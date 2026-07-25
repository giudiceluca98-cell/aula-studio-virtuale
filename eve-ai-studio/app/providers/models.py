from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class ProviderKind(StrEnum):
    MOCK = "mock"
    EXTERNAL = "external"


class ProviderDescriptor(BaseModel):
    key: str
    label: str
    kind: ProviderKind
    enabled: bool
    external: bool = False
    reason_disabled: str | None = None
    models: list[str] = Field(default_factory=list)


class ModelDescriptor(BaseModel):
    key: str
    provider_key: str
    label: str
    enabled: bool
    input_cost_per_million_usd: float = 0.0
    output_cost_per_million_usd: float = 0.0
    context_window: int = 128_000
    deterministic: bool = False
    reason_disabled: str | None = None


class ExecutionTarget(BaseModel):
    provider_key: str
    model_key: str


class RetryPolicy(BaseModel):
    max_attempts_per_target: int = Field(default=1, ge=1, le=5)
    timeout_ms: int = Field(default=2_000, ge=10, le=120_000)
    backoff_ms: int = Field(default=0, ge=0, le=10_000)


class ExecutionProfile(BaseModel):
    key: str
    label: str
    purpose: str
    enabled: bool = True
    external_allowed: bool = False
    targets: list[ExecutionTarget] = Field(min_length=1)
    retry: RetryPolicy = Field(default_factory=RetryPolicy)
    max_input_tokens: int = Field(default=8_000, ge=1)
    max_output_tokens: int = Field(default=4_000, ge=1)
    max_total_tokens: int = Field(default=12_000, ge=1)
    max_cost_per_run_usd: float = Field(default=0.0, ge=0)
    daily_token_budget: int = Field(default=100_000, ge=1)
    daily_cost_budget_usd: float = Field(default=0.0, ge=0)


class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int


class ProviderAttempt(BaseModel):
    provider_key: str
    model_key: str
    attempt_number: int
    duration_ms: float
    status: str
    error_code: str | None = None


class ProviderExecutionTelemetry(BaseModel):
    execution_id: int | None = None
    created_at: str
    purpose: str
    profile_key: str
    provider_key: str
    model_key: str
    status: str
    attempts_count: int
    fallback_used: bool
    duration_ms: float
    usage: TokenUsage
    estimated_cost_usd: float
    request_sha256: str
    response_sha256: str | None = None
    error_code: str | None = None
    attempts: list[ProviderAttempt] = Field(default_factory=list)


class ProviderCatalogStatus(BaseModel):
    providers_count: int
    enabled_providers_count: int
    external_providers_enabled: bool
    models_count: int
    enabled_models_count: int
    profiles_count: int
    telemetry_events_count: int
    daily_tokens: int
    daily_cost_usd: float


class ProviderExecutionResult(BaseModel):
    response: object
    telemetry: ProviderExecutionTelemetry

    model_config = {"arbitrary_types_allowed": True}
