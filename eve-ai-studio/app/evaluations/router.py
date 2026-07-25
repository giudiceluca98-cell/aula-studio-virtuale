from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from .models import (
    EvaluationCatalogStatus,
    EvaluationGateStatus,
    EvaluationRunCompleteRequest,
    EvaluationRunCreateRequest,
    EvaluationRunDetail,
    EvaluationRunListResponse,
    EvaluationScenarioCreateRequest,
    EvaluationScenarioDetail,
    EvaluationScenarioListResponse,
    EvaluationScenarioRevisionRequest,
)
from .service import EvaluationService
from .storage import (
    EvaluationConflictError,
    EvaluationRunNotFoundError,
    EvaluationRunStateError,
    EvaluationScenarioNotFoundError,
)


def create_evaluation_router(service: EvaluationService) -> APIRouter:
    router = APIRouter(prefix="/v1/evaluations", tags=["evaluations"])

    @router.get("/status", response_model=EvaluationCatalogStatus)
    async def evaluation_status() -> EvaluationCatalogStatus:
        return service.status()

    @router.get("/gate/{prompt_version_id}", response_model=EvaluationGateStatus)
    async def evaluation_gate(prompt_version_id: int) -> EvaluationGateStatus:
        try:
            return service.gate(prompt_version_id)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Versione prompt non trovata",
            ) from exc

    @router.get("/scenarios", response_model=EvaluationScenarioListResponse)
    async def list_scenarios(
        active_only: bool = False,
        category: str | None = None,
        limit: int = Query(default=200, ge=1, le=500),
    ) -> EvaluationScenarioListResponse:
        items = service.list_scenarios(
            active_only=active_only,
            category=category,
            limit=limit,
        )
        return EvaluationScenarioListResponse(total=len(items), items=items)

    @router.post(
        "/scenarios",
        response_model=EvaluationScenarioDetail,
        status_code=status.HTTP_201_CREATED,
    )
    async def create_scenario(
        request: EvaluationScenarioCreateRequest,
    ) -> EvaluationScenarioDetail:
        try:
            return service.create_scenario(request)
        except EvaluationConflictError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    @router.get("/scenarios/{scenario_version_id}", response_model=EvaluationScenarioDetail)
    async def get_scenario(scenario_version_id: int) -> EvaluationScenarioDetail:
        try:
            return service.get_scenario(scenario_version_id)
        except EvaluationScenarioNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scenario non trovato",
            ) from exc

    @router.post(
        "/scenarios/{scenario_version_id}/revisions",
        response_model=EvaluationScenarioDetail,
        status_code=status.HTTP_201_CREATED,
    )
    async def revise_scenario(
        scenario_version_id: int,
        request: EvaluationScenarioRevisionRequest,
    ) -> EvaluationScenarioDetail:
        try:
            return service.revise_scenario(scenario_version_id, request)
        except EvaluationScenarioNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scenario non trovato",
            ) from exc

    @router.get("/runs", response_model=EvaluationRunListResponse)
    async def list_runs(
        prompt_version_id: int | None = Query(default=None, ge=1),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> EvaluationRunListResponse:
        items = service.list_runs(prompt_version_id=prompt_version_id, limit=limit)
        return EvaluationRunListResponse(total=len(items), items=items)

    @router.post(
        "/runs",
        response_model=EvaluationRunDetail,
        status_code=status.HTTP_201_CREATED,
    )
    async def start_run(request: EvaluationRunCreateRequest) -> EvaluationRunDetail:
        try:
            return service.start_run(request)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Versione prompt non trovata",
            ) from exc
        except EvaluationConflictError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    @router.get("/runs/{run_id}", response_model=EvaluationRunDetail)
    async def get_run(run_id: int) -> EvaluationRunDetail:
        try:
            return service.get_run(run_id)
        except EvaluationRunNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Esecuzione non trovata",
            ) from exc

    @router.post("/runs/{run_id}/complete", response_model=EvaluationRunDetail)
    async def complete_run(
        run_id: int,
        request: EvaluationRunCompleteRequest,
    ) -> EvaluationRunDetail:
        try:
            return service.complete_run(run_id, request)
        except EvaluationRunNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Esecuzione non trovata",
            ) from exc
        except (EvaluationRunStateError, EvaluationScenarioNotFoundError) as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return router
