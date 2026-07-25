from __future__ import annotations

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


class SqliteEvaluationStore(RunStorageMixin, ScenarioStorageMixin, BaseEvaluationStore):
    """Storage SQLite composto per scenari, esecuzioni, risultati e gate."""


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
