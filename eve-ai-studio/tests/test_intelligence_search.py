from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.intelligence import (
    ControlledWebAcquirer,
    ResearchCenterService,
    ResearchLimitError,
    ResearchProjectCreateRequest,
    ResearchQueryCreateRequest,
    ResearchQueryStatus,
    ResearchSearchDisabledError,
    ResearchSearchExecuteRequest,
    ResearchSearchFilters,
    ResearchSearchPolicy,
    SearchProviderItem,
    SearchProviderRegistry,
    SqliteAcquisitionStore,
    SqliteResearchStore,
    SqliteReviewStore,
    SqliteSearchStore,
    StaticSearchProvider,
    WebAcquisitionPolicy,
    create_research_router,
    normalize_search_url,
)
from app.materials import MaterialService, SqliteMaterialStore


def provider_items():
    return [
        SearchProviderItem(
            url="https://Example.edu/course?utm_source=newsletter&b=2&a=1#part",
            title="Curricolo verificabile",
            snippet="Percorso introduttivo.",
            publisher="Example University",
            published_at="2026-06-01",
            language="it",
            source_type="curriculum",
            score=0.95,
            ranking_reasons=("dominio accademico",),
        ),
        SearchProviderItem(
            url="https://example.edu/course?a=1&b=2",
            title="Duplicato con URL canonico",
            language="it",
            source_type="curriculum",
            score=0.50,
        ),
        SearchProviderItem(
            url="https://blocked.example.net/page",
            title="Dominio escluso",
            language="it",
            score=0.99,
        ),
        SearchProviderItem(
            url="javascript:alert(1)",
            title="Schema vietato",
            score=1.0,
        ),
    ]


def make_service(tmp_path, *, enabled=True, providers=None, policy=None):
    research_db = tmp_path / "research.sqlite3"
    material_db = tmp_path / "materials.sqlite3"
    research_store = SqliteResearchStore(research_db)
    acquisition_store = SqliteAcquisitionStore(research_db)
    review_store = SqliteReviewStore(research_db)
    search_store = SqliteSearchStore(research_db)
    materials = MaterialService(SqliteMaterialStore(str(material_db)))
    registry = SearchProviderRegistry(providers or [])
    service = ResearchCenterService(
        research_store,
        acquisition_store=acquisition_store,
        acquirer=ControlledWebAcquirer(policy=WebAcquisitionPolicy(enabled=False)),
        review_store=review_store,
        material_service=materials,
        search_store=search_store,
        search_providers=registry,
        search_policy=policy or ResearchSearchPolicy(
            enabled=enabled,
            max_results=10,
            max_retries=1,
            provider_order=tuple(provider.name for provider in providers or []),
        ),
    )
    return research_store, acquisition_store, search_store, service


def project_and_query(service, room="room-a"):
    project = service.create_project(
        ResearchProjectCreateRequest(
            room_id=room,
            title="Ricerca fonti",
            objective="Trovare fonti didattiche verificabili",
            domain="informatica",
        )
    )
    query = service.add_query(
        project.project_id,
        room,
        ResearchQueryCreateRequest(
            text="curricolo programmazione introduttivo",
            purpose="costruzione percorso",
            language="it",
        ),
    )
    return project, query


def execute_request(**updates):
    base = ResearchSearchExecuteRequest(
        actor_id="teacher-1",
        max_results=10,
        register_candidates=True,
        filters=ResearchSearchFilters(
            included_domains=["example.edu"],
            excluded_domains=["blocked.example.net"],
            language="it",
            source_types=["curriculum"],
        ),
    )
    return base.model_copy(update=updates)


def test_search_is_disabled_by_default(tmp_path):
    provider = StaticSearchProvider("demo", provider_items())
    *_, service = make_service(tmp_path, enabled=False, providers=[provider])
    project, query = project_and_query(service)
    with pytest.raises(ResearchSearchDisabledError):
        service.execute_query(project.project_id, query.query_id, project.room_id, execute_request())


def test_status_exposes_04_but_does_not_enable_provider_implicitly(tmp_path):
    *_, service = make_service(tmp_path, enabled=False, providers=[])
    status = service.status()
    assert status.checkpoint == "INTELLIGENCE-0.4"
    assert status.search_available is True
    assert status.search_provider_count == 0
    assert status.web_search_enabled is False
    assert status.model_training_enabled is False


def test_url_normalization_removes_tracking_fragment_and_sorts_query():
    assert normalize_search_url(
        "HTTPS://Example.EDU:443/course?utm_source=x&b=2&a=1#section"
    ) == "https://example.edu/course?a=1&b=2"


def test_query_execution_deduplicates_filters_and_registers_quarantined_candidate(tmp_path):
    provider = StaticSearchProvider("primary", provider_items(), cost_units=0.25)
    store, acquisition_store, search_store, service = make_service(
        tmp_path, providers=[provider]
    )
    project, query = project_and_query(service)
    execution = service.execute_query(
        project.project_id, query.query_id, project.room_id, execute_request()
    )
    assert execution.status.value == "succeeded"
    assert execution.provider_name == "primary"
    assert execution.result_count == 1
    assert execution.results[0].normalized_url == "https://example.edu/course?a=1&b=2"
    assert execution.results[0].source_id is not None
    candidate = store.get_source_candidate(
        project.project_id, execution.results[0].source_id, project.room_id
    )
    assert candidate.status.value == "quarantined"
    assert candidate.content_acquired is False
    assert acquisition_store.count_successful() == 0
    assert search_store.count_results() == 1
    assert store.get_query(project.project_id, query.query_id, project.room_id).status == ResearchQueryStatus.SUCCEEDED


def test_candidate_registration_can_be_disabled_without_losing_results(tmp_path):
    provider = StaticSearchProvider("primary", provider_items())
    store, acquisition_store, _, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service)
    execution = service.execute_query(
        project.project_id,
        query.query_id,
        project.room_id,
        execute_request(register_candidates=False),
    )
    assert execution.result_count == 1
    assert execution.results[0].source_id is None
    assert store.count_sources(project.project_id) == 0
    assert acquisition_store.count_successful() == 0


def test_retry_then_success_is_audited(tmp_path):
    provider = StaticSearchProvider(
        "unstable", provider_items(), failures_before_success=1
    )
    *_, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service)
    execution = service.execute_query(
        project.project_id, query.query_id, project.room_id, execute_request()
    )
    assert execution.attempts == 2
    assert provider.calls == 2


def test_fallback_provider_is_used_after_primary_failure(tmp_path):
    primary = StaticSearchProvider(
        "primary", provider_items(), failures_before_success=99
    )
    fallback = StaticSearchProvider("fallback", provider_items())
    policy = ResearchSearchPolicy(
        enabled=True, max_results=10, max_retries=0,
        provider_order=("primary", "fallback"),
    )
    *_, service = make_service(
        tmp_path, providers=[primary, fallback], policy=policy
    )
    project, query = project_and_query(service)
    execution = service.execute_query(
        project.project_id, query.query_id, project.room_id, execute_request()
    )
    assert execution.provider_name == "fallback"
    assert execution.attempts == 2


def test_explicit_unknown_provider_is_rejected(tmp_path):
    provider = StaticSearchProvider("primary", provider_items())
    *_, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service)
    with pytest.raises(Exception):
        service.execute_query(
            project.project_id,
            query.query_id,
            project.room_id,
            execute_request(provider="missing"),
        )


def test_daily_actor_limit_blocks_second_execution(tmp_path):
    provider = StaticSearchProvider("primary", provider_items())
    policy = ResearchSearchPolicy(
        enabled=True, max_results=10, max_retries=0,
        max_executions_per_actor_day=1,
        provider_order=("primary",),
    )
    *_, service = make_service(tmp_path, providers=[provider], policy=policy)
    project, query = project_and_query(service)
    service.execute_query(project.project_id, query.query_id, project.room_id, execute_request())
    with pytest.raises(ResearchLimitError):
        service.execute_query(project.project_id, query.query_id, project.room_id, execute_request())


def test_room_isolation_protects_query_and_execution(tmp_path):
    provider = StaticSearchProvider("primary", provider_items())
    *_, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service, room="room-a")
    execution = service.execute_query(
        project.project_id, query.query_id, "room-a", execute_request()
    )
    with pytest.raises(Exception):
        service.get_search_execution(execution.execution_id, "room-b")
    with pytest.raises(Exception):
        service.list_search_executions(project.project_id, query.query_id, "room-b")


def test_ranking_reasons_and_cost_are_persisted(tmp_path):
    provider = StaticSearchProvider("primary", provider_items(), cost_units=1.75)
    *_, search_store, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service)
    execution = service.execute_query(
        project.project_id, query.query_id, project.room_id, execute_request()
    )
    loaded = search_store.get(execution.execution_id, room_id=project.room_id)
    assert loaded.cost_units == 1.75
    assert "provider_score=0.950" in loaded.results[0].ranking_reasons
    assert "dominio accademico" in loaded.results[0].ranking_reasons


def test_api_executes_lists_and_reads_search_without_acquisition(tmp_path):
    provider = StaticSearchProvider("primary", provider_items())
    _, acquisition_store, _, service = make_service(tmp_path, providers=[provider])
    project, query = project_and_query(service)
    app = FastAPI()
    app.include_router(create_research_router(service))
    client = TestClient(app)
    response = client.post(
        f"/v1/intelligence/research/projects/{project.project_id}/queries/{query.query_id}/execute",
        params={"room_id": project.room_id},
        json=execute_request().model_dump(),
    )
    assert response.status_code == 201
    body = response.json()
    execution_id = body["execution_id"]
    assert body["result_count"] == 1
    history = client.get(
        f"/v1/intelligence/research/projects/{project.project_id}/queries/{query.query_id}/executions",
        params={"room_id": project.room_id},
    )
    assert history.status_code == 200
    assert history.json()["total"] == 1
    detail = client.get(
        f"/v1/intelligence/research/executions/{execution_id}",
        params={"room_id": project.room_id},
    )
    assert detail.status_code == 200
    assert detail.json()["results"][0]["source_id"] is not None
    assert acquisition_store.count_successful() == 0
