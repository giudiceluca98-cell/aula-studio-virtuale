from __future__ import annotations

import json
from typing import Any

import pytest

from app.core.config import EveSettings
from app.models import ChatRequest, StudyContext
from app.providers.bootstrap import build_provider_runtime
from app.providers.external import (
    ExternalProviderConfig,
    ExternalProviderConfigurationError,
    ExternalProviderResponseError,
    OpenAICompatibleEveProvider,
)
from app.providers.orchestrator import ProviderOrchestrator
from app.providers.runtime import (
    ProviderCircuitOpenError,
    ProviderRateLimitExceededError,
    ProviderRuntimeGuard,
    ProviderRuntimePolicy,
)
from app.providers.telemetry import ProviderTelemetryStore


class FakeTransport:
    def __init__(self, response: dict[str, Any] | None = None, error: Exception | None = None) -> None:
        self.response = response
        self.error = error
        self.calls: list[dict[str, Any]] = []

    def post_json(self, endpoint: str, **kwargs) -> dict[str, Any]:
        self.calls.append({"endpoint": endpoint, **kwargs})
        if self.error:
            raise self.error
        assert self.response is not None
        return self.response


def request() -> ChatRequest:
    return ChatRequest(
        message="Spiega il concetto usando soltanto le fonti autorizzate",
        context=StudyContext(user_id="u1", room_id="r1", course_id="c1"),
    )


def config(**changes) -> ExternalProviderConfig:
    values = dict(
        provider_key="external-test",
        provider_label="External test",
        model_key="model-test-v1",
        model_label="Model test",
        base_url="https://provider.example/v1",
        api_key="super-secret-token",
    )
    values.update(changes)
    return ExternalProviderConfig(**values)


def structured(message: str = "Risposta verificata") -> dict[str, Any]:
    return {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "message": message,
                            "uncertainty": "low",
                            "sources": [{"title": "Fonte", "locator": "page:1"}],
                            "proposed_actions": [],
                        }
                    )
                }
            }
        ]
    }


def settings(**changes) -> EveSettings:
    values = dict(
        external_providers_enabled=True,
        external_provider_key="external-test",
        external_provider_label="External test",
        external_provider_base_url="https://provider.example/v1",
        external_provider_api_key="super-secret-token",
        external_provider_model="model-test-v1",
        external_provider_model_label="Model test",
        chat_execution_profile="chat-production",
    )
    values.update(changes)
    return EveSettings(**values)


def test_remote_provider_requires_https() -> None:
    with pytest.raises(ExternalProviderConfigurationError):
        config(base_url="http://provider.example/v1")


def test_provider_configuration_repr_is_redacted() -> None:
    provider = OpenAICompatibleEveProvider(config(), FakeTransport(structured()))
    assert "super-secret-token" not in repr(provider.config)


@pytest.mark.asyncio
async def test_provider_generates_chat_response_without_exposing_secret() -> None:
    transport = FakeTransport(structured())
    provider = OpenAICompatibleEveProvider(config(), transport)
    response = await provider.generate(request())
    assert response.provider == "external-test"
    assert response.sources[0].locator == "page:1"
    assert transport.calls[0]["payload"]["store"] is False
    assert "super-secret-token" not in json.dumps(transport.calls[0]["payload"])


@pytest.mark.asyncio
async def test_provider_rejects_markdown_instead_of_json() -> None:
    transport = FakeTransport({"choices": [{"message": {"content": "```json\\n{}\\n```"}}]})
    provider = OpenAICompatibleEveProvider(config(), transport)
    with pytest.raises(ExternalProviderResponseError):
        await provider.generate(request())


def test_incomplete_settings_fail_closed() -> None:
    runtime = build_provider_runtime(settings(external_provider_api_key=""))
    assert runtime.external_configured is False
    assert runtime.guard is None
    external = runtime.catalog.provider("external-test")
    assert external.enabled is False
    assert "API_KEY" in (external.reason_disabled or "")


def test_complete_settings_register_real_profile() -> None:
    runtime = build_provider_runtime(settings(), transport=FakeTransport(structured()))
    assert runtime.external_configured is True
    profile = runtime.profiles.get("chat-production")
    assert profile.targets[0].provider_key == "external-test"
    assert profile.targets[1].provider_key == "mock"


@pytest.mark.asyncio
async def test_real_provider_success_records_redacted_telemetry(tmp_path) -> None:
    runtime = build_provider_runtime(settings(), transport=FakeTransport(structured()))
    orchestrator = ProviderOrchestrator(
        runtime.catalog,
        runtime.profiles,
        ProviderTelemetryStore(tmp_path / "telemetry.sqlite3"),
        runtime_guard=runtime.guard,
    )
    result = await orchestrator.execute(request(), profile_key="chat-production", purpose="chat")
    assert result.response.provider == "external-test"
    event = orchestrator.telemetry.list()[0]
    assert event.status == "success"
    assert "super-secret-token" not in json.dumps(event.model_dump(mode="json"))


@pytest.mark.asyncio
async def test_external_failure_uses_mock_fallback(tmp_path) -> None:
    runtime = build_provider_runtime(settings(), transport=FakeTransport(error=RuntimeError("secret details")))
    orchestrator = ProviderOrchestrator(
        runtime.catalog,
        runtime.profiles,
        ProviderTelemetryStore(tmp_path / "telemetry.sqlite3"),
        runtime_guard=runtime.guard,
    )
    result = await orchestrator.execute(request(), profile_key="chat-production", purpose="chat")
    assert result.response.provider == "mock"
    assert result.telemetry.fallback_used is True
    assert "secret details" not in json.dumps(result.telemetry.model_dump(mode="json"))


def test_runtime_rate_limit() -> None:
    now = [0.0]
    guard = ProviderRuntimeGuard(ProviderRuntimePolicy(requests_per_minute=2), clock=lambda: now[0])
    guard.check_rate("chat")
    guard.check_rate("chat")
    with pytest.raises(ProviderRateLimitExceededError):
        guard.check_rate("chat")
    now[0] = 61
    guard.check_rate("chat")


def test_runtime_circuit_breaker_recovers() -> None:
    now = [0.0]
    guard = ProviderRuntimeGuard(
        ProviderRuntimePolicy(circuit_failure_threshold=2, circuit_recovery_seconds=10),
        clock=lambda: now[0],
    )
    guard.record_failure("p:m")
    guard.record_failure("p:m")
    with pytest.raises(ProviderCircuitOpenError):
        guard.before_attempt("p:m")
    now[0] = 11
    guard.before_attempt("p:m")
    assert guard.status().circuits[0].state == "closed"
