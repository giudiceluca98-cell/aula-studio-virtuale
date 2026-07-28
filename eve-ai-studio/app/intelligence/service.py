from __future__ import annotations

from dataclasses import dataclass

from .errors import ResearchLimitError
from .models import (
    ResearchCenterStatus,
    ResearchProjectCreateRequest,
    ResearchProjectDetail,
    ResearchProjectListResponse,
    ResearchProjectStatus,
    ResearchProjectTransitionRequest,
    ResearchQuery,
    ResearchQueryCreateRequest,
    ResearchQueryListResponse,
    ResearchSourceCandidate,
    ResearchSourceCandidateCreateRequest,
    ResearchSourceCandidateListResponse,
    ResearchTransitionEvent,
)
from .storage import SqliteResearchStore


@dataclass(frozen=True)
class ResearchLimits:
    max_projects_per_room: int = 50
    max_queries_per_project: int = 100
    max_sources_per_project: int = 500


class ResearchCenterService:
    """Orchestra progetti e catalogo fonti senza effettuare rete."""

    def __init__(
        self,
        store: SqliteResearchStore,
        *,
        limits: ResearchLimits | None = None,
    ) -> None:
        self.store = store
        self.limits = limits or ResearchLimits()

    def status(self) -> ResearchCenterStatus:
        return self.store.raw_status(
            max_projects_per_room=self.limits.max_projects_per_room,
            max_queries_per_project=self.limits.max_queries_per_project,
            max_sources_per_project=self.limits.max_sources_per_project,
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
