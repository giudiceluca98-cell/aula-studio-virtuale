from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from .automatic import AutomaticEvaluationService, AutomaticRunnerUnavailableError
from .models import (
    EvaluationArtifactListResponse,
    EvaluationAutomaticRunRequest,
    EvaluationAutomaticRunResult,
    EvaluationRunnerStatus,
)
from .storage import EvaluationRunNotFoundError, EvaluationRunStateError


def create_automatic_evaluation_router(
    service: AutomaticEvaluationService,
) -> APIRouter:
    router = APIRouter(prefix="/v1/evaluations", tags=["evaluations-runner"])

    @router.get("/runner/status", response_model=EvaluationRunnerStatus)
    async def runner_status() -> EvaluationRunnerStatus:
        try:
            return service.status()
        except AutomaticRunnerUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc

    @router.post(
        "/runs/execute",
        response_model=EvaluationAutomaticRunResult,
        status_code=status.HTTP_201_CREATED,
    )
    async def execute_automatic_run(
        request: EvaluationAutomaticRunRequest,
    ) -> EvaluationAutomaticRunResult:
        try:
            return await service.execute(request)
        except KeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Versione prompt non trovata",
            ) from exc
        except AutomaticRunnerUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(exc),
            ) from exc
        except EvaluationRunStateError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(exc),
            ) from exc

    @router.get(
        "/runs/{run_id}/artifacts",
        response_model=EvaluationArtifactListResponse,
    )
    async def list_run_artifacts(run_id: int) -> EvaluationArtifactListResponse:
        try:
            items = service.artifacts(run_id)
        except EvaluationRunNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Esecuzione non trovata",
            ) from exc
        return EvaluationArtifactListResponse(total=len(items), items=items)

    return router
