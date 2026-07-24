from __future__ import annotations

from threading import RLock

from .models import (
    PlanImportResult,
    PlanSection,
    RequirementCard,
    RequirementCatalogStatus,
    RequirementImportSummary,
    RequirementRollbackResult,
    RequirementSummary,
    RequirementVersionDiff,
    RequirementVersionSummary,
)
from .parser import PlanParseError, parse_plan
from .storage import (
    RequirementVersionNotFoundError,
    SqliteRequirementStore,
    catalog_sha256,
    source_sha256,
)


class RequirementNotFoundError(KeyError):
    pass


class RequirementRegistry:
    """Catalogo versionato con cache attiva e persistenza SQLite."""

    def __init__(self, store: SqliteRequirementStore) -> None:
        self._lock = RLock()
        self._store = store
        self._source_sha256: str | None = None
        self._catalog_sha256: str | None = None
        self._active_version_id: int | None = None
        self._sections: list[PlanSection] = []
        self._cards: dict[str, RequirementCard] = {}
        self._reload_active()

    @property
    def store(self) -> SqliteRequirementStore:
        return self._store

    def _reload_active(self) -> None:
        version, sections, cards = self._store.load_active()
        with self._lock:
            self._sections = sections
            self._cards = {card.requirement_id: card for card in cards}
            self._active_version_id = version.version_id if version else None
            self._source_sha256 = version.source_sha256 if version else None
            self._catalog_sha256 = version.catalog_sha256 if version else None

    def import_text(
        self,
        text: str,
        *,
        expected_sections: int | None = None,
        expected_cards: int | None = None,
        replace: bool = True,
        label: str | None = None,
        note: str | None = None,
    ) -> PlanImportResult:
        source_hash = source_sha256(text)
        import_id = self._store.begin_import(
            source_hash=source_hash,
            expected_sections=expected_sections,
            expected_cards=expected_cards,
            label=label,
            note=note,
            replace=replace,
        )
        try:
            parsed = parse_plan(text)
            if expected_sections is not None and len(parsed.sections) != expected_sections:
                raise PlanParseError(
                    f"Numero sezioni inatteso: {len(parsed.sections)}; atteso: {expected_sections}"
                )
            if expected_cards is not None and len(parsed.cards) != expected_cards:
                raise PlanParseError(
                    f"Numero schede inatteso: {len(parsed.cards)}; atteso: {expected_cards}"
                )

            with self._lock:
                previous_version_id = self._active_version_id
                if replace:
                    resulting_sections = list(parsed.sections)
                    resulting_cards = list(parsed.cards)
                else:
                    section_map = {section.number: section for section in self._sections}
                    section_map.update({section.number: section for section in parsed.sections})
                    card_map = dict(self._cards)
                    card_map.update({card.requirement_id: card for card in parsed.cards})
                    resulting_sections = sorted(section_map.values(), key=lambda item: item.number)
                    resulting_cards = sorted(
                        card_map.values(), key=lambda item: (item.section_number, item.card_number)
                    )

            resulting_catalog_hash = catalog_sha256(resulting_sections, resulting_cards)
            existing_version_id = self._store.find_version_by_catalog_hash(resulting_catalog_hash)
            if existing_version_id is not None:
                if existing_version_id != previous_version_id:
                    self._store.activate_version(
                        existing_version_id,
                        note="Riattivazione di catalogo identico",
                        event_type="import_reuse",
                    )
                self._store.complete_import(import_id, existing_version_id, unchanged=True)
                self._reload_active()
                return PlanImportResult(
                    source_sha256=parsed.source_sha256,
                    catalog_sha256=resulting_catalog_hash,
                    sections_count=len(resulting_sections),
                    cards_count=len(resulting_cards),
                    warnings=parsed.warnings,
                    import_id=import_id,
                    version_id=existing_version_id,
                    previous_version_id=previous_version_id,
                    created_new_version=False,
                    active=True,
                )

            version_id = self._store.save_version(
                source_hash=parsed.source_sha256,
                catalog_hash=resulting_catalog_hash,
                sections=resulting_sections,
                cards=resulting_cards,
                parent_version_id=previous_version_id,
                import_id=import_id,
                import_mode="replace" if replace else "merge",
                label=label,
                note=note,
            )
            self._store.complete_import(import_id, version_id)
            self._reload_active()
            return PlanImportResult(
                source_sha256=parsed.source_sha256,
                catalog_sha256=resulting_catalog_hash,
                sections_count=len(resulting_sections),
                cards_count=len(resulting_cards),
                warnings=parsed.warnings,
                import_id=import_id,
                version_id=version_id,
                previous_version_id=previous_version_id,
                created_new_version=True,
                active=True,
            )
        except Exception as exc:
            self._store.fail_import(import_id, str(exc))
            raise

    def status(self) -> RequirementCatalogStatus:
        with self._lock:
            return RequirementCatalogStatus(
                loaded=bool(self._cards),
                source_sha256=self._source_sha256,
                catalog_sha256=self._catalog_sha256,
                sections_count=len(self._sections),
                cards_count=len(self._cards),
                active_version_id=self._active_version_id,
                versions_count=self._store.versions_count(),
                persistent=True,
                schema_version=self._store.schema_version,
            )

    def sections(self) -> list[PlanSection]:
        with self._lock:
            return list(self._sections)

    def get(self, requirement_id: str) -> RequirementCard:
        with self._lock:
            try:
                return self._cards[requirement_id]
            except KeyError as exc:
                raise RequirementNotFoundError(requirement_id) from exc

    def list(
        self,
        *,
        section: int | None = None,
        module_key: str | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> tuple[int, list[RequirementSummary]]:
        query_folded = query.casefold().strip() if query else None
        with self._lock:
            cards = sorted(
                self._cards.values(), key=lambda card: (card.section_number, card.card_number)
            )

        filtered = [
            card
            for card in cards
            if (section is None or card.section_number == section)
            and (module_key is None or card.module_key == module_key)
            and (
                query_folded is None
                or query_folded in card.title.casefold()
                or query_folded in card.objective.casefold()
            )
        ]
        page = filtered[offset:offset + limit]
        return len(filtered), [
            RequirementSummary(
                requirement_id=card.requirement_id,
                section_number=card.section_number,
                section_title=card.section_title,
                card_number=card.card_number,
                title=card.title,
                owner_hint=card.owner_hint,
                module_key=card.module_key,
            )
            for card in page
        ]

    def versions(self, *, limit: int = 100) -> list[RequirementVersionSummary]:
        return self._store.list_versions(limit=limit)

    def imports(self, *, limit: int = 100) -> list[RequirementImportSummary]:
        return self._store.list_imports(limit=limit)

    def version(self, version_id: int) -> RequirementVersionSummary:
        summary, _sections, _cards = self._store.load_version(version_id)
        return summary

    def compare(self, from_version_id: int, to_version_id: int) -> RequirementVersionDiff:
        return self._store.compare_versions(from_version_id, to_version_id)

    def rollback(self, version_id: int, *, note: str | None = None) -> RequirementRollbackResult:
        previous_version_id, rolled_back_at = self._store.activate_version(version_id, note=note)
        self._reload_active()
        status = self.status()
        if not status.source_sha256 or not status.catalog_sha256 or not status.active_version_id:
            raise RuntimeError("Il rollback non ha prodotto un catalogo attivo")
        return RequirementRollbackResult(
            previous_version_id=previous_version_id,
            active_version_id=status.active_version_id,
            source_sha256=status.source_sha256,
            catalog_sha256=status.catalog_sha256,
            sections_count=status.sections_count,
            cards_count=status.cards_count,
            rolled_back_at=rolled_back_at,
        )

    def reset_all(self) -> None:
        self._store.clear_all()
        self._reload_active()


__all__ = [
    "RequirementNotFoundError",
    "RequirementRegistry",
    "RequirementVersionNotFoundError",
]
