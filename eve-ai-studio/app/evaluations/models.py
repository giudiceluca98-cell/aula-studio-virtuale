from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class ScenarioStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class EvaluationSeverity(str, Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"


class CriterionOutcome(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    ERROR = "error"


class EvaluationRunStatus(str, Enum):
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"


class EvaluationScenarioCreateRequest(BaseModel):
    scenario_key: str = Field(min_length=3, max_length=100, pattern=r"^[a-z0-9][a-z0-9-]*$")
    name: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=4000)
    category: str = Field(min_length=3, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    severity: EvaluationSeverity
    weight: float = Field(default=1.0, ge=0.1, le=10)
    minimum_score: float = Field(default=80, ge=0, le=100)
    required: bool = True
    input_payload: dict[str, Any] = Field(default_factory=dict)
    expected_behaviors: list[str] = Field(min_length=1, max_length=50)
    note: str | None = Field(default=None, max_length=1000)


class EvaluationScenarioRevisionRequest(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = Field(default=None, min_length=10, max_length=4000)
    category: str | None = Field(default=None, min_length=3, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    severity: EvaluationSeverity | None = None
    weight: float | None = Field(default=None, ge=0.1, le=10)
    minimum_score: float | None = Field(default=None, ge=0, le=100)
    required: bool | None = None
    input_payload: dict[str, Any] | None = None
    expected_behaviors: list[str] | None = Field(default=None, min_length=1, max_length=50)
    note: str | None = Field(default=None, max_length=1000)


class EvaluationScenarioSummary(BaseModel):
    scenario_version_id: int
    scenario_key: str
    version_number: int
    created_at: str
    status: ScenarioStatus
    name: str
    category: str
    severity: EvaluationSeverity
    weight: float
    minimum_score: float
    required: bool
    checksum: str
    parent_version_id: int | None = None
    active: bool


class EvaluationScenarioDetail(EvaluationScenarioSummary):
    description: str
    input_payload: dict[str, Any]
    expected_behaviors: list[str]
    note: str | None = None


class EvaluationScenarioListResponse(BaseModel):
    total: int
    items: list[EvaluationScenarioSummary]


class CriterionResultInput(BaseModel):
    criterion_key: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9][a-z0-9_.-]*$")
    score: float = Field(ge=0, le=100)
    outcome: CriterionOutcome
    message: str | None = Field(default=None, max_length=1000)
    evidence_summary: str | None = Field(default=None, max_length=2000)


class ScenarioResultInput(BaseModel):
    scenario_version_id: int = Field(ge=1)
    criteria: list[CriterionResultInput] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def unique_criteria(self) -> "ScenarioResultInput":
        keys = [item.criterion_key for item in self.criteria]
        if len(keys) != len(set(keys)):
            raise ValueError("I criteri di uno scenario devono essere univoci")
        return self


class EvaluationRunCreateRequest(BaseModel):
    prompt_version_id: int = Field(ge=1)
    scenario_version_ids: list[int] | None = Field(default=None, min_length=1, max_length=500)
    note: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def unique_scenarios(self) -> "EvaluationRunCreateRequest":
        if self.scenario_version_ids and len(self.scenario_version_ids) != len(set(self.scenario_version_ids)):
            raise ValueError("Gli scenari dell'esecuzione devono essere univoci")
        return self


class EvaluationRunCompleteRequest(BaseModel):
    results: list[ScenarioResultInput] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def unique_scenarios(self) -> "EvaluationRunCompleteRequest":
        ids = [item.scenario_version_id for item in self.results]
        if len(ids) != len(set(ids)):
            raise ValueError("Ogni scenario deve avere un solo risultato aggregato")
        return self


class CriterionResult(BaseModel):
    criterion_key: str
    score: float
    outcome: CriterionOutcome
    passed: bool
    message: str | None = None
    evidence_summary: str | None = None


class ScenarioRunResult(BaseModel):
    scenario_version_id: int
    scenario_key: str
    name: str
    severity: EvaluationSeverity
    required: bool
    weight: float
    minimum_score: float
    score: float
    passed: bool
    criteria: list[CriterionResult]


class EvaluationRunSummary(BaseModel):
    run_id: int
    prompt_version_id: int
    created_at: str
    completed_at: str | None = None
    status: EvaluationRunStatus
    weighted_score: float | None = None
    passed_scenarios: int
    failed_scenarios: int
    critical_failures: int
    required_failures: int
    total_scenarios: int
    note: str | None = None


class EvaluationRunDetail(EvaluationRunSummary):
    scenario_version_ids: list[int]
    results: list[ScenarioRunResult] = Field(default_factory=list)


class EvaluationRunListResponse(BaseModel):
    total: int
    items: list[EvaluationRunSummary]


class EvaluationGateStatus(BaseModel):
    prompt_version_id: int
    eligible: bool
    latest_run_id: int | None = None
    latest_run_status: EvaluationRunStatus | None = None
    weighted_score: float | None = None
    publish_threshold: float
    critical_failures: int = 0
    required_failures: int = 0
    suite_current: bool = False
    reasons: list[str] = Field(default_factory=list)


class EvaluationCatalogStatus(BaseModel):
    scenarios_count: int
    active_scenarios_count: int
    scenario_versions_count: int
    runs_count: int
    passed_runs_count: int
    failed_runs_count: int
    latest_run_id: int | None = None
    publish_threshold: float
    schema_version: int
    persistent: bool = True
