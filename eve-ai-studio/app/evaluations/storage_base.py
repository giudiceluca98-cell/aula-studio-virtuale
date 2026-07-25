from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

SCHEMA_VERSION = 1


class EvaluationStorageError(RuntimeError):
    pass


class EvaluationScenarioNotFoundError(KeyError):
    pass


class EvaluationRunNotFoundError(KeyError):
    pass


class EvaluationConflictError(RuntimeError):
    pass


class EvaluationRunStateError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class BaseEvaluationStore:
    publish_threshold: float
    _lock: RLock
    _connection: sqlite3.Connection

    def __init__(self, path: str | Path, *, publish_threshold: float = 85.0) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.publish_threshold = float(publish_threshold)
        self._lock = RLock()
        self._connection = sqlite3.connect(self.path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._connection.execute("PRAGMA journal_mode = WAL")
        self._apply_migrations()

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def _apply_migrations(self) -> None:
        with self._lock, self._connection:
            current = int(self._connection.execute("PRAGMA user_version").fetchone()[0])
            if current > SCHEMA_VERSION:
                raise EvaluationStorageError(
                    f"Schema valutazioni {current} più recente del software {SCHEMA_VERSION}"
                )
            if current < 1:
                self._connection.executescript(
                    """
                    CREATE TABLE evaluation_scenario_versions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        scenario_key TEXT NOT NULL,
                        version_number INTEGER NOT NULL,
                        created_at TEXT NOT NULL,
                        status TEXT NOT NULL,
                        name TEXT NOT NULL,
                        description TEXT NOT NULL,
                        category TEXT NOT NULL,
                        severity TEXT NOT NULL,
                        weight REAL NOT NULL,
                        minimum_score REAL NOT NULL,
                        required INTEGER NOT NULL,
                        input_json TEXT NOT NULL,
                        expected_json TEXT NOT NULL,
                        checksum TEXT NOT NULL,
                        parent_version_id INTEGER,
                        note TEXT,
                        active INTEGER NOT NULL DEFAULT 1,
                        UNIQUE(scenario_key, version_number),
                        FOREIGN KEY(parent_version_id) REFERENCES evaluation_scenario_versions(id)
                    );

                    CREATE TABLE evaluation_runs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        prompt_version_id INTEGER NOT NULL,
                        created_at TEXT NOT NULL,
                        completed_at TEXT,
                        status TEXT NOT NULL,
                        note TEXT,
                        weighted_score REAL,
                        passed_scenarios INTEGER NOT NULL DEFAULT 0,
                        failed_scenarios INTEGER NOT NULL DEFAULT 0,
                        critical_failures INTEGER NOT NULL DEFAULT 0,
                        required_failures INTEGER NOT NULL DEFAULT 0,
                        total_scenarios INTEGER NOT NULL
                    );

                    CREATE TABLE evaluation_run_scenarios (
                        run_id INTEGER NOT NULL,
                        scenario_version_id INTEGER NOT NULL,
                        PRIMARY KEY(run_id, scenario_version_id),
                        FOREIGN KEY(run_id) REFERENCES evaluation_runs(id) ON DELETE CASCADE,
                        FOREIGN KEY(scenario_version_id) REFERENCES evaluation_scenario_versions(id)
                    );

                    CREATE TABLE evaluation_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        run_id INTEGER NOT NULL,
                        scenario_version_id INTEGER NOT NULL,
                        criterion_key TEXT NOT NULL,
                        score REAL NOT NULL,
                        outcome TEXT NOT NULL,
                        passed INTEGER NOT NULL,
                        message TEXT,
                        evidence_summary TEXT,
                        UNIQUE(run_id, scenario_version_id, criterion_key),
                        FOREIGN KEY(run_id) REFERENCES evaluation_runs(id) ON DELETE CASCADE,
                        FOREIGN KEY(scenario_version_id) REFERENCES evaluation_scenario_versions(id)
                    );

                    CREATE INDEX idx_evaluation_scenario_active
                        ON evaluation_scenario_versions(active, scenario_key);
                    CREATE INDEX idx_evaluation_runs_prompt
                        ON evaluation_runs(prompt_version_id, id DESC);
                    CREATE INDEX idx_evaluation_results_run
                        ON evaluation_results(run_id, scenario_version_id);
                    """
                )
                self._connection.execute("PRAGMA user_version = 1")

    @property
    def schema_version(self) -> int:
        with self._lock:
            return int(self._connection.execute("PRAGMA user_version").fetchone()[0])

    def table_names(self) -> set[str]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        return {str(row["name"]) for row in rows}
