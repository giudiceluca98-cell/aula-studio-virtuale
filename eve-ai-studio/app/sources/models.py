from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class SourceOpenRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    locator: str = Field(min_length=1, max_length=500)
    expected_text_sha256: str | None = Field(default=None, min_length=64, max_length=64)
    context_chars: int = Field(default=240, ge=0, le=2_000)
    require_current: bool = False

    @field_validator("room_id", "locator")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("expected_text_sha256")
    @classmethod
    def normalize_hash(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip().lower()
        if any(character not in "0123456789abcdef" for character in value):
            raise ValueError("SHA-256 non valido")
        return value


class SourceNavigation(BaseModel):
    kind: str = "character_offsets"
    resource_path: str
    anchor: str
    page_number: int | None = None


class SourceOpenResponse(BaseModel):
    opened: bool = True
    room_id: str
    locator: str
    material_id: str
    title: str
    source_label: str | None = None
    version_id: int
    version_number: int
    current_version_number: int | None = None
    is_current: bool
    stale: bool
    filename: str
    media_type: str
    source_type: str
    chunk_id: int
    chunk_index: int
    start_char: int
    end_char: int
    text: str
    text_sha256: str
    integrity_verified: bool
    expected_hash_verified: bool | None = None
    context_start_char: int
    context_end_char: int
    context_text: str
    suspicious_content: bool
    safety_flags: list[str] = Field(default_factory=list)
    content_trust: str = "untrusted_document_content"
    instructions_executable: bool = False
    navigation: SourceNavigation


class SourceOpeningStatus(BaseModel):
    enabled: bool
    deterministic: bool
    stage: str
    locator_format: str
    source_scope: str
    integrity_checks: list[str]
    historical_ready_versions_openable: bool
    max_context_chars: int
