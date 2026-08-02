from __future__ import annotations

from enum import Enum
from typing import Any
from urllib.parse import urlsplit

from pydantic import BaseModel, Field, field_validator


class ResearchProjectStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ResearchQueryStatus(str, Enum):
    PLANNED = "planned"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    BLOCKED = "blocked"


class ResearchSourceStatus(str, Enum):
    QUARANTINED = "quarantined"
    UNDER_REVIEW = "under_review"
    REVIEW_REQUIRED = "review_required"  # compatibilità con INTELLIGENCE-0.1/0.2
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    SUPERSEDED = "superseded"


class ResearchReviewStatus(str, Enum):
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    SUPERSEDED = "superseded"


class ResearchReviewDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"


class ResearchPromotionStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class ResearchAcquisitionStatus(str, Enum):
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    BLOCKED = "blocked"
    FAILED = "failed"


def _clean_unique(values: list[str], *, max_items: int) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in values:
        value = raw.strip()
        if not value:
            continue
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(value)
    if len(cleaned) > max_items:
        raise ValueError(f"Sono consentiti al massimo {max_items} elementi")
    return cleaned


class ResearchProjectCreateRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    objective: str = Field(min_length=1, max_length=4_000)
    domain: str = Field(min_length=1, max_length=160)
    language: str = Field(default="it", min_length=2, max_length=16)
    target_levels: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    max_sources: int = Field(default=25, ge=1, le=500)
    human_review_required: bool = True

    @field_validator("room_id", "title", "objective", "domain", "language")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("target_levels")
    @classmethod
    def clean_levels(cls, values: list[str]) -> list[str]:
        return _clean_unique(values, max_items=20)

    @field_validator("topics")
    @classmethod
    def clean_topics(cls, values: list[str]) -> list[str]:
        return _clean_unique(values, max_items=100)


class ResearchProjectTransitionRequest(BaseModel):
    status: ResearchProjectStatus
    note: str | None = Field(default=None, max_length=1_000)

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchQueryCreateRequest(BaseModel):
    text: str = Field(min_length=2, max_length=500)
    purpose: str | None = Field(default=None, max_length=500)
    language: str = Field(default="it", min_length=2, max_length=16)

    @field_validator("text", "language")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("purpose")
    @classmethod
    def clean_purpose(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchSourceCandidateCreateRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2_048)
    title: str | None = Field(default=None, max_length=500)
    publisher: str | None = Field(default=None, max_length=300)
    published_at: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=2_000)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        value = value.strip()
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Sono consentiti soltanto URL HTTP o HTTPS completi")
        if parsed.username or parsed.password:
            raise ValueError("Gli URL con credenziali incorporate non sono consentiti")
        return value

    @field_validator("title", "publisher", "published_at", "notes")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchAcquisitionRequest(BaseModel):
    refresh: bool = False


class ResearchProjectSummary(BaseModel):
    project_id: str
    room_id: str
    title: str
    objective: str
    domain: str
    language: str
    status: ResearchProjectStatus
    max_sources: int
    human_review_required: bool
    web_access_enabled: bool
    query_count: int
    source_count: int
    created_at: str
    updated_at: str


class ResearchProjectDetail(ResearchProjectSummary):
    target_levels: list[str]
    topics: list[str]


class ResearchProjectListResponse(BaseModel):
    total: int
    offset: int
    limit: int
    items: list[ResearchProjectSummary]


class ResearchQuery(BaseModel):
    query_id: int
    project_id: str
    text: str
    purpose: str | None = None
    language: str
    status: ResearchQueryStatus
    created_at: str


class ResearchQueryListResponse(BaseModel):
    total: int
    items: list[ResearchQuery]


class ResearchSourceCandidate(BaseModel):
    source_id: int
    project_id: str
    url: str
    title: str | None = None
    publisher: str | None = None
    published_at: str | None = None
    status: ResearchSourceStatus
    trust_level: str
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    content_acquired: bool
    created_at: str


class ResearchSourceCandidateListResponse(BaseModel):
    total: int
    items: list[ResearchSourceCandidate]


class ResearchAcquisitionEvent(BaseModel):
    acquisition_id: int
    source_id: int
    project_id: str
    status: ResearchAcquisitionStatus
    requested_url: str
    final_url: str | None = None
    http_status: int | None = None
    media_type: str | None = None
    size_bytes: int | None = None
    sha256: str | None = None
    extracted_chars: int | None = None
    robots_allowed: bool | None = None
    resolved_ips: list[str] = Field(default_factory=list)
    redirect_chain: list[str] = Field(default_factory=list)
    error_code: str | None = None
    created_at: str
    completed_at: str | None = None


class ResearchAcquisitionEventListResponse(BaseModel):
    total: int
    items: list[ResearchAcquisitionEvent]


class ResearchQuarantinedDocument(BaseModel):
    source_id: int
    project_id: str
    acquisition_id: int
    requested_url: str
    final_url: str
    media_type: str
    size_bytes: int
    sha256: str
    extracted_text: str
    extracted_chars: int
    status: ResearchSourceStatus
    content_trust: str
    instructions_executable: bool
    created_at: str


class ResearchTransitionEvent(BaseModel):
    event_id: int
    project_id: str
    from_status: ResearchProjectStatus
    to_status: ResearchProjectStatus
    note: str | None = None
    created_at: str




class ResearchReviewStartRequest(BaseModel):
    reviewer_id: str = Field(min_length=2, max_length=160)
    reviewer_role: str = Field(default="reviewer", min_length=2, max_length=80)

    @field_validator("reviewer_id", "reviewer_role")
    @classmethod
    def clean_identity(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("L'identità del revisore è obbligatoria")
        return value


class ResearchQualityScores(BaseModel):
    quality: int = Field(ge=0, le=100)
    authority: int = Field(ge=0, le=100)
    freshness: int = Field(ge=0, le=100)
    relevance: int = Field(ge=0, le=100)
    completeness: int = Field(ge=0, le=100)


class ResearchSafetyAnalysis(BaseModel):
    suspicious_content: bool = False
    prompt_injection_detected: bool = False
    severity: str = Field(default="none", max_length=32)
    flags: list[str] = Field(default_factory=list)


class ResearchReviewDecisionRequest(BaseModel):
    decision: ResearchReviewDecision
    reviewer_id: str = Field(min_length=2, max_length=160)
    rationale: str = Field(min_length=10, max_length=4_000)
    title: str | None = Field(default=None, max_length=500)
    author: str | None = Field(default=None, max_length=300)
    publisher: str | None = Field(default=None, max_length=300)
    published_at: str | None = Field(default=None, max_length=64)
    license_name: str | None = Field(default=None, max_length=200)
    language: str | None = Field(default=None, min_length=2, max_length=16)
    scores: ResearchQualityScores | None = None
    risk_acknowledged: bool = False

    @field_validator(
        "reviewer_id", "rationale", "title", "author", "publisher",
        "published_at", "license_name", "language"
    )
    @classmethod
    def clean_review_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchPromotionRequest(BaseModel):
    actor_id: str = Field(min_length=2, max_length=160)
    idempotency_key: str = Field(min_length=8, max_length=128)
    title: str | None = Field(default=None, max_length=500)
    source_label: str | None = Field(default=None, max_length=240)

    @field_validator("actor_id", "idempotency_key", "title", "source_label")
    @classmethod
    def clean_promotion_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchPromotionRevocationRequest(BaseModel):
    actor_id: str = Field(min_length=2, max_length=160)
    rationale: str = Field(min_length=10, max_length=4_000)
    source_status: ResearchReviewStatus = ResearchReviewStatus.SUPERSEDED

    @field_validator("actor_id", "rationale")
    @classmethod
    def clean_revocation_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("source_status")
    @classmethod
    def validate_revocation_status(cls, value: ResearchReviewStatus) -> ResearchReviewStatus:
        if value not in {ResearchReviewStatus.EXPIRED, ResearchReviewStatus.SUPERSEDED}:
            raise ValueError("La revoca può impostare soltanto expired o superseded")
        return value


class ResearchSourceReview(BaseModel):
    review_id: int
    source_id: int
    project_id: str
    room_id: str
    acquisition_id: int
    status: ResearchReviewStatus
    reviewer_id: str
    reviewer_role: str
    rationale: str | None = None
    title: str | None = None
    author: str | None = None
    publisher: str | None = None
    published_at: str | None = None
    license_name: str | None = None
    language: str | None = None
    scores: ResearchQualityScores | None = None
    safety_analysis: ResearchSafetyAnalysis
    risk_acknowledged: bool
    created_at: str
    updated_at: str
    decided_at: str | None = None


class ResearchSourceReviewListResponse(BaseModel):
    total: int
    items: list[ResearchSourceReview]


class ResearchReviewEvent(BaseModel):
    event_id: int
    review_id: int
    source_id: int
    project_id: str
    room_id: str
    event_type: str
    actor_id: str
    rationale: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ResearchPromotion(BaseModel):
    promotion_id: int
    review_id: int
    source_id: int
    project_id: str
    room_id: str
    acquisition_id: int
    material_id: str
    version_id: int
    idempotency_key: str
    status: ResearchPromotionStatus
    promoted_by: str
    promoted_at: str
    revoked_by: str | None = None
    revoked_at: str | None = None
    revocation_reason: str | None = None


class ResearchSourceVersionComparison(BaseModel):
    source_id: int
    project_id: str
    current_acquisition_id: int
    previous_acquisition_id: int | None = None
    checksum_changed: bool
    final_url_changed: bool
    size_delta: int | None = None
    extracted_chars_delta: int | None = None
    current_sha256: str
    previous_sha256: str | None = None



class ResearchSearchExecutionStatus(str, Enum):
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    BLOCKED = "blocked"


class ResearchSearchFilters(BaseModel):
    included_domains: list[str] = Field(default_factory=list, max_length=30)
    excluded_domains: list[str] = Field(default_factory=list, max_length=100)
    language: str | None = Field(default=None, min_length=2, max_length=16)
    published_after: str | None = Field(default=None, max_length=32)
    published_before: str | None = Field(default=None, max_length=32)
    source_types: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("included_domains", "excluded_domains", "source_types")
    @classmethod
    def clean_search_lists(cls, values: list[str]) -> list[str]:
        return _clean_unique(values, max_items=100)

    @field_validator("language", "published_after", "published_before")
    @classmethod
    def clean_search_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchSearchExecuteRequest(BaseModel):
    actor_id: str = Field(min_length=2, max_length=160)
    provider: str | None = Field(default=None, min_length=2, max_length=80)
    max_results: int = Field(default=10, ge=1, le=50)
    register_candidates: bool = True
    filters: ResearchSearchFilters = Field(default_factory=ResearchSearchFilters)

    @field_validator("actor_id", "provider")
    @classmethod
    def clean_search_identity(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ResearchSearchResult(BaseModel):
    result_id: int | None = None
    execution_id: int | None = None
    rank: int
    original_url: str
    normalized_url: str
    title: str
    snippet: str = ""
    publisher: str | None = None
    published_at: str | None = None
    language: str | None = None
    source_type: str = "web"
    provider_score: float = 0.0
    ranking_reasons: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    source_id: int | None = None


class ResearchSearchExecution(BaseModel):
    execution_id: int
    query_id: int
    project_id: str
    room_id: str
    actor_id: str
    provider_name: str
    status: ResearchSearchExecutionStatus
    filters: ResearchSearchFilters
    requested_limit: int
    attempts: int
    result_count: int
    cost_units: float
    provider_request_id: str | None = None
    error_code: str | None = None
    created_at: str
    completed_at: str | None = None
    results: list[ResearchSearchResult] = Field(default_factory=list)


class ResearchSearchExecutionListResponse(BaseModel):
    total: int
    items: list[ResearchSearchExecution]


class ResearchCenterStatus(BaseModel):
    persistent: bool
    schema_version: int
    checkpoint: str
    stage: str
    total_projects: int
    active_projects: int
    total_queries: int
    quarantined_sources: int
    successful_acquisitions: int = 0
    review_available: bool = False
    review_enabled: bool = False
    promotion_enabled: bool = False
    under_review_sources: int = 0
    approved_sources: int = 0
    rejected_sources: int = 0
    active_promotions: int = 0
    search_available: bool = False
    search_provider_count: int = 0
    search_execution_count: int = 0
    search_result_count: int = 0
    max_search_results: int = 0
    max_search_executions_per_room_day: int = 0
    web_search_enabled: bool
    content_acquisition_available: bool = False
    content_acquisition_enabled: bool
    model_training_enabled: bool
    human_review_required_by_default: bool
    max_projects_per_room: int
    max_queries_per_project: int
    max_sources_per_project: int
    max_acquisition_bytes: int = 0
    max_redirects: int = 0
    robots_required: bool = True
    advanced_ingestion_available: bool = False
    advanced_ingestion_enabled: bool = False
    ingested_document_count: int = 0
    crawl_available: bool = False
    crawl_enabled: bool = False
    crawl_count: int = 0
    max_crawl_depth: int = 0
    max_crawl_pages: int = 0


class ResearchIngestionStatus(str, Enum):
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REJECTED = "rejected"

class ResearchDuplicateKind(str, Enum):
    NONE = "none"
    EXACT = "exact"
    NEAR = "near"

class ResearchAdvancedImportRequest(BaseModel):
    actor_id: str = Field(min_length=2,max_length=160)
    idempotency_key: str = Field(min_length=8,max_length=128)
    filename: str = Field(min_length=1,max_length=255)
    media_type: str = Field(min_length=1,max_length=160)
    content_base64: str = Field(min_length=1)
    source_id: int | None = Field(default=None,ge=1)
    metadata: dict[str,Any] = Field(default_factory=dict)

class ResearchIngestionEvent(BaseModel):
    ingestion_id:int; project_id:str; room_id:str; source_id:int|None=None; actor_id:str
    idempotency_key:str; filename:str; media_type:str; status:ResearchIngestionStatus
    document_id:int|None=None; error_code:str|None=None; created_at:str; completed_at:str|None=None

class ResearchIngestionEventListResponse(BaseModel):
    total:int; items:list[ResearchIngestionEvent]

class ResearchIngestedDocument(BaseModel):
    document_id:int; project_id:str; room_id:str; source_id:int|None=None; ingestion_id:int
    filename:str; media_type:str; format_name:str; size_bytes:int; sha256:str
    extracted_text:str; extracted_chars:int; segment_count:int
    duplicate_kind:ResearchDuplicateKind; duplicate_of_document_id:int|None=None
    content_trust:str; instructions_executable:bool; metadata:dict[str,Any]=Field(default_factory=dict); created_at:str

class ResearchCrawlStatus(str, Enum):
    RUNNING="running"; SUCCEEDED="succeeded"; FAILED="failed"; BLOCKED="blocked"

class ResearchCrawlRequest(BaseModel):
    actor_id:str=Field(min_length=2,max_length=160)
    max_depth:int=Field(default=1,ge=0,le=3)
    max_pages:int=Field(default=10,ge=1,le=50)

class ResearchCrawlPage(BaseModel):
    crawl_page_id:int; url:str; depth:int; media_type:str; size_bytes:int; sha256:str
    extracted_text:str; discovered_links:list[str]=Field(default_factory=list)
    content_trust:str; instructions_executable:bool

class ResearchCrawlRun(BaseModel):
    crawl_id:int; project_id:str; room_id:str; source_id:int; actor_id:str; root_url:str
    status:ResearchCrawlStatus; page_count:int; total_bytes:int; truncated:bool
    error_code:str|None=None; created_at:str; completed_at:str|None=None
    pages:list[ResearchCrawlPage]=Field(default_factory=list)
