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


class ResearchSourceStatus(str, Enum):
    QUARANTINED = "quarantined"
    REVIEW_REQUIRED = "review_required"
    APPROVED = "approved"
    REJECTED = "rejected"


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
