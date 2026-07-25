from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest

from app.evaluations.graders import grade_scenario
from app.evaluations.models import EvaluationScenarioDetail, EvaluationSeverity, ScenarioStatus
from app.evaluations.runner import DeterministicEvaluationRunner
from app.models import ChatResponse
from app.providers.mock import MockEveProvider


def scenario(key, minimum=80, payload=None, sid=1):
    return EvaluationScenarioDetail(
        scenario_version_id=sid,
        scenario_key=key,
        version_number=1,
        created_at="now",
        status=ScenarioStatus.ACTIVE,
        name=key,
        category="quality",
        severity=EvaluationSeverity.MAJOR,
        weight=1,
        minimum_score=minimum,
        required=True,
        checksum="x" * 64,
        parent_version_id=None,
        active=True,
        description="Descrizione sufficientemente lunga dello scenario.",
        input_payload=payload or {},
        expected_behaviors=["Comportamento"],
        note=None,
    )


prompt = SimpleNamespace(didactic_mode=SimpleNamespace(value="adaptive_explanation"))


def run(coroutine):
    return asyncio.run(coroutine)


def test_runner_status_is_deterministic_and_private():
    status = DeterministicEvaluationRunner(MockEveProvider()).status()
    assert status.deterministic is True
    assert status.raw_output_stored is False


def test_build_request_uses_executable_defaults():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    request = runner.build_request(scenario("context-correctness"), prompt)
    assert request.context.room_id == "room-evaluation"
    assert request.mode == "adaptive_explanation"


def test_custom_payload_overrides_defaults():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    item = scenario(
        "context-correctness",
        payload={"message": "Custom", "context": {"room_id": "room-x"}, "mode": "quiz"},
    )
    request = runner.build_request(item, prompt)
    assert request.message == "Custom"
    assert request.context.room_id == "room-x"
    assert request.mode == "quiz"


@pytest.mark.parametrize(
    "key",
    [
        "context-correctness",
        "source-grounding",
        "room-isolation",
        "permission-enforcement",
        "uncertainty-handling",
        "pedagogical-quality",
        "language-consistency",
        "latency-budget",
    ],
)
def test_default_scenarios_pass_with_mock(key):
    runner = DeterministicEvaluationRunner(MockEveProvider())
    batch = run(runner.execute(prompt=prompt, scenarios=[scenario(key, minimum=70)]))
    assert batch.results[0].criteria[0].outcome.value == "pass"
    assert batch.artifacts[0].redacted is True
    assert len(batch.artifacts[0].output_sha256) == 64


def test_room_isolation_detects_leak():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    item = scenario("room-isolation", payload={"forbidden_values": ["room-evaluation"]})
    request = runner.build_request(item, prompt)
    response = run(runner.provider.generate(request))
    result = grade_scenario(item, request, response, 1)[0]
    assert result.outcome.value == "fail"


def test_permission_detects_action():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    item = scenario("permission-enforcement")
    request = runner.build_request(item, prompt)
    response = ChatResponse(
        message="ok",
        provider="mock",
        model="x",
        uncertainty="u",
        sources=[],
        proposed_actions=[{"type": "write"}],
    )
    assert grade_scenario(item, request, response, 1)[0].outcome.value == "fail"


def test_latency_can_fail():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    item = scenario("latency-budget", payload={"latency_budget_ms": 10})
    request = runner.build_request(item, prompt)
    response = run(runner.provider.generate(request))
    assert grade_scenario(item, request, response, 100)[0].outcome.value == "fail"


def test_unknown_scenario_uses_generic_grader():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    batch = run(runner.execute(prompt=prompt, scenarios=[scenario("custom-scenario")]))
    assert batch.results[0].criteria[0].criterion_key == "provider.response"


class BrokenProvider:
    name = "broken"
    model = "broken-v1"

    async def generate(self, request):
        raise RuntimeError("secret raw exception body")


def test_provider_error_is_redacted():
    runner = DeterministicEvaluationRunner(BrokenProvider())
    batch = run(runner.execute(prompt=prompt, scenarios=[scenario("context-correctness")]))
    artifact = batch.artifacts[0]
    assert artifact.error_code == "RuntimeError"
    assert artifact.output_chars == 0
    assert batch.results[0].criteria[0].outcome.value == "error"
    assert "secret raw" not in (batch.results[0].criteria[0].evidence_summary or "")


def test_evidence_is_limited():
    runner = DeterministicEvaluationRunner(MockEveProvider(), evidence_max_chars=80)
    batch = run(runner.execute(prompt=prompt, scenarios=[scenario("context-correctness")]))
    assert len(batch.results[0].criteria[0].evidence_summary) <= 80


def test_artifact_does_not_contain_raw_message():
    runner = DeterministicEvaluationRunner(MockEveProvider())
    batch = run(runner.execute(prompt=prompt, scenarios=[scenario("source-grounding")]))
    dump = batch.artifacts[0].model_dump_json()
    assert "Questa è una risposta" not in dump
    assert batch.artifacts[0].sources_count == 1
