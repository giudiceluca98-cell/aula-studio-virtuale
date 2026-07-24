from __future__ import annotations

from threading import RLock

from .models import (
    PlanImportResult,
    PlanSection,
    RequirementCard,
    RequirementCatalogStatus,
    RequirementSummary,
)
from .parser import PlanParseError, parse_plan


class RequirementNotFoundError(KeyError):
    pass


class RequirementRegistry:
    """Registro in memoria; la persistenza verrà aggiunta in un checkpoint successivo."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._source_sha256: str | None = None
        self._sections: list[PlanSection] = []
        self._cards: dict[str, RequirementCard] = {}

    def import_text(
        self,
        text: str,
        *,
        expected_sections: int | None = None,
        expected_cards: int | None = None,
        replace: bool = True,
    ) -> PlanImportResult:
        parsed = parse_plan(text)
        if expected_sections is not None and len(parsed.sections) != expected_sections:
            raise PlanParseError(
                f"Numero sezioni inatteso: {len(parsed.sections)}; atteso: {expected_sections}"
            )
        if expected_cards is not None and len(parsed.cards) != expected_cards:
            raise PlanParseError(f"Numero schede inatteso: {len(parsed.cards)}; atteso: {expected_cards}")

        with self._lock:
            if replace:
                self._cards.clear()
            for card in parsed.cards:
                self._cards[card.requirement_id] = card
            self._sections = parsed.sections
            self._source_sha256 = parsed.source_sha256

        return PlanImportResult(
            source_sha256=parsed.source_sha256,
            sections_count=len(parsed.sections),
            cards_count=len(parsed.cards),
            warnings=parsed.warnings,
        )

    def status(self) -> RequirementCatalogStatus:
        with self._lock:
            return RequirementCatalogStatus(
                loaded=bool(self._cards),
                source_sha256=self._source_sha256,
                sections_count=len(self._sections),
                cards_count=len(self._cards),
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
                self._cards.values(),
                key=lambda card: (card.section_number, card.card_number),
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
