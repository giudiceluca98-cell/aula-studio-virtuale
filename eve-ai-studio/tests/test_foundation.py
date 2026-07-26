from fastapi.testclient import TestClient
import pytest

from app.core.permissions import PermissionDeniedError, require_permission
from app.main import app
from app.models import PermissionLevel

client = TestClient(app)


def test_health_reports_modular_mock_provider() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["enabled"] is True
    assert payload["service_version"] == "0.9.0"


def test_chat_returns_structured_simulation_and_source() -> None:
    response = client.post(
        "/v1/chat",
        json={
            "message": "Spiegami questa parte",
            "mode": "explain",
            "context": {
                "user_id": "user-1",
                "room_id": "room-1",
                "course_id": "python-zero",
                "lesson_id": "lesson-1-2",
                "permission_level": "read",
            },
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "mock"
    assert payload["proposed_actions"] == []
    assert payload["sources"][0]["locator"] == "lesson-1-2"


def test_context_limit_is_enforced() -> None:
    response = client.post(
        "/v1/chat",
        json={
            "message": "Analizza",
            "context": {
                "user_id": "user-1",
                "selected_text": "x" * 12001,
                "permission_level": "read",
            },
        },
    )
    assert response.status_code == 413


def test_permission_levels_are_enforced_by_code() -> None:
    with pytest.raises(PermissionDeniedError):
        require_permission(PermissionLevel.READ, PermissionLevel.CONFIRM)

    require_permission(PermissionLevel.ADMIN, PermissionLevel.CONFIRM)
