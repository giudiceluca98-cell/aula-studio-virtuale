from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .errors import (
    ResearchPromotionNotFoundError,
    ResearchReviewNotFoundError,
    ResearchReviewStateError,
)
from .models import (
    ResearchPromotion,
    ResearchPromotionStatus,
    ResearchQualityScores,
    ResearchReviewEvent,
    ResearchReviewStatus,
    ResearchSafetyAnalysis,
    ResearchSourceReview,
)

REVIEW_SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SqliteReviewStore:
    """Human-review and promotion ledger in the research database."""

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
                CREATE TABLE IF NOT EXISTS research_review_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS research_source_reviews (
                    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    acquisition_id INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    reviewer_id TEXT NOT NULL,
                    reviewer_role TEXT NOT NULL,
                    rationale TEXT,
                    title TEXT,
                    author TEXT,
                    publisher TEXT,
                    published_at TEXT,
                    license_name TEXT,
                    language TEXT,
                    scores_json TEXT,
                    analysis_json TEXT NOT NULL,
                    risk_acknowledged INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    decided_at TEXT,
                    UNIQUE(source_id, acquisition_id),
                    FOREIGN KEY(source_id) REFERENCES research_source_candidates(source_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(project_id) REFERENCES research_projects(project_id)
                        ON DELETE CASCADE,
                    FOREIGN KEY(acquisition_id) REFERENCES research_acquisition_events(acquisition_id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_research_reviews_room_status
                    ON research_source_reviews(room_id, status, updated_at DESC);
                CREATE INDEX IF NOT EXISTS idx_research_reviews_source
                    ON research_source_reviews(source_id, review_id DESC);

                CREATE TABLE IF NOT EXISTS research_review_events (
                    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    review_id INTEGER NOT NULL,
                    source_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    actor_id TEXT NOT NULL,
                    rationale TEXT,
                    payload_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(review_id) REFERENCES research_source_reviews(review_id)
                        ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_research_review_events_review
                    ON research_review_events(review_id, event_id);

                CREATE TABLE IF NOT EXISTS research_source_promotions (
                    promotion_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    review_id INTEGER NOT NULL,
                    source_id INTEGER NOT NULL,
                    project_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    acquisition_id INTEGER NOT NULL,
                    material_id TEXT NOT NULL,
                    version_id INTEGER NOT NULL,
                    idempotency_key TEXT NOT NULL,
                    status TEXT NOT NULL,
                    promoted_by TEXT NOT NULL,
                    promoted_at TEXT NOT NULL,
                    revoked_by TEXT,
                    revoked_at TEXT,
                    revocation_reason TEXT,
                    UNIQUE(room_id, idempotency_key),
                    FOREIGN KEY(review_id) REFERENCES research_source_reviews(review_id)
                        ON DELETE CASCADE
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_research_active_promotion_per_review
                    ON research_source_promotions(review_id)
                    WHERE status = 'active';
                CREATE INDEX IF NOT EXISTS idx_research_promotions_material_status
                    ON research_source_promotions(material_id, status);
                """
            )
            self._connection.execute(
                """
                INSERT INTO research_review_meta(key, value)
                VALUES ('schema_version', ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (str(REVIEW_SCHEMA_VERSION),),
            )

    @property
    def schema_version(self) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT value FROM research_review_meta WHERE key = 'schema_version'"
            ).fetchone()
        return int(row[0]) if row else 0

    @staticmethod
    def _row_to_review(row: sqlite3.Row) -> ResearchSourceReview:
        scores = json.loads(str(row["scores_json"])) if row["scores_json"] else None
        analysis = json.loads(str(row["analysis_json"]))
        return ResearchSourceReview(
            review_id=int(row["review_id"]),
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            room_id=str(row["room_id"]),
            acquisition_id=int(row["acquisition_id"]),
            status=ResearchReviewStatus(str(row["status"])),
            reviewer_id=str(row["reviewer_id"]),
            reviewer_role=str(row["reviewer_role"]),
            rationale=str(row["rationale"]) if row["rationale"] is not None else None,
            title=str(row["title"]) if row["title"] is not None else None,
            author=str(row["author"]) if row["author"] is not None else None,
            publisher=str(row["publisher"]) if row["publisher"] is not None else None,
            published_at=(str(row["published_at"]) if row["published_at"] is not None else None),
            license_name=(str(row["license_name"]) if row["license_name"] is not None else None),
            language=str(row["language"]) if row["language"] is not None else None,
            scores=ResearchQualityScores(**scores) if scores is not None else None,
            safety_analysis=ResearchSafetyAnalysis(**analysis),
            risk_acknowledged=bool(row["risk_acknowledged"]),
            created_at=str(row["created_at"]),
            updated_at=str(row["updated_at"]),
            decided_at=str(row["decided_at"]) if row["decided_at"] is not None else None,
        )

    @staticmethod
    def _row_to_promotion(row: sqlite3.Row) -> ResearchPromotion:
        return ResearchPromotion(
            promotion_id=int(row["promotion_id"]),
            review_id=int(row["review_id"]),
            source_id=int(row["source_id"]),
            project_id=str(row["project_id"]),
            room_id=str(row["room_id"]),
            acquisition_id=int(row["acquisition_id"]),
            material_id=str(row["material_id"]),
            version_id=int(row["version_id"]),
            idempotency_key=str(row["idempotency_key"]),
            status=ResearchPromotionStatus(str(row["status"])),
            promoted_by=str(row["promoted_by"]),
            promoted_at=str(row["promoted_at"]),
            revoked_by=str(row["revoked_by"]) if row["revoked_by"] is not None else None,
            revoked_at=str(row["revoked_at"]) if row["revoked_at"] is not None else None,
            revocation_reason=(
                str(row["revocation_reason"]) if row["revocation_reason"] is not None else None
            ),
        )

    def _record_event(
        self,
        *,
        review_id: int,
        source_id: int,
        project_id: str,
        room_id: str,
        event_type: str,
        actor_id: str,
        rationale: str | None = None,
        payload: dict | None = None,
    ) -> None:
        self._connection.execute(
            """
            INSERT INTO research_review_events(
                review_id, source_id, project_id, room_id, event_type,
                actor_id, rationale, payload_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                review_id,
                source_id,
                project_id,
                room_id,
                event_type,
                actor_id,
                rationale,
                json.dumps(payload or {}, ensure_ascii=False, sort_keys=True),
                utc_now(),
            ),
        )

    def start_review(
        self,
        *,
        source_id: int,
        project_id: str,
        room_id: str,
        acquisition_id: int,
        reviewer_id: str,
        reviewer_role: str,
        safety_analysis: ResearchSafetyAnalysis,
    ) -> ResearchSourceReview:
        now = utc_now()
        with self._lock, self._connection:
            existing = self._connection.execute(
                """
                SELECT * FROM research_source_reviews
                WHERE source_id = ? AND acquisition_id = ? AND room_id = ?
                """,
                (source_id, acquisition_id, room_id),
            ).fetchone()
            if existing is not None:
                return self._row_to_review(existing)

            old_rows = self._connection.execute(
                """
                SELECT * FROM research_source_reviews
                WHERE source_id = ? AND room_id = ? AND acquisition_id <> ?
                  AND status IN ('under_review', 'approved')
                """,
                (source_id, room_id, acquisition_id),
            ).fetchall()
            for old in old_rows:
                self._connection.execute(
                    """
                    UPDATE research_source_reviews
                    SET status = 'expired', updated_at = ?, decided_at = COALESCE(decided_at, ?)
                    WHERE review_id = ?
                    """,
                    (now, now, int(old["review_id"])),
                )
                self._record_event(
                    review_id=int(old["review_id"]),
                    source_id=source_id,
                    project_id=project_id,
                    room_id=room_id,
                    event_type="expired_by_new_acquisition",
                    actor_id="system",
                    rationale="Una nuova acquisizione richiede una nuova revisione.",
                    payload={"new_acquisition_id": acquisition_id},
                )

            cursor = self._connection.execute(
                """
                INSERT INTO research_source_reviews(
                    source_id, project_id, room_id, acquisition_id, status,
                    reviewer_id, reviewer_role, analysis_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'under_review', ?, ?, ?, ?, ?)
                """,
                (
                    source_id,
                    project_id,
                    room_id,
                    acquisition_id,
                    reviewer_id,
                    reviewer_role,
                    safety_analysis.model_dump_json(),
                    now,
                    now,
                ),
            )
            review_id = int(cursor.lastrowid)
            self._record_event(
                review_id=review_id,
                source_id=source_id,
                project_id=project_id,
                room_id=room_id,
                event_type="review_started",
                actor_id=reviewer_id,
                payload={"reviewer_role": reviewer_role, "acquisition_id": acquisition_id},
            )
            row = self._connection.execute(
                "SELECT * FROM research_source_reviews WHERE review_id = ?",
                (review_id,),
            ).fetchone()
        return self._row_to_review(row)

    def get_review(self, project_id: str, source_id: int, room_id: str) -> ResearchSourceReview:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT * FROM research_source_reviews
                WHERE project_id = ? AND source_id = ? AND room_id = ?
                ORDER BY review_id DESC LIMIT 1
                """,
                (project_id, source_id, room_id),
            ).fetchone()
        if row is None:
            raise ResearchReviewNotFoundError(source_id)
        return self._row_to_review(row)

    def list_reviews(
        self,
        *,
        room_id: str,
        status: ResearchReviewStatus | None = None,
    ) -> list[ResearchSourceReview]:
        clauses = ["room_id = ?"]
        values: list[object] = [room_id]
        if status is not None:
            clauses.append("status = ?")
            values.append(status.value)
        where = " AND ".join(clauses)
        with self._lock:
            rows = self._connection.execute(
                f"SELECT * FROM research_source_reviews WHERE {where} ORDER BY updated_at DESC, review_id DESC",
                values,
            ).fetchall()
        return [self._row_to_review(row) for row in rows]

    def decide_review(
        self,
        *,
        review_id: int,
        decision_status: ResearchReviewStatus,
        reviewer_id: str,
        rationale: str,
        title: str | None,
        author: str | None,
        publisher: str | None,
        published_at: str | None,
        license_name: str | None,
        language: str | None,
        scores: ResearchQualityScores | None,
        risk_acknowledged: bool,
    ) -> ResearchSourceReview:
        now = utc_now()
        with self._lock, self._connection:
            row = self._connection.execute(
                "SELECT * FROM research_source_reviews WHERE review_id = ?",
                (review_id,),
            ).fetchone()
            if row is None:
                raise ResearchReviewNotFoundError(review_id)
            if str(row["status"]) != ResearchReviewStatus.UNDER_REVIEW.value:
                raise ResearchReviewStateError("La revisione non è nello stato under_review")
            self._connection.execute(
                """
                UPDATE research_source_reviews
                SET status = ?, reviewer_id = ?, rationale = ?, title = ?, author = ?,
                    publisher = ?, published_at = ?, license_name = ?, language = ?,
                    scores_json = ?, risk_acknowledged = ?, updated_at = ?, decided_at = ?
                WHERE review_id = ?
                """,
                (
                    decision_status.value,
                    reviewer_id,
                    rationale,
                    title,
                    author,
                    publisher,
                    published_at,
                    license_name,
                    language,
                    scores.model_dump_json() if scores is not None else None,
                    int(risk_acknowledged),
                    now,
                    now,
                    review_id,
                ),
            )
            self._record_event(
                review_id=review_id,
                source_id=int(row["source_id"]),
                project_id=str(row["project_id"]),
                room_id=str(row["room_id"]),
                event_type=f"review_{decision_status.value}",
                actor_id=reviewer_id,
                rationale=rationale,
                payload={
                    "scores": scores.model_dump() if scores is not None else None,
                    "risk_acknowledged": risk_acknowledged,
                },
            )
            updated = self._connection.execute(
                "SELECT * FROM research_source_reviews WHERE review_id = ?",
                (review_id,),
            ).fetchone()
        return self._row_to_review(updated)

    def set_review_status(
        self,
        *,
        review_id: int,
        status: ResearchReviewStatus,
        actor_id: str,
        rationale: str,
    ) -> ResearchSourceReview:
        now = utc_now()
        with self._lock, self._connection:
            row = self._connection.execute(
                "SELECT * FROM research_source_reviews WHERE review_id = ?",
                (review_id,),
            ).fetchone()
            if row is None:
                raise ResearchReviewNotFoundError(review_id)
            self._connection.execute(
                "UPDATE research_source_reviews SET status = ?, updated_at = ? WHERE review_id = ?",
                (status.value, now, review_id),
            )
            self._record_event(
                review_id=review_id,
                source_id=int(row["source_id"]),
                project_id=str(row["project_id"]),
                room_id=str(row["room_id"]),
                event_type=f"review_{status.value}",
                actor_id=actor_id,
                rationale=rationale,
            )
            updated = self._connection.execute(
                "SELECT * FROM research_source_reviews WHERE review_id = ?",
                (review_id,),
            ).fetchone()
        return self._row_to_review(updated)

    def list_events(self, review_id: int, room_id: str) -> list[ResearchReviewEvent]:
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT * FROM research_review_events
                WHERE review_id = ? AND room_id = ?
                ORDER BY event_id
                """,
                (review_id, room_id),
            ).fetchall()
        if not rows:
            raise ResearchReviewNotFoundError(review_id)
        return [
            ResearchReviewEvent(
                event_id=int(row["event_id"]),
                review_id=int(row["review_id"]),
                source_id=int(row["source_id"]),
                project_id=str(row["project_id"]),
                room_id=str(row["room_id"]),
                event_type=str(row["event_type"]),
                actor_id=str(row["actor_id"]),
                rationale=str(row["rationale"]) if row["rationale"] is not None else None,
                payload=json.loads(str(row["payload_json"])),
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]

    def get_promotion_by_key(self, room_id: str, idempotency_key: str) -> ResearchPromotion | None:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM research_source_promotions WHERE room_id = ? AND idempotency_key = ?",
                (room_id, idempotency_key),
            ).fetchone()
        return self._row_to_promotion(row) if row is not None else None

    def get_active_promotion(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchPromotion:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT * FROM research_source_promotions
                WHERE project_id = ? AND source_id = ? AND room_id = ? AND status = 'active'
                ORDER BY promotion_id DESC LIMIT 1
                """,
                (project_id, source_id, room_id),
            ).fetchone()
        if row is None:
            raise ResearchPromotionNotFoundError(source_id)
        return self._row_to_promotion(row)

    def record_promotion(
        self,
        *,
        review: ResearchSourceReview,
        material_id: str,
        version_id: int,
        idempotency_key: str,
        promoted_by: str,
    ) -> ResearchPromotion:
        existing = self.get_promotion_by_key(review.room_id, idempotency_key)
        if existing is not None:
            return existing
        now = utc_now()
        with self._lock, self._connection:
            active = self._connection.execute(
                "SELECT * FROM research_source_promotions WHERE review_id = ? AND status = 'active'",
                (review.review_id,),
            ).fetchone()
            if active is not None:
                return self._row_to_promotion(active)
            cursor = self._connection.execute(
                """
                INSERT INTO research_source_promotions(
                    review_id, source_id, project_id, room_id, acquisition_id,
                    material_id, version_id, idempotency_key, status,
                    promoted_by, promoted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
                """,
                (
                    review.review_id,
                    review.source_id,
                    review.project_id,
                    review.room_id,
                    review.acquisition_id,
                    material_id,
                    version_id,
                    idempotency_key,
                    promoted_by,
                    now,
                ),
            )
            promotion_id = int(cursor.lastrowid)
            self._record_event(
                review_id=review.review_id,
                source_id=review.source_id,
                project_id=review.project_id,
                room_id=review.room_id,
                event_type="promoted_to_core",
                actor_id=promoted_by,
                payload={"material_id": material_id, "version_id": version_id},
            )
            row = self._connection.execute(
                "SELECT * FROM research_source_promotions WHERE promotion_id = ?",
                (promotion_id,),
            ).fetchone()
        return self._row_to_promotion(row)

    def revoke_promotion(
        self,
        *,
        promotion_id: int,
        actor_id: str,
        rationale: str,
    ) -> ResearchPromotion:
        now = utc_now()
        with self._lock, self._connection:
            row = self._connection.execute(
                "SELECT * FROM research_source_promotions WHERE promotion_id = ?",
                (promotion_id,),
            ).fetchone()
            if row is None:
                raise ResearchPromotionNotFoundError(promotion_id)
            if str(row["status"]) == ResearchPromotionStatus.REVOKED.value:
                return self._row_to_promotion(row)
            self._connection.execute(
                """
                UPDATE research_source_promotions
                SET status = 'revoked', revoked_by = ?, revoked_at = ?, revocation_reason = ?
                WHERE promotion_id = ?
                """,
                (actor_id, now, rationale, promotion_id),
            )
            self._record_event(
                review_id=int(row["review_id"]),
                source_id=int(row["source_id"]),
                project_id=str(row["project_id"]),
                room_id=str(row["room_id"]),
                event_type="promotion_revoked",
                actor_id=actor_id,
                rationale=rationale,
                payload={"material_id": str(row["material_id"]), "version_id": int(row["version_id"])},
            )
            updated = self._connection.execute(
                "SELECT * FROM research_source_promotions WHERE promotion_id = ?",
                (promotion_id,),
            ).fetchone()
        return self._row_to_promotion(updated)

    def active_promotions_for_material(self, material_id: str) -> int:
        with self._lock:
            row = self._connection.execute(
                "SELECT COUNT(*) FROM research_source_promotions WHERE material_id = ? AND status = 'active'",
                (material_id,),
            ).fetchone()
        return int(row[0])


    def expire_for_new_acquisition(
        self,
        *,
        source_id: int,
        project_id: str,
        room_id: str,
        acquisition_id: int,
    ) -> int:
        now = utc_now()
        expired = 0
        with self._lock, self._connection:
            rows = self._connection.execute(
                """
                SELECT * FROM research_source_reviews
                WHERE source_id = ? AND project_id = ? AND room_id = ?
                  AND acquisition_id <> ? AND status IN ('under_review', 'approved')
                """,
                (source_id, project_id, room_id, acquisition_id),
            ).fetchall()
            for row in rows:
                self._connection.execute(
                    """
                    UPDATE research_source_reviews
                    SET status = 'expired', updated_at = ?, decided_at = COALESCE(decided_at, ?)
                    WHERE review_id = ?
                    """,
                    (now, now, int(row["review_id"])),
                )
                self._record_event(
                    review_id=int(row["review_id"]),
                    source_id=source_id,
                    project_id=project_id,
                    room_id=room_id,
                    event_type="expired_by_new_acquisition",
                    actor_id="system",
                    rationale="Una nuova acquisizione richiede una nuova revisione.",
                    payload={"new_acquisition_id": acquisition_id},
                )
                expired += 1
        return expired

    def counts(self) -> dict[str, int]:
        with self._lock:
            review_rows = self._connection.execute(
                "SELECT status, COUNT(*) AS total FROM research_source_reviews GROUP BY status"
            ).fetchall()
            promotion_row = self._connection.execute(
                "SELECT COUNT(*) FROM research_source_promotions WHERE status = 'active'"
            ).fetchone()
        counts = {str(row["status"]): int(row["total"]) for row in review_rows}
        return {
            "under_review_sources": counts.get("under_review", 0),
            "approved_sources": counts.get("approved", 0),
            "rejected_sources": counts.get("rejected", 0),
            "active_promotions": int(promotion_row[0]),
        }
