from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class SourceAvailabilityStatus(str, Enum):
    UNKNOWN = "unknown"
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    REMOVED = "removed"


class SourceFreshnessStatus(str, Enum):
    UNKNOWN = "unknown"
    CURRENT = "current"
    STALE = "stale"
    CHANGED = "changed"
    REPLACED = "replaced"


class SourceConsistencyStatus(str, Enum):
    UNASSESSED = "unassessed"
    CONSISTENT = "consistent"
    CONFLICTED = "conflicted"


class SourceHealthSummaryStatus(str, Enum):
    UNKNOWN = "unknown"
    HEALTHY = "healthy"
    ATTENTION = "attention"
    CRITICAL = "critical"


class SourceHealthCheckKind(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"
    REPLACEMENT = "replacement"


class SourceConflictType(str, Enum):
    DIRECT_CONTRADICTION = "direct_contradiction"
    DATE_MISMATCH = "date_mismatch"
    NUMERIC_MISMATCH = "numeric_mismatch"
    VERSION_DIVERGENCE = "version_divergence"
    SCOPE_MISMATCH = "scope_mismatch"
    OTHER = "other"


class SourceConflictStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class SourceConflictResolution(str, Enum):
    PREFER_LEFT = "prefer_left"
    PREFER_RIGHT = "prefer_right"
    KEEP_BOTH = "keep_both"
    DISMISS = "dismiss"


class SourceFreshnessPolicyRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    max_age_days: int = Field(ge=1, le=3650)
    recheck_interval_hours: int = Field(ge=1, le=8760)
    note: str = Field(min_length=10, max_length=2000)

    @field_validator("room_id", "actor_id", "note")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class SourceFreshnessPolicyView(BaseModel):
    source_id: int
    project_id: str
    room_id: str
    max_age_days: int
    recheck_interval_hours: int
    actor_id: str
    note: str
    updated_at: str
    custom: bool


class SourceHealthCheckRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    force: bool = False

    @field_validator("room_id", "actor_id")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class SourceHealthBatchRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    limit: int = Field(default=25, ge=1, le=100)

    @field_validator("room_id", "actor_id")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class SourceHealthComponents(BaseModel):
    availability: int = Field(ge=0, le=100)
    freshness: int = Field(ge=0, le=100)
    provenance: int = Field(ge=0, le=100)
    consistency: int = Field(ge=0, le=100)


class SourceHealthSnapshot(BaseModel):
    snapshot_id: int
    source_id: int
    project_id: str
    room_id: str
    check_kind: SourceHealthCheckKind
    actor_id: str
    availability_status: SourceAvailabilityStatus
    freshness_status: SourceFreshnessStatus
    consistency_status: SourceConsistencyStatus
    summary_status: SourceHealthSummaryStatus
    components: SourceHealthComponents
    health_score: int = Field(ge=0, le=100)
    previous_acquisition_id: int | None = None
    observed_acquisition_id: int | None = None
    previous_sha256: str | None = None
    observed_sha256: str | None = None
    active_promotion_id: int | None = None
    material_id: str | None = None
    version_id: int | None = None
    source_date: str | None = None
    acquired_at: str | None = None
    checked_at: str
    expires_at: str | None = None
    next_check_at: str | None = None
    final_url: str | None = None
    http_status: int | None = None
    consecutive_failures: int = 0
    signals: list[str] = Field(default_factory=list)
    error_code: str | None = None


class SourceHealthState(BaseModel):
    source_id: int
    project_id: str
    room_id: str
    latest_snapshot_id: int | None = None
    availability_status: SourceAvailabilityStatus
    freshness_status: SourceFreshnessStatus
    consistency_status: SourceConsistencyStatus
    summary_status: SourceHealthSummaryStatus
    components: SourceHealthComponents
    health_score: int = Field(ge=0, le=100)
    consecutive_failures: int
    open_conflicts: int
    replacement_source_id: int | None = None
    previous_acquisition_id: int | None = None
    observed_acquisition_id: int | None = None
    last_checked_at: str | None = None
    expires_at: str | None = None
    next_check_at: str | None = None
    updated_at: str


class SourceHealthListResponse(BaseModel):
    total: int
    items: list[SourceHealthState]


class SourceHealthBatchResult(BaseModel):
    room_id: str
    requested: int
    completed: int
    attention: int
    critical: int
    errors: list[dict[str, Any]] = Field(default_factory=list)
    snapshots: list[SourceHealthSnapshot] = Field(default_factory=list)


class SourceReplacementRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    replacement_source_id: int = Field(ge=1)
    rationale: str = Field(min_length=10, max_length=2000)

    @field_validator("room_id", "actor_id", "rationale")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class SourceConflictCreateRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    left_source_id: int = Field(ge=1)
    right_source_id: int = Field(ge=1)
    topic_key: str = Field(min_length=2, max_length=240)
    conflict_type: SourceConflictType
    left_claim: str = Field(min_length=2, max_length=4000)
    right_claim: str = Field(min_length=2, max_length=4000)
    left_locator: str | None = Field(default=None, max_length=500)
    right_locator: str | None = Field(default=None, max_length=500)
    rationale: str = Field(min_length=10, max_length=2000)

    @field_validator(
        "room_id", "actor_id", "topic_key", "left_claim", "right_claim", "rationale"
    )
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value

    @field_validator("left_locator", "right_locator")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def distinct_sources(self) -> "SourceConflictCreateRequest":
        if self.left_source_id == self.right_source_id:
            raise ValueError("Il conflitto richiede due fonti differenti")
        return self


class SourceConflictResolveRequest(BaseModel):
    room_id: str = Field(min_length=1, max_length=120)
    actor_id: str = Field(min_length=1, max_length=160)
    resolution: SourceConflictResolution
    rationale: str = Field(min_length=10, max_length=2000)

    @field_validator("room_id", "actor_id", "rationale")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto")
        return value


class SourceConflict(BaseModel):
    conflict_id: int
    room_id: str
    project_id: str | None = None
    left_source_id: int
    right_source_id: int
    topic_key: str
    conflict_type: SourceConflictType
    status: SourceConflictStatus
    left_claim: str
    right_claim: str
    left_locator: str | None = None
    right_locator: str | None = None
    detected_by: str
    detection_rationale: str
    resolution: SourceConflictResolution | None = None
    preferred_source_id: int | None = None
    resolved_by: str | None = None
    resolution_rationale: str | None = None
    created_at: str
    resolved_at: str | None = None


class SourceConflictListResponse(BaseModel):
    total: int
    items: list[SourceConflict]


class CorpusProjectCoverage(BaseModel):
    project_id: str
    title: str
    candidate_sources: int
    acquired_sources: int
    approved_sources: int
    active_promotions: int
    health_checked_sources: int
    healthy_sources: int
    attention_sources: int
    critical_sources: int
    open_conflicts: int


class CorpusHealthReport(BaseModel):
    report_id: int
    room_id: str
    generated_by: str
    generated_at: str
    total_projects: int
    total_sources: int
    acquired_sources: int
    approved_sources: int
    active_promotions: int
    checked_sources: int
    healthy_sources: int
    attention_sources: int
    critical_sources: int
    stale_sources: int
    changed_sources: int
    unavailable_sources: int
    removed_sources: int
    open_conflicts: int
    average_health_score: float
    coverage_ratio: float
    reliability_ratio: float
    projects: list[CorpusProjectCoverage]
    notes: list[str]
    report_sha256: str


class SourceHealthServiceStatus(BaseModel):
    checkpoint: str
    schema_version: int
    health_enabled: bool
    recheck_enabled: bool
    conflict_tracking_enabled: bool
    reporting_enabled: bool
    default_max_age_days: int
    default_recheck_interval_hours: int
    max_due_per_run: int
    total_states: int
    due_sources: int
    open_conflicts: int
    stored_reports: int
    health_score_can_approve: bool = False
    automatic_promotion: bool = False
