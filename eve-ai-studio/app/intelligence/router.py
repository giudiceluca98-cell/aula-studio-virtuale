from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from starlette.concurrency import run_in_threadpool

from app.materials.errors import MaterialError

from .errors import (
    ResearchConflictError,
    ResearchDocumentNotFoundError,
    ResearchLimitError,
    ResearchProjectNotFoundError,
    ResearchSourceNotFoundError,
    ResearchTransitionError,
)
from .models import (
    ResearchAcquisitionEvent,
    ResearchAcquisitionEventListResponse,
    ResearchAcquisitionRequest,
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
from .service import ResearchCenterService
from .web_acquisition import (
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


def _http_error(error: Exception) -> HTTPException:
    if isinstance(error, ResearchProjectNotFoundError):
        return HTTPException(status_code=404, detail="Progetto di ricerca non trovato")
    if isinstance(error, ResearchSourceNotFoundError):
        return HTTPException(status_code=404, detail="Fonte candidata non trovata")
    if isinstance(error, ResearchDocumentNotFoundError):
        return HTTPException(status_code=404, detail="Documento acquisito non trovato")
    if isinstance(error, WebAccessDisabledError):
        return HTTPException(status_code=503, detail=str(error))
    if isinstance(
        error,
        (
            InvalidWebUrlError,
            UnsafeWebTargetError,
            WebRedirectError,
            WebResponseTooLargeError,
            WebMediaTypeError,
            WebEncodingError,
            RobotsDeniedError,
            RobotsUnavailableError,
            MaterialError,
        ),
    ):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": getattr(error, "code", "web_content_rejected"),
                "message": str(error),
            },
        )
    if isinstance(error, WebAcquisitionError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": error.code, "message": str(error)},
        )
    if isinstance(error, (ResearchLimitError, ResearchConflictError, ResearchTransitionError)):
        return HTTPException(status_code=409, detail=str(error))
    return HTTPException(status_code=500, detail="Errore del centro ricerca")


def create_research_router(service: ResearchCenterService) -> APIRouter:
    router = APIRouter(
        prefix="/v1/intelligence/research",
        tags=["intelligence-research"],
    )

    @router.get("/status", response_model=ResearchCenterStatus)
    async def research_status() -> ResearchCenterStatus:
        return service.status()

    @router.post("/projects", response_model=ResearchProjectDetail, status_code=201)
    async def create_project(request: ResearchProjectCreateRequest) -> ResearchProjectDetail:
        try:
            return service.create_project(request)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/projects", response_model=ResearchProjectListResponse)
    async def list_projects(
        room_id: str = Query(min_length=1, max_length=120),
        project_status: ResearchProjectStatus | None = Query(default=None, alias="status"),
        q: str | None = Query(default=None, max_length=240),
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> ResearchProjectListResponse:
        return service.list_projects(
            room_id=room_id,
            status=project_status,
            query=q,
            offset=offset,
            limit=limit,
        )

    @router.get("/projects/{project_id}", response_model=ResearchProjectDetail)
    async def get_project(
        project_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchProjectDetail:
        try:
            return service.get_project(project_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.post("/projects/{project_id}/transition", response_model=ResearchProjectDetail)
    async def transition_project(
        project_id: str,
        request: ResearchProjectTransitionRequest,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchProjectDetail:
        try:
            return service.transition_project(project_id, room_id, request)
        except Exception as error:
            raise _http_error(error) from error

    @router.post("/projects/{project_id}/queries", response_model=ResearchQuery, status_code=201)
    async def add_query(
        project_id: str,
        request: ResearchQueryCreateRequest,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchQuery:
        try:
            return service.add_query(project_id, room_id, request)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/projects/{project_id}/queries", response_model=ResearchQueryListResponse)
    async def list_queries(
        project_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchQueryListResponse:
        try:
            return service.list_queries(project_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.post("/projects/{project_id}/sources", response_model=ResearchSourceCandidate, status_code=201)
    async def add_source_candidate(
        project_id: str,
        request: ResearchSourceCandidateCreateRequest,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchSourceCandidate:
        try:
            return service.add_source_candidate(project_id, room_id, request)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/projects/{project_id}/sources", response_model=ResearchSourceCandidateListResponse)
    async def list_source_candidates(
        project_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchSourceCandidateListResponse:
        try:
            return service.list_source_candidates(project_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.post(
        "/projects/{project_id}/sources/{source_id}/acquire",
        response_model=ResearchAcquisitionEvent,
    )
    async def acquire_source(
        project_id: str,
        source_id: int,
        request: ResearchAcquisitionRequest,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchAcquisitionEvent:
        try:
            return await run_in_threadpool(
                service.acquire_source,
                project_id,
                source_id,
                room_id,
                refresh=request.refresh,
            )
        except Exception as error:
            raise _http_error(error) from error

    @router.get(
        "/projects/{project_id}/sources/{source_id}/acquisitions",
        response_model=ResearchAcquisitionEventListResponse,
    )
    async def list_acquisitions(
        project_id: str,
        source_id: int,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchAcquisitionEventListResponse:
        try:
            return service.list_acquisitions(project_id, source_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.get(
        "/projects/{project_id}/sources/{source_id}/document",
        response_model=ResearchQuarantinedDocument,
    )
    async def get_quarantined_document(
        project_id: str,
        source_id: int,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> ResearchQuarantinedDocument:
        try:
            return service.get_quarantined_document(project_id, source_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/projects/{project_id}/events", response_model=list[ResearchTransitionEvent])
    async def list_transition_events(
        project_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> list[ResearchTransitionEvent]:
        try:
            return service.list_transition_events(project_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    return router
