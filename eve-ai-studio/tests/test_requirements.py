from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from app.main import app, requirements
from app.requirements.parser import PlanParseError, parse_plan
from app.requirements.registry import RequirementRegistry
from app.requirements.storage import SCHEMA_VERSION, SqliteRequirementStore

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

SAMPLE_PLAN_V2 = """==============================================================================
1. VISIONE GENERALE
==============================================================================

SCHEDA 1.1 — capire la lezione in modo adattivo

Obiettivo operativo:
Comprendere il requisito e adattare la spiegazione.

Esperienza dell'utente:
Mostrare il contesto e il livello corrente.

Implementazione proposta:
Area principale: features/eve/agent, features/eve/context. Usare output strutturato.

Dati, permessi e tracciabilità:
Usare soltanto dati autorizzati.

Casi limite e rischi:
Contesto o livello mancante.

Verifica e criterio di completamento:
Test end-to-end e test del livello.

SCHEDA 1.3 — conservare la cronologia

Obiettivo operativo:
Conservare le versioni importate.

Esperienza dell'utente:
Confrontare due versioni e tornare indietro.

Implementazione proposta:
Area principale: database, repository dati e versionamento.

Dati, permessi e tracciabilità:
Salvare metadati e snapshot senza esporre dati privati.

Casi limite e rischi:
Versione inesistente o database corrotto.

Verifica e criterio di completamento:
Test di persistenza e rollback.
"""


def setup_function() -> None:
    requirements.reset_all()


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
        json={
            "text": SAMPLE_PLAN,
            "expected_sections": 1,
            "expected_cards": 2,
            "label": "Piano iniziale",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["cards_count"] == 2
    assert payload["created_new_version"] is True
    assert payload["version_id"] == 1

    listing = client.get("/v1/requirements", params={"module_key": "retrieval"})
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
    assert listing.json()["items"][0]["requirement_id"] == "1.2"

    detail = client.get("/v1/requirements/1.1")
    assert detail.status_code == 200
    assert detail.json()["title"] == "capire la lezione"

    status_response = client.get("/v1/requirements/status")
    assert status_response.json()["persistent"] is True
    assert status_response.json()["schema_version"] == SCHEMA_VERSION


def test_import_validates_expected_counts_and_records_failure() -> None:
    response = client.post(
        "/v1/requirements/import",
        json={"text": SAMPLE_PLAN, "expected_sections": 36, "expected_cards": 1197},
    )
    assert response.status_code == 422
    history = client.get("/v1/requirements/imports").json()
    assert history["total"] == 1
    assert history["items"][0]["status"] == "failed"
    assert "Numero sezioni inatteso" in history["items"][0]["error_message"]


def test_sqlite_migration_creates_versioned_schema(tmp_path) -> None:
    store = SqliteRequirementStore(tmp_path / "catalog.sqlite3")
    try:
        assert store.schema_version == SCHEMA_VERSION
        assert {
            "requirement_imports",
            "requirement_versions",
            "requirement_sections",
            "requirement_cards",
            "requirement_catalog_state",
            "requirement_activation_events",
        }.issubset(store.table_names())
    finally:
        store.close()


def test_catalog_persists_across_registry_instances(tmp_path) -> None:
    path = tmp_path / "catalog.sqlite3"
    first_store = SqliteRequirementStore(path)
    first = RequirementRegistry(first_store)
    result = first.import_text(SAMPLE_PLAN, label="persistenza")
    assert result.version_id == 1
    first_store.close()

    second_store = SqliteRequirementStore(path)
    try:
        second = RequirementRegistry(second_store)
        assert second.status().active_version_id == 1
        assert second.status().cards_count == 2
        assert second.get("1.2").title == "mostrare le fonti"
    finally:
        second_store.close()


def test_version_diff_reports_added_removed_and_modified() -> None:
    first = client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN}).json()
    second = client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN_V2}).json()

    response = client.get(
        "/v1/requirements/compare",
        params={"from_version_id": first["version_id"], "to_version_id": second["version_id"]},
    )
    assert response.status_code == 200
    diff = response.json()
    assert diff["added_count"] == 1
    assert diff["removed_count"] == 1
    assert diff["modified_count"] == 1
    assert diff["unchanged_count"] == 0
    assert diff["added"][0]["requirement_id"] == "1.3"
    assert diff["removed"][0]["requirement_id"] == "1.2"
    assert "title" in diff["modified"][0]["changed_fields"]


def test_rollback_restores_previous_catalog() -> None:
    first = client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN}).json()
    client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN_V2})

    response = client.post(
        "/v1/requirements/rollback",
        json={"version_id": first["version_id"], "note": "Verifica rollback"},
    )
    assert response.status_code == 200
    assert response.json()["active_version_id"] == first["version_id"]
    assert client.get("/v1/requirements/1.2").status_code == 200
    assert client.get("/v1/requirements/1.3").status_code == 404


def test_reimport_of_identical_catalog_reuses_version() -> None:
    first = client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN}).json()
    second = client.post("/v1/requirements/import", json={"text": SAMPLE_PLAN}).json()
    assert first["version_id"] == second["version_id"]
    assert second["created_new_version"] is False

    versions = client.get("/v1/requirements/versions").json()
    imports = client.get("/v1/requirements/imports").json()
    assert versions["total"] == 1
    assert imports["total"] == 2
    assert imports["items"][0]["status"] == "unchanged"


def test_missing_version_returns_404() -> None:
    assert client.get("/v1/requirements/versions/999").status_code == 404
    assert client.get(
        "/v1/requirements/compare", params={"from_version_id": 1, "to_version_id": 999}
    ).status_code == 404
    assert client.post("/v1/requirements/rollback", json={"version_id": 999}).status_code == 404
