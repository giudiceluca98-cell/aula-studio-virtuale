import json
from pathlib import Path


MANIFEST_PATH = Path(__file__).parents[1] / "data" / "requirements-import-manifest.json"
EXPECTED_SHA256 = "da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313"


def test_official_requirements_import_manifest_is_complete() -> None:
    payload = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    assert payload["source_sha256"] == EXPECTED_SHA256
    assert payload["sections_count"] == 36
    assert payload["cards_count"] == 1197
    assert payload["unique_requirement_ids"] == 1197
    assert payload["warnings"] == []
    assert payload["first_requirement_id"] == "1.1"
    assert payload["last_requirement_id"] == "36.10"
    assert len(payload["sections"]) == 36
