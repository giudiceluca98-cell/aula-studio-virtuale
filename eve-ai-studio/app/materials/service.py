from __future__ import annotations

import base64
import binascii
import hashlib
import json
from dataclasses import dataclass

from .chunking import prepare_chunks
from .errors import (
    InvalidMaterialPayloadError,
    MaterialError,
    MaterialProcessingError,
    MaterialTextTooLargeError,
    MaterialTooLargeError,
    MaterialVersionLimitError,
)
from .extraction import SUPPORTED_MEDIA_TYPES, extract_text, normalize_media_type
from .models import (
    MaterialCatalogStatus,
    MaterialChunkListResponse,
    MaterialDetail,
    MaterialImportEventListResponse,
    MaterialImportRequest,
    MaterialImportResult,
    MaterialListResponse,
    MaterialStatus,
    MaterialVersionListResponse,
    MaterialVersionSummary,
)
from .storage import SqliteMaterialStore


@dataclass(frozen=True, slots=True)
class MaterialLimits:
    max_material_bytes: int = 2_000_000
    max_extracted_chars: int = 2_000_000
    max_metadata_chars: int = 16_000
    chunk_chars: int = 1_200
    chunk_overlap_chars: int = 150
    max_versions_per_material: int = 50

    def validate(self) -> None:
        if self.max_material_bytes < 1:
            raise ValueError("max_material_bytes deve essere positivo")
        if self.max_extracted_chars < 1:
            raise ValueError("max_extracted_chars deve essere positivo")
        if self.max_metadata_chars < 2:
            raise ValueError("max_metadata_chars deve essere almeno 2")
        if self.chunk_chars < 100:
            raise ValueError("chunk_chars deve essere almeno 100")
        if self.chunk_overlap_chars < 0 or self.chunk_overlap_chars >= self.chunk_chars:
            raise ValueError("chunk_overlap_chars non valido")
        if self.max_versions_per_material < 1:
            raise ValueError("max_versions_per_material deve essere positivo")


class MaterialService:
    def __init__(self, store: SqliteMaterialStore, *, limits: MaterialLimits | None = None) -> None:
        self.store = store
        self.limits = limits or MaterialLimits()
        self.limits.validate()

    @staticmethod
    def _safe_error_class(error: BaseException) -> str:
        return error.__class__.__name__[:120]

    def _validate_metadata(self, metadata: dict) -> None:
        try:
            serialized = json.dumps(
                metadata,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
                allow_nan=False,
            )
        except (TypeError, ValueError) as exc:
            raise InvalidMaterialPayloadError("I metadati non sono serializzabili") from exc
        if len(serialized) > self.limits.max_metadata_chars:
            raise InvalidMaterialPayloadError("I metadati superano il limite configurato")

    def _decode_content(self, request: MaterialImportRequest) -> bytes:
        maximum_encoded_length = ((self.limits.max_material_bytes + 2) // 3) * 4 + 8
        if len(request.content_base64) > maximum_encoded_length:
            error = MaterialTooLargeError()
            self.store.record_rejected_import(
                room_id=request.room_id,
                status="rejected",
                error_code=error.code,
                error_class=error.__class__.__name__,
            )
            raise error
        try:
            content = base64.b64decode(request.content_base64, validate=True)
        except (binascii.Error, ValueError) as exc:
            self.store.record_rejected_import(
                room_id=request.room_id,
                status="rejected",
                error_code=InvalidMaterialPayloadError.code,
                error_class=self._safe_error_class(exc),
            )
            raise InvalidMaterialPayloadError() from exc
        if not content:
            error = InvalidMaterialPayloadError("Il materiale è vuoto")
            self.store.record_rejected_import(
                room_id=request.room_id,
                status="rejected",
                error_code=error.code,
                error_class=error.__class__.__name__,
                size_bytes=0,
            )
            raise error
        if len(content) > self.limits.max_material_bytes:
            error = MaterialTooLargeError()
            self.store.record_rejected_import(
                room_id=request.room_id,
                status="rejected",
                error_code=error.code,
                error_class=error.__class__.__name__,
                size_bytes=len(content),
            )
            raise error
        return content

    def import_document(self, request: MaterialImportRequest) -> MaterialImportResult:
        self._validate_metadata(request.metadata)
        content = self._decode_content(request)
        checksum = hashlib.sha256(content).hexdigest()
        duplicate = self.store.find_ready_duplicate(request.room_id, checksum)
        if duplicate is not None:
            import_id = self.store.record_rejected_import(
                room_id=request.room_id,
                status="duplicate",
                error_code="duplicate_checksum",
                error_class="DuplicateChecksum",
                checksum_sha256=checksum,
                size_bytes=len(content),
                material_id=duplicate["material_id"],
                version_id=duplicate["version_id"],
            )
            return MaterialImportResult(
                import_id=import_id,
                material_id=duplicate["material_id"],
                version_id=duplicate["version_id"],
                version_number=duplicate["version_number"],
                checksum_sha256=checksum,
                status=MaterialStatus.READY,
                duplicate=True,
                duplicate_of_material_id=duplicate["material_id"],
                size_bytes=duplicate["size_bytes"],
                extracted_chars=duplicate["extracted_chars"],
                chunk_count=duplicate["chunk_count"],
            )

        if request.material_id is not None:
            self.store.get_material(request.material_id, request.room_id)
        if (
            request.material_id is not None
            and self.store.material_versions_count(request.material_id)
            >= self.limits.max_versions_per_material
        ):
            error = MaterialVersionLimitError()
            self.store.record_rejected_import(
                room_id=request.room_id,
                status="rejected",
                error_code=error.code,
                error_class=error.__class__.__name__,
                checksum_sha256=checksum,
                size_bytes=len(content),
            )
            raise error

        normalized_media_type = normalize_media_type(request.media_type, request.filename)
        import_id, material_id, version_id, version_number = self.store.begin_import(
            room_id=request.room_id,
            title=request.title,
            filename=request.filename,
            media_type=normalized_media_type,
            source_type=request.source_type,
            checksum_sha256=checksum,
            size_bytes=len(content),
            metadata=request.metadata,
            raw_content=content,
            material_id=request.material_id,
            source_label=request.source_label,
        )
        try:
            extracted_text, normalized_media_type = extract_text(
                content,
                normalized_media_type,
                request.filename,
            )
            if len(extracted_text) > self.limits.max_extracted_chars:
                raise MaterialTextTooLargeError()
            chunks = prepare_chunks(
                extracted_text,
                chunk_chars=self.limits.chunk_chars,
                overlap_chars=self.limits.chunk_overlap_chars,
            )
            self.store.complete_import(
                import_id=import_id,
                material_id=material_id,
                version_id=version_id,
                title=request.title,
                source_label=request.source_label,
                extracted_text=extracted_text,
                chunks=chunks,
            )
        except MaterialError as error:
            self.store.fail_import(
                import_id=import_id,
                version_id=version_id,
                error_code=error.code,
                error_class=error.__class__.__name__,
            )
            raise
        except Exception as error:
            self.store.fail_import(
                import_id=import_id,
                version_id=version_id,
                error_code=MaterialProcessingError.code,
                error_class=self._safe_error_class(error),
            )
            raise MaterialProcessingError() from error

        return MaterialImportResult(
            import_id=import_id,
            material_id=material_id,
            version_id=version_id,
            version_number=version_number,
            checksum_sha256=checksum,
            status=MaterialStatus.READY,
            duplicate=False,
            size_bytes=len(content),
            extracted_chars=len(extracted_text),
            chunk_count=len(chunks),
        )

    def status(self) -> MaterialCatalogStatus:
        counts = self.store.catalog_counts()
        return MaterialCatalogStatus(
            persistent=True,
            schema_version=self.store.schema_version(),
            supported_media_types=list(SUPPORTED_MEDIA_TYPES),
            max_material_bytes=self.limits.max_material_bytes,
            max_extracted_chars=self.limits.max_extracted_chars,
            max_metadata_chars=self.limits.max_metadata_chars,
            chunk_chars=self.limits.chunk_chars,
            chunk_overlap_chars=self.limits.chunk_overlap_chars,
            max_versions_per_material=self.limits.max_versions_per_material,
            embeddings_enabled=False,
            embedding_provider=None,
            rag_stage="text_extracted_and_chunked_no_embeddings",
            **counts,
        )

    def list_imports(self, room_id: str, *, limit: int = 100) -> MaterialImportEventListResponse:
        items = self.store.list_imports(room_id, limit=limit)
        return MaterialImportEventListResponse(total=len(items), items=items)

    def list_materials(
        self,
        *,
        room_id: str,
        status: MaterialStatus | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> MaterialListResponse:
        total, items = self.store.list_materials(
            room_id=room_id,
            status=status,
            query=query,
            offset=offset,
            limit=limit,
        )
        return MaterialListResponse(total=total, offset=offset, limit=limit, items=items)

    def get_material(self, material_id: str, room_id: str) -> MaterialDetail:
        return self.store.get_material(material_id, room_id)

    def list_versions(self, material_id: str, room_id: str) -> MaterialVersionListResponse:
        items = self.store.list_versions(material_id, room_id)
        return MaterialVersionListResponse(total=len(items), items=items)

    def get_version(self, material_id: str, version_number: int, room_id: str) -> MaterialVersionSummary:
        return self.store.get_version(material_id, version_number, room_id)

    def list_chunks(self, material_id: str, version_number: int, room_id: str) -> MaterialChunkListResponse:
        items = self.store.list_chunks(material_id, version_number, room_id)
        return MaterialChunkListResponse(total=len(items), items=items)
