from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from .freshness_errors import (
    CorpusReportingDisabledError,
    SourceConflictNotFoundError,
    SourceConflictStateError,
    SourceConflictTrackingDisabledError,
    SourceHealthDisabledError,
    SourceHealthNotFoundError,
    SourceHealthStateError,
    SourceRecheckDisabledError,
)
from .freshness_models import (
    CorpusHealthReport,
    SourceConflict,
    SourceConflictCreateRequest,
    SourceConflictListResponse,
    SourceConflictResolveRequest,
    SourceConflictStatus,
    SourceFreshnessPolicyRequest,
    SourceFreshnessPolicyView,
    SourceHealthBatchRequest,
    SourceHealthBatchResult,
    SourceHealthCheckRequest,
    SourceHealthListResponse,
    SourceHealthServiceStatus,
    SourceHealthSnapshot,
    SourceHealthState,
    SourceReplacementRequest,
)
from .source_health import SourceHealthService


def _http(error: Exception) -> HTTPException:
    if isinstance(error, (SourceHealthDisabledError, SourceRecheckDisabledError,
                          SourceConflictTrackingDisabledError, CorpusReportingDisabledError)):
        return HTTPException(status_code=503, detail={"code": error.code, "message": str(error)})
    if isinstance(error, (SourceHealthNotFoundError, SourceConflictNotFoundError)):
        return HTTPException(status_code=404, detail={"code": getattr(error, "code", "not_found"), "message": str(error)})
    if isinstance(error, (SourceHealthStateError, SourceConflictStateError)):
        return HTTPException(status_code=409, detail={"code": error.code, "message": str(error)})
    return HTTPException(status_code=422, detail={"code": getattr(error, "code", error.__class__.__name__), "message": str(error)})


def create_source_health_router(service: SourceHealthService) -> APIRouter:
    router = APIRouter(prefix="/v1/intelligence/source-health", tags=["intelligence-source-health"])

    @router.get("/status", response_model=SourceHealthServiceStatus)
    async def source_health_status() -> SourceHealthServiceStatus:
        return service.status()

    @router.put("/sources/{source_id}/policy", response_model=SourceFreshnessPolicyView)
    async def set_policy(source_id: int, request: SourceFreshnessPolicyRequest) -> SourceFreshnessPolicyView:
        try:
            return await run_in_threadpool(service.configure_source, source_id, request)
        except Exception as error:
            raise _http(error) from error

    @router.get("/sources/{source_id}/policy", response_model=SourceFreshnessPolicyView)
    async def get_policy(
        source_id: int, room_id: str = Query(min_length=1, max_length=120)
    ) -> SourceFreshnessPolicyView:
        try:
            return service.get_policy(source_id, room_id)
        except Exception as error:
            raise _http(error) from error

    @router.post("/sources/{source_id}/check", response_model=SourceHealthSnapshot)
    async def check_source(source_id: int, request: SourceHealthCheckRequest) -> SourceHealthSnapshot:
        try:
            return await run_in_threadpool(service.check_source, source_id, request)
        except Exception as error:
            raise _http(error) from error

    @router.post("/recheck/due", response_model=SourceHealthBatchResult)
    async def recheck_due(request: SourceHealthBatchRequest) -> SourceHealthBatchResult:
        try:
            return await run_in_threadpool(service.run_due, request)
        except Exception as error:
            raise _http(error) from error

    @router.get("/sources/{source_id}", response_model=SourceHealthState)
    async def get_state(
        source_id: int, room_id: str = Query(min_length=1, max_length=120)
    ) -> SourceHealthState:
        try:
            return service.get_state(source_id, room_id)
        except Exception as error:
            raise _http(error) from error

    @router.get("/sources", response_model=SourceHealthListResponse)
    async def list_states(
        room_id: str = Query(min_length=1, max_length=120)
    ) -> SourceHealthListResponse:
        try:
            return service.list_states(room_id)
        except Exception as error:
            raise _http(error) from error

    @router.post("/sources/{source_id}/replacement", response_model=SourceHealthSnapshot)
    async def register_replacement(
        source_id: int, request: SourceReplacementRequest
    ) -> SourceHealthSnapshot:
        try:
            return await run_in_threadpool(service.register_replacement, source_id, request)
        except Exception as error:
            raise _http(error) from error

    @router.post("/conflicts", response_model=SourceConflict, status_code=status.HTTP_201_CREATED)
    async def create_conflict(request: SourceConflictCreateRequest) -> SourceConflict:
        try:
            return await run_in_threadpool(service.create_conflict, request)
        except Exception as error:
            raise _http(error) from error

    @router.get("/conflicts", response_model=SourceConflictListResponse)
    async def list_conflicts(
        room_id: str = Query(min_length=1, max_length=120),
        conflict_status: SourceConflictStatus | None = Query(default=None, alias="status"),
    ) -> SourceConflictListResponse:
        try:
            return service.list_conflicts(room_id, conflict_status)
        except Exception as error:
            raise _http(error) from error

    @router.post("/conflicts/{conflict_id}/resolve", response_model=SourceConflict)
    async def resolve_conflict(
        conflict_id: int, request: SourceConflictResolveRequest
    ) -> SourceConflict:
        try:
            return await run_in_threadpool(service.resolve_conflict, conflict_id, request)
        except Exception as error:
            raise _http(error) from error

    @router.post("/reports/corpus", response_model=CorpusHealthReport)
    async def corpus_report(
        room_id: str = Query(min_length=1, max_length=120),
        actor_id: str = Query(min_length=1, max_length=160),
    ) -> CorpusHealthReport:
        try:
            return await run_in_threadpool(service.generate_report, room_id, actor_id)
        except Exception as error:
            raise _http(error) from error

    return router
