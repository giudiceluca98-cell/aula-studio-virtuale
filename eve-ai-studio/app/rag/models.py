from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

from ..models import StudyContext
from ..retrieval.models import RetrievalCitation


class RagChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8_000)
    context: StudyContext
    mode: str = Field(default="explain", max_length=64)
    limit: int = Field(default=4, ge=1, le=10)
    material_ids: list[str] | None = Field(default=None, max_length=100)

    @field_validator("message", "mode")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("material_ids")
    @classmethod
    def normalize_material_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        normalized = sorted({item.strip() for item in value if item.strip()})
        return normalized or None


class RagSource(BaseModel):
    rank: int
    score: float
    excerpt: str
    matched_terms: list[str]
    exact_phrase: bool
    suspicious_content: bool
    safety_flags: list[str] = Field(default_factory=list)
    citation: RetrievalCitation


class RagChatResponse(BaseModel):
    message: str
    provider: str
    model: str
    uncertainty: str
    grounded: bool
    knowledge_scope: str
    retrieval_stage: str
    query_sha256: str
    answer_sha256: str
    total_candidates: int
    integrity_failures: int
    excluded_suspicious_hits: int
    sources: list[RagSource] = Field(default_factory=list)
    proposed_actions: list[dict[str, Any]] = Field(default_factory=list)


class RagStatus(BaseModel):
    enabled: bool
    deterministic: bool
    provider: str
    model: str
    retrieval_stage: str
    embeddings_enabled: bool
    external_provider_enabled: bool
    source_scope: str
    suspicious_source_policy: str
    max_sources: int
    max_answer_chars: int
