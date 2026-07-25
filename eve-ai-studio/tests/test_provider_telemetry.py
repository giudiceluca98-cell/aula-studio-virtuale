from app.providers.models import (
    ProviderAttempt,
    ProviderExecutionTelemetry,
    TokenUsage,
)
from app.providers.telemetry import ProviderTelemetryStore, utc_now


def sample() -> ProviderExecutionTelemetry:
    return ProviderExecutionTelemetry(
        created_at=utc_now(),
        purpose="chat",
        profile_key="chat-development",
        provider_key="mock",
        model_key="m",
        status="success",
        attempts_count=1,
        fallback_used=False,
        duration_ms=3.2,
        usage=TokenUsage(input_tokens=10, output_tokens=20, total_tokens=30),
        estimated_cost_usd=0,
        request_sha256="a" * 64,
        response_sha256="b" * 64,
        attempts=[
            ProviderAttempt(
                provider_key="mock",
                model_key="m",
                attempt_number=1,
                duration_ms=3.2,
                status="success",
            )
        ],
    )


def test_schema_created(tmp_path) -> None:
    store = ProviderTelemetryStore(tmp_path / "telemetry.sqlite3")
    assert store.schema_version == 1


def test_record_and_read(tmp_path) -> None:
    store = ProviderTelemetryStore(tmp_path / "telemetry.sqlite3")
    saved = store.record(sample())
    assert saved.execution_id == 1
    assert store.list()[0].usage.total_tokens == 30


def test_daily_usage_counts_only_success(tmp_path) -> None:
    store = ProviderTelemetryStore(tmp_path / "telemetry.sqlite3")
    store.record(sample())
    failed = sample().model_copy(
        update={
            "status": "failed",
            "usage": TokenUsage(input_tokens=5, output_tokens=0, total_tokens=5),
        }
    )
    store.record(failed)
    tokens, cost = store.daily_usage()
    assert tokens == 30
    assert cost == 0


def test_persistence_after_reopen(tmp_path) -> None:
    path = tmp_path / "telemetry.sqlite3"
    store = ProviderTelemetryStore(path)
    store.record(sample())
    store.close()
    reopened = ProviderTelemetryStore(path)
    assert reopened.count() == 1
