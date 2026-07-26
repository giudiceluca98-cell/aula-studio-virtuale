from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path

from .errors import (
    MaterialTextDecodingError,
    UnsupportedMediaTypeError,
)

SUPPORTED_MEDIA_TYPES = (
    "text/plain",
    "text/markdown",
    "text/csv",
    "text/html",
    "application/xhtml+xml",
    "application/json",
)

_EXTENSION_MEDIA_TYPES = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".csv": "text/csv",
    ".html": "text/html",
    ".htm": "text/html",
    ".xhtml": "application/xhtml+xml",
    ".json": "application/json",
}


class _ReadableHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self._ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self._ignored_depth += 1
            return
        if not self._ignored_depth and tag in {
            "p", "div", "section", "article", "header", "footer", "main",
            "aside", "nav", "li", "br", "h1", "h2", "h3", "h4", "h5", "h6",
            "tr", "table", "blockquote", "pre",
        }:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            if self._ignored_depth:
                self._ignored_depth -= 1
            return
        if not self._ignored_depth and tag in {
            "p", "div", "section", "article", "li", "h1", "h2", "h3", "h4", "h5", "h6",
            "tr", "blockquote", "pre",
        }:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._ignored_depth:
            self.parts.append(data)

    def text(self) -> str:
        return "".join(self.parts)


def normalize_media_type(media_type: str, filename: str) -> str:
    normalized = media_type.split(";", 1)[0].strip().lower()
    if normalized in {"application/octet-stream", "binary/octet-stream", ""}:
        guessed = _EXTENSION_MEDIA_TYPES.get(Path(filename).suffix.lower())
        if guessed:
            normalized = guessed
    return normalized


def decode_utf8(content: bytes) -> str:
    if b"\x00" in content:
        raise MaterialTextDecodingError()
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise MaterialTextDecodingError() from exc


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text(content: bytes, media_type: str, filename: str) -> tuple[str, str]:
    normalized_media_type = normalize_media_type(media_type, filename)
    if normalized_media_type not in SUPPORTED_MEDIA_TYPES:
        raise UnsupportedMediaTypeError()

    decoded = decode_utf8(content)
    if normalized_media_type in {"text/html", "application/xhtml+xml"}:
        parser = _ReadableHtmlParser()
        parser.feed(decoded)
        parser.close()
        decoded = parser.text()
    elif normalized_media_type == "application/json":
        try:
            payload = json.loads(decoded)
        except json.JSONDecodeError as exc:
            raise MaterialTextDecodingError("Il documento JSON non è valido") from exc
        decoded = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)

    return normalize_text(decoded), normalized_media_type
