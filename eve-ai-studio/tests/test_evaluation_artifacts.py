import pytest

from app.evaluations.models import EvaluationRunArtifactInput
from app.evaluations.storage import SqliteEvaluationStore
from app.evaluations.storage_base import EvaluationRunNotFoundError, EvaluationRunStateError


def setup_store(tmp_path):
    store = SqliteEvaluationStore(tmp_path / "eval.sqlite3")
    with store._connection:
        store._connection.execute(
            """
            INSERT INTO evaluation_scenario_versions
            (id,scenario_key,version_number,created_at,status,name,description,category,severity,
             weight,minimum_score,required,input_json,expected_json,checksum,active)
            VALUES(1,'x',1,'now','active','x','long enough desc','quality','major',1,80,1,
                   '{}','["x"]',?,1)
            """,
            ("x" * 64,),
        )
        store._connection.execute(
            """
            INSERT INTO evaluation_runs
            (id,prompt_version_id,created_at,status,total_scenarios)
            VALUES(1,1,'now','running',1)
            """
        )
        store._connection.execute(
            "INSERT INTO evaluation_run_scenarios(run_id,scenario_version_id) VALUES(1,1)"
        )
    return store


def artifact(scenario_version_id=1):
    return EvaluationRunArtifactInput(
        scenario_version_id=scenario_version_id,
        provider="mock",
        model="m",
        duration_ms=1,
        output_sha256="a" * 64,
        output_chars=10,
        sources_count=1,
        proposed_actions_count=0,
        redacted=True,
    )


def test_schema_migrates_to_two(tmp_path):
    store = SqliteEvaluationStore(tmp_path / "a.sqlite3")
    assert store.schema_version == 2
    assert "evaluation_run_artifacts" in store.table_names()
    store.close()


def test_artifact_round_trip(tmp_path):
    store = setup_store(tmp_path)
    saved = store.save_artifacts(1, [artifact()])
    assert saved[0].redacted is True
    assert saved[0].output_chars == 10
    assert store.list_artifacts(1)[0].provider == "mock"
    store.close()


def test_artifacts_must_cover_snapshot(tmp_path):
    store = setup_store(tmp_path)
    with pytest.raises(EvaluationRunStateError):
        store.save_artifacts(1, [])
    store.close()


def test_unknown_run_is_rejected(tmp_path):
    store = SqliteEvaluationStore(tmp_path / "b.sqlite3")
    with pytest.raises(EvaluationRunNotFoundError):
        store.list_artifacts(99)
    store.close()
