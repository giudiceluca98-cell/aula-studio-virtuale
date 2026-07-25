"""Valutazioni persistenti, runner automatico e gate di pubblicazione di Eve AI Studio."""

from .automatic import AutomaticEvaluationService
from .models import (
    EvaluationAutomaticRunResult,
    EvaluationGateStatus,
    EvaluationRunStatus,
    EvaluationRunnerStatus,
    EvaluationSeverity,
)
from .service import EvaluationService
from .storage import SqliteEvaluationStore

__all__ = [
    "AutomaticEvaluationService",
    "EvaluationAutomaticRunResult",
    "EvaluationGateStatus",
    "EvaluationRunStatus",
    "EvaluationRunnerStatus",
    "EvaluationSeverity",
    "EvaluationService",
    "SqliteEvaluationStore",
]
