from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .models import ProviderAttempt, ProviderExecutionTelemetry, TokenUsage

SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class ProviderTelemetryStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        self._connection = sqlite3.connect(self.path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA journal_mode = WAL")
        self._apply_migrations()

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def _apply_migrations(self) -> None:
        with self._lock, self._connection:
            current = int(self._connection.execute("PRAGMA user_version").fetchone()[0])
            if current < 1:
                self._connection.executescript(
                    """
                    CREATE TABLE provider_execution_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created_at TEXT NOT NULL,
                        purpose TEXT NOT NULL,
                        profile_key TEXT NOT NULL,
                        provider_key TEXT NOT NULL,
                        model_key TEXT NOT NULL,
                        status TEXT NOT NULL,
                        attempts_count INTEGER NOT NULL,
                        fallback_used INTEGER NOT NULL,
                        duration_ms REAL NOT NULL,
                        input_tokens INTEGER NOT NULL,
                        output_tokens INTEGER NOT NULL,
                        total_tokens INTEGER NOT NULL,
                        estimated_cost_usd REAL NOT NULL,
                        request_sha256 TEXT NOT NULL,
                        response_sha256 TEXT,
                        error_code TEXT,
                        attempts_json TEXT NOT NULL
                    );
                    CREATE INDEX idx_provider_events_created
                        ON provider_execution_events(created_at DESC);
                    CREATE INDEX idx_provider_events_profile
                        ON provider_execution_events(profile_key, created_at DESC);
                    """
                )
                self._connection.execute("PRAGMA user_version = 1")

    @property
    def schema_version(self) -> int:
        with self._lock:
            return int(self._connection.execute("PRAGMA user_version").fetchone()[0])

    def record(self, item: ProviderExecutionTelemetry) -> ProviderExecutionTelemetry:
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO provider_execution_events(
                    created_at, purpose, profile_key, provider_key, model_key,
                    status, attempts_count, fallback_used, duration_ms,
                    input_tokens, output_tokens, total_tokens,
                    estimated_cost_usd, request_sha256, response_sha256,
                    error_code, attempts_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.created_at,
                    item.purpose,
                    item.profile_key,
                    item.provider_key,
                    item.model_key,
                    item.status,
                    item.attempts_count,
                    int(item.fallback_used),
                    item.duration_ms,
                    item.usage.input_tokens,
                    item.usage.output_tokens,
                    item.usage.total_tokens,
                    item.estimated_cost_usd,
                    item.request_sha256,
                    item.response_sha256,
                    item.error_code,
                    json.dumps(
                        [attempt.model_dump(mode="json") for attempt in item.attempts],
                        ensure_ascii=False,
                    ),
                ),
            )
            execution_id = int(cursor.lastrowid)
        return item.model_copy(update={"execution_id": execution_id})

    def list(self, limit: int = 100) -> list[ProviderExecutionTelemetry]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM provider_execution_events ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [self._from_row(row) for row in rows]

    def count(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT COUNT(*) FROM provider_execution_events"
            ).fetchone()
        return int(row[0])

    def daily_usage(self, day_prefix: str | None = None) -> tuple[int, float]:
        prefix = day_prefix or datetime.now(timezone.utc).date().isoformat()
        with self._lock:
            row = self._connection.execute(
                """
                SELECT COALESCE(SUM(total_tokens), 0),
                       COALESCE(SUM(estimated_cost_usd), 0)
                FROM provider_execution_events
                WHERE created_at LIKE ? AND status = 'success'
                """,
                (prefix + "%",),
            ).fetchone()
        return int(row[0]), float(row[1])

    @staticmethod
    def _from_row(row: sqlite3.Row) -> ProviderExecutionTelemetry:
        return ProviderExecutionTelemetry(
            execution_id=int(row["id"]),
            created_at=str(row["created_at"]),
            purpose=str(row["purpose"]),
            profile_key=str(row["profile_key"]),
            provider_key=str(row["provider_key"]),
            model_key=str(row["model_key"]),
            status=str(row["status"]),
            attempts_count=int(row["attempts_count"]),
            fallback_used=bool(row["fallback_used"]),
            duration_ms=float(row["duration_ms"]),
            usage=TokenUsage(
                input_tokens=int(row["input_tokens"]),
                output_tokens=int(row["output_tokens"]),
                total_tokens=int(row["total_tokens"]),
            ),
            estimated_cost_usd=float(row["estimated_cost_usd"]),
            request_sha256=str(row["request_sha256"]),
            response_sha256=(
                str(row["response_sha256"]) if row["response_sha256"] else None
            ),
            error_code=str(row["error_code"]) if row["error_code"] else None,
            attempts=[
                ProviderAttempt.model_validate(item)
                for item in json.loads(row["attempts_json"])
            ],
        )
