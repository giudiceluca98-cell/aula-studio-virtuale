from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field, field_validator


class EmbeddingJobStatus(str, Enum):
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class EmbeddingIndexRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    idempotency_key: str = Field(min_length=8, max_length=240)
    rebuild: bool = False

    @field_validator("room_id", "actor_id", "idempotency_key")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class EmbeddingJob(BaseModel):
    job_id: int
    room_id: str
    project_id: str
    source_id: int
    promotion_id: int
    material_id: str
    version_id: int
    version_number: int
    checksum_sha256: str
    provider: str
    model: str
    dimensions: int
    status: EmbeddingJobStatus
    segment_count: int
    token_count: int
    cost_microunits: int
    idempotency_key: str
    created_at: str
    completed_at: str | None = None
    error_code: str | None = None


class SemanticIndexDeleteResult(BaseModel):
    material_id: str
    version_number: int
    deleted_jobs: int
    deleted_segments: int


class HybridSearchRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    query: str = Field(min_length=1, max_length=500)
    project_id: str | None = Field(default=None, max_length=120)
    material_ids: list[str] = Field(default_factory=list, max_length=50)
    source_ids: list[int] = Field(default_factory=list, max_length=50)
    limit: int = Field(default=10, ge=1, le=50)
    min_score: float | None = Field(default=None, ge=0.0, le=1.0)

    @field_validator("room_id", "query")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class HybridSearchHit(BaseModel):
    segment_id: int
    project_id: str
    source_id: int
    material_id: str
    version_number: int
    locator: str
    excerpt: str
    score: float
    semantic_score: float
    lexical_score: float
    rerank_bonus: float
    text_sha256: str
    provider: str
    model: str


class HybridSearchResponse(BaseModel):
    run_id: int
    mode: str
    query: str
    total_candidates: int
    latency_ms: float
    token_count: int
    cost_microunits: int
    items: list[HybridSearchHit]


class RetrievalEvaluationRequest(HybridSearchRequest):
    expected_locators: list[str] = Field(min_length=1, max_length=100)


class RetrievalEvaluationResult(BaseModel):
    response: HybridSearchResponse
    precision_at_k: float
    recall_at_k: float
    matched_locators: list[str]
    missing_locators: list[str]


class SemanticIndexStatus(BaseModel):
    checkpoint: str
    embeddings_enabled: bool
    hybrid_retrieval_enabled: bool
    lexical_fallback_enabled: bool
    provider: str
    model: str
    dimensions: int
    total_jobs: int
    succeeded_jobs: int
    indexed_segments: int
    retrieval_runs: int
    max_results: int
    minimum_score: float
