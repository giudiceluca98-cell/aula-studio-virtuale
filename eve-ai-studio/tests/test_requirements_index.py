import json
from pathlib import Path


INDEX_PATH = Path(__file__).parents[1] / "data" / "requirements-index.json"
EXPECTED_SHA256 = "da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313"


def test_official_requirements_index_is_complete_and_unique() -> None:
    payload = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    ids = [card["requirement_id"] for card in payload["cards"]]

    assert payload["source_sha256"] == EXPECTED_SHA256
    assert payload["sections_count"] == 36
    assert payload["cards_count"] == 1197
    assert payload["warnings"] == []
    assert len(payload["sections"]) == 36
    assert len(ids) == 1197
    assert len(set(ids)) == 1197
