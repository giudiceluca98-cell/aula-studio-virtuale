from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from .chunking import PreparedChunk
from .errors import (
    MaterialNotFoundError,
    MaterialRoomMismatchError,
    MaterialVersionNotFoundError,
)
from .models import (
    MaterialChunk,
    MaterialDetail,
    MaterialImportEventSummary,
    MaterialSourceType,
    MaterialStatus,
    MaterialSummary,
    MaterialVersionSummary,
)

SCHEMA_VERSION = 1


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SqliteMaterialStore:
    def __init__(self, database_path: str) -> None:
        self.database_path = database_path
        if database_path != ":memory:":
            Path(database_path).parent.mkdir(parents=True, exist_ok=True)
        self._memory_connection: sqlite3.Connection | None = None
        if database_path == ":memory:":
            self._memory_connection = self._new_connection()
        self._initialize()

    def _new_connection(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        if self._memory_connection is not None:
            yield self._memory_connection
            return
        connection = self._new_connection()
        try:
            yield connection
        finally:
            connection.close()

    def _initialize(self) -> None:
        with self.connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS material_schema_metadata (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS materials (
                    material_id TEXT PRIMARY KEY,
                    room_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    source_label TEXT,
                    current_version_id INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_materials_room_updated
                    ON materials(room_id, updated_at DESC);

                CREATE TABLE IF NOT EXISTS material_versions (
                    version_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    material_id TEXT NOT NULL,
                    room_id TEXT NOT NULL,
                    version_number INTEGER NOT NULL,
                    filename TEXT NOT NULL,
                    media_type TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    checksum_sha256 TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    raw_content BLOB NOT NULL,
                    extracted_text TEXT,
                    extracted_chars INTEGER NOT NULL DEFAULT 0,
                    chunk_count INTEGER NOT NULL DEFAULT 0,
                    error_code TEXT,
                    error_class TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    FOREIGN KEY(material_id) REFERENCES materials(material_id),
                    UNIQUE(material_id, version_number)
                );

                CREATE INDEX IF NOT EXISTS idx_material_versions_material
                    ON material_versions(material_id, version_number DESC);
                CREATE INDEX IF NOT EXISTS idx_material_versions_room_checksum
                    ON material_versions(room_id, checksum_sha256, status);

                CREATE TABLE IF NOT EXISTS material_chunks (
                    chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version_id INTEGER NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    start_char INTEGER NOT NULL,
                    end_char INTEGER NOT NULL,
                    text_content TEXT NOT NULL,
                    text_sha256 TEXT NOT NULL,
                    embedding_status TEXT NOT NULL DEFAULT 'not_requested',
                    FOREIGN KEY(version_id) REFERENCES material_versions(version_id) ON DELETE CASCADE,
                    UNIQUE(version_id, chunk_index)
                );

                CREATE TABLE IF NOT EXISTS material_import_events (
                    import_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id TEXT NOT NULL,
                    material_id TEXT,
                    version_id INTEGER,
                    status TEXT NOT NULL,
                    checksum_sha256 TEXT,
                    size_bytes INTEGER,
                    error_code TEXT,
                    error_class TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT,
                    FOREIGN KEY(material_id) REFERENCES materials(material_id),
                    FOREIGN KEY(version_id) REFERENCES material_versions(version_id)
                );
                """
            )
            connection.execute(
                "INSERT OR REPLACE INTO material_schema_metadata(key, value) VALUES ('schema_version', ?)",
                (str(SCHEMA_VERSION),),
            )
            connection.commit()

    def schema_version(self) -> int:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT value FROM material_schema_metadata WHERE key = 'schema_version'"
            ).fetchone()
            return int(row["value"]) if row else 0

    def record_rejected_import(
        self,
        *,
        room_id: str,
        status: str,
        error_code: str,
        error_class: str,
        checksum_sha256: str | None = None,
        size_bytes: int | None = None,
        material_id: str | None = None,
        version_id: int | None = None,
    ) -> int:
        now = utc_now()
        with self.connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO material_import_events(
                    room_id, material_id, version_id, status, checksum_sha256, size_bytes,
                    error_code, error_class, created_at, completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    room_id,
                    material_id,
                    version_id,
                    status,
                    checksum_sha256,
                    size_bytes,
                    error_code,
                    error_class,
                    now,
                    now,
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def list_imports(self, room_id: str, *, limit: int = 100) -> list[MaterialImportEventSummary]:
        with self.connection() as connection:
            rows = connection.execute(
                """
                SELECT import_id, room_id, material_id, version_id, status,
                       checksum_sha256, size_bytes, error_code, error_class,
                       created_at, completed_at
                FROM material_import_events
                WHERE room_id = ?
                ORDER BY import_id DESC
                LIMIT ?
                """,
                (room_id, limit),
            ).fetchall()
        return [
            MaterialImportEventSummary(
                import_id=row["import_id"],
                room_id=row["room_id"],
                material_id=row["material_id"],
                version_id=row["version_id"],
                status=row["status"],
                checksum_sha256=row["checksum_sha256"],
                size_bytes=row["size_bytes"],
                error_code=row["error_code"],
                error_class=row["error_class"],
                created_at=row["created_at"],
                completed_at=row["completed_at"],
            )
            for row in rows
        ]

    def find_ready_duplicate(self, room_id: str, checksum_sha256: str) -> sqlite3.Row | None:
        with self.connection() as connection:
            return connection.execute(
                """
                SELECT v.*, e.import_id
                FROM material_versions v
                LEFT JOIN material_import_events e ON e.version_id = v.version_id
                WHERE v.room_id = ? AND v.checksum_sha256 = ? AND v.status = 'ready'
                ORDER BY v.version_id ASC, e.import_id ASC
                LIMIT 1
                """,
                (room_id, checksum_sha256),
            ).fetchone()

    def material_versions_count(self, material_id: str) -> int:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT COUNT(*) AS total FROM material_versions WHERE material_id = ?",
                (material_id,),
            ).fetchone()
            return int(row["total"])

    def begin_import(
        self,
        *,
        room_id: str,
        title: str,
        filename: str,
        media_type: str,
        source_type: MaterialSourceType,
        checksum_sha256: str,
        size_bytes: int,
        metadata: dict,
        raw_content: bytes,
        material_id: str | None,
        source_label: str | None,
    ) -> tuple[int, str, int, int]:
        now = utc_now()
        metadata_json = json.dumps(
            metadata,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        )
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            if material_id is None:
                material_id = uuid.uuid4().hex
                connection.execute(
                    """
                    INSERT INTO materials(material_id, room_id, title, source_label, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (material_id, room_id, title, source_label, now, now),
                )
                version_number = 1
            else:
                material = connection.execute(
                    "SELECT room_id FROM materials WHERE material_id = ?",
                    (material_id,),
                ).fetchone()
                if material is None:
                    connection.rollback()
                    raise MaterialNotFoundError()
                if material["room_id"] != room_id:
                    connection.rollback()
                    raise MaterialRoomMismatchError()
                version_number = int(
                    connection.execute(
                        "SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM material_versions WHERE material_id = ?",
                        (material_id,),
                    ).fetchone()["next_version"]
                )

            version_cursor = connection.execute(
                """
                INSERT INTO material_versions(
                    material_id, room_id, version_number, filename, media_type,
                    source_type, checksum_sha256, size_bytes, status, metadata_json,
                    raw_content, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?, ?)
                """,
                (
                    material_id,
                    room_id,
                    version_number,
                    filename,
                    media_type,
                    source_type.value,
                    checksum_sha256,
                    size_bytes,
                    metadata_json,
                    raw_content,
                    now,
                ),
            )
            version_id = int(version_cursor.lastrowid)
            if version_number == 1:
                connection.execute(
                    "UPDATE materials SET current_version_id = ?, updated_at = ? WHERE material_id = ?",
                    (version_id, now, material_id),
                )
            import_cursor = connection.execute(
                """
                INSERT INTO material_import_events(
                    room_id, material_id, version_id, status, checksum_sha256,
                    size_bytes, created_at
                ) VALUES (?, ?, ?, 'processing', ?, ?, ?)
                """,
                (room_id, material_id, version_id, checksum_sha256, size_bytes, now),
            )
            import_id = int(import_cursor.lastrowid)
            connection.commit()
            return import_id, material_id, version_id, version_number

    def complete_import(
        self,
        *,
        import_id: int,
        material_id: str,
        version_id: int,
        title: str,
        source_label: str | None,
        extracted_text: str,
        chunks: list[PreparedChunk],
    ) -> None:
        now = utc_now()
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.executemany(
                """
                INSERT INTO material_chunks(
                    version_id, chunk_index, start_char, end_char,
                    text_content, text_sha256, embedding_status
                ) VALUES (?, ?, ?, ?, ?, ?, 'not_requested')
                """,
                [
                    (
                        version_id,
                        chunk.chunk_index,
                        chunk.start_char,
                        chunk.end_char,
                        chunk.text,
                        chunk.text_sha256,
                    )
                    for chunk in chunks
                ],
            )
            connection.execute(
                """
                UPDATE material_versions
                SET status = 'ready', extracted_text = ?, extracted_chars = ?,
                    chunk_count = ?, completed_at = ?, error_code = NULL, error_class = NULL
                WHERE version_id = ?
                """,
                (extracted_text, len(extracted_text), len(chunks), now, version_id),
            )
            connection.execute(
                """
                UPDATE materials
                SET title = ?, source_label = COALESCE(?, source_label),
                    current_version_id = ?, updated_at = ?
                WHERE material_id = ?
                """,
                (title, source_label, version_id, now, material_id),
            )
            connection.execute(
                """
                UPDATE material_import_events
                SET status = 'ready', completed_at = ?, error_code = NULL, error_class = NULL
                WHERE import_id = ?
                """,
                (now, import_id),
            )
            connection.commit()

    def fail_import(
        self,
        *,
        import_id: int,
        version_id: int,
        error_code: str,
        error_class: str,
    ) -> None:
        now = utc_now()
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                UPDATE material_versions
                SET status = 'failed', extracted_text = NULL, extracted_chars = 0,
                    chunk_count = 0, error_code = ?, error_class = ?, completed_at = ?
                WHERE version_id = ?
                """,
                (error_code, error_class, now, version_id),
            )
            connection.execute(
                """
                UPDATE material_import_events
                SET status = 'failed', error_code = ?, error_class = ?, completed_at = ?
                WHERE import_id = ?
                """,
                (error_code, error_class, now, import_id),
            )
            connection.commit()

    @staticmethod
    def _summary_from_row(row: sqlite3.Row) -> MaterialSummary:
        status = MaterialStatus(row["current_status"]) if row["current_status"] else None
        return MaterialSummary(
            material_id=row["material_id"],
            room_id=row["room_id"],
            title=row["title"],
            source_label=row["source_label"],
            current_version_id=row["current_version_id"],
            current_version_number=row["current_version_number"],
            current_status=status,
            media_type=row["media_type"],
            filename=row["filename"],
            checksum_sha256=row["checksum_sha256"],
            size_bytes=row["size_bytes"] or 0,
            extracted_chars=row["extracted_chars"] or 0,
            chunk_count=row["chunk_count"] or 0,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def _material_query(self) -> str:
        return """
            SELECT m.*,
                   v.version_number AS current_version_number,
                   v.status AS current_status,
                   v.media_type,
                   v.filename,
                   v.checksum_sha256,
                   v.size_bytes,
                   v.extracted_chars,
                   v.chunk_count,
                   v.metadata_json
            FROM materials m
            LEFT JOIN material_versions v ON v.version_id = m.current_version_id
        """

    def list_materials(
        self,
        *,
        room_id: str,
        status: MaterialStatus | None,
        query: str | None,
        offset: int,
        limit: int,
    ) -> tuple[int, list[MaterialSummary]]:
        conditions = ["m.room_id = ?"]
        values: list[object] = [room_id]
        if status is not None:
            conditions.append("v.status = ?")
            values.append(status.value)
        if query:
            conditions.append("(LOWER(m.title) LIKE ? OR LOWER(v.filename) LIKE ?)")
            pattern = f"%{query.lower()}%"
            values.extend([pattern, pattern])
        where = " AND ".join(conditions)
        with self.connection() as connection:
            total = int(
                connection.execute(
                    f"SELECT COUNT(*) AS total FROM ({self._material_query()} WHERE {where})",
                    values,
                ).fetchone()["total"]
            )
            rows = connection.execute(
                f"{self._material_query()} WHERE {where} ORDER BY m.updated_at DESC LIMIT ? OFFSET ?",
                [*values, limit, offset],
            ).fetchall()
        return total, [self._summary_from_row(row) for row in rows]

    def get_material(self, material_id: str, room_id: str) -> MaterialDetail:
        with self.connection() as connection:
            row = connection.execute(
                f"{self._material_query()} WHERE m.material_id = ?",
                (material_id,),
            ).fetchone()
        if row is None:
            raise MaterialNotFoundError()
        if row["room_id"] != room_id:
            raise MaterialRoomMismatchError()
        summary = self._summary_from_row(row)
        metadata = json.loads(row["metadata_json"]) if row["metadata_json"] else {}
        return MaterialDetail(**summary.model_dump(), metadata=metadata)

    @staticmethod
    def _version_from_row(row: sqlite3.Row) -> MaterialVersionSummary:
        return MaterialVersionSummary(
            version_id=row["version_id"],
            material_id=row["material_id"],
            room_id=row["room_id"],
            version_number=row["version_number"],
            filename=row["filename"],
            media_type=row["media_type"],
            source_type=MaterialSourceType(row["source_type"]),
            checksum_sha256=row["checksum_sha256"],
            size_bytes=row["size_bytes"],
            status=MaterialStatus(row["status"]),
            extracted_chars=row["extracted_chars"],
            chunk_count=row["chunk_count"],
            metadata=json.loads(row["metadata_json"]),
            error_code=row["error_code"],
            error_class=row["error_class"],
            created_at=row["created_at"],
            completed_at=row["completed_at"],
        )

    def list_versions(self, material_id: str, room_id: str) -> list[MaterialVersionSummary]:
        self.get_material(material_id, room_id)
        with self.connection() as connection:
            rows = connection.execute(
                "SELECT * FROM material_versions WHERE material_id = ? ORDER BY version_number DESC",
                (material_id,),
            ).fetchall()
        return [self._version_from_row(row) for row in rows]

    def get_version(self, material_id: str, version_number: int, room_id: str) -> MaterialVersionSummary:
        self.get_material(material_id, room_id)
        with self.connection() as connection:
            row = connection.execute(
                "SELECT * FROM material_versions WHERE material_id = ? AND version_number = ?",
                (material_id, version_number),
            ).fetchone()
        if row is None:
            raise MaterialVersionNotFoundError()
        return self._version_from_row(row)

    def list_chunks(self, material_id: str, version_number: int, room_id: str) -> list[MaterialChunk]:
        version = self.get_version(material_id, version_number, room_id)
        with self.connection() as connection:
            rows = connection.execute(
                "SELECT * FROM material_chunks WHERE version_id = ? ORDER BY chunk_index",
                (version.version_id,),
            ).fetchall()
        return [
            MaterialChunk(
                chunk_id=row["chunk_id"],
                version_id=row["version_id"],
                chunk_index=row["chunk_index"],
                start_char=row["start_char"],
                end_char=row["end_char"],
                text=row["text_content"],
                text_sha256=row["text_sha256"],
                embedding_status=row["embedding_status"],
            )
            for row in rows
        ]


    def deactivate_material(self, material_id: str, room_id: str) -> None:
        """Remove a material from active retrieval without deleting versions or audit history."""
        now = utc_now()
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                "SELECT room_id FROM materials WHERE material_id = ?",
                (material_id,),
            ).fetchone()
            if row is None:
                connection.rollback()
                raise MaterialNotFoundError()
            if row["room_id"] != room_id:
                connection.rollback()
                raise MaterialRoomMismatchError()
            connection.execute(
                "UPDATE materials SET current_version_id = NULL, updated_at = ? WHERE material_id = ?",
                (now, material_id),
            )
            connection.commit()

    def activate_material_version(
        self,
        material_id: str,
        version_id: int,
        room_id: str,
    ) -> None:
        now = utc_now()
        with self.connection() as connection:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute(
                """
                SELECT m.room_id, v.status
                FROM materials m
                JOIN material_versions v ON v.material_id = m.material_id
                WHERE m.material_id = ? AND v.version_id = ?
                """,
                (material_id, version_id),
            ).fetchone()
            if row is None:
                connection.rollback()
                raise MaterialVersionNotFoundError()
            if row["room_id"] != room_id:
                connection.rollback()
                raise MaterialRoomMismatchError()
            if row["status"] != MaterialStatus.READY.value:
                connection.rollback()
                raise MaterialVersionNotFoundError()
            connection.execute(
                "UPDATE materials SET current_version_id = ?, updated_at = ? WHERE material_id = ?",
                (version_id, now, material_id),
            )
            connection.commit()

    def is_material_active(self, material_id: str, room_id: str) -> bool:
        with self.connection() as connection:
            row = connection.execute(
                "SELECT room_id, current_version_id FROM materials WHERE material_id = ?",
                (material_id,),
            ).fetchone()
        if row is None:
            raise MaterialNotFoundError()
        if row["room_id"] != room_id:
            raise MaterialRoomMismatchError()
        return row["current_version_id"] is not None

    def catalog_counts(self) -> dict[str, int]:
        with self.connection() as connection:
            material_total = int(
                connection.execute("SELECT COUNT(*) AS total FROM materials").fetchone()["total"]
            )
            version_rows = connection.execute(
                "SELECT status, COUNT(*) AS total FROM material_versions GROUP BY status"
            ).fetchall()
            version_counts = {row["status"]: int(row["total"]) for row in version_rows}
            total_versions = sum(version_counts.values())
            total_chunks = int(
                connection.execute("SELECT COUNT(*) AS total FROM material_chunks").fetchone()["total"]
            )
        return {
            "total_materials": material_total,
            "total_versions": total_versions,
            "ready_versions": version_counts.get("ready", 0),
            "processing_versions": version_counts.get("processing", 0),
            "failed_versions": version_counts.get("failed", 0),
            "total_chunks": total_chunks,
        }
