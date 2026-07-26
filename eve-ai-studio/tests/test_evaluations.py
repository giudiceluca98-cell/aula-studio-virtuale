from pathlib import Path
from types import SimpleNamespace

import pytest

from app.evaluations.models import (
    CriterionOutcome,
    CriterionResultInput,
    EvaluationRunCompleteRequest,
    EvaluationRunCreateRequest,
    EvaluationScenarioCreateRequest,
    EvaluationScenarioRevisionRequest,
    EvaluationSeverity,
    ScenarioResultInput,
)
from app.evaluations.service import EvaluationService
from app.evaluations.storage import (
    EvaluationConflictError,
    EvaluationRunStateError,
    SqliteEvaluationStore,
)


def prompt_getter(version_id: int):
    if version_id not in {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}:
        raise KeyError(version_id)
    return SimpleNamespace(version_id=version_id)


def make_service(tmp_path: Path, threshold: float = 85.0) -> EvaluationService:
    store = SqliteEvaluationStore(
        tmp_path / "evaluations.sqlite3",
        publish_threshold=threshold,
    )
    return EvaluationService(
        store,
        prompt_version_getter=prompt_getter,
        seed_default=True,
    )


def complete_all(
    service: EvaluationService,
    prompt_version_id: int = 1,
    *,
    overrides: dict[str, tuple[float, CriterionOutcome]] | None = None,
):
    run = service.start_run(EvaluationRunCreateRequest(prompt_version_id=prompt_version_id))
    overrides = overrides or {}
    results = []
    for scenario_id in run.scenario_version_ids:
        scenario = service.get_scenario(scenario_id)
        score, outcome = overrides.get(
            scenario.scenario_key,
            (100, CriterionOutcome.PASS),
        )
        results.append(
            ScenarioResultInput(
                scenario_version_id=scenario_id,
                criteria=[
                    CriterionResultInput(
                        criterion_key="main",
                        score=score,
                        outcome=outcome,
                    )
                ],
            )
        )
    return service.complete_run(
        run.run_id,
        EvaluationRunCompleteRequest(results=results),
    )


def test_schema_and_default_scenarios(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    assert service.store.schema_version == 2
    assert service.store.table_names() == {
        "evaluation_scenario_versions",
        "evaluation_runs",
        "evaluation_run_scenarios",
        "evaluation_results",
        "evaluation_run_artifacts",
    }
    assert service.status().active_scenarios_count == 8
    assert service.status().scenarios_count == 8


def test_scenario_revision_is_versioned_and_archives_previous(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    original = service.list_scenarios(active_only=True)[0]
    revised = service.revise_scenario(
        original.scenario_version_id,
        EvaluationScenarioRevisionRequest(
            minimum_score=95,
            note="Soglia aggiornata",
        ),
    )
    assert revised.version_number == 2
    assert revised.parent_version_id == original.scenario_version_id
    assert revised.minimum_score == 95
    assert service.get_scenario(original.scenario_version_id).active is False


def test_duplicate_scenario_key_is_blocked(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    with pytest.raises(EvaluationConflictError):
        service.create_scenario(
            EvaluationScenarioCreateRequest(
                scenario_key="context-correctness",
                name="Duplicato",
                description="Descrizione valida sufficientemente lunga.",
                category="correctness",
                severity=EvaluationSeverity.CRITICAL,
                expected_behaviors=["Non duplicare"],
            )
        )


def test_run_snapshots_active_scenarios(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    run = service.start_run(EvaluationRunCreateRequest(prompt_version_id=1))
    assert run.total_scenarios == 8
    assert len(run.scenario_version_ids) == 8
    assert run.status.value == "running"


def test_completed_run_calculates_weighted_score_and_gate(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    completed = complete_all(service, 1)
    assert completed.status.value == "passed"
    assert completed.weighted_score == 100
    assert len(completed.results) == 8
    gate = service.gate(1)
    assert gate.eligible is True
    assert gate.latest_run_id == completed.run_id
    assert gate.suite_current is True


def test_critical_failure_blocks_gate(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    completed = complete_all(
        service,
        1,
        overrides={"room-isolation": (0, CriterionOutcome.FAIL)},
    )
    assert completed.critical_failures == 1
    assert completed.status.value == "failed"
    gate = service.gate(1)
    assert gate.eligible is False
    assert any("Errori critici" in reason for reason in gate.reasons)


def test_optional_minor_failure_can_pass_when_score_above_threshold(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    completed = complete_all(
        service,
        1,
        overrides={"latency-budget": (0, CriterionOutcome.FAIL)},
    )
    assert completed.failed_scenarios == 1
    assert completed.required_failures == 0
    assert completed.critical_failures == 0
    assert completed.weighted_score is not None
    assert completed.weighted_score > 85
    assert completed.status.value == "passed"
    assert service.gate(1).eligible is True


def test_missing_scenario_result_is_rejected(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    run = service.start_run(EvaluationRunCreateRequest(prompt_version_id=1))
    first = run.scenario_version_ids[0]
    with pytest.raises(EvaluationRunStateError):
        service.complete_run(
            run.run_id,
            EvaluationRunCompleteRequest(
                results=[
                    ScenarioResultInput(
                        scenario_version_id=first,
                        criteria=[
                            CriterionResultInput(
                                criterion_key="main",
                                score=100,
                                outcome=CriterionOutcome.PASS,
                            )
                        ],
                    )
                ]
            ),
        )


def test_suite_revision_invalidates_old_gate(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    complete_all(service, 1)
    assert service.gate(1).eligible
    current = service.list_scenarios(active_only=True)[0]
    service.revise_scenario(
        current.scenario_version_id,
        EvaluationScenarioRevisionRequest(
            description=current.name + " nuova descrizione verificabile"
        ),
    )
    gate = service.gate(1)
    assert gate.eligible is False
    assert gate.suite_current is False


def test_persistence_after_reopen(tmp_path: Path) -> None:
    database = tmp_path / "evaluations.sqlite3"
    service = EvaluationService(
        SqliteEvaluationStore(database),
        prompt_version_getter=prompt_getter,
    )
    completed = complete_all(service, 1)
    service.store.close()
    reopened = EvaluationService(
        SqliteEvaluationStore(database),
        prompt_version_getter=prompt_getter,
    )
    assert reopened.get_run(completed.run_id).status.value == "passed"
    assert reopened.gate(1).eligible is True


def test_unknown_prompt_version_is_rejected(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    with pytest.raises(KeyError):
        service.start_run(EvaluationRunCreateRequest(prompt_version_id=999))


def test_baseline_seed_is_idempotent(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    first = service.seed_baseline(1)
    second = service.seed_baseline(1)
    assert first.run_id == second.run_id
    assert service.store.runs_count(prompt_version_id=1) == 1
