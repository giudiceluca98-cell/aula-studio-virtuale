from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .models import (
    DidacticMode,
    PromptCatalogStatus,
    PromptParameters,
    PromptRevisionRequest,
    PromptRollbackResult,
    PromptStatus,
    PromptTransitionResult,
    PromptVersionCreateRequest,
    PromptVersionDetail,
    PromptVersionDiff,
    PromptVersionSummary,
)

SCHEMA_VERSION = 1


class PromptStorageError(RuntimeError):
    pass


class PromptVersionNotFoundError(KeyError):
    pass


class PromptConflictError(RuntimeError):
    pass


class PromptTransitionError(RuntimeError):
    pass


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def prompt_checksum(
    *,
    name: str,
    system_prompt: str,
    didactic_mode: DidacticMode,
    parameters: PromptParameters,
) -> str:
    payload = {
        "name": name,
        "system_prompt": system_prompt,
        "didactic_mode": didactic_mode.value,
        "parameters": parameters.model_dump(mode="json"),
    }
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


_ALLOWED_TRANSITIONS: dict[PromptStatus, set[PromptStatus]] = {
    PromptStatus.DRAFT: {PromptStatus.IN_REVIEW},
    PromptStatus.IN_REVIEW: {PromptStatus.DRAFT, PromptStatus.PUBLISHABLE},
    PromptStatus.PUBLISHABLE: {PromptStatus.DRAFT, PromptStatus.PUBLISHED},
    PromptStatus.PUBLISHED: {PromptStatus.ARCHIVED},
    PromptStatus.ARCHIVED: set(),
}


class SqlitePromptStore:
    """Persistenza SQLite per prompt immutabili e ciclo di approvazione tracciato."""

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
                raise PromptStorageError(
                    f"Schema prompt {current} più recente del software {SCHEMA_VERSION}"
                )
            if current < 1:
                self._connection.executescript(
                    """
                    CREATE TABLE prompt_versions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        configuration_key TEXT NOT NULL,
                        version_number INTEGER NOT NULL,
                        created_at TEXT NOT NULL,
                        status TEXT NOT NULL,
                        name TEXT NOT NULL,
                        system_prompt TEXT NOT NULL,
                        didactic_mode TEXT NOT NULL,
                        parameters_json TEXT NOT NULL,
                        checksum TEXT NOT NULL,
                        parent_version_id INTEGER,
                        note TEXT,
                        active INTEGER NOT NULL DEFAULT 0,
                        published_at TEXT,
                        UNIQUE(configuration_key, version_number),
                        FOREIGN KEY(parent_version_id) REFERENCES prompt_versions(id)
                    );

                    CREATE TABLE prompt_transition_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created_at TEXT NOT NULL,
                        version_id INTEGER NOT NULL,
                        from_status TEXT NOT NULL,
                        to_status TEXT NOT NULL,
                        review_tests_passed INTEGER NOT NULL DEFAULT 0,
                        note TEXT,
                        FOREIGN KEY(version_id) REFERENCES prompt_versions(id)
                    );

                    CREATE TABLE prompt_active_state (
                        configuration_key TEXT PRIMARY KEY,
                        active_version_id INTEGER NOT NULL,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY(active_version_id) REFERENCES prompt_versions(id)
                    );

                    CREATE INDEX idx_prompt_versions_key_number
                        ON prompt_versions(configuration_key, version_number DESC);
                    CREATE INDEX idx_prompt_versions_status
                        ON prompt_versions(status);
                    CREATE INDEX idx_prompt_events_version
                        ON prompt_transition_events(version_id, created_at DESC);
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

    def versions_count(self, configuration_key: str | None = None) -> int:
        with self._lock:
            if configuration_key:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM prompt_versions WHERE configuration_key = ?",
                    (configuration_key,),
                ).fetchone()
            else:
                row = self._connection.execute("SELECT COUNT(*) FROM prompt_versions").fetchone()
        return int(row[0])

    def _next_version_number(self, configuration_key: str) -> int:
        row = self._connection.execute(
            "SELECT COALESCE(MAX(version_number), 0) + 1 FROM prompt_versions WHERE configuration_key = ?",
            (configuration_key,),
        ).fetchone()
        return int(row[0])

    def create(self, request: PromptVersionCreateRequest) -> PromptVersionDetail:
        with self._lock, self._connection:
            if self.versions_count(request.configuration_key):
                raise PromptConflictError(
                    f"La configurazione {request.configuration_key!r} esiste già"
                )
            version_id = self._insert_version(
                configuration_key=request.configuration_key,
                version_number=1,
                status=PromptStatus.DRAFT,
                name=request.name,
                system_prompt=request.system_prompt,
                didactic_mode=request.didactic_mode,
                parameters=request.parameters,
                parent_version_id=None,
                note=request.note,
            )
        return self.get(version_id)

    def create_revision(
        self,
        base_version_id: int,
        request: PromptRevisionRequest,
    ) -> PromptVersionDetail:
        base = self.get(base_version_id)
        with self._lock, self._connection:
            version_number = self._next_version_number(base.configuration_key)
            version_id = self._insert_version(
                configuration_key=base.configuration_key,
                version_number=version_number,
                status=PromptStatus.DRAFT,
                name=request.name or base.name,
                system_prompt=request.system_prompt or base.system_prompt,
                didactic_mode=request.didactic_mode or base.didactic_mode,
                parameters=request.parameters or base.parameters,
                parent_version_id=base.version_id,
                note=request.note,
            )
        return self.get(version_id)

    def _insert_version(
        self,
        *,
        configuration_key: str,
        version_number: int,
        status: PromptStatus,
        name: str,
        system_prompt: str,
        didactic_mode: DidacticMode,
        parameters: PromptParameters,
        parent_version_id: int | None,
        note: str | None,
    ) -> int:
        created_at = utc_now()
        checksum = prompt_checksum(
            name=name,
            system_prompt=system_prompt,
            didactic_mode=didactic_mode,
            parameters=parameters,
        )
        cursor = self._connection.execute(
            """
            INSERT INTO prompt_versions (
                configuration_key, version_number, created_at, status, name,
                system_prompt, didactic_mode, parameters_json, checksum,
                parent_version_id, note, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (
                configuration_key,
                version_number,
                created_at,
                status.value,
                name,
                system_prompt,
                didactic_mode.value,
                json.dumps(parameters.model_dump(mode="json"), ensure_ascii=False, sort_keys=True),
                checksum,
                parent_version_id,
                note,
            ),
        )
        return int(cursor.lastrowid)

    def list_versions(
        self,
        *,
        configuration_key: str | None = None,
        status: PromptStatus | None = None,
        limit: int = 100,
    ) -> list[PromptVersionSummary]:
        clauses: list[str] = []
        args: list[object] = []
        if configuration_key:
            clauses.append("configuration_key = ?")
            args.append(configuration_key)
        if status:
            clauses.append("status = ?")
            args.append(status.value)
        where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
        args.append(limit)
        with self._lock:
            rows = self._connection.execute(
                f"SELECT * FROM prompt_versions{where} ORDER BY id DESC LIMIT ?",
                args,
            ).fetchall()
        return [self._summary_from_row(row) for row in rows]

    def get(self, version_id: int) -> PromptVersionDetail:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM prompt_versions WHERE id = ?", (version_id,)
            ).fetchone()
        if not row:
            raise PromptVersionNotFoundError(version_id)
        return self._detail_from_row(row)

    def status(self) -> PromptCatalogStatus:
        with self._lock:
            counts = {
                str(row["status"]): int(row["count"])
                for row in self._connection.execute(
                    "SELECT status, COUNT(*) AS count FROM prompt_versions GROUP BY status"
                ).fetchall()
            }
            active = self._connection.execute(
                """
                SELECT p.id, p.configuration_key
                FROM prompt_versions p
                WHERE p.active = 1
                ORDER BY p.published_at DESC, p.id DESC
                LIMIT 1
                """
            ).fetchone()
        return PromptCatalogStatus(
            versions_count=sum(counts.values()),
            drafts_count=counts.get(PromptStatus.DRAFT.value, 0),
            in_review_count=counts.get(PromptStatus.IN_REVIEW.value, 0),
            publishable_count=counts.get(PromptStatus.PUBLISHABLE.value, 0),
            published_count=counts.get(PromptStatus.PUBLISHED.value, 0),
            active_version_id=int(active["id"]) if active else None,
            active_configuration_key=str(active["configuration_key"]) if active else None,
            schema_version=self.schema_version,
        )

    def transition(
        self,
        version_id: int,
        target_status: PromptStatus,
        *,
        review_tests_passed: bool = False,
        note: str | None = None,
    ) -> PromptTransitionResult:
        current = self.get(version_id)
        if target_status == current.status:
            raise PromptTransitionError("La versione è già nello stato richiesto")
        if target_status not in _ALLOWED_TRANSITIONS[current.status]:
            raise PromptTransitionError(
                f"Transizione non consentita: {current.status.value} -> {target_status.value}"
            )
        if target_status is PromptStatus.PUBLISHABLE and not review_tests_passed:
            raise PromptTransitionError(
                "Una versione può diventare pubblicabile solo dopo il superamento dei test"
            )

        transitioned_at = utc_now()
        with self._lock, self._connection:
            if target_status is PromptStatus.PUBLISHED:
                previous_rows = self._connection.execute(
                    """
                    SELECT id FROM prompt_versions
                    WHERE configuration_key = ? AND active = 1 AND id <> ?
                    """,
                    (current.configuration_key, version_id),
                ).fetchall()
                for row in previous_rows:
                    previous_id = int(row["id"])
                    self._connection.execute(
                        "UPDATE prompt_versions SET status = ?, active = 0 WHERE id = ?",
                        (PromptStatus.ARCHIVED.value, previous_id),
                    )
                    self._record_transition_locked(
                        previous_id,
                        PromptStatus.PUBLISHED,
                        PromptStatus.ARCHIVED,
                        review_tests_passed=True,
                        note="Archiviazione automatica per nuova pubblicazione",
                        created_at=transitioned_at,
                    )
                self._connection.execute(
                    """
                    UPDATE prompt_versions
                    SET status = ?, active = 1, published_at = ?
                    WHERE id = ?
                    """,
                    (target_status.value, transitioned_at, version_id),
                )
                self._connection.execute(
                    """
                    INSERT INTO prompt_active_state(configuration_key, active_version_id, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(configuration_key) DO UPDATE SET
                        active_version_id = excluded.active_version_id,
                        updated_at = excluded.updated_at
                    """,
                    (current.configuration_key, version_id, transitioned_at),
                )
            else:
                self._connection.execute(
                    "UPDATE prompt_versions SET status = ? WHERE id = ?",
                    (target_status.value, version_id),
                )
            self._record_transition_locked(
                version_id,
                current.status,
                target_status,
                review_tests_passed=review_tests_passed,
                note=note,
                created_at=transitioned_at,
            )
        updated = self.get(version_id)
        return PromptTransitionResult(
            version_id=version_id,
            previous_status=current.status,
            current_status=updated.status,
            active=updated.active,
            transitioned_at=transitioned_at,
        )

    def _record_transition_locked(
        self,
        version_id: int,
        from_status: PromptStatus,
        to_status: PromptStatus,
        *,
        review_tests_passed: bool,
        note: str | None,
        created_at: str,
    ) -> None:
        self._connection.execute(
            """
            INSERT INTO prompt_transition_events (
                created_at, version_id, from_status, to_status,
                review_tests_passed, note
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                created_at,
                version_id,
                from_status.value,
                to_status.value,
                int(review_tests_passed),
                note,
            ),
        )

    def compare(self, from_version_id: int, to_version_id: int) -> PromptVersionDiff:
        source = self.get(from_version_id)
        target = self.get(to_version_id)
        changed_fields: list[str] = []
        for field in ("name", "system_prompt", "didactic_mode", "status"):
            if getattr(source, field) != getattr(target, field):
                changed_fields.append(field)
        source_parameters = source.parameters.model_dump(mode="json")
        target_parameters = target.parameters.model_dump(mode="json")
        for key in sorted(set(source_parameters) | set(target_parameters)):
            if source_parameters.get(key) != target_parameters.get(key):
                changed_fields.append(f"parameters.{key}")
        return PromptVersionDiff(
            from_version_id=from_version_id,
            to_version_id=to_version_id,
            changed=bool(changed_fields),
            changed_fields=changed_fields,
            from_checksum=source.checksum,
            to_checksum=target.checksum,
        )

    def rollback(self, version_id: int, *, note: str | None = None) -> PromptRollbackResult:
        source = self.get(version_id)
        revision = self.create_revision(
            source.version_id,
            PromptRevisionRequest(
                name=source.name,
                system_prompt=source.system_prompt,
                didactic_mode=source.didactic_mode,
                parameters=source.parameters,
                note=note or f"Rollback non distruttivo dalla versione {source.version_number}",
            ),
        )
        return PromptRollbackResult(
            source_version_id=source.version_id,
            new_version_id=revision.version_id,
            configuration_key=revision.configuration_key,
            version_number=revision.version_number,
            status=revision.status,
            created_at=revision.created_at,
        )

    @staticmethod
    def _summary_from_row(row: sqlite3.Row) -> PromptVersionSummary:
        return PromptVersionSummary(
            version_id=int(row["id"]),
            configuration_key=str(row["configuration_key"]),
            version_number=int(row["version_number"]),
            created_at=str(row["created_at"]),
            status=PromptStatus(str(row["status"])),
            name=str(row["name"]),
            didactic_mode=DidacticMode(str(row["didactic_mode"])),
            checksum=str(row["checksum"]),
            parent_version_id=(
                int(row["parent_version_id"]) if row["parent_version_id"] is not None else None
            ),
            active=bool(row["active"]),
            published_at=str(row["published_at"]) if row["published_at"] else None,
        )

    @classmethod
    def _detail_from_row(cls, row: sqlite3.Row) -> PromptVersionDetail:
        summary = cls._summary_from_row(row)
        return PromptVersionDetail(
            **summary.model_dump(),
            system_prompt=str(row["system_prompt"]),
            parameters=PromptParameters.model_validate(json.loads(str(row["parameters_json"]))),
            note=str(row["note"]) if row["note"] else None,
        )
