from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from uuid import uuid4

from .errors import (
    ResearchConflictError,
    ResearchProjectNotFoundError,
    ResearchTransitionError,
)
from .models import (
    ResearchCenterStatus,
    ResearchProjectCreateRequest,
    ResearchProjectDetail,
    ResearchProjectStatus,
    ResearchProjectSummary,
    ResearchQuery,
    ResearchQueryCreateRequest,
    ResearchQueryStatus,
    ResearchSourceCandidate,
    ResearchSourceCandidateCreateRequest,
    ResearchSourceStatus,
    ResearchTransitionEvent,
)

SCHEMA_VERSION = 1

_ALLOWED_TRANSITIONS: dict[ResearchProjectStatus, set[ResearchProjectStatus]] = {
    ResearchProjectStatus.DRAFT: {
        ResearchProjectStatus.ACTIVE,
        ResearchProjectStatus.ARCHIVED,
    },
    ResearchProjectStatus.ACTIVE: {
        ResearchProjectStatus.PAUSED,
        ResearchProjectStatus.COMPLETED,
        ResearchProjectStatus.ARCHIVED,
    },
    ResearchProjectStatus.PAUSED: {
        ResearchProjectStatus.ACTIVE,
        ResearchProjectStatus.COMPLETED,
        ResearchProjectStatus.ARCHIVED,
    },
    ResearchProjectStatus.COMPLETED: {ResearchProjectStatus.ARCHIVED},
    ResearchProjectStatus.ARCHIVED: set(),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SqliteResearchStore:
    """Catalogo persistente dei progetti di ricerca, senza accesso di rete."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
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
                raise RuntimeError(
                    f"Schema ricerca {current} più recente del software {SCHEMA_VERSION}"
                )
            if current < 1:
                self._connection.executescript(
                    """
                    CREATE TABLE research_projects (
                        project_id TEXT PRIMARY KEY,
                        room_id TEXT NOT NULL,
                        title TEXT NOT NULL,
                        objective TEXT NOT NULL,
                        domain TEXT NOT NULL,
                        language TEXT NOT NULL,
                        target_levels_json TEXT NOT NULL,
                        topics_json TEXT NOT NULL,
                        status TEXT NOT NULL,
                        max_sources INTEGER NOT NULL,
                        human_review_required INTEGER NOT NULL,
                        web_access_enabled INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    );

                    CREATE TABLE research_queries (
                        query_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id TEXT NOT NULL,
                        text TEXT NOT NULL,
                        purpose TEXT,
                        language TEXT NOT NULL,
                        status TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        UNIQUE(project_id, text),
                        FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                            ON DELETE CASCADE
                    );

                    CREATE TABLE research_source_candidates (
                        source_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id TEXT NOT NULL,
                        url TEXT NOT NULL,
                        title TEXT,
                        publisher TEXT,
                        published_at TEXT,
                        status TEXT NOT NULL,
                        trust_level TEXT NOT NULL,
                        notes TEXT,
                        metadata_json TEXT NOT NULL,
                        content_acquired INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL,
                        UNIQUE(project_id, url),
                        FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                            ON DELETE CASCADE
                    );

                    CREATE TABLE research_transition_events (
                        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        project_id TEXT NOT NULL,
                        from_status TEXT NOT NULL,
                        to_status TEXT NOT NULL,
                        note TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                            ON DELETE CASCADE
                    );

                    CREATE INDEX idx_research_projects_room_status
                        ON research_projects(room_id, status, updated_at DESC);
                    CREATE INDEX idx_research_queries_project
                        ON research_queries(project_id, query_id);
                    CREATE INDEX idx_research_sources_project_status
                        ON research_source_candidates(project_id, status, source_id);
                    """
                )
                self._connection.execute("PRAGMA user_version = 1")

    @property
    def schema_version(self) -> int:
        with self._lock:
            return int(self._connection.execute("PRAGMA user_version").fetchone()[0])

    def _require_project_row(self, project_id: str, room_id: str) -> sqlite3.Row:
        row = self._connection.execute(
            "SELECT * FROM research_projects WHERE project_id = ? AND room_id = ?",
            (project_id, room_id),
        ).fetchone()
        if row is None:
            raise ResearchProjectNotFoundError(project_id)
        return row

    def count_projects(self, room_id: str | None = None) -> int:
        with self._lock:
            if room_id is None:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_projects"
                ).fetchone()
            else:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_projects WHERE room_id = ?",
                    (room_id,),
                ).fetchone()
        return int(row[0])

    def count_queries(self, project_id: str | None = None) -> int:
        with self._lock:
            if project_id is None:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_queries"
                ).fetchone()
            else:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_queries WHERE project_id = ?",
                    (project_id,),
                ).fetchone()
        return int(row[0])

    def count_sources(self, project_id: str | None = None) -> int:
        with self._lock:
            if project_id is None:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_source_candidates"
                ).fetchone()
            else:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM research_source_candidates WHERE project_id = ?",
                    (project_id,),
                ).fetchone()
        return int(row[0])

    def create_project(self, request: ResearchProjectCreateRequest) -> ResearchProjectDetail:
        project_id = f"research-{uuid4().hex[:20]}"
        now = utc_now()
        with self._lock, self._connection:
            self._connection.execute(
                """
                INSERT INTO research_projects (
                    project_id, room_id, title, objective, domain, language,
                    target_levels_json, topics_json, status, max_sources,
                    human_review_required, web_access_enabled, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    project_id,
                    request.room_id,
                    request.title,
                    request.objective,
                    request.domain,
                    request.language,
                    json.dumps(request.target_levels, ensure_ascii=False),
                    json.dumps(request.topics, ensure_ascii=False),
                    ResearchProjectStatus.DRAFT.value,
                    request.max_sources,
                    int(request.human_review_required),
                    now,
                    now,
                ),
            )
        return self.get_project(project_id, request.room_id)

    def _project_counts(self, project_id: str) -> tuple[int, int]:
        query_count = int(
            self._connection.execute(
                "SELECT COUNT(*) FROM research_queries WHERE project_id = ?",
                (project_id,),
            ).fetchone()[0]
        )
        source_count = int(
            self._connection.execute(
                "SELECT COUNT(*) FROM research_source_candidates WHERE project_id = ?",
                (project_id,),
            ).fetchone()[0]
        )
        return query_count, source_count

    def _row_to_project(
        self,
        row: sqlite3.Row,
        *,
        detail: bool,
    ) -> ResearchProjectSummary | ResearchProjectDetail:
        query_count, source_count = self._project_counts(str(row["project_id"]))
        data = {
            "project_id": str(row["project_id"]),
            "room_id": str(row["room_id"]),
            "title": str(row["title"]),
            "objective": str(row["objective"]),
            "domain": str(row["domain"]),
            "language": str(row["language"]),
            "status": ResearchProjectStatus(str(row["status"])),
            "max_sources": int(row["max_sources"]),
            "human_review_required": bool(row["human_review_required"]),
            "web_access_enabled": bool(row["web_access_enabled"]),
            "query_count": query_count,
            "source_count": source_count,
            "created_at": str(row["created_at"]),
            "updated_at": str(row["updated_at"]),
        }
        if detail:
            return ResearchProjectDetail(
                **data,
                target_levels=json.loads(str(row["target_levels_json"])),
                topics=json.loads(str(row["topics_json"])),
            )
        return ResearchProjectSummary(**data)

    def get_project(self, project_id: str, room_id: str) -> ResearchProjectDetail:
        with self._lock:
            row = self._require_project_row(project_id, room_id)
            return self._row_to_project(row, detail=True)

    def list_projects(
        self,
        *,
        room_id: str,
        status: ResearchProjectStatus | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> tuple[int, list[ResearchProjectSummary]]:
        clauses = ["room_id = ?"]
        params: list[object] = [room_id]
        if status is not None:
            clauses.append("status = ?")
            params.append(status.value)
        if query:
            clauses.append("(title LIKE ? OR objective LIKE ? OR domain LIKE ?)")
            pattern = f"%{query}%"
            params.extend([pattern, pattern, pattern])
        where = " AND ".join(clauses)
        with self._lock:
            total = int(
                self._connection.execute(
                    f"SELECT COUNT(*) FROM research_projects WHERE {where}",
                    params,
                ).fetchone()[0]
            )
            rows = self._connection.execute(
                f"""
                SELECT * FROM research_projects
                WHERE {where}
                ORDER BY updated_at DESC, project_id DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            ).fetchall()
            items = [self._row_to_project(row, detail=False) for row in rows]
        return total, items

    def transition_project(
        self,
        project_id: str,
        room_id: str,
        to_status: ResearchProjectStatus,
        note: str | None,
    ) -> ResearchProjectDetail:
        now = utc_now()
        with self._lock, self._connection:
            row = self._require_project_row(project_id, room_id)
            from_status = ResearchProjectStatus(str(row["status"]))
            if to_status == from_status:
                return self._row_to_project(row, detail=True)
            if to_status not in _ALLOWED_TRANSITIONS[from_status]:
                raise ResearchTransitionError(
                    f"Transizione non consentita: {from_status.value} → {to_status.value}"
                )
            self._connection.execute(
                "UPDATE research_projects SET status = ?, updated_at = ? WHERE project_id = ?",
                (to_status.value, now, project_id),
            )
            self._connection.execute(
                """
                INSERT INTO research_transition_events (
                    project_id, from_status, to_status, note, created_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (project_id, from_status.value, to_status.value, note, now),
            )
        return self.get_project(project_id, room_id)

    def add_query(
        self,
        project_id: str,
        room_id: str,
        request: ResearchQueryCreateRequest,
    ) -> ResearchQuery:
        with self._lock, self._connection:
            row = self._require_project_row(project_id, room_id)
            if ResearchProjectStatus(str(row["status"])) == ResearchProjectStatus.ARCHIVED:
                raise ResearchTransitionError("Un progetto archiviato non può ricevere query")
            try:
                cursor = self._connection.execute(
                    """
                    INSERT INTO research_queries (
                        project_id, text, purpose, language, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        project_id,
                        request.text,
                        request.purpose,
                        request.language,
                        ResearchQueryStatus.PLANNED.value,
                        utc_now(),
                    ),
                )
            except sqlite3.IntegrityError as error:
                raise ResearchConflictError("La query è già presente nel progetto") from error
            query_id = int(cursor.lastrowid)
            self._connection.execute(
                "UPDATE research_projects SET updated_at = ? WHERE project_id = ?",
                (utc_now(), project_id),
            )
            query_row = self._connection.execute(
                "SELECT * FROM research_queries WHERE query_id = ?",
                (query_id,),
            ).fetchone()
        return self._row_to_query(query_row)

    @staticmethod
    def _row_to_query(row: sqlite3.Row) -> ResearchQuery:
        return ResearchQuery(
            query_id=int(row["query_id"]),
            project_id=str(row["project_id"]),
            text=str(row["text"]),
            purpose=str(row["purpose"]) if row["purpose"] is not None else None,
            language=str(row["language"]),
            status=ResearchQueryStatus(str(row["status"])),
            created_at=str(row["created_at"]),
        )

    def list_queries(
        self,
        project_id: str,
        room_id: str,
    ) -> list[ResearchQuery]:
        with self._lock:
            self._require_project_row(project_id, room_id)
            rows = self._connection.execute(
                """
                SELECT * FROM research_queries
                WHERE project_id = ?
                ORDER BY query_id
                """,
                (project_id,),
            ).fetchall()
        return [self._row_to_query(row) for row in rows]

    def add_source_candidate(
        self,
        project_id: str,
        room_id: str,
        request: ResearchSourceCandidateCreateRequest,
    ) -> ResearchSourceCandidate:
        with self._lock, self._connection:
            row = self._require_project_row(project_id, room_id)
            if ResearchProjectStatus(str(row["status"])) == ResearchProjectStatus.ARCHIVED:
                raise ResearchTransitionError("Un progetto archiviato non può ricevere fonti")
            try:
                cursor = self._connection.execute(
                    """
                    INSERT INTO research_source_candidates (
                        project_id, url, title, publisher, published_at, status,
                        trust_level, notes, metadata_json, content_acquired, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
                    """,
                    (
                        project_id,
                        request.url,
                        request.title,
                        request.publisher,
                        request.published_at,
                        ResearchSourceStatus.QUARANTINED.value,
                        "unreviewed",
                        request.notes,
                        json.dumps(
                            request.metadata,
                            ensure_ascii=False,
                            sort_keys=True,
                            separators=(",", ":"),
                        ),
                        utc_now(),
                    ),
                )
            except sqlite3.IntegrityError as error:
                raise ResearchConflictError("La fonte è già presente nel progetto") from error
            source_id = int(cursor.lastrowid)
            self._connection.execute(
                "UPDATE research_projects SET updated_at = ? WHERE project_id = ?",
                (utc_now(), project_id),
            )
            source_row = self._connection.execute(
                "SELECT * FROM research_source_candidates WHERE source_id = ?",
                (source_id,),
            ).fetchone()
        return self._row_to_source(source_row)

    @staticmethod
    def _row_to_source(row: sqlite3.Row) -> ResearchSourceCandidate:
        return ResearchSourceCandidate(
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            url=str(row["url"]),
            title=str(row["title"]) if row["title"] is not None else None,
            publisher=str(row["publisher"]) if row["publisher"] is not None else None,
            published_at=(
                str(row["published_at"]) if row["published_at"] is not None else None
            ),
            status=ResearchSourceStatus(str(row["status"])),
            trust_level=str(row["trust_level"]),
            notes=str(row["notes"]) if row["notes"] is not None else None,
            metadata=json.loads(str(row["metadata_json"])),
            content_acquired=bool(row["content_acquired"]),
            created_at=str(row["created_at"]),
        )

    def list_source_candidates(
        self,
        project_id: str,
        room_id: str,
    ) -> list[ResearchSourceCandidate]:
        with self._lock:
            self._require_project_row(project_id, room_id)
            rows = self._connection.execute(
                """
                SELECT * FROM research_source_candidates
                WHERE project_id = ?
                ORDER BY source_id
                """,
                (project_id,),
            ).fetchall()
        return [self._row_to_source(row) for row in rows]


    def get_source_candidate(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> ResearchSourceCandidate:
        with self._lock:
            self._require_project_row(project_id, room_id)
            row = self._connection.execute(
                """
                SELECT * FROM research_source_candidates
                WHERE source_id = ? AND project_id = ?
                """,
                (source_id, project_id),
            ).fetchone()
        if row is None:
            from .errors import ResearchSourceNotFoundError

            raise ResearchSourceNotFoundError(source_id)
        return self._row_to_source(row)

    def set_source_review_state(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        *,
        status: ResearchSourceStatus,
        trust_level: str,
    ) -> ResearchSourceCandidate:
        now = utc_now()
        with self._lock, self._connection:
            self._require_project_row(project_id, room_id)
            cursor = self._connection.execute(
                """
                UPDATE research_source_candidates
                SET status = ?, trust_level = ?
                WHERE source_id = ? AND project_id = ?
                """,
                (status.value, trust_level, source_id, project_id),
            )
            if cursor.rowcount != 1:
                from .errors import ResearchSourceNotFoundError

                raise ResearchSourceNotFoundError(source_id)
            self._connection.execute(
                "UPDATE research_projects SET updated_at = ? WHERE project_id = ?",
                (now, project_id),
            )
        return self.get_source_candidate(project_id, source_id, room_id)

    def list_transition_events(
        self,
        project_id: str,
        room_id: str,
    ) -> list[ResearchTransitionEvent]:
        with self._lock:
            self._require_project_row(project_id, room_id)
            rows = self._connection.execute(
                """
                SELECT * FROM research_transition_events
                WHERE project_id = ?
                ORDER BY event_id
                """,
                (project_id,),
            ).fetchall()
        return [
            ResearchTransitionEvent(
                event_id=int(row["event_id"]),
                project_id=str(row["project_id"]),
                from_status=ResearchProjectStatus(str(row["from_status"])),
                to_status=ResearchProjectStatus(str(row["to_status"])),
                note=str(row["note"]) if row["note"] is not None else None,
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]

    def raw_status(
        self,
        *,
        max_projects_per_room: int,
        max_queries_per_project: int,
        max_sources_per_project: int,
    ) -> ResearchCenterStatus:
        with self._lock:
            total_projects = int(
                self._connection.execute(
                    "SELECT COUNT(*) FROM research_projects"
                ).fetchone()[0]
            )
            active_projects = int(
                self._connection.execute(
                    "SELECT COUNT(*) FROM research_projects WHERE status = ?",
                    (ResearchProjectStatus.ACTIVE.value,),
                ).fetchone()[0]
            )
            total_queries = int(
                self._connection.execute(
                    "SELECT COUNT(*) FROM research_queries"
                ).fetchone()[0]
            )
            quarantined_sources = int(
                self._connection.execute(
                    """
                    SELECT COUNT(*) FROM research_source_candidates
                    WHERE status = ?
                    """,
                    (ResearchSourceStatus.QUARANTINED.value,),
                ).fetchone()[0]
            )
        return ResearchCenterStatus(
            persistent=True,
            schema_version=self.schema_version,
            checkpoint="INTELLIGENCE-0.1",
            stage="research_projects_and_source_catalog_no_network",
            total_projects=total_projects,
            active_projects=active_projects,
            total_queries=total_queries,
            quarantined_sources=quarantined_sources,
            web_search_enabled=False,
            content_acquisition_enabled=False,
            model_training_enabled=False,
            human_review_required_by_default=True,
            max_projects_per_room=max_projects_per_room,
            max_queries_per_project=max_queries_per_project,
            max_sources_per_project=max_sources_per_project,
        )


    def get_query(self, project_id: str, query_id: int, room_id: str) -> ResearchQuery:
        with self._lock:
            self._require_project_row(project_id, room_id)
            row = self._connection.execute(
                "SELECT * FROM research_queries WHERE query_id = ? AND project_id = ?",
                (query_id, project_id),
            ).fetchone()
        if row is None:
            from .errors import ResearchConflictError
            raise ResearchConflictError("Query di ricerca non trovata nel progetto")
        return self._row_to_query(row)


    def set_query_status(
        self,
        project_id: str,
        query_id: int,
        room_id: str,
        status: ResearchQueryStatus,
    ) -> ResearchQuery:
        with self._lock, self._connection:
            self._require_project_row(project_id, room_id)
            cursor = self._connection.execute(
                "UPDATE research_queries SET status = ? WHERE query_id = ? AND project_id = ?",
                (status.value, query_id, project_id),
            )
            if cursor.rowcount != 1:
                from .errors import ResearchConflictError
                raise ResearchConflictError("Query di ricerca non trovata nel progetto")
        return self.get_query(project_id, query_id, room_id)


    def find_source_candidate_by_url(
        self, project_id: str, room_id: str, url: str
    ) -> ResearchSourceCandidate | None:
        with self._lock:
            self._require_project_row(project_id, room_id)
            row = self._connection.execute(
                "SELECT * FROM research_source_candidates WHERE project_id = ? AND url = ?",
                (project_id, url),
            ).fetchone()
        return self._row_to_source(row) if row is not None else None
