from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Any

from .freshness_errors import (
    SourceConflictNotFoundError,
    SourceConflictStateError,
    SourceHealthNotFoundError,
    SourceHealthStateError,
)
from .freshness_models import (
    CorpusHealthReport,
    CorpusProjectCoverage,
    SourceAvailabilityStatus,
    SourceConflict,
    SourceConflictResolution,
    SourceConflictStatus,
    SourceConflictType,
    SourceConsistencyStatus,
    SourceFreshnessPolicyView,
    SourceFreshnessStatus,
    SourceHealthCheckKind,
    SourceHealthComponents,
    SourceHealthSnapshot,
    SourceHealthState,
    SourceHealthSummaryStatus,
)

FRESHNESS_SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SqliteSourceHealthStore:
    """Ledger append-only per salute, conflitti e report del corpus."""

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
                CREATE TABLE IF NOT EXISTS research_freshness_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS research_source_freshness_policies (
                    source_id INTEGER PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    max_age_days INTEGER NOT NULL,
                    recheck_interval_hours INTEGER NOT NULL,
                    actor_id TEXT NOT NULL,
                    note TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS research_source_health_snapshots (
                    snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    check_kind TEXT NOT NULL,
                    actor_id TEXT NOT NULL,
                    availability_status TEXT NOT NULL,
                    freshness_status TEXT NOT NULL,
                    consistency_status TEXT NOT NULL,
                    summary_status TEXT NOT NULL,
                    components_json TEXT NOT NULL,
                    health_score INTEGER NOT NULL,
                    previous_acquisition_id INTEGER,
                    observed_acquisition_id INTEGER,
                    previous_sha256 TEXT,
                    observed_sha256 TEXT,
                    active_promotion_id INTEGER,
                    material_id TEXT,
                    version_id INTEGER,
                    source_date TEXT,
                    acquired_at TEXT,
                    checked_at TEXT NOT NULL,
                    expires_at TEXT,
                    next_check_at TEXT,
                    final_url TEXT,
                    http_status INTEGER,
                    consecutive_failures INTEGER NOT NULL DEFAULT 0,
                    signals_json TEXT NOT NULL DEFAULT '[]',
                    error_code TEXT,
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_research_health_snapshots_source
                    ON research_source_health_snapshots(source_id, snapshot_id DESC);
                CREATE INDEX IF NOT EXISTS idx_research_health_snapshots_room
                    ON research_source_health_snapshots(room_id, checked_at DESC);

                CREATE TABLE IF NOT EXISTS research_source_health_state (
                    source_id INTEGER PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    latest_snapshot_id INTEGER,
                    availability_status TEXT NOT NULL,
                    freshness_status TEXT NOT NULL,
                    consistency_status TEXT NOT NULL,
                    summary_status TEXT NOT NULL,
                    components_json TEXT NOT NULL,
                    health_score INTEGER NOT NULL,
                    consecutive_failures INTEGER NOT NULL DEFAULT 0,
                    replacement_source_id INTEGER,
                    previous_acquisition_id INTEGER,
                    observed_acquisition_id INTEGER,
                    last_checked_at TEXT,
                    expires_at TEXT,
                    next_check_at TEXT,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(latest_snapshot_id) REFERENCES research_source_health_snapshots(snapshot_id),
                    FOREIGN KEY(replacement_source_id) REFERENCES research_source_candidates(source_id)
                );

                CREATE INDEX IF NOT EXISTS idx_research_health_state_room_due
                    ON research_source_health_state(room_id, next_check_at);

                CREATE TABLE IF NOT EXISTS research_source_conflicts (
                    conflict_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    project_id TEXT,
                    left_source_id INTEGER NOT NULL,
                    right_source_id INTEGER NOT NULL,
                    topic_key TEXT NOT NULL,
                    conflict_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    left_claim TEXT NOT NULL,
                    right_claim TEXT NOT NULL,
                    left_locator TEXT,
                    right_locator TEXT,
                    detected_by TEXT NOT NULL,
                    detection_rationale TEXT NOT NULL,
                    resolution TEXT,
                    preferred_source_id INTEGER,
                    resolved_by TEXT,
                    resolution_rationale TEXT,
                    created_at TEXT NOT NULL,
                    resolved_at TEXT,
                    FOREIGN KEY(left_source_id) REFERENCES research_source_candidates(source_id),
                    FOREIGN KEY(right_source_id) REFERENCES research_source_candidates(source_id),
                    FOREIGN KEY(preferred_source_id) REFERENCES research_source_candidates(source_id)
                );

                CREATE INDEX IF NOT EXISTS idx_research_conflicts_room_status
                    ON research_source_conflicts(room_id, status, conflict_id DESC);
                CREATE INDEX IF NOT EXISTS idx_research_conflicts_sources
                    ON research_source_conflicts(left_source_id, right_source_id, status);

                CREATE TABLE IF NOT EXISTS research_corpus_health_reports (
                    report_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    generated_by TEXT NOT NULL,
                    generated_at TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    report_sha256 TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_research_corpus_reports_room
                    ON research_corpus_health_reports(room_id, report_id DESC);
                """
            )
            self._connection.execute(
                """
                INSERT INTO research_freshness_meta(key, value)
                VALUES ('schema_version', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (str(FRESHNESS_SCHEMA_VERSION),),
            )

    @property
    def schema_version(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT value FROM research_freshness_meta WHERE key = 'schema_version'"
            ).fetchone()
        return int(row[0]) if row else 0

    def source_context(self, source_id: int, room_id: str) -> dict[str, Any]:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT s.source_id, s.project_id, s.url, s.title, s.publisher,
                       s.published_at, s.status AS source_status, s.trust_level,
                       s.content_acquired, p.room_id, p.title AS project_title,
                       d.acquisition_id, d.final_url, d.sha256, d.created_at AS acquired_at,
                       r.review_id, r.status AS review_status, r.author AS review_author,
                       r.publisher AS review_publisher, r.published_at AS review_published_at,
                       r.license_name, r.language,
                       promo.promotion_id AS active_promotion_id,
                       promo.material_id, promo.version_id
                FROM research_source_candidates s
                JOIN research_projects p ON p.project_id = s.project_id
                LEFT JOIN research_acquired_documents d
                  ON d.source_id = s.source_id AND d.project_id = s.project_id
                LEFT JOIN research_source_reviews r
                  ON r.review_id = (
                    SELECT MAX(r2.review_id) FROM research_source_reviews r2
                    WHERE r2.source_id = s.source_id AND r2.project_id = s.project_id
                  )
                LEFT JOIN research_source_promotions promo
                  ON promo.promotion_id = (
                    SELECT MAX(p2.promotion_id) FROM research_source_promotions p2
                    WHERE p2.source_id = s.source_id AND p2.project_id = s.project_id
                      AND p2.room_id = p.room_id AND p2.status = 'active'
                  )
                WHERE s.source_id = ? AND p.room_id = ?
                """,
                (source_id, room_id),
            ).fetchone()
        if row is None:
            raise SourceHealthNotFoundError(source_id)
        return dict(row)

    def set_policy(
        self,
        *,
        source_id: int,
        room_id: str,
        max_age_days: int,
        recheck_interval_hours: int,
        actor_id: str,
        note: str,
    ) -> SourceFreshnessPolicyView:
        context = self.source_context(source_id, room_id)
        now = utc_now()
        with self._lock, self._connection:
            self._connection.execute(
                """
                INSERT INTO research_source_freshness_policies(
                    source_id, project_id, room_id, max_age_days,
                    recheck_interval_hours, actor_id, note, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    max_age_days = excluded.max_age_days,
                    recheck_interval_hours = excluded.recheck_interval_hours,
                    actor_id = excluded.actor_id,
                    note = excluded.note,
                    updated_at = excluded.updated_at
                """,
                (
                    source_id,
                    context["project_id"],
                    room_id,
                    max_age_days,
                    recheck_interval_hours,
                    actor_id,
                    note,
                    now,
                ),
            )
        return self.get_policy(
            source_id,
            room_id,
            default_max_age_days=max_age_days,
            default_recheck_interval_hours=recheck_interval_hours,
        )

    def get_policy(
        self,
        source_id: int,
        room_id: str,
        *,
        default_max_age_days: int,
        default_recheck_interval_hours: int,
    ) -> SourceFreshnessPolicyView:
        context = self.source_context(source_id, room_id)
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM research_source_freshness_policies WHERE source_id = ? AND room_id = ?",
                (source_id, room_id),
            ).fetchone()
        if row is None:
            return SourceFreshnessPolicyView(
                source_id=source_id,
                project_id=str(context["project_id"]),
                room_id=room_id,
                max_age_days=default_max_age_days,
                recheck_interval_hours=default_recheck_interval_hours,
                actor_id="system-default",
                note="Policy predefinita server-side.",
                updated_at=utc_now(),
                custom=False,
            )
        return SourceFreshnessPolicyView(
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            room_id=str(row["room_id"]),
            max_age_days=int(row["max_age_days"]),
            recheck_interval_hours=int(row["recheck_interval_hours"]),
            actor_id=str(row["actor_id"]),
            note=str(row["note"]),
            updated_at=str(row["updated_at"]),
            custom=True,
        )

    @staticmethod
    def _snapshot_from_row(row: sqlite3.Row) -> SourceHealthSnapshot:
        return SourceHealthSnapshot(
            snapshot_id=int(row["snapshot_id"]),
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            room_id=str(row["room_id"]),
            check_kind=SourceHealthCheckKind(str(row["check_kind"])),
            actor_id=str(row["actor_id"]),
            availability_status=SourceAvailabilityStatus(str(row["availability_status"])),
            freshness_status=SourceFreshnessStatus(str(row["freshness_status"])),
            consistency_status=SourceConsistencyStatus(str(row["consistency_status"])),
            summary_status=SourceHealthSummaryStatus(str(row["summary_status"])),
            components=SourceHealthComponents(**json.loads(str(row["components_json"]))),
            health_score=int(row["health_score"]),
            previous_acquisition_id=(
                int(row["previous_acquisition_id"])
                if row["previous_acquisition_id"] is not None else None
            ),
            observed_acquisition_id=(
                int(row["observed_acquisition_id"])
                if row["observed_acquisition_id"] is not None else None
            ),
            previous_sha256=(str(row["previous_sha256"]) if row["previous_sha256"] else None),
            observed_sha256=(str(row["observed_sha256"]) if row["observed_sha256"] else None),
            active_promotion_id=(
                int(row["active_promotion_id"])
                if row["active_promotion_id"] is not None else None
            ),
            material_id=str(row["material_id"]) if row["material_id"] else None,
            version_id=int(row["version_id"]) if row["version_id"] is not None else None,
            source_date=str(row["source_date"]) if row["source_date"] else None,
            acquired_at=str(row["acquired_at"]) if row["acquired_at"] else None,
            checked_at=str(row["checked_at"]),
            expires_at=str(row["expires_at"]) if row["expires_at"] else None,
            next_check_at=str(row["next_check_at"]) if row["next_check_at"] else None,
            final_url=str(row["final_url"]) if row["final_url"] else None,
            http_status=int(row["http_status"]) if row["http_status"] is not None else None,
            consecutive_failures=int(row["consecutive_failures"]),
            signals=list(json.loads(str(row["signals_json"]))),
            error_code=str(row["error_code"]) if row["error_code"] else None,
        )

    def record_snapshot(self, values: dict[str, Any]) -> SourceHealthSnapshot:
        components_json = json.dumps(values["components"], sort_keys=True, separators=(",", ":"))
        signals_json = json.dumps(values.get("signals", []), ensure_ascii=False, sort_keys=True)
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO research_source_health_snapshots(
                    source_id, project_id, room_id, check_kind, actor_id,
                    availability_status, freshness_status, consistency_status,
                    summary_status, components_json, health_score,
                    previous_acquisition_id, observed_acquisition_id,
                    previous_sha256, observed_sha256, active_promotion_id,
                    material_id, version_id, source_date, acquired_at, checked_at,
                    expires_at, next_check_at, final_url, http_status,
                    consecutive_failures, signals_json, error_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    values["source_id"], values["project_id"], values["room_id"],
                    values["check_kind"], values["actor_id"],
                    values["availability_status"], values["freshness_status"],
                    values["consistency_status"], values["summary_status"],
                    components_json, values["health_score"],
                    values.get("previous_acquisition_id"), values.get("observed_acquisition_id"),
                    values.get("previous_sha256"), values.get("observed_sha256"),
                    values.get("active_promotion_id"), values.get("material_id"),
                    values.get("version_id"), values.get("source_date"), values.get("acquired_at"),
                    values["checked_at"], values.get("expires_at"), values.get("next_check_at"),
                    values.get("final_url"), values.get("http_status"),
                    values.get("consecutive_failures", 0), signals_json, values.get("error_code"),
                ),
            )
            snapshot_id = int(cursor.lastrowid)
            self._connection.execute(
                """
                INSERT INTO research_source_health_state(
                    source_id, project_id, room_id, latest_snapshot_id,
                    availability_status, freshness_status, consistency_status,
                    summary_status, components_json, health_score,
                    consecutive_failures, replacement_source_id,
                    previous_acquisition_id, observed_acquisition_id,
                    last_checked_at, expires_at, next_check_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_id) DO UPDATE SET
                    project_id = excluded.project_id,
                    room_id = excluded.room_id,
                    latest_snapshot_id = excluded.latest_snapshot_id,
                    availability_status = excluded.availability_status,
                    freshness_status = excluded.freshness_status,
                    consistency_status = excluded.consistency_status,
                    summary_status = excluded.summary_status,
                    components_json = excluded.components_json,
                    health_score = excluded.health_score,
                    consecutive_failures = excluded.consecutive_failures,
                    replacement_source_id = COALESCE(excluded.replacement_source_id, research_source_health_state.replacement_source_id),
                    previous_acquisition_id = excluded.previous_acquisition_id,
                    observed_acquisition_id = excluded.observed_acquisition_id,
                    last_checked_at = excluded.last_checked_at,
                    expires_at = excluded.expires_at,
                    next_check_at = excluded.next_check_at,
                    updated_at = excluded.updated_at
                """,
                (
                    values["source_id"], values["project_id"], values["room_id"], snapshot_id,
                    values["availability_status"], values["freshness_status"],
                    values["consistency_status"], values["summary_status"], components_json,
                    values["health_score"], values.get("consecutive_failures", 0),
                    values.get("replacement_source_id"), values.get("previous_acquisition_id"),
                    values.get("observed_acquisition_id"), values["checked_at"],
                    values.get("expires_at"), values.get("next_check_at"), values["checked_at"],
                ),
            )
            row = self._connection.execute(
                "SELECT * FROM research_source_health_snapshots WHERE snapshot_id = ?",
                (snapshot_id,),
            ).fetchone()
        return self._snapshot_from_row(row)

    def _open_conflicts(self, source_id: int, room_id: str) -> int:
        row = self._connection.execute(
            """
            SELECT COUNT(*) FROM research_source_conflicts
            WHERE room_id = ? AND status = 'open'
              AND (left_source_id = ? OR right_source_id = ?)
            """,
            (room_id, source_id, source_id),
        ).fetchone()
        return int(row[0])

    def _state_from_row(self, row: sqlite3.Row) -> SourceHealthState:
        open_conflicts = self._open_conflicts(int(row["source_id"]), str(row["room_id"]))
        consistency = (
            SourceConsistencyStatus.CONFLICTED
            if open_conflicts else SourceConsistencyStatus(str(row["consistency_status"]))
        )
        summary = SourceHealthSummaryStatus(str(row["summary_status"]))
        if open_conflicts and summary == SourceHealthSummaryStatus.HEALTHY:
            summary = SourceHealthSummaryStatus.ATTENTION
        return SourceHealthState(
            source_id=int(row["source_id"]), project_id=str(row["project_id"]),
            room_id=str(row["room_id"]),
            latest_snapshot_id=(int(row["latest_snapshot_id"]) if row["latest_snapshot_id"] else None),
            availability_status=SourceAvailabilityStatus(str(row["availability_status"])),
            freshness_status=SourceFreshnessStatus(str(row["freshness_status"])),
            consistency_status=consistency,
            summary_status=summary,
            components=SourceHealthComponents(**json.loads(str(row["components_json"]))),
            health_score=int(row["health_score"]),
            consecutive_failures=int(row["consecutive_failures"]),
            open_conflicts=open_conflicts,
            replacement_source_id=(int(row["replacement_source_id"]) if row["replacement_source_id"] else None),
            previous_acquisition_id=(int(row["previous_acquisition_id"]) if row["previous_acquisition_id"] else None),
            observed_acquisition_id=(int(row["observed_acquisition_id"]) if row["observed_acquisition_id"] else None),
            last_checked_at=str(row["last_checked_at"]) if row["last_checked_at"] else None,
            expires_at=str(row["expires_at"]) if row["expires_at"] else None,
            next_check_at=str(row["next_check_at"]) if row["next_check_at"] else None,
            updated_at=str(row["updated_at"]),
        )

    def get_snapshot(self, snapshot_id: int, room_id: str) -> SourceHealthSnapshot:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM research_source_health_snapshots WHERE snapshot_id = ? AND room_id = ?",
                (snapshot_id, room_id),
            ).fetchone()
        if row is None:
            raise SourceHealthNotFoundError(snapshot_id)
        return self._snapshot_from_row(row)

    def get_state(self, source_id: int, room_id: str) -> SourceHealthState:
        self.source_context(source_id, room_id)
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM research_source_health_state WHERE source_id = ? AND room_id = ?",
                (source_id, room_id),
            ).fetchone()
        if row is None:
            raise SourceHealthNotFoundError(source_id)
        return self._state_from_row(row)

    def list_states(self, room_id: str) -> list[SourceHealthState]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM research_source_health_state WHERE room_id = ? ORDER BY health_score, source_id",
                (room_id,),
            ).fetchall()
            return [self._state_from_row(row) for row in rows]

    def due_sources(self, room_id: str, now: str, limit: int) -> list[int]:
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT s.source_id
                FROM research_source_candidates s
                JOIN research_projects p ON p.project_id = s.project_id
                JOIN research_acquired_documents d ON d.source_id = s.source_id
                LEFT JOIN research_source_health_state h ON h.source_id = s.source_id
                WHERE p.room_id = ?
                  AND (h.source_id IS NULL OR h.next_check_at IS NULL OR h.next_check_at <= ?)
                ORDER BY COALESCE(h.next_check_at, '0000-01-01T00:00:00+00:00'), s.source_id
                LIMIT ?
                """,
                (room_id, now, limit),
            ).fetchall()
        return [int(row["source_id"]) for row in rows]

    def mark_replacement(
        self,
        *, source_id: int, room_id: str, replacement_source_id: int,
        actor_id: str, rationale: str, snapshot_values: dict[str, Any]
    ) -> SourceHealthSnapshot:
        source = self.source_context(source_id, room_id)
        replacement = self.source_context(replacement_source_id, room_id)
        if source_id == replacement_source_id:
            raise SourceHealthStateError("La fonte sostitutiva deve essere differente")
        if str(source["project_id"]) != str(replacement["project_id"]):
            raise SourceHealthStateError("La sostituzione deve restare nello stesso progetto")
        snapshot_values = dict(snapshot_values)
        snapshot_values["replacement_source_id"] = replacement_source_id
        snapshot_values.setdefault("signals", []).append(f"replacement:{replacement_source_id}")
        snapshot_values["signals"].append(f"replacement_rationale:{rationale}")
        snapshot = self.record_snapshot(snapshot_values)
        with self._lock, self._connection:
            self._connection.execute(
                "UPDATE research_source_health_state SET replacement_source_id = ?, updated_at = ? WHERE source_id = ?",
                (replacement_source_id, utc_now(), source_id),
            )
        return snapshot

    @staticmethod
    def _conflict_from_row(row: sqlite3.Row) -> SourceConflict:
        return SourceConflict(
            conflict_id=int(row["conflict_id"]), room_id=str(row["room_id"]),
            project_id=str(row["project_id"]) if row["project_id"] else None,
            left_source_id=int(row["left_source_id"]), right_source_id=int(row["right_source_id"]),
            topic_key=str(row["topic_key"]), conflict_type=SourceConflictType(str(row["conflict_type"])),
            status=SourceConflictStatus(str(row["status"])), left_claim=str(row["left_claim"]),
            right_claim=str(row["right_claim"]),
            left_locator=str(row["left_locator"]) if row["left_locator"] else None,
            right_locator=str(row["right_locator"]) if row["right_locator"] else None,
            detected_by=str(row["detected_by"]), detection_rationale=str(row["detection_rationale"]),
            resolution=(SourceConflictResolution(str(row["resolution"])) if row["resolution"] else None),
            preferred_source_id=(int(row["preferred_source_id"]) if row["preferred_source_id"] else None),
            resolved_by=str(row["resolved_by"]) if row["resolved_by"] else None,
            resolution_rationale=(str(row["resolution_rationale"]) if row["resolution_rationale"] else None),
            created_at=str(row["created_at"]), resolved_at=str(row["resolved_at"]) if row["resolved_at"] else None,
        )

    def create_conflict(self, values: dict[str, Any]) -> SourceConflict:
        left = self.source_context(values["left_source_id"], values["room_id"])
        right = self.source_context(values["right_source_id"], values["room_id"])
        project_id = left["project_id"] if left["project_id"] == right["project_id"] else None
        pair = sorted((values["left_source_id"], values["right_source_id"]))
        with self._lock, self._connection:
            existing = self._connection.execute(
                """
                SELECT * FROM research_source_conflicts
                WHERE room_id = ? AND status = 'open' AND topic_key = ?
                  AND ((left_source_id = ? AND right_source_id = ?)
                    OR (left_source_id = ? AND right_source_id = ?))
                ORDER BY conflict_id DESC LIMIT 1
                """,
                (values["room_id"], values["topic_key"], pair[0], pair[1], pair[1], pair[0]),
            ).fetchone()
            if existing is not None:
                return self._conflict_from_row(existing)
            cursor = self._connection.execute(
                """
                INSERT INTO research_source_conflicts(
                    room_id, project_id, left_source_id, right_source_id,
                    topic_key, conflict_type, status, left_claim, right_claim,
                    left_locator, right_locator, detected_by, detection_rationale,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    values["room_id"], project_id, values["left_source_id"], values["right_source_id"],
                    values["topic_key"], values["conflict_type"], values["left_claim"],
                    values["right_claim"], values.get("left_locator"), values.get("right_locator"),
                    values["actor_id"], values["rationale"], utc_now(),
                ),
            )
            row = self._connection.execute(
                "SELECT * FROM research_source_conflicts WHERE conflict_id = ?",
                (int(cursor.lastrowid),),
            ).fetchone()
        return self._conflict_from_row(row)

    def get_conflict(self, conflict_id: int, room_id: str) -> SourceConflict:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM research_source_conflicts WHERE conflict_id = ? AND room_id = ?",
                (conflict_id, room_id),
            ).fetchone()
        if row is None:
            raise SourceConflictNotFoundError(conflict_id)
        return self._conflict_from_row(row)

    def list_conflicts(self, room_id: str, status: SourceConflictStatus | None = None) -> list[SourceConflict]:
        query = "SELECT * FROM research_source_conflicts WHERE room_id = ?"
        params: list[Any] = [room_id]
        if status is not None:
            query += " AND status = ?"
            params.append(status.value)
        query += " ORDER BY conflict_id DESC"
        with self._lock:
            rows = self._connection.execute(query, params).fetchall()
        return [self._conflict_from_row(row) for row in rows]

    def resolve_conflict(
        self, *, conflict_id: int, room_id: str, actor_id: str,
        resolution: SourceConflictResolution, rationale: str
    ) -> SourceConflict:
        conflict = self.get_conflict(conflict_id, room_id)
        if conflict.status != SourceConflictStatus.OPEN:
            return conflict
        preferred: int | None = None
        status = SourceConflictStatus.RESOLVED
        if resolution == SourceConflictResolution.PREFER_LEFT:
            preferred = conflict.left_source_id
        elif resolution == SourceConflictResolution.PREFER_RIGHT:
            preferred = conflict.right_source_id
        elif resolution == SourceConflictResolution.DISMISS:
            status = SourceConflictStatus.DISMISSED
        elif resolution != SourceConflictResolution.KEEP_BOTH:
            raise SourceConflictStateError("Risoluzione non valida")
        now = utc_now()
        with self._lock, self._connection:
            self._connection.execute(
                """
                UPDATE research_source_conflicts
                SET status = ?, resolution = ?, preferred_source_id = ?,
                    resolved_by = ?, resolution_rationale = ?, resolved_at = ?
                WHERE conflict_id = ? AND room_id = ?
                """,
                (status.value, resolution.value, preferred, actor_id, rationale, now, conflict_id, room_id),
            )
        return self.get_conflict(conflict_id, room_id)

    def report_statistics(self, room_id: str) -> tuple[dict[str, Any], list[CorpusProjectCoverage]]:
        with self._lock:
            total_projects = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_projects WHERE room_id = ?", (room_id,)
            ).fetchone()[0])
            total_sources = int(self._connection.execute(
                """SELECT COUNT(*) FROM research_source_candidates s JOIN research_projects p ON p.project_id=s.project_id WHERE p.room_id=?""",
                (room_id,),
            ).fetchone()[0])
            acquired = int(self._connection.execute(
                """SELECT COUNT(*) FROM research_acquired_documents d JOIN research_projects p ON p.project_id=d.project_id WHERE p.room_id=?""",
                (room_id,),
            ).fetchone()[0])
            approved = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_source_reviews WHERE room_id=? AND status='approved'", (room_id,)
            ).fetchone()[0])
            promotions = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_source_promotions WHERE room_id=? AND status='active'", (room_id,)
            ).fetchone()[0])
            state_rows = self._connection.execute(
                "SELECT * FROM research_source_health_state WHERE room_id=?", (room_id,)
            ).fetchall()
            conflicts = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_source_conflicts WHERE room_id=? AND status='open'", (room_id,)
            ).fetchone()[0])
            project_rows = self._connection.execute(
                "SELECT project_id,title FROM research_projects WHERE room_id=? ORDER BY project_id", (room_id,)
            ).fetchall()
            projects: list[CorpusProjectCoverage] = []
            for project in project_rows:
                pid = str(project["project_id"])
                counts = self._connection.execute(
                    """
                    SELECT
                      (SELECT COUNT(*) FROM research_source_candidates WHERE project_id=?) AS candidates,
                      (SELECT COUNT(*) FROM research_acquired_documents WHERE project_id=?) AS acquired,
                      (SELECT COUNT(*) FROM research_source_reviews WHERE project_id=? AND room_id=? AND status='approved') AS approved,
                      (SELECT COUNT(*) FROM research_source_promotions WHERE project_id=? AND room_id=? AND status='active') AS promotions,
                      (SELECT COUNT(*) FROM research_source_health_state WHERE project_id=? AND room_id=?) AS checked,
                      (SELECT COUNT(*) FROM research_source_health_state WHERE project_id=? AND room_id=? AND summary_status='healthy') AS healthy,
                      (SELECT COUNT(*) FROM research_source_health_state WHERE project_id=? AND room_id=? AND summary_status='attention') AS attention,
                      (SELECT COUNT(*) FROM research_source_health_state WHERE project_id=? AND room_id=? AND summary_status='critical') AS critical,
                      (SELECT COUNT(*) FROM research_source_conflicts WHERE project_id=? AND room_id=? AND status='open') AS conflicts
                    """,
                    (pid,pid,pid,room_id,pid,room_id,pid,room_id,pid,room_id,pid,room_id,pid,room_id,pid,room_id),
                ).fetchone()
                projects.append(CorpusProjectCoverage(
                    project_id=pid, title=str(project["title"]),
                    candidate_sources=int(counts["candidates"]), acquired_sources=int(counts["acquired"]),
                    approved_sources=int(counts["approved"]), active_promotions=int(counts["promotions"]),
                    health_checked_sources=int(counts["checked"]), healthy_sources=int(counts["healthy"]),
                    attention_sources=int(counts["attention"]), critical_sources=int(counts["critical"]),
                    open_conflicts=int(counts["conflicts"]),
                ))
        summary_counts = {"healthy":0,"attention":0,"critical":0,"stale":0,"changed":0,"unavailable":0,"removed":0}
        scores: list[int] = []
        for row in state_rows:
            summary_counts[str(row["summary_status"])] = summary_counts.get(str(row["summary_status"]),0)+1
            summary_counts[str(row["freshness_status"])] = summary_counts.get(str(row["freshness_status"]),0)+1
            summary_counts[str(row["availability_status"])] = summary_counts.get(str(row["availability_status"]),0)+1
            scores.append(int(row["health_score"]))
        return ({
            "total_projects":total_projects,"total_sources":total_sources,
            "acquired_sources":acquired,"approved_sources":approved,"active_promotions":promotions,
            "checked_sources":len(state_rows),"open_conflicts":conflicts,
            "average_health_score":round(sum(scores)/len(scores),2) if scores else 0.0,
            **summary_counts,
        }, projects)

    def save_report(self, payload: dict[str, Any]) -> CorpusHealthReport:
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        with self._lock, self._connection:
            cursor = self._connection.execute(
                "INSERT INTO research_corpus_health_reports(room_id,generated_by,generated_at,payload_json,report_sha256) VALUES (?,?,?,?,?)",
                (payload["room_id"], payload["generated_by"], payload["generated_at"], serialized, digest),
            )
            report_id = int(cursor.lastrowid)
        return CorpusHealthReport(report_id=report_id, report_sha256=digest, **payload)

    def counts(self) -> dict[str, int]:
        now = utc_now()
        with self._lock:
            states = int(self._connection.execute("SELECT COUNT(*) FROM research_source_health_state").fetchone()[0])
            due = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_source_health_state WHERE next_check_at IS NULL OR next_check_at <= ?", (now,)
            ).fetchone()[0])
            conflicts = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_source_conflicts WHERE status='open'"
            ).fetchone()[0])
            reports = int(self._connection.execute("SELECT COUNT(*) FROM research_corpus_health_reports").fetchone()[0])
        return {"total_states":states,"due_sources":due,"open_conflicts":conflicts,"stored_reports":reports}
