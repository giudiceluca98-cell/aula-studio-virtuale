from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import PurePosixPath
from urllib.parse import urlsplit

from app.materials.errors import MaterialError
from app.materials.extraction import extract_text

from .acquisition_storage import SqliteAcquisitionStore
from .errors import ResearchConflictError, ResearchLimitError
from .models import (
    ResearchAcquisitionEvent,
    ResearchAcquisitionEventListResponse,
    ResearchCenterStatus,
    ResearchProjectCreateRequest,
    ResearchProjectDetail,
    ResearchProjectListResponse,
    ResearchProjectStatus,
    ResearchProjectTransitionRequest,
    ResearchQuarantinedDocument,
    ResearchQuery,
    ResearchQueryCreateRequest,
    ResearchQueryListResponse,
    ResearchSourceCandidate,
    ResearchSourceCandidateCreateRequest,
    ResearchSourceCandidateListResponse,
    ResearchTransitionEvent,
)
from .storage import SqliteResearchStore
from .web_acquisition import (
    ControlledWebAcquirer,
    InvalidWebUrlError,
    RobotsDeniedError,
    RobotsUnavailableError,
    UnsafeWebTargetError,
    WebAccessDisabledError,
    WebAcquisitionError,
    WebEncodingError,
    WebMediaTypeError,
    WebRedirectError,
    WebResponseTooLargeError,
)


@dataclass(frozen=True)
class ResearchLimits:
    max_projects_per_room: int = 50
    max_queries_per_project: int = 100
    max_sources_per_project: int = 500


_BLOCKED_ACQUISITION_ERRORS = (
    WebAccessDisabledError,
    InvalidWebUrlError,
    UnsafeWebTargetError,
    WebRedirectError,
    WebResponseTooLargeError,
    WebMediaTypeError,
    WebEncodingError,
    RobotsDeniedError,
    RobotsUnavailableError,
    MaterialError,
)


class ResearchCenterService:
    """Orchestra progetti, fonti e acquisizioni senza promozione automatica."""

    def __init__(
        self,
        store: SqliteResearchStore,
        *,
        limits: ResearchLimits | None = None,
        acquisition_store: SqliteAcquisitionStore | None = None,
        acquirer: ControlledWebAcquirer | None = None,
    ) -> None:
        self.store = store
        self.limits = limits or ResearchLimits()
        self.acquisition_store = acquisition_store
        self.acquirer = acquirer

    def status(self) -> ResearchCenterStatus:
        base = self.store.raw_status(
            max_projects_per_room=self.limits.max_projects_per_room,
            max_queries_per_project=self.limits.max_queries_per_project,
            max_sources_per_project=self.limits.max_sources_per_project,
        )
        available = self.acquisition_store is not None and self.acquirer is not None
        policy = self.acquirer.policy if self.acquirer is not None else None
        return base.model_copy(
            update={
                "checkpoint": "INTELLIGENCE-0.2" if available else "INTELLIGENCE-0.1",
                "stage": (
                    "controlled_web_acquisition_quarantine_no_approval"
                    if available
                    else "research_projects_and_source_catalog_no_network"
                ),
                "successful_acquisitions": (
                    self.acquisition_store.count_successful()
                    if self.acquisition_store is not None
                    else 0
                ),
                "web_search_enabled": False,
                "content_acquisition_available": available,
                "content_acquisition_enabled": bool(policy and policy.enabled),
                "model_training_enabled": False,
                "max_acquisition_bytes": policy.max_bytes if policy else 0,
                "max_redirects": policy.max_redirects if policy else 0,
                "robots_required": policy.require_robots if policy else True,
            }
        )

    def create_project(
        self,
        request: ResearchProjectCreateRequest,
    ) -> ResearchProjectDetail:
        if self.store.count_projects(request.room_id) >= self.limits.max_projects_per_room:
            raise ResearchLimitError("Limite dei progetti di ricerca per aula raggiunto")
        if request.max_sources > self.limits.max_sources_per_project:
            raise ResearchLimitError(
                "Il limite richiesto supera il massimo configurato per progetto"
            )
        return self.store.create_project(request)

    def list_projects(
        self,
        *,
        room_id: str,
        status: ResearchProjectStatus | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> ResearchProjectListResponse:
        total, items = self.store.list_projects(
            room_id=room_id,
            status=status,
            query=query,
            offset=offset,
            limit=limit,
        )
        return ResearchProjectListResponse(
            total=total,
            offset=offset,
            limit=limit,
            items=items,
        )

    def get_project(self, project_id: str, room_id: str) -> ResearchProjectDetail:
        return self.store.get_project(project_id, room_id)

    def transition_project(
        self,
        project_id: str,
        room_id: str,
        request: ResearchProjectTransitionRequest,
    ) -> ResearchProjectDetail:
        return self.store.transition_project(
            project_id,
            room_id,
            request.status,
            request.note,
        )

    def add_query(
        self,
        project_id: str,
        room_id: str,
        request: ResearchQueryCreateRequest,
    ) -> ResearchQuery:
        if self.store.count_queries(project_id) >= self.limits.max_queries_per_project:
            raise ResearchLimitError("Limite delle query pianificate raggiunto")
        return self.store.add_query(project_id, room_id, request)

    def list_queries(
        self,
        project_id: str,
        room_id: str,
    ) -> ResearchQueryListResponse:
        items = self.store.list_queries(project_id, room_id)
        return ResearchQueryListResponse(total=len(items), items=items)

    def add_source_candidate(
        self,
        project_id: str,
        room_id: str,
        request: ResearchSourceCandidateCreateRequest,
    ) -> ResearchSourceCandidate:
        project = self.store.get_project(project_id, room_id)
        effective_limit = min(
            project.max_sources,
            self.limits.max_sources_per_project,
        )
        if self.store.count_sources(project_id) >= effective_limit:
            raise ResearchLimitError("Limite delle fonti candidate raggiunto")
        return self.store.add_source_candidate(project_id, room_id, request)

    def list_source_candidates(
        self,
        project_id: str,
        room_id: str,
    ) -> ResearchSourceCandidateListResponse:
        items = self.store.list_source_candidates(project_id, room_id)
        return ResearchSourceCandidateListResponse(total=len(items), items=items)

    def list_transition_events(
        self,
        project_id: str,
        room_id: str,
    ) -> list[ResearchTransitionEvent]:
        return self.store.list_transition_events(project_id, room_id)

    def _require_acquisition_components(
        self,
    ) -> tuple[SqliteAcquisitionStore, ControlledWebAcquirer]:
        if self.acquisition_store is None or self.acquirer is None:
            raise ResearchConflictError("Il modulo di acquisizione web non è configurato")
        return self.acquisition_store, self.acquirer

    def acquire_source(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        *,
        refresh: bool = False,
    ) -> ResearchAcquisitionEvent:
        acquisition_store, acquirer = self._require_acquisition_components()
        if acquisition_store.has_document(project_id, source_id, room_id) and not refresh:
            events = acquisition_store.list_events(project_id, source_id, room_id)
            for event in events:
                if event.status.value == "succeeded":
                    return event
        requested_url = acquisition_store.get_source_url(project_id, source_id, room_id)
        acquisition_id = acquisition_store.begin(
            project_id=project_id,
            source_id=source_id,
            room_id=room_id,
            requested_url=requested_url,
        )
        try:
            fetched = acquirer.fetch(requested_url)
            parsed = urlsplit(fetched.final_url)
            filename = PurePosixPath(parsed.path).name or f"source-{source_id}.txt"
            extracted_text, normalized_media_type = extract_text(
                fetched.content,
                fetched.media_type,
                filename,
            )
            digest = hashlib.sha256(fetched.content).hexdigest()
            return acquisition_store.complete(
                acquisition_id=acquisition_id,
                project_id=project_id,
                source_id=source_id,
                room_id=room_id,
                requested_url=fetched.requested_url,
                final_url=fetched.final_url,
                http_status=fetched.status,
                media_type=normalized_media_type,
                content=fetched.content,
                sha256=digest,
                extracted_text=extracted_text,
                robots_allowed=fetched.robots_allowed,
                resolved_ips=list(fetched.resolved_ips),
                redirect_chain=list(fetched.redirect_chain),
            )
        except (WebAcquisitionError, MaterialError) as error:
            error_code = getattr(error, "code", "web_content_extraction_failed")
            acquisition_store.fail(
                acquisition_id=acquisition_id,
                project_id=project_id,
                source_id=source_id,
                room_id=room_id,
                error_code=error_code,
                blocked=isinstance(error, _BLOCKED_ACQUISITION_ERRORS),
            )
            raise

    def list_acquisitions(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> ResearchAcquisitionEventListResponse:
        acquisition_store, _acquirer = self._require_acquisition_components()
        items = acquisition_store.list_events(project_id, source_id, room_id)
        return ResearchAcquisitionEventListResponse(total=len(items), items=items)

    def get_quarantined_document(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
    ) -> ResearchQuarantinedDocument:
        acquisition_store, _acquirer = self._require_acquisition_components()
        return acquisition_store.get_document(project_id, source_id, room_id)
