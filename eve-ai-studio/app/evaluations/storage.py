from __future__ import annotations

from .storage_artifacts import ArtifactStorageMixin
from .storage_base import (
    EvaluationConflictError,
    EvaluationRunNotFoundError,
    EvaluationRunStateError,
    EvaluationScenarioNotFoundError,
    EvaluationStorageError,
    SCHEMA_VERSION,
    BaseEvaluationStore,
)
from .storage_runs import RunStorageMixin
from .storage_scenarios import ScenarioStorageMixin, scenario_checksum


class SqliteEvaluationStore(
    ArtifactStorageMixin,
    RunStorageMixin,
    ScenarioStorageMixin,
    BaseEvaluationStore,
):
    """Storage SQLite composto per scenari, run, risultati, gate e artefatti redatti."""


__all__ = [
    "EvaluationConflictError",
    "EvaluationRunNotFoundError",
    "EvaluationRunStateError",
    "EvaluationScenarioNotFoundError",
    "EvaluationStorageError",
    "SCHEMA_VERSION",
    "SqliteEvaluationStore",
    "scenario_checksum",
]
