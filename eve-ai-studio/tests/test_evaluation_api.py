from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.evaluations.router import create_evaluation_router
from app.evaluations.service import EvaluationService
from app.evaluations.storage import SqliteEvaluationStore


def build_client(tmp_path):
    def getter(version_id: int):
        if version_id != 3:
            raise KeyError(version_id)
        return SimpleNamespace(version_id=version_id)

    service = EvaluationService(
        SqliteEvaluationStore(tmp_path / "api-evaluations.sqlite3"),
        prompt_version_getter=getter,
        seed_default=True,
    )
    app = FastAPI()
    app.include_router(create_evaluation_router(service))
    return TestClient(app), service


def result_payload(service, run, *, fail_key: str | None = None):
    items = []
    for scenario_id in run.scenario_version_ids:
        scenario = service.get_scenario(scenario_id)
        failed = scenario.scenario_key == fail_key
        items.append(
            {
                "scenario_version_id": scenario_id,
                "criteria": [
                    {
                        "criterion_key": "main",
                        "score": 0 if failed else 100,
                        "outcome": "fail" if failed else "pass",
                        "message": "demo",
                    }
                ],
            }
        )
    return {"results": items}


def test_api_status_scenarios_and_gate(tmp_path) -> None:
    client, _ = build_client(tmp_path)
    status_response = client.get("/v1/evaluations/status")
    assert status_response.status_code == 200
    assert status_response.json()["active_scenarios_count"] == 8
    scenarios_response = client.get("/v1/evaluations/scenarios?active_only=true")
    assert scenarios_response.json()["total"] == 8
    gate_response = client.get("/v1/evaluations/gate/3")
    assert gate_response.status_code == 200
    assert gate_response.json()["eligible"] is False


def test_api_run_completion_and_gate(tmp_path) -> None:
    client, service = build_client(tmp_path)
    created = client.post("/v1/evaluations/runs", json={"prompt_version_id": 3})
    assert created.status_code == 201
    run = service.get_run(created.json()["run_id"])
    completed = client.post(
        f"/v1/evaluations/runs/{run.run_id}/complete",
        json=result_payload(service, run),
    )
    assert completed.status_code == 200
    assert completed.json()["status"] == "passed"
    gate = client.get("/v1/evaluations/gate/3").json()
    assert gate["eligible"] is True


def test_api_failed_run_exposes_critical_reason(tmp_path) -> None:
    client, service = build_client(tmp_path)
    created = client.post("/v1/evaluations/runs", json={"prompt_version_id": 3})
    run = service.get_run(created.json()["run_id"])
    completed = client.post(
        f"/v1/evaluations/runs/{run.run_id}/complete",
        json=result_payload(service, run, fail_key="permission-enforcement"),
    )
    assert completed.json()["status"] == "failed"
    gate = client.get("/v1/evaluations/gate/3").json()
    assert gate["eligible"] is False
    assert gate["critical_failures"] == 1


def test_api_unknown_prompt_is_404(tmp_path) -> None:
    client, _ = build_client(tmp_path)
    response = client.post("/v1/evaluations/runs", json={"prompt_version_id": 9})
    assert response.status_code == 404
