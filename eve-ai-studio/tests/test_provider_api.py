from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.providers.catalog import build_default_catalog
from app.providers.orchestrator import ProviderOrchestrator
from app.providers.profiles import build_default_profiles
from app.providers.router import create_provider_router
from app.providers.telemetry import ProviderTelemetryStore


def build_client(tmp_path) -> TestClient:
    orchestrator = ProviderOrchestrator(
        build_default_catalog(),
        build_default_profiles(),
        ProviderTelemetryStore(tmp_path / "telemetry.sqlite3"),
    )
    app = FastAPI()
    app.include_router(create_provider_router(orchestrator))
    return TestClient(app)


def test_status_endpoint(tmp_path) -> None:
    payload = build_client(tmp_path).get("/v1/providers/status").json()
    assert payload["providers_count"] == 2
    assert payload["external_providers_enabled"] is False


def test_catalog_endpoint_marks_external_disabled(tmp_path) -> None:
    payload = build_client(tmp_path).get("/v1/providers/catalog").json()
    external = next(item for item in payload if item["key"] == "external-template")
    assert external["enabled"] is False


def test_models_endpoint(tmp_path) -> None:
    payload = build_client(tmp_path).get("/v1/providers/models").json()
    assert len(payload) == 3
    assert sum(1 for item in payload if item["enabled"]) == 2


def test_profiles_endpoint(tmp_path) -> None:
    payload = build_client(tmp_path).get("/v1/providers/profiles").json()
    assert {item["key"] for item in payload} == {
        "chat-development",
        "evaluation-safe",
        "external-review",
    }


def test_telemetry_initially_empty(tmp_path) -> None:
    payload = build_client(tmp_path).get("/v1/providers/telemetry").json()
    assert payload == []
