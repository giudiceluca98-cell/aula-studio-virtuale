from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.prompts.router import create_prompt_router
from app.prompts.service import PromptService
from app.prompts.storage import SqlitePromptStore


PROMPT = (
    "Sei Eve, tutor didattico di Aula Studio Virtuale. Usa fonti autorizzate e "
    "spiegazioni progressive, senza inventare informazioni mancanti o permessi."
)


def make_client(tmp_path: Path) -> TestClient:
    service = PromptService(SqlitePromptStore(tmp_path / "api-prompts.sqlite3"), seed_default=False)
    app = FastAPI()
    app.include_router(create_prompt_router(service))
    return TestClient(app)


def test_api_create_list_and_get(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    created = client.post(
        "/v1/prompts",
        json={
            "configuration_key": "eve-api",
            "name": "Eve API",
            "system_prompt": PROMPT,
            "didactic_mode": "adaptive_explanation",
        },
    )
    assert created.status_code == 201
    version_id = created.json()["version_id"]
    assert client.get(f"/v1/prompts/{version_id}").status_code == 200
    listed = client.get("/v1/prompts?configuration_key=eve-api")
    assert listed.json()["total"] == 1


def test_api_transition_gate_returns_conflict(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    version_id = client.post(
        "/v1/prompts",
        json={"configuration_key": "eve-gate", "name": "Eve Gate", "system_prompt": PROMPT},
    ).json()["version_id"]
    client.post(
        f"/v1/prompts/{version_id}/transition",
        json={"target_status": "in_review"},
    )
    blocked = client.post(
        f"/v1/prompts/{version_id}/transition",
        json={"target_status": "publishable", "review_tests_passed": False},
    )
    assert blocked.status_code == 409
    allowed = client.post(
        f"/v1/prompts/{version_id}/transition",
        json={"target_status": "publishable", "review_tests_passed": True},
    )
    assert allowed.status_code == 200


def test_api_modes_and_compare(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    modes = client.get("/v1/prompts/modes")
    assert modes.status_code == 200
    assert len(modes.json()) == 5
    first = client.post(
        "/v1/prompts",
        json={"configuration_key": "eve-diff", "name": "Eve Diff", "system_prompt": PROMPT},
    ).json()
    second = client.post(
        f"/v1/prompts/{first['version_id']}/revisions",
        json={"system_prompt": PROMPT + " Usa anche esempi concreti."},
    ).json()
    diff = client.get(
        "/v1/prompts/compare",
        params={"from_version_id": first["version_id"], "to_version_id": second["version_id"]},
    )
    assert diff.status_code == 200
    assert "system_prompt" in diff.json()["changed_fields"]


def test_api_rollback_creates_new_draft(tmp_path: Path) -> None:
    client = make_client(tmp_path)
    first = client.post(
        "/v1/prompts",
        json={"configuration_key": "eve-rollback", "name": "Eve Rollback", "system_prompt": PROMPT},
    ).json()
    client.post(
        f"/v1/prompts/{first['version_id']}/revisions",
        json={"system_prompt": PROMPT + " Versione due."},
    )
    rollback = client.post(
        "/v1/prompts/rollback",
        json={"version_id": first["version_id"], "note": "Ripristino API"},
    )
    assert rollback.status_code == 200
    assert rollback.json()["version_number"] == 3
    assert rollback.json()["status"] == "draft"
