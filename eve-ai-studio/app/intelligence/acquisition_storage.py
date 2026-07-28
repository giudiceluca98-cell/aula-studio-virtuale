from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .errors import (
    ResearchDocumentNotFoundError,
    ResearchProjectNotFoundError,
    ResearchSourceNotFoundError,
)
from .models import (
    ResearchAcquisitionEvent,
    ResearchAcquisitionStatus,
    ResearchQuarantinedDocument,
    ResearchSourceStatus,
)

ACQUISITION_SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SqliteAcquisitionStore:
    """Persistenza separata delle acquisizioni, nello stesso database ricerca."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        self._connection = sqlite3.connect(self.path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._connection.execute("PRAGMA journal_mode = WAL")
        self._apply_schema()

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def _apply_schema(self) -> None:
        with self._lock, self._connection:
            self._connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS research_acquisition_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS research_acquisition_events (
                    acquisition_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    requested_url TEXT NOT NULL,
                    final_url TEXT,
                    http_status INTEGER,
                    media_type TEXT,
                    size_bytes INTEGER,
                    sha256 TEXT,
                    extracted_chars INTEGER,
                    robots_allowed INTEGER,
                    resolved_ips_json TEXT NOT NULL DEFAULT '[]',
                    redirect_chain_json TEXT NOT NULL DEFAULT '[]',
                    error_code TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS research_acquired_documents (
                    source_id INTEGER PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    acquisition_id INTEGER NOT NULL UNIQUE,
                    requested_url TEXT NOT NULL,
                    final_url TEXT NOT NULL,
                    media_type TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    sha256 TEXT NOT NULL,
                    raw_content BLOB NOT NULL,
                    extracted_text TEXT NOT NULL,
                    extracted_chars INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(acquisition_id) REFERENCES research_acquisition_events(acquisition_id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_research_acquisition_source
                    ON research_acquisition_events(source_id, acquisition_id DESC);
                CREATE INDEX IF NOT EXISTS idx_research_acquisition_project_status
                    ON research_acquisition_events(project_id, status, acquisition_id DESC);
                """
            )
            self._connection.execute(
                """
                INSERT INTO research_acquisition_meta(key, value)
                VALUES ('schema_version', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (str(ACQUISITION_SCHEMA_VERSION),),
            )

    @property
    def schema_version(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT value FROM research_acquisition_meta WHERE key = 'schema_version'"
            ).fetchone()
        return int(row[0]) if row else 0

    def _require_source_row(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> sqlite3.Row:
        project = self._connection.execute(
            "SELECT project_id FROM research_projects WHERE project_id = ? AND room_id = ?",
            (project_id, room_id),
        ).fetchone()
        if project is None:
            raise ResearchProjectNotFoundError(project_id)
        source = self._connection.execute(
            """
            SELECT source_id, project_id, url, status, content_acquired
            FROM research_source_candidates
            WHERE source_id = ? AND project_id = ?
            """,
            (source_id, project_id),
        ).fetchone()
        if source is None:
            raise ResearchSourceNotFoundError(source_id)
        return source

    def get_source_url(self, project_id: str, source_id: int, room_id: str) -> str:
        with self._lock:
            return str(self._require_source_row(project_id, source_id, room_id)["url"])

    def has_document(self, project_id: str, source_id: int, room_id: str) -> bool:
        with self._lock:
            self._require_source_row(project_id, source_id, room_id)
            row = self._connection.execute(
                "SELECT 1 FROM research_acquired_documents WHERE source_id = ? AND project_id = ?",
                (source_id, project_id),
            ).fetchone()
        return row is not None

    def begin(
        self,
        *,
        project_id: str,
        source_id: int,
        room_id: str,
        requested_url: str,
    ) -> int:
        now = utc_now()
        with self._lock, self._connection:
            self._require_source_row(project_id, source_id, room_id)
            cursor = self._connection.execute(
                """
                INSERT INTO research_acquisition_events (
                    source_id, project_id, status, requested_url, created_at
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    source_id,
                    project_id,
                    ResearchAcquisitionStatus.RUNNING.value,
                    requested_url,
                    now,
                ),
            )
            return int(cursor.lastrowid)

    def complete(
        self,
        *,
        acquisition_id: int,
        project_id: str,
        source_id: int,
        room_id: str,
        requested_url: str,
        final_url: str,
        http_status: int,
        media_type: str,
        content: bytes,
        sha256: str,
        extracted_text: str,
        robots_allowed: bool,
        resolved_ips: list[str],
        redirect_chain: list[str],
    ) -> ResearchAcquisitionEvent:
        now = utc_now()
        with self._lock, self._connection:
            self._require_source_row(project_id, source_id, room_id)
            self._connection.execute(
                """
                UPDATE research_acquisition_events
                SET status = ?, final_url = ?, http_status = ?, media_type = ?,
                    size_bytes = ?, sha256 = ?, extracted_chars = ?, robots_allowed = ?,
                    resolved_ips_json = ?, redirect_chain_json = ?, completed_at = ?
                WHERE acquisition_id = ? AND source_id = ? AND project_id = ?
                """,
                (
                    ResearchAcquisitionStatus.SUCCEEDED.value,
                    final_url,
                    http_status,
                    media_type,
                    len(content),
                    sha256,
                    len(extracted_text),
                    int(robots_allowed),
                    json.dumps(resolved_ips, ensure_ascii=False),
                    json.dumps(redirect_chain, ensure_ascii=False),
                    now,
                    acquisition_id,
                    source_id,
                    project_id,
                ),
            )
            self._connection.execute(
                """
                INSERT INTO research_acquired_documents (
                    source_id, project_id, acquisition_id, requested_url, final_url,
                    media_type, size_bytes, sha256, raw_content, extracted_text,
                    extracted_chars, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    acquisition_id = excluded.acquisition_id,
                    requested_url = excluded.requested_url,
                    final_url = excluded.final_url,
                    media_type = excluded.media_type,
                    size_bytes = excluded.size_bytes,
                    sha256 = excluded.sha256,
                    raw_content = excluded.raw_content,
                    extracted_text = excluded.extracted_text,
                    extracted_chars = excluded.extracted_chars,
                    created_at = excluded.created_at
                """,
                (
                    source_id,
                    project_id,
                    acquisition_id,
                    requested_url,
                    final_url,
                    media_type,
                    len(content),
                    sha256,
                    content,
                    extracted_text,
                    len(extracted_text),
                    now,
                ),
            )
            self._connection.execute(
                """
                UPDATE research_source_candidates
                SET content_acquired = 1, status = ?, trust_level = ?
                WHERE source_id = ? AND project_id = ?
                """,
                (
                    ResearchSourceStatus.QUARANTINED.value,
                    "unreviewed_acquired",
                    source_id,
                    project_id,
                ),
            )
        return self.get_event(acquisition_id, project_id, source_id, room_id)

    def fail(
        self,
        *,
        acquisition_id: int,
        project_id: str,
        source_id: int,
        room_id: str,
        error_code: str,
        blocked: bool,
    ) -> ResearchAcquisitionEvent:
        with self._lock, self._connection:
            self._require_source_row(project_id, source_id, room_id)
            self._connection.execute(
                """
                UPDATE research_acquisition_events
                SET status = ?, error_code = ?, completed_at = ?
                WHERE acquisition_id = ? AND source_id = ? AND project_id = ?
                """,
                (
                    (
                        ResearchAcquisitionStatus.BLOCKED.value
                        if blocked
                        else ResearchAcquisitionStatus.FAILED.value
                    ),
                    error_code,
                    utc_now(),
                    acquisition_id,
                    source_id,
                    project_id,
                ),
            )
        return self.get_event(acquisition_id, project_id, source_id, room_id)

    @staticmethod
    def _row_to_event(row: sqlite3.Row) -> ResearchAcquisitionEvent:
        return ResearchAcquisitionEvent(
            acquisition_id=int(row["acquisition_id"]),
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            status=ResearchAcquisitionStatus(str(row["status"])),
            requested_url=str(row["requested_url"]),
            final_url=str(row["final_url"]) if row["final_url"] is not None else None,
            http_status=int(row["http_status"]) if row["http_status"] is not None else None,
            media_type=str(row["media_type"]) if row["media_type"] is not None else None,
            size_bytes=int(row["size_bytes"]) if row["size_bytes"] is not None else None,
            sha256=str(row["sha256"]) if row["sha256"] is not None else None,
            extracted_chars=(
                int(row["extracted_chars"])
                if row["extracted_chars"] is not None
                else None
            ),
            robots_allowed=(
                bool(row["robots_allowed"])
                if row["robots_allowed"] is not None
                else None
            ),
            resolved_ips=json.loads(str(row["resolved_ips_json"])),
            redirect_chain=json.loads(str(row["redirect_chain_json"])),
            error_code=(
                str(row["error_code"]) if row["error_code"] is not None else None
            ),
            created_at=str(row["created_at"]),
            completed_at=(
                str(row["completed_at"]) if row["completed_at"] is not None else None
            ),
        )

    def get_event(
        self,
        acquisition_id: int,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> ResearchAcquisitionEvent:
        with self._lock:
            self._require_source_row(project_id, source_id, room_id)
            row = self._connection.execute(
                """
                SELECT * FROM research_acquisition_events
                WHERE acquisition_id = ? AND source_id = ? AND project_id = ?
                """,
                (acquisition_id, source_id, project_id),
            ).fetchone()
        if row is None:
            raise ResearchDocumentNotFoundError(acquisition_id)
        return self._row_to_event(row)

    def list_events(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> list[ResearchAcquisitionEvent]:
        with self._lock:
            self._require_source_row(project_id, source_id, room_id)
            rows = self._connection.execute(
                """
                SELECT * FROM research_acquisition_events
                WHERE source_id = ? AND project_id = ?
                ORDER BY acquisition_id DESC
                """,
                (source_id, project_id),
            ).fetchall()
        return [self._row_to_event(row) for row in rows]

    def get_document(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> ResearchQuarantinedDocument:
        with self._lock:
            self._require_source_row(project_id, source_id, room_id)
            row = self._connection.execute(
                """
                SELECT * FROM research_acquired_documents
                WHERE source_id = ? AND project_id = ?
                """,
                (source_id, project_id),
            ).fetchone()
        if row is None:
            raise ResearchDocumentNotFoundError(source_id)
        return ResearchQuarantinedDocument(
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            acquisition_id=int(row["acquisition_id"]),
            requested_url=str(row["requested_url"]),
            final_url=str(row["final_url"]),
            media_type=str(row["media_type"]),
            size_bytes=int(row["size_bytes"]),
            sha256=str(row["sha256"]),
            extracted_text=str(row["extracted_text"]),
            extracted_chars=int(row["extracted_chars"]),
            status=ResearchSourceStatus.QUARANTINED,
            content_trust="untrusted_web_content",
            instructions_executable=False,
            created_at=str(row["created_at"]),
        )

    def count_successful(self) -> int:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT COUNT(*) FROM research_acquisition_events
                WHERE status = ?
                """,
                (ResearchAcquisitionStatus.SUCCEEDED.value,),
            ).fetchone()
        return int(row[0])
