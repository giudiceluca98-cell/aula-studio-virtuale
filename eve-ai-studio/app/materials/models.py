from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class MaterialStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class MaterialSourceType(str, Enum):
    UPLOAD = "upload"
    PASTED_TEXT = "pasted_text"
    GENERATED = "generated"
    RESEARCH_PROMOTION = "research_promotion"


class MaterialImportRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    filename: str = Field(min_length=1, max_length=255)
    media_type: str = Field(min_length=1, max_length=160)
    content_base64: str = Field(min_length=1)
    source_type: MaterialSourceType = MaterialSourceType.UPLOAD
    material_id: str | None = Field(default=None, min_length=8, max_length=64)
    source_label: str | None = Field(default=None, max_length=240)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("room_id", "title", "filename", "media_type")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("source_label")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class MaterialImportEventSummary(BaseModel):
    import_id: int
    room_id: str
    material_id: str | None = None
    version_id: int | None = None
    status: str
    checksum_sha256: str | None = None
    size_bytes: int | None = None
    error_code: str | None = None
    error_class: str | None = None
    created_at: str
    completed_at: str | None = None


class MaterialImportEventListResponse(BaseModel):
    total: int
    items: list[MaterialImportEventSummary]


class MaterialImportResult(BaseModel):
    import_id: int
    material_id: str
    version_id: int
    version_number: int
    checksum_sha256: str
    status: MaterialStatus
    duplicate: bool
    duplicate_of_material_id: str | None = None
    size_bytes: int
    extracted_chars: int
    chunk_count: int
    error_code: str | None = None


class MaterialSummary(BaseModel):
    material_id: str
    room_id: str
    title: str
    source_label: str | None = None
    current_version_id: int | None = None
    current_version_number: int | None = None
    current_status: MaterialStatus | None = None
    media_type: str | None = None
    filename: str | None = None
    checksum_sha256: str | None = None
    size_bytes: int = 0
    extracted_chars: int = 0
    chunk_count: int = 0
    created_at: str
    updated_at: str


class MaterialDetail(MaterialSummary):
    metadata: dict[str, Any] = Field(default_factory=dict)


class MaterialListResponse(BaseModel):
    total: int
    offset: int
    limit: int
    items: list[MaterialSummary]


class MaterialVersionSummary(BaseModel):
    version_id: int
    material_id: str
    room_id: str
    version_number: int
    filename: str
    media_type: str
    source_type: MaterialSourceType
    checksum_sha256: str
    size_bytes: int
    status: MaterialStatus
    extracted_chars: int
    chunk_count: int
    metadata: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None
    error_class: str | None = None
    created_at: str
    completed_at: str | None = None


class MaterialVersionListResponse(BaseModel):
    total: int
    items: list[MaterialVersionSummary]


class MaterialChunk(BaseModel):
    chunk_id: int
    version_id: int
    chunk_index: int
    start_char: int
    end_char: int
    text: str
    text_sha256: str
    embedding_status: str


class MaterialChunkListResponse(BaseModel):
    total: int
    items: list[MaterialChunk]


class MaterialCatalogStatus(BaseModel):
    persistent: bool
    schema_version: int
    total_materials: int
    total_versions: int
    ready_versions: int
    processing_versions: int
    failed_versions: int
    total_chunks: int
    supported_media_types: list[str]
    max_material_bytes: int
    max_extracted_chars: int
    max_metadata_chars: int
    chunk_chars: int
    chunk_overlap_chars: int
    max_versions_per_material: int
    embeddings_enabled: bool
    embedding_provider: str | None = None
    rag_stage: str
