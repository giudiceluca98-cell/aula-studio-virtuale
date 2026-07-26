from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class RetrievalSearchRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    query: str = Field(min_length=1, max_length=2_000)
    limit: int = Field(default=8, ge=1, le=50)
    material_ids: list[str] | None = Field(default=None, max_length=100)

    @field_validator("room_id", "query")
    @classmethod
    def strip_required(cls, value: str) -> str:
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


class RetrievalCitation(BaseModel):
    locator: str
    material_id: str
    version_id: int
    version_number: int
    chunk_id: int
    chunk_index: int
    title: str
    filename: str
    media_type: str
    start_char: int
    end_char: int
    text_sha256: str


class RetrievalHit(BaseModel):
    rank: int
    score: float
    excerpt: str
    excerpt_start_char: int
    excerpt_end_char: int
    matched_terms: list[str]
    exact_phrase: bool
    suspicious_content: bool
    safety_flags: list[str] = Field(default_factory=list)
    citation: RetrievalCitation


class RetrievalSearchResponse(BaseModel):
    room_id: str
    query: str
    query_sha256: str
    total_candidates: int
    integrity_failures: int
    returned_hits: int
    embeddings_enabled: bool = False
    retrieval_stage: str = "lexical_ranked_citations_no_embeddings"
    hits: list[RetrievalHit]


class RetrievalStatus(BaseModel):
    enabled: bool
    deterministic: bool
    embeddings_enabled: bool
    embedding_provider: str | None = None
    retrieval_stage: str
    ranking_algorithm: str
    current_ready_chunks: int
    max_query_chars: int
    max_results: int
    max_excerpt_chars: int
    minimum_score: float
    source_scope: str
