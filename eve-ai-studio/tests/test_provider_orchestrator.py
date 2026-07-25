import pytest

from app.models import ChatRequest, StudyContext
from app.providers.catalog import ProviderCatalog, build_default_catalog
from app.providers.mock import MockEveProvider
from app.providers.models import (
    ExecutionProfile,
    ExecutionTarget,
    ModelDescriptor,
    ProviderDescriptor,
    ProviderKind,
    RetryPolicy,
)
from app.providers.orchestrator import (
    ManagedEveProvider,
    ProviderBudgetExceededError,
    ProviderExecutionError,
    ProviderOrchestrator,
    estimate_tokens,
)
from app.providers.profiles import ExecutionProfileRegistry, build_default_profiles
from app.providers.telemetry import ProviderTelemetryStore


def request(message: str = "Spiega", selected: str | None = None) -> ChatRequest:
    return ChatRequest(
        message=message,
        context=StudyContext(
            user_id="u",
            room_id="r",
            course_id="c",
            lesson_id="l",
            selected_text=selected,
        ),
    )


def build(tmp_path, catalog=None, profiles=None) -> ProviderOrchestrator:
    return ProviderOrchestrator(
        catalog or build_default_catalog(),
        profiles or build_default_profiles(),
        ProviderTelemetryStore(tmp_path / "telemetry.sqlite3"),
    )


def test_token_estimator_is_positive_and_deterministic() -> None:
    item = request()
    assert estimate_tokens(item) == estimate_tokens(item) > 0


@pytest.mark.asyncio
async def test_success_records_telemetry(tmp_path) -> None:
    orchestrator = build(tmp_path)
    result = await orchestrator.execute(
        request(),
        profile_key="chat-development",
        purpose="chat",
    )
    assert result.response.provider == "mock"
    assert result.telemetry.status == "success"
    assert result.telemetry.usage.total_tokens > 0
    assert orchestrator.telemetry.count() == 1


@pytest.mark.asyncio
async def test_managed_provider_uses_orchestrator(tmp_path) -> None:
    orchestrator = build(tmp_path)
    provider = ManagedEveProvider(
        orchestrator,
        profile_key="evaluation-safe",
        purpose="evaluation",
    )
    response = await provider.generate(request())
    assert response.model == "eve-foundation-mock-v2"


@pytest.mark.asyncio
async def test_input_budget_blocks_before_call(tmp_path) -> None:
    profile = ExecutionProfile(
        key="tiny",
        label="tiny",
        purpose="chat",
        targets=[
            ExecutionTarget(
                provider_key="mock",
                model_key="eve-foundation-mock-v2",
            )
        ],
        retry=RetryPolicy(),
        max_input_tokens=1,
        max_output_tokens=10,
        max_total_tokens=11,
        max_cost_per_run_usd=0,
        daily_token_budget=100,
        daily_cost_budget_usd=0,
    )
    orchestrator = build(
        tmp_path,
        profiles=ExecutionProfileRegistry([profile]),
    )
    with pytest.raises(ProviderBudgetExceededError):
        await orchestrator.execute(
            request("x" * 100),
            profile_key="tiny",
            purpose="chat",
        )


@pytest.mark.asyncio
async def test_purpose_mismatch_is_blocked(tmp_path) -> None:
    orchestrator = build(tmp_path)
    with pytest.raises(Exception):
        await orchestrator.execute(
            request(),
            profile_key="evaluation-safe",
            purpose="chat",
        )


@pytest.mark.asyncio
async def test_retry_then_success(tmp_path) -> None:
    catalog = ProviderCatalog()
    catalog.register_provider(
        ProviderDescriptor(
            key="mock",
            label="mock",
            kind=ProviderKind.MOCK,
            enabled=True,
        )
    )
    instance = MockEveProvider("retry-model", failures_before_success=1)
    catalog.register_model(
        ModelDescriptor(
            key="retry-model",
            provider_key="mock",
            label="retry",
            enabled=True,
            deterministic=True,
        ),
        lambda: instance,
    )
    profile = ExecutionProfile(
        key="retry",
        label="retry",
        purpose="chat",
        targets=[ExecutionTarget(provider_key="mock", model_key="retry-model")],
        retry=RetryPolicy(
            max_attempts_per_target=2,
            timeout_ms=500,
            backoff_ms=0,
        ),
        max_input_tokens=1_000,
        max_output_tokens=1_000,
        max_total_tokens=2_000,
        max_cost_per_run_usd=0,
        daily_token_budget=10_000,
        daily_cost_budget_usd=0,
    )
    orchestrator = build(
        tmp_path,
        catalog,
        ExecutionProfileRegistry([profile]),
    )
    result = await orchestrator.execute(
        request(),
        profile_key="retry",
        purpose="chat",
    )
    assert result.telemetry.attempts_count == 2
    assert result.telemetry.fallback_used is False


@pytest.mark.asyncio
async def test_timeout_uses_fallback(tmp_path) -> None:
    catalog = ProviderCatalog()
    catalog.register_provider(
        ProviderDescriptor(
            key="mock",
            label="mock",
            kind=ProviderKind.MOCK,
            enabled=True,
        )
    )
    catalog.register_model(
        ModelDescriptor(
            key="slow",
            provider_key="mock",
            label="slow",
            enabled=True,
            deterministic=True,
        ),
        lambda: MockEveProvider("slow", delay_ms=50),
    )
    catalog.register_model(
        ModelDescriptor(
            key="fast",
            provider_key="mock",
            label="fast",
            enabled=True,
            deterministic=True,
        ),
        lambda: MockEveProvider("fast"),
    )
    profile = ExecutionProfile(
        key="fallback",
        label="fallback",
        purpose="chat",
        targets=[
            ExecutionTarget(provider_key="mock", model_key="slow"),
            ExecutionTarget(provider_key="mock", model_key="fast"),
        ],
        retry=RetryPolicy(
            max_attempts_per_target=1,
            timeout_ms=10,
            backoff_ms=0,
        ),
        max_input_tokens=1_000,
        max_output_tokens=1_000,
        max_total_tokens=2_000,
        max_cost_per_run_usd=0,
        daily_token_budget=10_000,
        daily_cost_budget_usd=0,
    )
    orchestrator = build(
        tmp_path,
        catalog,
        ExecutionProfileRegistry([profile]),
    )
    result = await orchestrator.execute(
        request(),
        profile_key="fallback",
        purpose="chat",
    )
    assert result.response.model == "fast"
    assert result.telemetry.fallback_used is True
    assert result.telemetry.attempts_count == 2


@pytest.mark.asyncio
async def test_all_targets_fail_records_redacted_error(tmp_path) -> None:
    catalog = ProviderCatalog()
    catalog.register_provider(
        ProviderDescriptor(
            key="mock",
            label="mock",
            kind=ProviderKind.MOCK,
            enabled=True,
        )
    )
    catalog.register_model(
        ModelDescriptor(
            key="bad",
            provider_key="mock",
            label="bad",
            enabled=True,
        ),
        lambda: MockEveProvider("bad", failures_before_success=10),
    )
    profile = ExecutionProfile(
        key="bad",
        label="bad",
        purpose="chat",
        targets=[ExecutionTarget(provider_key="mock", model_key="bad")],
        retry=RetryPolicy(
            max_attempts_per_target=2,
            timeout_ms=100,
            backoff_ms=0,
        ),
        max_input_tokens=1_000,
        max_output_tokens=1_000,
        max_total_tokens=2_000,
        max_cost_per_run_usd=0,
        daily_token_budget=10_000,
        daily_cost_budget_usd=0,
    )
    orchestrator = build(
        tmp_path,
        catalog,
        ExecutionProfileRegistry([profile]),
    )
    with pytest.raises(ProviderExecutionError):
        await orchestrator.execute(
            request(),
            profile_key="bad",
            purpose="chat",
        )
    event = orchestrator.telemetry.list()[0]
    assert event.status == "failed"
    assert event.error_code == "RuntimeError"
    assert "transient failure" not in str(event.model_dump())


@pytest.mark.asyncio
async def test_daily_token_budget_is_enforced(tmp_path) -> None:
    profile = ExecutionProfile(
        key="daily",
        label="daily",
        purpose="chat",
        targets=[
            ExecutionTarget(
                provider_key="mock",
                model_key="eve-foundation-mock-v2",
            )
        ],
        retry=RetryPolicy(),
        max_input_tokens=1_000,
        max_output_tokens=1_000,
        max_total_tokens=2_000,
        max_cost_per_run_usd=0,
        daily_token_budget=50,
        daily_cost_budget_usd=0,
    )
    orchestrator = build(
        tmp_path,
        profiles=ExecutionProfileRegistry([profile]),
    )
    await orchestrator.execute(
        request(),
        profile_key="daily",
        purpose="chat",
    )
    with pytest.raises(ProviderBudgetExceededError):
        await orchestrator.execute(
            request(),
            profile_key="daily",
            purpose="chat",
        )
