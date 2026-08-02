from __future__ import annotations

import hashlib
import io
import re
import zipfile
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import PurePosixPath
from typing import Iterable
from xml.etree import ElementTree as ET

from pypdf import PdfReader

from .errors import (
    ResearchArchiveRejectedError,
    ResearchDocumentEncryptedError,
    ResearchDocumentFormatError,
    ResearchDocumentTooLargeError,
    ResearchExtractionError,
)


@dataclass(frozen=True, slots=True)
class AdvancedIngestionPolicy:
    enabled: bool = False
    max_document_bytes: int = 12_000_000
    max_extracted_chars: int = 4_000_000
    max_archive_files: int = 2_000
    max_archive_uncompressed_bytes: int = 48_000_000
    max_pdf_pages: int = 1_000
    max_segments: int = 5_000
    near_duplicate_threshold: float = 0.88

    def validate(self) -> None:
        if self.max_document_bytes < 1 or self.max_extracted_chars < 1:
            raise ValueError("I limiti documento devono essere positivi")
        if self.max_archive_files < 1 or self.max_archive_uncompressed_bytes < 1:
            raise ValueError("I limiti archivio devono essere positivi")
        if self.max_pdf_pages < 1 or self.max_segments < 1:
            raise ValueError("I limiti di estrazione devono essere positivi")
        if not 0.0 <= self.near_duplicate_threshold <= 1.0:
            raise ValueError("Soglia near-duplicate non valida")


@dataclass(frozen=True, slots=True)
class ExtractedSegment:
    index: int
    locator: str
    text: str
    text_sha256: str


@dataclass(frozen=True, slots=True)
class ExtractedAdvancedDocument:
    filename: str
    media_type: str
    format_name: str
    sha256: str
    extracted_text: str
    segments: tuple[ExtractedSegment, ...]
    fingerprint_tokens: tuple[str, ...]
    metadata: dict[str, object]


class _HtmlTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._blocked = 0
    def handle_starttag(self, tag: str, attrs):
        if tag.lower() in {"script", "style", "noscript", "template"}: self._blocked += 1
    def handle_endtag(self, tag: str):
        if tag.lower() in {"script", "style", "noscript", "template"} and self._blocked: self._blocked -= 1
    def handle_data(self, data: str):
        if not self._blocked and data.strip(): self.parts.append(data.strip())


def _normalize_text(value: str) -> str:
    value = value.replace("\x00", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def fingerprint_tokens(text: str, *, width: int = 5, limit: int = 4096) -> tuple[str, ...]:
    words = re.findall(r"[\wÀ-ÿ]+", text.casefold())
    if not words:
        return ()
    if len(words) < width:
        return (hashlib.sha256(" ".join(words).encode()).hexdigest()[:20],)
    hashes = {
        hashlib.sha256(" ".join(words[i:i+width]).encode()).hexdigest()[:20]
        for i in range(len(words)-width+1)
    }
    return tuple(sorted(hashes)[:limit])


def fingerprint_similarity(first: Iterable[str], second: Iterable[str]) -> float:
    a, b = set(first), set(second)
    if not a and not b: return 1.0
    if not a or not b: return 0.0
    return len(a & b) / len(a | b)


class AdvancedDocumentExtractor:
    PDF_TYPES = {"application/pdf"}
    DOCX_TYPES = {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    EPUB_TYPES = {"application/epub+zip"}
    TEXT_TYPES = {"text/plain", "text/markdown", "text/html", "application/xhtml+xml"}

    def __init__(self, policy: AdvancedIngestionPolicy | None = None) -> None:
        self.policy = policy or AdvancedIngestionPolicy()
        self.policy.validate()

    def _check_size(self, content: bytes) -> None:
        if not content: raise ResearchDocumentFormatError("Il documento è vuoto")
        if len(content) > self.policy.max_document_bytes: raise ResearchDocumentTooLargeError()

    def _segments(self, values: list[tuple[str,str]]) -> tuple[ExtractedSegment, ...]:
        cleaned: list[ExtractedSegment] = []
        for locator, text in values:
            normalized = _normalize_text(text)
            if not normalized: continue
            if len(cleaned) >= self.policy.max_segments: raise ResearchExtractionError("Troppi segmenti")
            cleaned.append(ExtractedSegment(
                index=len(cleaned), locator=locator, text=normalized,
                text_sha256=hashlib.sha256(normalized.encode()).hexdigest(),
            ))
        if not cleaned: raise ResearchExtractionError("Nessun testo estraibile")
        return tuple(cleaned)

    def _safe_archive(self, content: bytes) -> zipfile.ZipFile:
        try: archive = zipfile.ZipFile(io.BytesIO(content))
        except (zipfile.BadZipFile, OSError) as exc: raise ResearchArchiveRejectedError("Archivio non valido") from exc
        infos = archive.infolist()
        if len(infos) > self.policy.max_archive_files: raise ResearchArchiveRejectedError("Troppi file nell'archivio")
        if sum(info.file_size for info in infos) > self.policy.max_archive_uncompressed_bytes:
            raise ResearchArchiveRejectedError("Archivio espanso oltre il limite")
        for info in infos:
            path = PurePosixPath(info.filename)
            if path.is_absolute() or ".." in path.parts: raise ResearchArchiveRejectedError("Percorso archivio non sicuro")
            if info.flag_bits & 0x1: raise ResearchDocumentEncryptedError("Archivio cifrato")
        return archive

    def _extract_pdf(self, content: bytes) -> tuple[tuple[ExtractedSegment,...], dict[str,object]]:
        try: reader = PdfReader(io.BytesIO(content), strict=True)
        except Exception as exc: raise ResearchDocumentFormatError("PDF non valido") from exc
        if reader.is_encrypted:
            raise ResearchDocumentEncryptedError("PDF protetto da password")
        if len(reader.pages) > self.policy.max_pdf_pages: raise ResearchDocumentTooLargeError("PDF con troppe pagine")
        values=[]
        try:
            for number, page in enumerate(reader.pages, start=1): values.append((f"page:{number}", page.extract_text() or ""))
        except Exception as exc: raise ResearchExtractionError("Estrazione PDF non riuscita") from exc
        metadata={"page_count":len(reader.pages),"title":str((reader.metadata or {}).get('/Title') or '') or None}
        return self._segments(values), metadata

    def _reject_external_relationships(self, archive: zipfile.ZipFile) -> None:
        for name in archive.namelist():
            if not name.endswith('.rels'): continue
            try: root=ET.fromstring(archive.read(name))
            except ET.ParseError as exc: raise ResearchArchiveRejectedError("Relazioni XML non valide") from exc
            for node in root.iter():
                if node.attrib.get('TargetMode','').lower() == 'external':
                    raise ResearchArchiveRejectedError("Relazioni esterne non consentite")

    def _extract_docx(self, content: bytes) -> tuple[tuple[ExtractedSegment,...], dict[str,object]]:
        archive=self._safe_archive(content)
        names=set(archive.namelist())
        if any(name.lower().endswith(('vbaproject.bin','vbaData.xml'.lower())) for name in names):
            raise ResearchArchiveRejectedError("Macro Office non consentite")
        if 'word/document.xml' not in names: raise ResearchDocumentFormatError("DOCX privo di document.xml")
        self._reject_external_relationships(archive)
        try: root=ET.fromstring(archive.read('word/document.xml'))
        except ET.ParseError as exc: raise ResearchDocumentFormatError("XML DOCX non valido") from exc
        values=[]
        for idx, paragraph in enumerate(root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'), start=1):
            text=''.join(node.text or '' for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'))
            values.append((f"paragraph:{idx}", text))
        return self._segments(values), {"paragraph_count":len(values),"macros_present":False}

    def _extract_epub(self, content: bytes) -> tuple[tuple[ExtractedSegment,...], dict[str,object]]:
        archive=self._safe_archive(content); names=set(archive.namelist())
        if 'META-INF/encryption.xml' in names: raise ResearchDocumentEncryptedError("EPUB cifrato")
        if 'META-INF/container.xml' not in names: raise ResearchDocumentFormatError("EPUB senza container.xml")
        try:
            container=ET.fromstring(archive.read('META-INF/container.xml'))
            rootfile=next(node.attrib['full-path'] for node in container.iter() if node.tag.endswith('rootfile'))
            package=ET.fromstring(archive.read(rootfile))
        except (ET.ParseError, KeyError, StopIteration) as exc: raise ResearchDocumentFormatError("Struttura EPUB non valida") from exc
        base=PurePosixPath(rootfile).parent
        manifest={node.attrib.get('id'):node.attrib.get('href') for node in package.iter() if node.tag.endswith('item')}
        spine=[node.attrib.get('idref') for node in package.iter() if node.tag.endswith('itemref')]
        values=[]
        for order,item_id in enumerate(spine,start=1):
            href=manifest.get(item_id)
            if not href: continue
            path=(base / href).as_posix()
            if path not in names: continue
            try: raw=archive.read(path).decode('utf-8-sig')
            except UnicodeDecodeError as exc: raise ResearchDocumentFormatError("Capitolo EPUB non UTF-8") from exc
            parser=_HtmlTextParser(); parser.feed(raw)
            values.append((f"spine:{order}:{path}", '\n'.join(parser.parts)))
        return self._segments(values), {"spine_items":len(spine),"scripts_executed":False}

    def _extract_text(self, content: bytes, media_type: str) -> tuple[tuple[ExtractedSegment,...], dict[str,object]]:
        try: decoded=content.decode('utf-8-sig')
        except UnicodeDecodeError as exc: raise ResearchDocumentFormatError("Testo non UTF-8") from exc
        if media_type in {'text/html','application/xhtml+xml'}:
            parser=_HtmlTextParser(); parser.feed(decoded); decoded='\n'.join(parser.parts)
        return self._segments([('document:1',decoded)]), {"scripts_executed":False}

    def extract(self, *, filename: str, media_type: str, content: bytes) -> ExtractedAdvancedDocument:
        self._check_size(content)
        media_type=media_type.split(';',1)[0].strip().lower(); suffix=PurePosixPath(filename).suffix.lower()
        if media_type in self.PDF_TYPES or suffix=='.pdf': fmt='pdf'; segments,metadata=self._extract_pdf(content); normalized='application/pdf'
        elif media_type in self.DOCX_TYPES or suffix=='.docx': fmt='docx'; segments,metadata=self._extract_docx(content); normalized=next(iter(self.DOCX_TYPES))
        elif media_type in self.EPUB_TYPES or suffix=='.epub': fmt='epub'; segments,metadata=self._extract_epub(content); normalized='application/epub+zip'
        elif media_type in self.TEXT_TYPES or suffix in {'.txt','.md','.html','.htm','.xhtml'}: fmt='text'; segments,metadata=self._extract_text(content,media_type); normalized=media_type
        else: raise ResearchDocumentFormatError(f"Formato non consentito: {media_type or suffix}")
        text=_normalize_text('\n\n'.join(segment.text for segment in segments))
        if len(text)>self.policy.max_extracted_chars: raise ResearchDocumentTooLargeError("Testo estratto oltre il limite")
        return ExtractedAdvancedDocument(
            filename=filename,media_type=normalized,format_name=fmt,
            sha256=hashlib.sha256(content).hexdigest(),extracted_text=text,
            segments=segments,fingerprint_tokens=fingerprint_tokens(text),metadata=metadata,
        )
