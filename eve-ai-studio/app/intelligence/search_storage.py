from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .errors import ResearchSearchExecutionNotFoundError
from .models import (
    ResearchSearchExecution,
    ResearchSearchExecutionListResponse,
    ResearchSearchExecutionStatus,
    ResearchSearchFilters,
    ResearchSearchResult,
)

SEARCH_SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


class SqliteSearchStore:
    """Audit persistente delle query provider; non acquisisce contenuti."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        self._connection = sqlite3.connect(self.path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute('PRAGMA foreign_keys = ON')
        self._apply_migrations()

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def _apply_migrations(self) -> None:
        with self._lock, self._connection:
            self._connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS research_search_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS research_search_executions (
                    execution_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    actor_id TEXT NOT NULL,
                    provider_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    filters_json TEXT NOT NULL,
                    requested_limit INTEGER NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    result_count INTEGER NOT NULL DEFAULT 0,
                    cost_units REAL NOT NULL DEFAULT 0,
                    provider_request_id TEXT,
                    error_code TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_research_search_project
                    ON research_search_executions(project_id, execution_id DESC);
                CREATE INDEX IF NOT EXISTS idx_research_search_room_actor_day
                    ON research_search_executions(room_id, actor_id, created_at);
                CREATE TABLE IF NOT EXISTS research_search_results (
                    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    execution_id INTEGER NOT NULL,
                    rank INTEGER NOT NULL,
                    original_url TEXT NOT NULL,
                    normalized_url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    snippet TEXT NOT NULL,
                    publisher TEXT,
                    published_at TEXT,
                    language TEXT,
                    source_type TEXT NOT NULL,
                    provider_score REAL NOT NULL,
                    ranking_reasons_json TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    source_id INTEGER,
                    created_at TEXT NOT NULL,
                    UNIQUE(execution_id, normalized_url),
                    FOREIGN KEY(execution_id) REFERENCES research_search_executions(execution_id)
                        ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_research_search_results_execution_rank
                    ON research_search_results(execution_id, rank);
                """
            )
            self._connection.execute(
                "INSERT OR REPLACE INTO research_search_meta(key, value) VALUES ('schema_version', ?)",
                (str(SEARCH_SCHEMA_VERSION),),
            )

    @property
    def schema_version(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT value FROM research_search_meta WHERE key = 'schema_version'"
            ).fetchone()
        return int(row['value']) if row else 0

    def begin(
        self,
        *,
        query_id: int,
        project_id: str,
        room_id: str,
        actor_id: str,
        provider_name: str,
        filters: ResearchSearchFilters,
        requested_limit: int,
    ) -> int:
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO research_search_executions(
                    query_id, project_id, room_id, actor_id, provider_name, status,
                    filters_json, requested_limit, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    query_id, project_id, room_id, actor_id, provider_name,
                    ResearchSearchExecutionStatus.RUNNING.value,
                    filters.model_dump_json(), requested_limit, utc_now(),
                ),
            )
            return int(cursor.lastrowid)

    def complete(
        self,
        execution_id: int,
        *,
        provider_name: str,
        attempts: int,
        cost_units: float,
        provider_request_id: str | None,
        results: list[ResearchSearchResult],
    ) -> ResearchSearchExecution:
        now = utc_now()
        with self._lock, self._connection:
            self._connection.executemany(
                """
                INSERT INTO research_search_results(
                    execution_id, rank, original_url, normalized_url, title, snippet,
                    publisher, published_at, language, source_type, provider_score,
                    ranking_reasons_json, metadata_json, source_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        execution_id, item.rank, item.original_url, item.normalized_url,
                        item.title, item.snippet, item.publisher, item.published_at,
                        item.language, item.source_type, item.provider_score,
                        json.dumps(item.ranking_reasons, ensure_ascii=False),
                        json.dumps(item.metadata, ensure_ascii=False, sort_keys=True),
                        item.source_id, now,
                    )
                    for item in results
                ],
            )
            self._connection.execute(
                """
                UPDATE research_search_executions
                SET provider_name = ?, status = ?, attempts = ?, result_count = ?,
                    cost_units = ?, provider_request_id = ?, completed_at = ?, error_code = NULL
                WHERE execution_id = ?
                """,
                (
                    provider_name, ResearchSearchExecutionStatus.SUCCEEDED.value,
                    attempts, len(results), cost_units, provider_request_id, now, execution_id,
                ),
            )
        return self.get(execution_id)

    def fail(self, execution_id: int, *, attempts: int, error_code: str) -> ResearchSearchExecution:
        with self._lock, self._connection:
            self._connection.execute(
                """
                UPDATE research_search_executions
                SET status = ?, attempts = ?, error_code = ?, completed_at = ?
                WHERE execution_id = ?
                """,
                (
                    ResearchSearchExecutionStatus.FAILED.value,
                    attempts, error_code[:120], utc_now(), execution_id,
                ),
            )
        return self.get(execution_id)

    @staticmethod
    def _row_to_result(row: sqlite3.Row) -> ResearchSearchResult:
        return ResearchSearchResult(
            result_id=int(row['result_id']),
            execution_id=int(row['execution_id']),
            rank=int(row['rank']),
            original_url=str(row['original_url']),
            normalized_url=str(row['normalized_url']),
            title=str(row['title']),
            snippet=str(row['snippet']),
            publisher=str(row['publisher']) if row['publisher'] is not None else None,
            published_at=str(row['published_at']) if row['published_at'] is not None else None,
            language=str(row['language']) if row['language'] is not None else None,
            source_type=str(row['source_type']),
            provider_score=float(row['provider_score']),
            ranking_reasons=json.loads(str(row['ranking_reasons_json'])),
            metadata=json.loads(str(row['metadata_json'])),
            source_id=int(row['source_id']) if row['source_id'] is not None else None,
        )

    def _row_to_execution(self, row: sqlite3.Row, *, include_results: bool) -> ResearchSearchExecution:
        results: list[ResearchSearchResult] = []
        if include_results:
            result_rows = self._connection.execute(
                "SELECT * FROM research_search_results WHERE execution_id = ? ORDER BY rank",
                (int(row['execution_id']),),
            ).fetchall()
            results = [self._row_to_result(value) for value in result_rows]
        return ResearchSearchExecution(
            execution_id=int(row['execution_id']),
            query_id=int(row['query_id']),
            project_id=str(row['project_id']),
            room_id=str(row['room_id']),
            actor_id=str(row['actor_id']),
            provider_name=str(row['provider_name']),
            status=ResearchSearchExecutionStatus(str(row['status'])),
            filters=ResearchSearchFilters.model_validate_json(str(row['filters_json'])),
            requested_limit=int(row['requested_limit']),
            attempts=int(row['attempts']),
            result_count=int(row['result_count']),
            cost_units=float(row['cost_units']),
            provider_request_id=(
                str(row['provider_request_id']) if row['provider_request_id'] is not None else None
            ),
            error_code=str(row['error_code']) if row['error_code'] is not None else None,
            created_at=str(row['created_at']),
            completed_at=str(row['completed_at']) if row['completed_at'] is not None else None,
            results=results,
        )

    def get(self, execution_id: int, *, room_id: str | None = None) -> ResearchSearchExecution:
        with self._lock:
            if room_id is None:
                row = self._connection.execute(
                    "SELECT * FROM research_search_executions WHERE execution_id = ?",
                    (execution_id,),
                ).fetchone()
            else:
                row = self._connection.execute(
                    "SELECT * FROM research_search_executions WHERE execution_id = ? AND room_id = ?",
                    (execution_id, room_id),
                ).fetchone()
            if row is None:
                raise ResearchSearchExecutionNotFoundError(execution_id)
            return self._row_to_execution(row, include_results=True)

    def list_for_query(
        self, project_id: str, query_id: int, room_id: str, *, limit: int = 100
    ) -> ResearchSearchExecutionListResponse:
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT * FROM research_search_executions
                WHERE project_id = ? AND query_id = ? AND room_id = ?
                ORDER BY execution_id DESC LIMIT ?
                """,
                (project_id, query_id, room_id, limit),
            ).fetchall()
            items = [self._row_to_execution(row, include_results=False) for row in rows]
        return ResearchSearchExecutionListResponse(total=len(items), items=items)

    def count_executions(
        self,
        *,
        project_id: str | None = None,
        room_id: str | None = None,
        actor_id: str | None = None,
        day_prefix: str | None = None,
    ) -> int:
        clauses: list[str] = []
        values: list[object] = []
        for column, value in (
            ('project_id', project_id), ('room_id', room_id), ('actor_id', actor_id)
        ):
            if value is not None:
                clauses.append(f"{column} = ?")
                values.append(value)
        if day_prefix is not None:
            clauses.append("substr(created_at, 1, 10) = ?")
            values.append(day_prefix)
        where = (' WHERE ' + ' AND '.join(clauses)) if clauses else ''
        with self._lock:
            row = self._connection.execute(
                f"SELECT COUNT(*) AS total FROM research_search_executions{where}", values
            ).fetchone()
        return int(row['total'])

    def count_results(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT COUNT(*) AS total FROM research_search_results"
            ).fetchone()
        return int(row['total'])
