from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Iterable

from .models import (
    PlanSection,
    RequirementCard,
    RequirementChangeSummary,
    RequirementImportSummary,
    RequirementVersionDiff,
    RequirementVersionSummary,
)

SCHEMA_VERSION = 1
_CARD_FIELDS = (
    "section_number",
    "section_title",
    "card_number",
    "title",
    "objective",
    "user_experience",
    "implementation",
    "data_permissions",
    "risks",
    "verification",
    "owner_hint",
    "module_key",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def normalize_source(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def source_sha256(text: str) -> str:
    return hashlib.sha256(normalize_source(text).encode("utf-8")).hexdigest()


def card_content_hash(card: RequirementCard) -> str:
    payload = {field: getattr(card, field) for field in _CARD_FIELDS}
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def catalog_sha256(sections: Iterable[PlanSection], cards: Iterable[RequirementCard]) -> str:
    payload = {
        "sections": [section.model_dump() for section in sorted(sections, key=lambda item: item.number)],
        "cards": [
            card.model_dump()
            for card in sorted(cards, key=lambda item: (item.section_number, item.card_number))
        ],
    }
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class RequirementStorageError(RuntimeError):
    pass


class RequirementVersionNotFoundError(KeyError):
    pass


class SqliteRequirementStore:
    """Persistenza locale SQLite con migrazioni e snapshot immutabili del catalogo."""

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
                raise RequirementStorageError(
                    f"Schema database {current} più recente del software {SCHEMA_VERSION}"
                )
            if current < 1:
                self._connection.executescript(
                    """
                    CREATE TABLE requirement_imports (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created_at TEXT NOT NULL,
                        completed_at TEXT,
                        status TEXT NOT NULL,
                        source_sha256 TEXT NOT NULL,
                        expected_sections INTEGER,
                        expected_cards INTEGER,
                        label TEXT,
                        note TEXT,
                        replace_mode INTEGER NOT NULL,
                        version_id INTEGER,
                        error_message TEXT
                    );

                    CREATE TABLE requirement_versions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created_at TEXT NOT NULL,
                        source_sha256 TEXT NOT NULL,
                        catalog_sha256 TEXT NOT NULL UNIQUE,
                        sections_count INTEGER NOT NULL,
                        cards_count INTEGER NOT NULL,
                        label TEXT,
                        note TEXT,
                        parent_version_id INTEGER,
                        import_id INTEGER NOT NULL,
                        import_mode TEXT NOT NULL,
                        FOREIGN KEY(parent_version_id) REFERENCES requirement_versions(id),
                        FOREIGN KEY(import_id) REFERENCES requirement_imports(id)
                    );

                    CREATE TABLE requirement_sections (
                        version_id INTEGER NOT NULL,
                        number INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        PRIMARY KEY(version_id, number),
                        FOREIGN KEY(version_id) REFERENCES requirement_versions(id) ON DELETE CASCADE
                    );

                    CREATE TABLE requirement_cards (
                        version_id INTEGER NOT NULL,
                        requirement_id TEXT NOT NULL,
                        section_number INTEGER NOT NULL,
                        section_title TEXT NOT NULL,
                        card_number INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        objective TEXT NOT NULL,
                        user_experience TEXT NOT NULL,
                        implementation TEXT NOT NULL,
                        data_permissions TEXT NOT NULL,
                        risks TEXT NOT NULL,
                        verification TEXT NOT NULL,
                        owner_hint TEXT NOT NULL,
                        module_key TEXT NOT NULL,
                        content_hash TEXT NOT NULL,
                        PRIMARY KEY(version_id, requirement_id),
                        FOREIGN KEY(version_id) REFERENCES requirement_versions(id) ON DELETE CASCADE
                    );

                    CREATE TABLE requirement_catalog_state (
                        singleton_id INTEGER PRIMARY KEY CHECK(singleton_id = 1),
                        active_version_id INTEGER,
                        updated_at TEXT NOT NULL,
                        FOREIGN KEY(active_version_id) REFERENCES requirement_versions(id)
                    );

                    CREATE TABLE requirement_activation_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        created_at TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        from_version_id INTEGER,
                        to_version_id INTEGER NOT NULL,
                        note TEXT,
                        FOREIGN KEY(from_version_id) REFERENCES requirement_versions(id),
                        FOREIGN KEY(to_version_id) REFERENCES requirement_versions(id)
                    );

                    CREATE INDEX idx_requirement_cards_version_module
                        ON requirement_cards(version_id, module_key);
                    CREATE INDEX idx_requirement_imports_created
                        ON requirement_imports(created_at DESC);
                    CREATE INDEX idx_requirement_versions_created
                        ON requirement_versions(created_at DESC);
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

    def begin_import(
        self,
        *,
        source_hash: str,
        expected_sections: int | None,
        expected_cards: int | None,
        label: str | None,
        note: str | None,
        replace: bool,
    ) -> int:
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO requirement_imports (
                    created_at, status, source_sha256, expected_sections, expected_cards,
                    label, note, replace_mode
                ) VALUES (?, 'running', ?, ?, ?, ?, ?, ?)
                """,
                (utc_now(), source_hash, expected_sections, expected_cards, label, note, int(replace)),
            )
            return int(cursor.lastrowid)

    def fail_import(self, import_id: int, error_message: str) -> None:
        with self._lock, self._connection:
            self._connection.execute(
                """
                UPDATE requirement_imports
                SET completed_at = ?, status = 'failed', error_message = ?
                WHERE id = ?
                """,
                (utc_now(), error_message[:2000], import_id),
            )

    def complete_import(self, import_id: int, version_id: int, *, unchanged: bool = False) -> None:
        with self._lock, self._connection:
            self._connection.execute(
                """
                UPDATE requirement_imports
                SET completed_at = ?, status = ?, version_id = ?
                WHERE id = ?
                """,
                (utc_now(), "unchanged" if unchanged else "success", version_id, import_id),
            )

    def active_version_id(self) -> int | None:
        with self._lock:
            row = self._connection.execute(
                "SELECT active_version_id FROM requirement_catalog_state WHERE singleton_id = 1"
            ).fetchone()
        return int(row["active_version_id"]) if row and row["active_version_id"] is not None else None

    def versions_count(self) -> int:
        with self._lock:
            return int(self._connection.execute("SELECT COUNT(*) FROM requirement_versions").fetchone()[0])

    def find_version_by_catalog_hash(self, catalog_hash: str) -> int | None:
        with self._lock:
            row = self._connection.execute(
                "SELECT id FROM requirement_versions WHERE catalog_sha256 = ?",
                (catalog_hash,),
            ).fetchone()
        return int(row["id"]) if row else None

    def save_version(
        self,
        *,
        source_hash: str,
        catalog_hash: str,
        sections: list[PlanSection],
        cards: list[RequirementCard],
        parent_version_id: int | None,
        import_id: int,
        import_mode: str,
        label: str | None,
        note: str | None,
    ) -> int:
        created_at = utc_now()
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO requirement_versions (
                    created_at, source_sha256, catalog_sha256, sections_count, cards_count,
                    label, note, parent_version_id, import_id, import_mode
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    created_at,
                    source_hash,
                    catalog_hash,
                    len(sections),
                    len(cards),
                    label,
                    note,
                    parent_version_id,
                    import_id,
                    import_mode,
                ),
            )
            version_id = int(cursor.lastrowid)
            self._connection.executemany(
                "INSERT INTO requirement_sections(version_id, number, title) VALUES (?, ?, ?)",
                [(version_id, section.number, section.title) for section in sections],
            )
            self._connection.executemany(
                """
                INSERT INTO requirement_cards (
                    version_id, requirement_id, section_number, section_title, card_number,
                    title, objective, user_experience, implementation, data_permissions,
                    risks, verification, owner_hint, module_key, content_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        version_id,
                        card.requirement_id,
                        card.section_number,
                        card.section_title,
                        card.card_number,
                        card.title,
                        card.objective,
                        card.user_experience,
                        card.implementation,
                        card.data_permissions,
                        card.risks,
                        card.verification,
                        card.owner_hint,
                        card.module_key,
                        card_content_hash(card),
                    )
                    for card in cards
                ],
            )
            self._set_active_version_locked(version_id, event_type="import", note=note)
        return version_id

    def _set_active_version_locked(self, version_id: int, *, event_type: str, note: str | None) -> int | None:
        row = self._connection.execute(
            "SELECT id FROM requirement_versions WHERE id = ?", (version_id,)
        ).fetchone()
        if not row:
            raise RequirementVersionNotFoundError(version_id)
        previous = self.active_version_id()
        now = utc_now()
        self._connection.execute(
            """
            INSERT INTO requirement_catalog_state(singleton_id, active_version_id, updated_at)
            VALUES (1, ?, ?)
            ON CONFLICT(singleton_id) DO UPDATE SET active_version_id=excluded.active_version_id,
                updated_at=excluded.updated_at
            """,
            (version_id, now),
        )
        self._connection.execute(
            """
            INSERT INTO requirement_activation_events(
                created_at, event_type, from_version_id, to_version_id, note
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (now, event_type, previous, version_id, note),
        )
        return previous

    def activate_version(
        self,
        version_id: int,
        *,
        note: str | None = None,
        event_type: str = "rollback",
    ) -> tuple[int | None, str]:
        with self._lock, self._connection:
            previous = self._set_active_version_locked(version_id, event_type=event_type, note=note)
            activated_at = utc_now()
        return previous, activated_at

    def load_version(self, version_id: int) -> tuple[RequirementVersionSummary, list[PlanSection], list[RequirementCard]]:
        with self._lock:
            version_row = self._connection.execute(
                "SELECT * FROM requirement_versions WHERE id = ?", (version_id,)
            ).fetchone()
            if not version_row:
                raise RequirementVersionNotFoundError(version_id)
            active = self.active_version_id()
            section_rows = self._connection.execute(
                "SELECT number, title FROM requirement_sections WHERE version_id = ? ORDER BY number",
                (version_id,),
            ).fetchall()
            card_rows = self._connection.execute(
                """
                SELECT * FROM requirement_cards
                WHERE version_id = ? ORDER BY section_number, card_number
                """,
                (version_id,),
            ).fetchall()
        summary = self._version_from_row(version_row, active)
        sections = [PlanSection(number=row["number"], title=row["title"]) for row in section_rows]
        cards = [self._card_from_row(row) for row in card_rows]
        return summary, sections, cards

    def load_active(self) -> tuple[RequirementVersionSummary | None, list[PlanSection], list[RequirementCard]]:
        version_id = self.active_version_id()
        if version_id is None:
            return None, [], []
        return self.load_version(version_id)

    def list_versions(self, *, limit: int = 100) -> list[RequirementVersionSummary]:
        active = self.active_version_id()
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM requirement_versions ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [self._version_from_row(row, active) for row in rows]

    def list_imports(self, *, limit: int = 100) -> list[RequirementImportSummary]:
        with self._lock:
            rows = self._connection.execute(
                "SELECT * FROM requirement_imports ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [
            RequirementImportSummary(
                import_id=row["id"],
                created_at=row["created_at"],
                completed_at=row["completed_at"],
                status=row["status"],
                source_sha256=row["source_sha256"],
                expected_sections=row["expected_sections"],
                expected_cards=row["expected_cards"],
                label=row["label"],
                note=row["note"],
                replace=bool(row["replace_mode"]),
                version_id=row["version_id"],
                error_message=row["error_message"],
            )
            for row in rows
        ]

    def compare_versions(self, from_version_id: int, to_version_id: int) -> RequirementVersionDiff:
        from_cards = self._load_card_rows_by_id(from_version_id)
        to_cards = self._load_card_rows_by_id(to_version_id)
        from_ids = set(from_cards)
        to_ids = set(to_cards)
        added_ids = sorted(to_ids - from_ids, key=self._id_sort_key)
        removed_ids = sorted(from_ids - to_ids, key=self._id_sort_key)
        common_ids = from_ids & to_ids
        modified_ids = sorted(
            [item for item in common_ids if from_cards[item]["content_hash"] != to_cards[item]["content_hash"]],
            key=self._id_sort_key,
        )
        unchanged_count = len(common_ids) - len(modified_ids)
        return RequirementVersionDiff(
            from_version_id=from_version_id,
            to_version_id=to_version_id,
            added_count=len(added_ids),
            removed_count=len(removed_ids),
            modified_count=len(modified_ids),
            unchanged_count=unchanged_count,
            added=[self._change_summary(to_cards[item]) for item in added_ids],
            removed=[self._change_summary(from_cards[item]) for item in removed_ids],
            modified=[
                self._change_summary(
                    to_cards[item],
                    changed_fields=self._changed_fields(from_cards[item], to_cards[item]),
                )
                for item in modified_ids
            ],
        )

    def clear_all(self) -> None:
        with self._lock, self._connection:
            for table in (
                "requirement_activation_events",
                "requirement_catalog_state",
                "requirement_cards",
                "requirement_sections",
                "requirement_versions",
                "requirement_imports",
            ):
                self._connection.execute(f"DELETE FROM {table}")
            self._connection.execute(
                "DELETE FROM sqlite_sequence WHERE name IN ('requirement_imports','requirement_versions','requirement_activation_events')"
            )

    def _load_card_rows_by_id(self, version_id: int) -> dict[str, sqlite3.Row]:
        with self._lock:
            exists = self._connection.execute(
                "SELECT 1 FROM requirement_versions WHERE id = ?", (version_id,)
            ).fetchone()
            if not exists:
                raise RequirementVersionNotFoundError(version_id)
            rows = self._connection.execute(
                "SELECT * FROM requirement_cards WHERE version_id = ?", (version_id,)
            ).fetchall()
        return {str(row["requirement_id"]): row for row in rows}

    @staticmethod
    def _id_sort_key(requirement_id: str) -> tuple[int, int]:
        section, card = requirement_id.split(".", 1)
        return int(section), int(card)

    @staticmethod
    def _card_from_row(row: sqlite3.Row) -> RequirementCard:
        return RequirementCard(**{field: row[field] for field in ("requirement_id",) + _CARD_FIELDS})

    @staticmethod
    def _version_from_row(row: sqlite3.Row, active_version_id: int | None) -> RequirementVersionSummary:
        return RequirementVersionSummary(
            version_id=row["id"],
            created_at=row["created_at"],
            source_sha256=row["source_sha256"],
            catalog_sha256=row["catalog_sha256"],
            sections_count=row["sections_count"],
            cards_count=row["cards_count"],
            label=row["label"],
            note=row["note"],
            parent_version_id=row["parent_version_id"],
            import_id=row["import_id"],
            import_mode=row["import_mode"],
            active=row["id"] == active_version_id,
        )

    @staticmethod
    def _change_summary(row: sqlite3.Row, changed_fields: list[str] | None = None) -> RequirementChangeSummary:
        return RequirementChangeSummary(
            requirement_id=row["requirement_id"],
            title=row["title"],
            module_key=row["module_key"],
            changed_fields=changed_fields or [],
        )

    @staticmethod
    def _changed_fields(before: sqlite3.Row, after: sqlite3.Row) -> list[str]:
        return [field for field in _CARD_FIELDS if before[field] != after[field]]
