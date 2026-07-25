from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.evaluations.automatic_router import create_automatic_evaluation_router
from app.evaluations.models import (
    EvaluationAutomaticRunResult,
    EvaluationRunArtifact,
    EvaluationRunDetail,
    EvaluationRunnerStatus,
    EvaluationRunStatus,
)


class FakeAutomaticService:
    def status(self):
        return EvaluationRunnerStatus(
            provider="mock",
            model="m",
            deterministic=True,
            raw_output_stored=False,
            evidence_max_chars=500,
            latency_budget_ms=750,
        )

    async def execute(self, request):
        run = EvaluationRunDetail(
            run_id=1,
            prompt_version_id=request.prompt_version_id,
            created_at="now",
            completed_at="now",
            status=EvaluationRunStatus.PASSED,
            weighted_score=100,
            passed_scenarios=1,
            failed_scenarios=0,
            critical_failures=0,
            required_failures=0,
            total_scenarios=1,
            scenario_version_ids=[1],
        )
        artifact = EvaluationRunArtifact(
            run_id=1,
            scenario_version_id=1,
            provider="mock",
            model="m",
            duration_ms=1,
            output_sha256="a" * 64,
            output_chars=10,
            sources_count=1,
            proposed_actions_count=0,
            redacted=True,
        )
        return EvaluationAutomaticRunResult(
            run=run,
            artifacts=[artifact],
            runner=self.status(),
        )

    def artifacts(self, run_id):
        if run_id == 99:
            from app.evaluations.storage_base import EvaluationRunNotFoundError

            raise EvaluationRunNotFoundError(run_id)
        return [
            EvaluationRunArtifact(
                run_id=run_id,
                scenario_version_id=1,
                provider="mock",
                model="m",
                duration_ms=1,
                output_sha256="a" * 64,
                output_chars=10,
                sources_count=1,
                proposed_actions_count=0,
                redacted=True,
            )
        ]


def build_client():
    app = FastAPI()
    app.include_router(create_automatic_evaluation_router(FakeAutomaticService()))
    return TestClient(app)


def test_runner_status_api():
    response = build_client().get("/v1/evaluations/runner/status")
    assert response.status_code == 200
    assert response.json()["raw_output_stored"] is False


def test_execute_api():
    response = build_client().post(
        "/v1/evaluations/runs/execute",
        json={"prompt_version_id": 3},
    )
    assert response.status_code == 201
    assert response.json()["run"]["status"] == "passed"
    assert len(response.json()["artifacts"]) == 1


def test_artifacts_api_and_404():
    assert build_client().get("/v1/evaluations/runs/1/artifacts").status_code == 200
    assert build_client().get("/v1/evaluations/runs/99/artifacts").status_code == 404
