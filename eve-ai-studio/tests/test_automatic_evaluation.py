from __future__ import annotations

import asyncio
from types import SimpleNamespace

from app.evaluations.automatic import AutomaticEvaluationService, executable_payload_for
from app.evaluations.models import (
    EvaluationAutomaticRunRequest,
    EvaluationRunArtifact,
    EvaluationRunDetail,
    EvaluationRunStatus,
    EvaluationScenarioDetail,
    EvaluationScenarioSummary,
    EvaluationSeverity,
    ScenarioStatus,
)
from app.providers.mock import MockEveProvider


class FakeCore:
    def __init__(self):
        self.scenarios = [
            make_scenario(index + 1, key, {})
            for index, key in enumerate(
                [
                    "context-correctness",
                    "source-grounding",
                    "room-isolation",
                    "permission-enforcement",
                    "uncertainty-handling",
                    "pedagogical-quality",
                    "language-consistency",
                    "latency-budget",
                ]
            )
        ]
        self.completed = None

    def list_scenarios(self, active_only=True, limit=500):
        return [
            EvaluationScenarioSummary(
                **{
                    key: value
                    for key, value in item.model_dump().items()
                    if key not in {"description", "input_payload", "expected_behaviors", "note"}
                }
            )
            for item in self.scenarios
        ]

    def get_scenario(self, scenario_id):
        return next(item for item in self.scenarios if item.scenario_version_id == scenario_id)

    def revise_scenario(self, scenario_id, request):
        item = self.get_scenario(scenario_id)
        item.input_payload = request.input_payload
        return item

    def start_run(self, request):
        return EvaluationRunDetail(
            run_id=1,
            prompt_version_id=request.prompt_version_id,
            created_at="now",
            status=EvaluationRunStatus.RUNNING,
            passed_scenarios=0,
            failed_scenarios=0,
            critical_failures=0,
            required_failures=0,
            total_scenarios=len(self.scenarios),
            scenario_version_ids=[item.scenario_version_id for item in self.scenarios],
        )

    def complete_run(self, run_id, request):
        self.completed = request
        return EvaluationRunDetail(
            run_id=1,
            prompt_version_id=3,
            created_at="now",
            completed_at="now",
            status=EvaluationRunStatus.PASSED,
            weighted_score=100,
            passed_scenarios=8,
            failed_scenarios=0,
            critical_failures=0,
            required_failures=0,
            total_scenarios=8,
            scenario_version_ids=[item.scenario_version_id for item in self.scenarios],
        )


class FakeStore:
    def __init__(self):
        self.saved = []

    def save_artifacts(self, run_id, artifacts):
        self.saved = artifacts
        return [EvaluationRunArtifact(run_id=run_id, **item.model_dump()) for item in artifacts]

    def list_artifacts(self, run_id):
        return [EvaluationRunArtifact(run_id=run_id, **item.model_dump()) for item in self.saved]


def make_scenario(scenario_id, key, payload):
    return EvaluationScenarioDetail(
        scenario_version_id=scenario_id,
        scenario_key=key,
        version_number=1,
        created_at="now",
        status=ScenarioStatus.ACTIVE,
        name=key,
        category="quality",
        severity=(
            EvaluationSeverity.MINOR if key == "latency-budget" else EvaluationSeverity.MAJOR
        ),
        weight=1,
        minimum_score=70,
        required=key != "latency-budget",
        checksum="x" * 64,
        parent_version_id=None,
        active=True,
        description="Descrizione sufficientemente lunga.",
        input_payload=payload,
        expected_behaviors=["x"],
        note=None,
    )


def prompt_getter(prompt_version_id):
    return SimpleNamespace(
        version_id=prompt_version_id,
        didactic_mode=SimpleNamespace(value="adaptive_explanation"),
    )


def test_payloads_are_executable():
    assert executable_payload_for("source-grounding")["context"]["lesson_id"]
    assert executable_payload_for("room-isolation")["forbidden_values"]
    assert executable_payload_for("latency-budget")["latency_budget_ms"] == 750


def test_empty_inputs_are_migrated_once():
    core = FakeCore()
    store = FakeStore()
    service = AutomaticEvaluationService(
        core,
        store,
        provider=MockEveProvider(),
        prompt_version_getter=prompt_getter,
    )
    assert all(item.input_payload for item in core.scenarios)
    assert service.ensure_executable_scenarios() == 0


def test_automatic_execution_completes_and_saves_artifacts():
    core = FakeCore()
    store = FakeStore()
    service = AutomaticEvaluationService(
        core,
        store,
        provider=MockEveProvider(),
        prompt_version_getter=prompt_getter,
    )
    result = asyncio.run(
        service.execute(EvaluationAutomaticRunRequest(prompt_version_id=3))
    )
    assert result.run.status is EvaluationRunStatus.PASSED
    assert len(result.artifacts) == 8
    assert len(core.completed.results) == 8
    assert result.runner.raw_output_stored is False


def test_artifact_endpoint_data_available():
    core = FakeCore()
    store = FakeStore()
    service = AutomaticEvaluationService(
        core,
        store,
        provider=MockEveProvider(),
        prompt_version_getter=prompt_getter,
    )
    asyncio.run(service.execute(EvaluationAutomaticRunRequest(prompt_version_id=3)))
    assert len(service.artifacts(1)) == 8
