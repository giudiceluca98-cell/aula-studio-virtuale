from fastapi.testclient import TestClient
import pytest

from app.main import app, requirements
from app.requirements.parser import PlanParseError, parse_plan

client = TestClient(app)

SAMPLE_PLAN = """==============================================================================
1. VISIONE GENERALE
==============================================================================

SCHEDA 1.1 — capire la lezione

Obiettivo operativo:
Comprendere il requisito.

Esperienza dell'utente:
Mostrare il contesto.

Implementazione proposta:
Area principale: features/eve/agent, features/eve/context. Usare output strutturato.

Dati, permessi e tracciabilità:
Usare soltanto dati autorizzati.

Casi limite e rischi:
Contesto mancante.

Verifica e criterio di completamento:
Test end-to-end.

SCHEDA 1.2 — mostrare le fonti

Obiettivo operativo:
Citare le fonti.

Esperienza dell'utente:
Aprire la fonte.

Implementazione proposta:
Area principale: retrieval, indicizzazione e citazioni. Applicare il ranking.

Dati, permessi e tracciabilità:
Separare le aule.

Casi limite e rischi:
Citazione fuori contesto.

Verifica e criterio di completamento:
Test delle citazioni.
"""


def setup_function() -> None:
    requirements._cards.clear()
    requirements._sections.clear()
    requirements._source_sha256 = None


def test_parser_extracts_cards_and_routes_modules() -> None:
    parsed = parse_plan(SAMPLE_PLAN)
    assert len(parsed.sections) == 1
    assert len(parsed.cards) == 2
    assert parsed.cards[0].requirement_id == "1.1"
    assert parsed.cards[0].module_key in {"agent", "context"}
    assert parsed.cards[1].module_key == "retrieval"


def test_parser_rejects_missing_fields() -> None:
    with pytest.raises(PlanParseError):
        parse_plan(SAMPLE_PLAN.replace("Verifica e criterio di completamento:", "Verifica rimossa:"))


def test_api_imports_and_lists_requirements() -> None:
    response = client.post(
        "/v1/requirements/import",
        json={"text": SAMPLE_PLAN, "expected_sections": 1, "expected_cards": 2},
    )
    assert response.status_code == 200
    assert response.json()["cards_count"] == 2

    listing = client.get("/v1/requirements", params={"module_key": "retrieval"})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["requirement_id"] == "1.2"

    detail = client.get("/v1/requirements/1.1")
    assert detail.status_code == 200
    assert detail.json()["title"] == "capire la lezione"


def test_import_validates_expected_counts() -> None:
    response = client.post(
        "/v1/requirements/import",
        json={"text": SAMPLE_PLAN, "expected_sections": 36, "expected_cards": 1197},
    )
    assert response.status_code == 422
