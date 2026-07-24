from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from .models import PlanSection, RequirementCard
from .routing import route_requirement

_SECTION_RE = re.compile(
    r"^={20,}\n(?P<number>\d+)\.\s+(?P<title>[^\n]+)\n={20,}$",
    re.MULTILINE,
)
_CARD_RE = re.compile(
    r"^SCHEDA\s+(?P<section>\d+)\.(?P<card>\d+)\s+—\s+(?P<title>.+)$",
    re.MULTILINE,
)
_FIELD_LABELS = (
    ("objective", "Obiettivo operativo:"),
    ("user_experience", "Esperienza dell'utente:"),
    ("implementation", "Implementazione proposta:"),
    ("data_permissions", "Dati, permessi e tracciabilità:"),
    ("risks", "Casi limite e rischi:"),
    ("verification", "Verifica e criterio di completamento:"),
)


class PlanParseError(ValueError):
    pass


@dataclass(frozen=True)
class ParsedPlan:
    source_sha256: str
    sections: list[PlanSection]
    cards: list[RequirementCard]
    warnings: list[str]


def _extract_fields(block: str, requirement_id: str) -> dict[str, str]:
    positions: list[tuple[str, int, int]] = []
    for key, label in _FIELD_LABELS:
        index = block.find(label)
        if index < 0:
            raise PlanParseError(f"{requirement_id}: campo mancante: {label}")
        positions.append((key, index, index + len(label)))

    positions.sort(key=lambda item: item[1])
    values: dict[str, str] = {}
    for idx, (key, _start, content_start) in enumerate(positions):
        content_end = positions[idx + 1][1] if idx + 1 < len(positions) else len(block)
        values[key] = block[content_start:content_end].strip()
        if not values[key]:
            raise PlanParseError(f"{requirement_id}: campo vuoto: {key}")
    return values


def _owner_hint(implementation: str) -> str:
    match = re.search(r"Area principale:\s*(.+?)(?:\.\s|\n|$)", implementation)
    return match.group(1).strip() if match else "non specificata"


def parse_plan(text: str) -> ParsedPlan:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    source_sha256 = hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    section_matches = list(_SECTION_RE.finditer(normalized))
    sections = [
        PlanSection(number=int(match.group("number")), title=match.group("title").strip())
        for match in section_matches
    ]
    section_titles = {section.number: section.title for section in sections}
    if not sections:
        raise PlanParseError("Nessuna sezione numerata trovata")

    card_matches = list(_CARD_RE.finditer(normalized))
    if not card_matches:
        raise PlanParseError("Nessuna scheda trovata")

    cards: list[RequirementCard] = []
    warnings: list[str] = []
    seen_ids: set[str] = set()

    for index, match in enumerate(card_matches):
        section_number = int(match.group("section"))
        card_number = int(match.group("card"))
        requirement_id = f"{section_number}.{card_number}"
        if requirement_id in seen_ids:
            raise PlanParseError(f"Identificatore duplicato: {requirement_id}")
        seen_ids.add(requirement_id)

        block_end = card_matches[index + 1].start() if index + 1 < len(card_matches) else len(normalized)
        block = normalized[match.end():block_end]
        fields = _extract_fields(block, requirement_id)
        title = match.group("title").strip()
        owner_hint = _owner_hint(fields["implementation"])
        module_key = route_requirement(owner_hint, title)

        section_title = section_titles.get(section_number)
        if section_title is None:
            section_title = "SEZIONE NON TROVATA"
            warnings.append(f"{requirement_id}: sezione {section_number} non dichiarata")

        cards.append(
            RequirementCard(
                requirement_id=requirement_id,
                section_number=section_number,
                section_title=section_title,
                card_number=card_number,
                title=title,
                owner_hint=owner_hint,
                module_key=module_key,
                **fields,
            )
        )

    expected_section_numbers = list(range(1, len(sections) + 1))
    actual_section_numbers = [section.number for section in sections]
    if actual_section_numbers != expected_section_numbers:
        warnings.append("La numerazione delle sezioni non è continua o non parte da 1")

    return ParsedPlan(
        source_sha256=source_sha256,
        sections=sections,
        cards=cards,
        warnings=warnings,
    )
