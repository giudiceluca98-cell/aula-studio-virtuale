from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Iterable, Sequence

from .semantic_errors import (
    SemanticIndexConflictError,
    SemanticIndexNotFoundError,
    UnapprovedMaterialError,
)
from .semantic_models import EmbeddingJob, EmbeddingJobStatus


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class SqliteHybridIndexStore:
    """Indice persistente separato per aula, modello e versione del materiale."""

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        self._connection = sqlite3.connect(self.path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._connection.execute("PRAGMA journal_mode = WAL")
        self._schema()

    def close(self) -> None:
        with self._lock:
            self._connection.close()

    def _schema(self) -> None:
        with self._lock, self._connection:
            self._connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS research_embedding_jobs(
                    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    project_id TEXT NOT NULL,
                    source_id INTEGER NOT NULL,
                    promotion_id INTEGER NOT NULL,
                    material_id TEXT NOT NULL,
                    version_id INTEGER NOT NULL,
                    version_number INTEGER NOT NULL,
                    checksum_sha256 TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    dimensions INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    segment_count INTEGER NOT NULL DEFAULT 0,
                    token_count INTEGER NOT NULL DEFAULT 0,
                    cost_microunits INTEGER NOT NULL DEFAULT 0,
                    idempotency_key TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    error_code TEXT,
                    UNIQUE(room_id, material_id, version_id, provider, model),
                    UNIQUE(room_id, idempotency_key)
                );
                CREATE INDEX IF NOT EXISTS idx_embedding_jobs_room_status
                    ON research_embedding_jobs(room_id,status,job_id DESC);

                CREATE TABLE IF NOT EXISTS research_vector_segments(
                    segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL,
                    room_id TEXT NOT NULL,
                    project_id TEXT NOT NULL,
                    source_id INTEGER NOT NULL,
                    promotion_id INTEGER NOT NULL,
                    material_id TEXT NOT NULL,
                    version_id INTEGER NOT NULL,
                    version_number INTEGER NOT NULL,
                    locator TEXT NOT NULL,
                    text_content TEXT NOT NULL,
                    text_sha256 TEXT NOT NULL,
                    vector_json TEXT NOT NULL,
                    vector_norm REAL NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    dimensions INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(job_id) REFERENCES research_embedding_jobs(job_id)
                        ON DELETE CASCADE,
                    UNIQUE(job_id, locator)
                );
                CREATE INDEX IF NOT EXISTS idx_vector_segments_room_project
                    ON research_vector_segments(room_id,project_id,segment_id);
                CREATE INDEX IF NOT EXISTS idx_vector_segments_room_material
                    ON research_vector_segments(room_id,material_id,version_number);
                CREATE INDEX IF NOT EXISTS idx_vector_segments_room_source
                    ON research_vector_segments(room_id,source_id);

                CREATE TABLE IF NOT EXISTS research_hybrid_retrieval_runs(
                    run_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    project_id TEXT,
                    query_sha256 TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    candidate_count INTEGER NOT NULL,
                    result_count INTEGER NOT NULL,
                    latency_ms REAL NOT NULL,
                    token_count INTEGER NOT NULL,
                    cost_microunits INTEGER NOT NULL,
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_hybrid_runs_room_created
                    ON research_hybrid_retrieval_runs(room_id,run_id DESC);
                """
            )

    @staticmethod
    def _job(row: sqlite3.Row) -> EmbeddingJob:
        return EmbeddingJob(
            job_id=int(row["job_id"]), room_id=str(row["room_id"]),
            project_id=str(row["project_id"]), source_id=int(row["source_id"]),
            promotion_id=int(row["promotion_id"]), material_id=str(row["material_id"]),
            version_id=int(row["version_id"]), version_number=int(row["version_number"]),
            checksum_sha256=str(row["checksum_sha256"]), provider=str(row["provider"]),
            model=str(row["model"]), dimensions=int(row["dimensions"]),
            status=EmbeddingJobStatus(str(row["status"])), segment_count=int(row["segment_count"]),
            token_count=int(row["token_count"]), cost_microunits=int(row["cost_microunits"]),
            idempotency_key=str(row["idempotency_key"]), created_at=str(row["created_at"]),
            completed_at=str(row["completed_at"]) if row["completed_at"] else None,
            error_code=str(row["error_code"]) if row["error_code"] else None,
        )

    def require_active_promotion(
        self, *, room_id: str, material_id: str, version_id: int
    ) -> tuple[str, int, int]:
        with self._lock:
            try:
                row = self._connection.execute(
                    """
                    SELECT project_id,source_id,promotion_id
                    FROM research_source_promotions
                    WHERE room_id=? AND material_id=? AND version_id=? AND status='active'
                    ORDER BY promotion_id DESC LIMIT 1
                    """,
                    (room_id, material_id, version_id),
                ).fetchone()
            except sqlite3.OperationalError as exc:
                raise UnapprovedMaterialError(
                    "Registro promozioni non disponibile: applicare INTELLIGENCE-0.3"
                ) from exc
        if row is None:
            raise UnapprovedMaterialError(
                "Il materiale non possiede una promozione INTELLIGENCE attiva per questa aula e versione"
            )
        return str(row["project_id"]), int(row["source_id"]), int(row["promotion_id"])

    def find_job(
        self, *, room_id: str, material_id: str, version_id: int, provider: str, model: str
    ) -> EmbeddingJob | None:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT * FROM research_embedding_jobs
                WHERE room_id=? AND material_id=? AND version_id=? AND provider=? AND model=?
                """,
                (room_id, material_id, version_id, provider, model),
            ).fetchone()
        return self._job(row) if row else None

    def begin_job(
        self, *, room_id: str, project_id: str, source_id: int, promotion_id: int,
        material_id: str, version_id: int, version_number: int, checksum_sha256: str,
        provider: str, model: str, dimensions: int, idempotency_key: str, rebuild: bool,
    ) -> EmbeddingJob:
        now = utc_now()
        with self._lock, self._connection:
            existing = self._connection.execute(
                """SELECT * FROM research_embedding_jobs
                WHERE room_id=? AND material_id=? AND version_id=? AND provider=? AND model=?""",
                (room_id, material_id, version_id, provider, model),
            ).fetchone()
            if existing is not None:
                job = self._job(existing)
                if job.status == EmbeddingJobStatus.SUCCEEDED and not rebuild:
                    return job
                self._connection.execute(
                    """UPDATE research_embedding_jobs SET status='running', segment_count=0,
                    token_count=0,cost_microunits=0,idempotency_key=?,created_at=?,completed_at=NULL,
                    error_code=NULL,checksum_sha256=?,dimensions=?,promotion_id=?,source_id=?,project_id=?
                    WHERE job_id=?""",
                    (idempotency_key, now, checksum_sha256, dimensions, promotion_id,
                     source_id, project_id, job.job_id),
                )
                self._connection.execute(
                    "DELETE FROM research_vector_segments WHERE job_id=?", (job.job_id,)
                )
                row = self._connection.execute(
                    "SELECT * FROM research_embedding_jobs WHERE job_id=?", (job.job_id,)
                ).fetchone()
                return self._job(row)
            try:
                cursor = self._connection.execute(
                    """INSERT INTO research_embedding_jobs(
                    room_id,project_id,source_id,promotion_id,material_id,version_id,version_number,
                    checksum_sha256,provider,model,dimensions,status,idempotency_key,created_at)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,'running',?,?)""",
                    (room_id,project_id,source_id,promotion_id,material_id,version_id,version_number,
                     checksum_sha256,provider,model,dimensions,idempotency_key,now),
                )
            except sqlite3.IntegrityError as exc:
                raise SemanticIndexConflictError(
                    "Idempotency key già usata da un altro job nell'aula"
                ) from exc
            row = self._connection.execute(
                "SELECT * FROM research_embedding_jobs WHERE job_id=?", (cursor.lastrowid,)
            ).fetchone()
        return self._job(row)

    def complete_job(
        self, *, job_id: int, segments: Sequence[dict], token_count: int, cost_microunits: int
    ) -> EmbeddingJob:
        now = utc_now()
        with self._lock, self._connection:
            job_row = self._connection.execute(
                "SELECT * FROM research_embedding_jobs WHERE job_id=?", (job_id,)
            ).fetchone()
            if job_row is None:
                raise SemanticIndexNotFoundError(job_id)
            self._connection.execute("DELETE FROM research_vector_segments WHERE job_id=?", (job_id,))
            self._connection.executemany(
                """INSERT INTO research_vector_segments(
                job_id,room_id,project_id,source_id,promotion_id,material_id,version_id,
                version_number,locator,text_content,text_sha256,vector_json,vector_norm,
                provider,model,dimensions,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                [(
                    job_id, job_row["room_id"], job_row["project_id"], job_row["source_id"],
                    job_row["promotion_id"], job_row["material_id"], job_row["version_id"],
                    job_row["version_number"], item["locator"], item["text"], item["text_sha256"],
                    json.dumps(item["vector"], separators=(",", ":")), item["norm"],
                    job_row["provider"], job_row["model"], job_row["dimensions"], now,
                ) for item in segments],
            )
            self._connection.execute(
                """UPDATE research_embedding_jobs SET status='succeeded',segment_count=?,
                token_count=?,cost_microunits=?,completed_at=?,error_code=NULL WHERE job_id=?""",
                (len(segments), token_count, cost_microunits, now, job_id),
            )
            row = self._connection.execute(
                "SELECT * FROM research_embedding_jobs WHERE job_id=?", (job_id,)
            ).fetchone()
        return self._job(row)

    def fail_job(self, job_id: int, error_code: str) -> None:
        with self._lock, self._connection:
            self._connection.execute(
                """UPDATE research_embedding_jobs SET status='failed',error_code=?,completed_at=?
                WHERE job_id=?""", (error_code[:120], utc_now(), job_id)
            )

    def list_segments(
        self, *, room_id: str, project_id: str | None, material_ids: Sequence[str],
        source_ids: Sequence[int], provider: str, model: str, limit: int,
    ) -> list[dict]:
        clauses = [
            "s.room_id=?", "s.provider=?", "s.model=?",
            """EXISTS (
                SELECT 1 FROM research_source_promotions AS p
                WHERE p.promotion_id=s.promotion_id
                  AND p.room_id=s.room_id
                  AND p.material_id=s.material_id
                  AND p.version_id=s.version_id
                  AND p.status='active'
            )""",
        ]
        params: list[object] = [room_id, provider, model]
        if project_id:
            clauses.append("s.project_id=?"); params.append(project_id)
        if material_ids:
            clauses.append(f"s.material_id IN ({','.join('?' for _ in material_ids)})")
            params.extend(material_ids)
        if source_ids:
            clauses.append(f"s.source_id IN ({','.join('?' for _ in source_ids)})")
            params.extend(source_ids)
        with self._lock:
            rows = self._connection.execute(
                f"""SELECT s.* FROM research_vector_segments AS s
                WHERE {' AND '.join(clauses)}
                ORDER BY s.segment_id LIMIT ?""", [*params, limit]
            ).fetchall()
        return [{
            "segment_id": int(row["segment_id"]), "project_id": str(row["project_id"]),
            "source_id": int(row["source_id"]), "material_id": str(row["material_id"]),
            "version_number": int(row["version_number"]), "locator": str(row["locator"]),
            "text": str(row["text_content"]), "text_sha256": str(row["text_sha256"]),
            "vector": tuple(float(v) for v in json.loads(str(row["vector_json"]))),
            "provider": str(row["provider"]), "model": str(row["model"]),
            "dimensions": int(row["dimensions"]),
        } for row in rows if str(row["locator"]).strip()]

    def delete_index(self, *, room_id: str, material_id: str, version_number: int) -> tuple[int, int]:
        with self._lock, self._connection:
            rows = self._connection.execute(
                "SELECT job_id FROM research_embedding_jobs WHERE room_id=? AND material_id=? AND version_number=?",
                (room_id, material_id, version_number),
            ).fetchall()
            job_ids = [int(row["job_id"]) for row in rows]
            if not job_ids:
                return 0, 0
            placeholders = ",".join("?" for _ in job_ids)
            segment_count = int(self._connection.execute(
                f"SELECT COUNT(*) FROM research_vector_segments WHERE job_id IN ({placeholders})",
                job_ids,
            ).fetchone()[0])
            self._connection.execute(
                f"DELETE FROM research_embedding_jobs WHERE job_id IN ({placeholders})", job_ids
            )
        return len(job_ids), segment_count

    def record_run(
        self, *, room_id: str, project_id: str | None, query_sha256: str, mode: str,
        candidate_count: int, result_count: int, latency_ms: float, token_count: int,
        cost_microunits: int, provider: str, model: str,
    ) -> int:
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """INSERT INTO research_hybrid_retrieval_runs(
                room_id,project_id,query_sha256,mode,candidate_count,result_count,latency_ms,
                token_count,cost_microunits,provider,model,created_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
                (room_id,project_id,query_sha256,mode,candidate_count,result_count,latency_ms,
                 token_count,cost_microunits,provider,model,utc_now()),
            )
        return int(cursor.lastrowid)

    def counts(self) -> dict[str, int]:
        with self._lock:
            total_jobs = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_embedding_jobs"
            ).fetchone()[0])
            succeeded_jobs = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_embedding_jobs WHERE status='succeeded'"
            ).fetchone()[0])
            segments = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_vector_segments"
            ).fetchone()[0])
            runs = int(self._connection.execute(
                "SELECT COUNT(*) FROM research_hybrid_retrieval_runs"
            ).fetchone()[0])
        return {"total_jobs":total_jobs,"succeeded_jobs":succeeded_jobs,
                "indexed_segments":segments,"retrieval_runs":runs}
