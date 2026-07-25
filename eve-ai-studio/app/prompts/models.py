from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class PromptStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHABLE = "publishable"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class DidacticMode(str, Enum):
    ADAPTIVE_EXPLANATION = "adaptive_explanation"
    SOCRATIC = "socratic"
    QUIZ = "quiz"
    CORRECTION = "correction"
    PLANNING = "planning"


class PromptParameters(BaseModel):
    tone: Literal["calm_direct", "friendly", "technical"] = "calm_direct"
    depth: int = Field(default=2, ge=1, le=4)
    source_policy: Literal["required", "when_available", "disabled"] = "required"
    solution_policy: Literal["guided", "direct", "never_immediate"] = "guided"
    ask_check_question: bool = True
    memory_policy: Literal["off", "consent", "session_only"] = "consent"
    tool_policy: Literal["read_only", "propose", "confirm"] = "propose"


class DidacticModeDefinition(BaseModel):
    key: DidacticMode
    label: str
    description: str
    default_parameters: PromptParameters


class PromptVersionCreateRequest(BaseModel):
    configuration_key: str = Field(min_length=3, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=3, max_length=120)
    system_prompt: str = Field(min_length=50, max_length=50_000)
    didactic_mode: DidacticMode = DidacticMode.ADAPTIVE_EXPLANATION
    parameters: PromptParameters = Field(default_factory=PromptParameters)
    note: str | None = Field(default=None, max_length=1000)


class PromptRevisionRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=120)
    system_prompt: str | None = Field(default=None, min_length=50, max_length=50_000)
    didactic_mode: DidacticMode | None = None
    parameters: PromptParameters | None = None
    note: str | None = Field(default=None, max_length=1000)


class PromptTransitionRequest(BaseModel):
    target_status: PromptStatus
    review_tests_passed: bool = False
    note: str | None = Field(default=None, max_length=1000)


class PromptRollbackRequest(BaseModel):
    version_id: int = Field(ge=1)
    note: str | None = Field(default=None, max_length=1000)


class PromptVersionSummary(BaseModel):
    version_id: int
    configuration_key: str
    version_number: int
    created_at: str
    status: PromptStatus
    name: str
    didactic_mode: DidacticMode
    checksum: str
    parent_version_id: int | None = None
    active: bool
    published_at: str | None = None


class PromptVersionDetail(PromptVersionSummary):
    system_prompt: str
    parameters: PromptParameters
    note: str | None = None


class PromptVersionListResponse(BaseModel):
    total: int
    items: list[PromptVersionSummary]


class PromptCatalogStatus(BaseModel):
    versions_count: int
    drafts_count: int
    in_review_count: int
    publishable_count: int
    published_count: int
    active_version_id: int | None
    active_configuration_key: str | None
    schema_version: int
    persistent: bool = True


class PromptVersionDiff(BaseModel):
    from_version_id: int
    to_version_id: int
    changed: bool
    changed_fields: list[str] = Field(default_factory=list)
    from_checksum: str
    to_checksum: str


class PromptTransitionResult(BaseModel):
    version_id: int
    previous_status: PromptStatus
    current_status: PromptStatus
    active: bool
    transitioned_at: str


class PromptRollbackResult(BaseModel):
    source_version_id: int
    new_version_id: int
    configuration_key: str
    version_number: int
    status: PromptStatus
    created_at: str
