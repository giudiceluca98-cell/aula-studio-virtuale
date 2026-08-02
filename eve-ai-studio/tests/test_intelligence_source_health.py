from __future__ import annotations

import hashlib
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.intelligence import (
    ResearchProjectCreateRequest,
    ResearchReviewPolicy,
    ResearchSourceCandidateCreateRequest,
    SourceAvailabilityStatus,
    SourceConflictCreateRequest,
    SourceConflictResolution,
    SourceConflictResolveRequest,
    SourceConflictTrackingDisabledError,
    SourceConflictType,
    SourceFreshnessPolicyRequest,
    SourceFreshnessStatus,
    SourceHealthBatchRequest,
    SourceHealthCheckRequest,
    SourceHealthDisabledError,
    SourceHealthPolicy,
    SourceHealthService,
    SourceHealthSummaryStatus,
    SourceReplacementRequest,
    SqliteAcquisitionStore,
    SqliteResearchStore,
    SqliteReviewStore,
    SqliteSourceHealthStore,
    WebFetchResult,
    create_source_health_router,
)
from app.intelligence.web_acquisition import WebHttpStatusError, WebTimeoutError


class QueueAcquirer:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)

    def fetch(self, url: str):
        if not self.outcomes:
            raise AssertionError("Nessun risultato fake disponibile")
        outcome = self.outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome


def fetched(content: bytes, url: str = "https://example.edu/source") -> WebFetchResult:
    return WebFetchResult(
        requested_url=url, final_url=url, status=200, media_type="text/plain",
        content=content, redirect_chain=(), resolved_ips=("203.0.113.10",),
        robots_allowed=True, response_headers={"content-type": "text/plain"},
    )


def setup(tmp_path: Path, *, outcomes=(), enabled=True, recheck=True, conflicts=True):
    db = tmp_path / "research.sqlite3"
    research = SqliteResearchStore(db)
    acquisitions = SqliteAcquisitionStore(db)
    reviews = SqliteReviewStore(db)
    health_store = SqliteSourceHealthStore(db)
    project = research.create_project(ResearchProjectCreateRequest(
        room_id="room-a", title="Progetto", objective="Verificare fonti",
        domain="Scienze", language="it", topics=["clima"],
    ))
    source = research.add_source_candidate(project.project_id, "room-a", ResearchSourceCandidateCreateRequest(
        url="https://example.edu/source", title="Fonte A", publisher="Università",
        published_at="2026-01-01T00:00:00+00:00",
    ))
    content = b"contenuto stabile e verificabile"
    acquisition_id = acquisitions.begin(project_id=project.project_id, source_id=source.source_id, room_id="room-a", requested_url=source.url)
    acquisitions.complete(
        acquisition_id=acquisition_id, project_id=project.project_id, source_id=source.source_id,
        room_id="room-a", requested_url=source.url, final_url=source.url,
        http_status=200, media_type="text/plain", content=content,
        sha256=hashlib.sha256(content).hexdigest(), extracted_text=content.decode(),
        robots_allowed=True, resolved_ips=["203.0.113.10"], redirect_chain=[],
    )
    service = SourceHealthService(
        health_store, research, acquisitions, reviews, QueueAcquirer(outcomes),
        policy=SourceHealthPolicy(
            health_enabled=enabled, recheck_enabled=recheck,
            conflict_tracking_enabled=conflicts, reporting_enabled=True,
            default_max_age_days=365, default_recheck_interval_hours=24,
            max_due_per_run=10,
        ),
    )
    return service, research, acquisitions, reviews, health_store, project, source, content


def test_flags_disabled_block_mutations(tmp_path: Path):
    service, *_ = setup(tmp_path, enabled=False, conflicts=False)
    with pytest.raises(SourceHealthDisabledError):
        service.check_source(1, SourceHealthCheckRequest(room_id="room-a", actor_id="user-1"))
    with pytest.raises(SourceConflictTrackingDisabledError):
        service.create_conflict(SourceConflictCreateRequest(
            room_id="room-a", actor_id="user-1", left_source_id=1, right_source_id=2,
            topic_key="xy", conflict_type=SourceConflictType.OTHER,
            left_claim="claim a", right_claim="claim b", rationale="Conflitto verificato manualmente",
        ))


def test_unchanged_source_is_current_and_does_not_create_acquisition(tmp_path: Path):
    service, _, acquisitions, _, _, project, source, content = setup(tmp_path, outcomes=[fetched(b"contenuto stabile e verificabile")])
    before = len(acquisitions.list_events(project.project_id, source.source_id, "room-a"))
    snapshot = service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="reviewer", force=True))
    after = len(acquisitions.list_events(project.project_id, source.source_id, "room-a"))
    assert snapshot.availability_status == SourceAvailabilityStatus.AVAILABLE
    assert snapshot.freshness_status == SourceFreshnessStatus.CURRENT
    assert snapshot.previous_acquisition_id == snapshot.observed_acquisition_id
    assert before == after
    assert "historical_citations_preserved" in snapshot.signals


def test_changed_source_creates_quarantined_acquisition_and_preserves_previous_ref(tmp_path: Path):
    changed = b"contenuto modificato con nuova versione"
    service, research, acquisitions, _, _, project, source, _ = setup(tmp_path, outcomes=[fetched(changed)])
    old = acquisitions.latest_successful_event(project.project_id, source.source_id, "room-a")
    snapshot = service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="reviewer", force=True))
    new = acquisitions.latest_successful_event(project.project_id, source.source_id, "room-a")
    assert snapshot.freshness_status == SourceFreshnessStatus.CHANGED
    assert snapshot.previous_acquisition_id == old.acquisition_id
    assert snapshot.observed_acquisition_id == new.acquisition_id
    assert new.acquisition_id != old.acquisition_id
    candidate = research.get_source_candidate(project.project_id, source.source_id, "room-a")
    assert candidate.content_acquired is True
    assert "review_required" in snapshot.signals


def test_removed_and_unavailable_are_recorded_without_deleting_history(tmp_path: Path):
    service, _, acquisitions, _, _, project, source, _ = setup(
        tmp_path, outcomes=[WebHttpStatusError(404), WebTimeoutError("timeout")]
    )
    removed = service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="system", force=True))
    unavailable = service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="system", force=True))
    assert removed.availability_status == SourceAvailabilityStatus.REMOVED
    assert removed.summary_status == SourceHealthSummaryStatus.CRITICAL
    assert unavailable.availability_status == SourceAvailabilityStatus.UNAVAILABLE
    assert unavailable.consecutive_failures == 2
    assert len(acquisitions.list_events(project.project_id, source.source_id, "room-a")) == 1


def test_custom_expiry_policy_marks_old_source_stale(tmp_path: Path):
    service, *_rest, source, content = setup(tmp_path, outcomes=[fetched(b"contenuto stabile e verificabile")])
    service.configure_source(source.source_id, SourceFreshnessPolicyRequest(
        room_id="room-a", actor_id="teacher", max_age_days=1,
        recheck_interval_hours=12, note="La fonte normativa richiede controllo giornaliero",
    ))
    snapshot = service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="teacher", force=True))
    assert snapshot.freshness_status == SourceFreshnessStatus.STALE
    assert service.get_policy(source.source_id, "room-a").custom is True


def test_due_batch_is_room_scoped_and_limited(tmp_path: Path):
    service, research, acquisitions, _, _, project, source, content = setup(tmp_path, outcomes=[fetched(b"contenuto stabile e verificabile")])
    result = service.run_due(SourceHealthBatchRequest(room_id="room-a", actor_id="scheduler", limit=1))
    assert result.requested == 1
    assert result.completed == 1
    assert result.snapshots[0].source_id == source.source_id
    with pytest.raises(Exception):
        service.get_state(source.source_id, "room-b")


def test_conflict_requires_human_resolution_and_preference_is_a_participant(tmp_path: Path):
    service, research, acquisitions, _, _, project, source, _ = setup(tmp_path)
    second = research.add_source_candidate(project.project_id, "room-a", ResearchSourceCandidateCreateRequest(
        url="https://example.org/second", title="Fonte B", publisher="Ente B",
        published_at="2026-02-01T00:00:00+00:00",
    ))
    content = b"seconda fonte"
    aid = acquisitions.begin(project_id=project.project_id, source_id=second.source_id, room_id="room-a", requested_url=second.url)
    acquisitions.complete(acquisition_id=aid, project_id=project.project_id, source_id=second.source_id, room_id="room-a", requested_url=second.url, final_url=second.url, http_status=200, media_type="text/plain", content=content, sha256=hashlib.sha256(content).hexdigest(), extracted_text=content.decode(), robots_allowed=True, resolved_ips=["203.0.113.20"], redirect_chain=[])
    conflict = service.create_conflict(SourceConflictCreateRequest(
        room_id="room-a", actor_id="teacher", left_source_id=source.source_id,
        right_source_id=second.source_id, topic_key="temperatura-media",
        conflict_type=SourceConflictType.NUMERIC_MISMATCH,
        left_claim="1,2 gradi", right_claim="1,5 gradi",
        left_locator="char:10-20", right_locator="char:30-40",
        rationale="Le due fonti riportano valori incompatibili",
    ))
    assert conflict.status.value == "open"
    resolved = service.resolve_conflict(conflict.conflict_id, SourceConflictResolveRequest(
        room_id="room-a", actor_id="teacher", resolution=SourceConflictResolution.PREFER_RIGHT,
        rationale="La seconda fonte è più recente e documenta il metodo di misura",
    ))
    assert resolved.preferred_source_id == second.source_id
    assert resolved.resolution == SourceConflictResolution.PREFER_RIGHT


def test_replacement_keeps_original_source_and_history(tmp_path: Path):
    service, research, acquisitions, _, _, project, source, _ = setup(tmp_path)
    replacement = research.add_source_candidate(project.project_id, "room-a", ResearchSourceCandidateCreateRequest(
        url="https://example.edu/replacement", title="Fonte nuova", publisher="Università",
    ))
    data = b"nuova fonte"
    aid = acquisitions.begin(project_id=project.project_id, source_id=replacement.source_id, room_id="room-a", requested_url=replacement.url)
    acquisitions.complete(acquisition_id=aid, project_id=project.project_id, source_id=replacement.source_id, room_id="room-a", requested_url=replacement.url, final_url=replacement.url, http_status=200, media_type="text/plain", content=data, sha256=hashlib.sha256(data).hexdigest(), extracted_text=data.decode(), robots_allowed=True, resolved_ips=["203.0.113.30"], redirect_chain=[])
    snapshot = service.register_replacement(source.source_id, SourceReplacementRequest(
        room_id="room-a", actor_id="teacher", replacement_source_id=replacement.source_id,
        rationale="L'editore ha pubblicato una nuova edizione ufficiale",
    ))
    state = service.get_state(source.source_id, "room-a")
    assert snapshot.freshness_status == SourceFreshnessStatus.REPLACED
    assert state.replacement_source_id == replacement.source_id
    assert research.get_source_candidate(project.project_id, source.source_id, "room-a")


def test_corpus_report_is_informative_not_approval(tmp_path: Path):
    service, research, _, _, _, project, source, content = setup(tmp_path, outcomes=[fetched(b"contenuto stabile e verificabile")])
    service.check_source(source.source_id, SourceHealthCheckRequest(room_id="room-a", actor_id="teacher", force=True))
    before = research.get_source_candidate(project.project_id, source.source_id, "room-a").status
    report = service.generate_report("room-a", "teacher")
    after = research.get_source_candidate(project.project_id, source.source_id, "room-a").status
    assert report.total_sources == 1
    assert report.checked_sources == 1
    assert report.report_sha256
    assert before == after
    assert any("non approva automaticamente" in note for note in report.notes)


def test_api_status_and_disabled_check(tmp_path: Path):
    service, *_ = setup(tmp_path, enabled=False)
    app = FastAPI()
    app.include_router(create_source_health_router(service))
    client = TestClient(app)
    status = client.get("/v1/intelligence/source-health/status")
    assert status.status_code == 200
    assert status.json()["checkpoint"] == "INTELLIGENCE-0.7"
    blocked = client.post("/v1/intelligence/source-health/sources/1/check", json={
        "room_id":"room-a", "actor_id":"user-1", "force":True
    })
    assert blocked.status_code == 503
    assert blocked.json()["detail"]["code"] == "source_health_disabled"
