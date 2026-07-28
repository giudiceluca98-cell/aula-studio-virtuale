from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from app.intelligence import (
    ResearchCenterService,
    ResearchConflictError,
    ResearchLimitError,
    ResearchLimits,
    ResearchProjectCreateRequest,
    ResearchProjectNotFoundError,
    ResearchProjectStatus,
    ResearchProjectTransitionRequest,
    ResearchQueryCreateRequest,
    ResearchSourceCandidateCreateRequest,
    ResearchTransitionError,
    SqliteResearchStore,
    create_research_router,
)


def make_service(tmp_path, **limits):
    store = SqliteResearchStore(tmp_path / "research.sqlite3")
    service = ResearchCenterService(
        store,
        limits=ResearchLimits(**limits) if limits else ResearchLimits(),
    )
    return store, service


def project_request(room_id: str = "room-python") -> ResearchProjectCreateRequest:
    return ResearchProjectCreateRequest(
        room_id=room_id,
        title="Programmazione da zero",
        objective="Costruire un percorso completo e verificabile.",
        domain="informatica",
        language="it",
        target_levels=["principiante", "scuola superiore"],
        topics=["variabili", "funzioni", "funzioni"],
        max_sources=25,
    )


def test_status_declares_no_network_or_training(tmp_path):
    store, service = make_service(tmp_path)
    status = service.status()
    assert status.checkpoint == "INTELLIGENCE-0.1"
    assert status.stage == "research_projects_and_source_catalog_no_network"
    assert status.web_search_enabled is False
    assert status.content_acquisition_enabled is False
    assert status.model_training_enabled is False
    assert status.human_review_required_by_default is True
    store.close()


def test_create_project_is_persistent_and_normalized(tmp_path):
    store, service = make_service(tmp_path)
    created = service.create_project(project_request())
    assert created.project_id.startswith("research-")
    assert created.status == ResearchProjectStatus.DRAFT
    assert created.web_access_enabled is False
    assert created.human_review_required is True
    assert created.topics == ["variabili", "funzioni"]
    store.close()

    reopened = SqliteResearchStore(tmp_path / "research.sqlite3")
    loaded = reopened.get_project(created.project_id, "room-python")
    assert loaded.title == "Programmazione da zero"
    reopened.close()


def test_room_isolation_hides_project(tmp_path):
    store, service = make_service(tmp_path)
    created = service.create_project(project_request("room-a"))
    with pytest.raises(ResearchProjectNotFoundError):
        service.get_project(created.project_id, "room-b")
    assert service.list_projects(room_id="room-b").total == 0
    store.close()


def test_list_projects_filters_status_and_text(tmp_path):
    store, service = make_service(tmp_path)
    first = service.create_project(project_request("room-a"))
    second_request = project_request("room-a").model_copy(
        update={"title": "Storia romana", "domain": "storia"}
    )
    service.create_project(second_request)
    service.transition_project(
        first.project_id,
        "room-a",
        ResearchProjectTransitionRequest(status=ResearchProjectStatus.ACTIVE),
    )
    assert service.list_projects(
        room_id="room-a", status=ResearchProjectStatus.ACTIVE
    ).total == 1
    result = service.list_projects(room_id="room-a", query="romana")
    assert result.total == 1
    assert result.items[0].domain == "storia"
    store.close()


def test_transition_cycle_and_events(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    active = service.transition_project(
        project.project_id,
        project.room_id,
        ResearchProjectTransitionRequest(
            status=ResearchProjectStatus.ACTIVE,
            note="Piano pronto",
        ),
    )
    assert active.status == ResearchProjectStatus.ACTIVE
    paused = service.transition_project(
        project.project_id,
        project.room_id,
        ResearchProjectTransitionRequest(status=ResearchProjectStatus.PAUSED),
    )
    assert paused.status == ResearchProjectStatus.PAUSED
    events = service.list_transition_events(project.project_id, project.room_id)
    assert [(event.from_status, event.to_status) for event in events] == [
        (ResearchProjectStatus.DRAFT, ResearchProjectStatus.ACTIVE),
        (ResearchProjectStatus.ACTIVE, ResearchProjectStatus.PAUSED),
    ]
    store.close()


def test_invalid_transition_is_rejected(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    with pytest.raises(ResearchTransitionError):
        service.transition_project(
            project.project_id,
            project.room_id,
            ResearchProjectTransitionRequest(status=ResearchProjectStatus.COMPLETED),
        )
    store.close()


def test_query_catalog_and_duplicate_detection(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    query = ResearchQueryCreateRequest(
        text="manuale completo variabili Python",
        purpose="Fonti introduttive",
    )
    created = service.add_query(project.project_id, project.room_id, query)
    assert created.status.value == "planned"
    with pytest.raises(ResearchConflictError):
        service.add_query(project.project_id, project.room_id, query)
    listed = service.list_queries(project.project_id, project.room_id)
    assert listed.total == 1
    store.close()


def test_query_limit_is_enforced(tmp_path):
    store, service = make_service(tmp_path, max_queries_per_project=1)
    project = service.create_project(project_request())
    service.add_query(
        project.project_id,
        project.room_id,
        ResearchQueryCreateRequest(text="prima query"),
    )
    with pytest.raises(ResearchLimitError):
        service.add_query(
            project.project_id,
            project.room_id,
            ResearchQueryCreateRequest(text="seconda query"),
        )
    store.close()


def test_source_candidate_is_quarantined_without_acquisition(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    source = service.add_source_candidate(
        project.project_id,
        project.room_id,
        ResearchSourceCandidateCreateRequest(
            url="https://example.edu/course",
            title="Corso verificabile",
            publisher="Example University",
            metadata={"kind": "primary"},
        ),
    )
    assert source.status.value == "quarantined"
    assert source.trust_level == "unreviewed"
    assert source.content_acquired is False
    assert service.list_source_candidates(
        project.project_id, project.room_id
    ).total == 1
    store.close()


def test_source_duplicate_and_limit_are_enforced(tmp_path):
    store, service = make_service(tmp_path, max_sources_per_project=1)
    request = project_request().model_copy(update={"max_sources": 1})
    project = service.create_project(request)
    source = ResearchSourceCandidateCreateRequest(url="https://example.org/a")
    service.add_source_candidate(project.project_id, project.room_id, source)
    with pytest.raises(ResearchLimitError):
        service.add_source_candidate(
            project.project_id,
            project.room_id,
            ResearchSourceCandidateCreateRequest(url="https://example.org/b"),
        )
    store.close()


def test_url_validation_blocks_unsafe_or_incomplete_urls():
    with pytest.raises(ValidationError):
        ResearchSourceCandidateCreateRequest(url="file:///etc/passwd")
    with pytest.raises(ValidationError):
        ResearchSourceCandidateCreateRequest(url="https://user:secret@example.org/page")
    with pytest.raises(ValidationError):
        ResearchSourceCandidateCreateRequest(url="example.org/page")


def test_archived_project_rejects_new_queries_and_sources(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    service.transition_project(
        project.project_id,
        project.room_id,
        ResearchProjectTransitionRequest(status=ResearchProjectStatus.ARCHIVED),
    )
    with pytest.raises(ResearchTransitionError):
        service.add_query(
            project.project_id,
            project.room_id,
            ResearchQueryCreateRequest(text="query bloccata"),
        )
    with pytest.raises(ResearchTransitionError):
        service.add_source_candidate(
            project.project_id,
            project.room_id,
            ResearchSourceCandidateCreateRequest(url="https://example.org"),
        )
    store.close()


def test_project_limit_is_isolated_per_room(tmp_path):
    store, service = make_service(tmp_path, max_projects_per_room=1)
    service.create_project(project_request("room-a"))
    with pytest.raises(ResearchLimitError):
        service.create_project(
            project_request("room-a").model_copy(update={"title": "Altro progetto"})
        )
    service.create_project(project_request("room-b"))
    store.close()


def test_router_full_flow_and_http_contracts(tmp_path):
    store, service = make_service(tmp_path)
    app = FastAPI()
    app.include_router(create_research_router(service))
    client = TestClient(app)

    status = client.get("/v1/intelligence/research/status")
    assert status.status_code == 200
    assert status.json()["web_search_enabled"] is False

    created = client.post(
        "/v1/intelligence/research/projects",
        json=project_request().model_dump(mode="json"),
    )
    assert created.status_code == 201
    project = created.json()

    query = client.post(
        f"/v1/intelligence/research/projects/{project['project_id']}/queries",
        params={"room_id": "room-python"},
        json={"text": "fonti universitarie Python", "purpose": "manuali"},
    )
    assert query.status_code == 201

    source = client.post(
        f"/v1/intelligence/research/projects/{project['project_id']}/sources",
        params={"room_id": "room-python"},
        json={"url": "https://example.edu/python", "publisher": "Example University"},
    )
    assert source.status_code == 201
    assert source.json()["status"] == "quarantined"

    activated = client.post(
        f"/v1/intelligence/research/projects/{project['project_id']}/transition",
        params={"room_id": "room-python"},
        json={"status": "active", "note": "Piano approvato"},
    )
    assert activated.status_code == 200
    assert activated.json()["status"] == "active"

    hidden = client.get(
        f"/v1/intelligence/research/projects/{project['project_id']}",
        params={"room_id": "room-other"},
    )
    assert hidden.status_code == 404
    store.close()


def test_status_counts_projects_queries_and_quarantine(tmp_path):
    store, service = make_service(tmp_path)
    project = service.create_project(project_request())
    service.transition_project(
        project.project_id,
        project.room_id,
        ResearchProjectTransitionRequest(status=ResearchProjectStatus.ACTIVE),
    )
    service.add_query(
        project.project_id,
        project.room_id,
        ResearchQueryCreateRequest(text="query di prova"),
    )
    service.add_source_candidate(
        project.project_id,
        project.room_id,
        ResearchSourceCandidateCreateRequest(url="https://example.org/source"),
    )
    status = service.status()
    assert status.total_projects == 1
    assert status.active_projects == 1
    assert status.total_queries == 1
    assert status.quarantined_sources == 1
    store.close()
