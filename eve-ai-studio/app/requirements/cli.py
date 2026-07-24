from __future__ import annotations

import argparse
import json
from pathlib import Path

from .parser import parse_plan


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa il piano approfondito di Eve")
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--expected-sections", type=int)
    parser.add_argument("--expected-cards", type=int)
    parser.add_argument("--full", action="store_true", help="Esporta tutti i campi delle schede")
    args = parser.parse_args()

    parsed = parse_plan(args.source.read_text(encoding="utf-8"))
    if args.expected_sections is not None and len(parsed.sections) != args.expected_sections:
        parser.error(f"sezioni trovate: {len(parsed.sections)}; attese: {args.expected_sections}")
    if args.expected_cards is not None and len(parsed.cards) != args.expected_cards:
        parser.error(f"schede trovate: {len(parsed.cards)}; attese: {args.expected_cards}")

    cards = [
        card.model_dump()
        if args.full
        else {
            "requirement_id": card.requirement_id,
            "section_number": card.section_number,
            "section_title": card.section_title,
            "card_number": card.card_number,
            "title": card.title,
            "owner_hint": card.owner_hint,
            "module_key": card.module_key,
        }
        for card in parsed.cards
    ]
    payload = {
        "source_sha256": parsed.source_sha256,
        "sections_count": len(parsed.sections),
        "cards_count": len(parsed.cards),
        "warnings": parsed.warnings,
        "sections": [section.model_dump() for section in parsed.sections],
        "cards": cards,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"Import completato: {len(parsed.sections)} sezioni, "
        f"{len(parsed.cards)} schede, sha256={parsed.source_sha256}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
