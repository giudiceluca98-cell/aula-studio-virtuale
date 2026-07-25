from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from .models import (
    DidacticModeDefinition,
    PromptCatalogStatus,
    PromptRevisionRequest,
    PromptRollbackRequest,
    PromptRollbackResult,
    PromptStatus,
    PromptTransitionRequest,
    PromptTransitionResult,
    PromptVersionCreateRequest,
    PromptVersionDetail,
    PromptVersionDiff,
    PromptVersionListResponse,
)
from .service import PromptService
from .storage import PromptConflictError, PromptTransitionError, PromptVersionNotFoundError


def create_prompt_router(service: PromptService) -> APIRouter:
    router = APIRouter(prefix="/v1/prompts", tags=["prompts"])

    @router.get("/status", response_model=PromptCatalogStatus)
    async def prompt_status() -> PromptCatalogStatus:
        return service.status()

    @router.get("/modes", response_model=list[DidacticModeDefinition])
    async def didactic_modes() -> list[DidacticModeDefinition]:
        return service.modes()

    @router.get("/compare", response_model=PromptVersionDiff)
    async def compare_prompt_versions(
        from_version_id: int = Query(ge=1),
        to_version_id: int = Query(ge=1),
    ) -> PromptVersionDiff:
        try:
            return service.compare(from_version_id, to_version_id)
        except PromptVersionNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione prompt non trovata") from exc

    @router.post("/rollback", response_model=PromptRollbackResult)
    async def rollback_prompt(request: PromptRollbackRequest) -> PromptRollbackResult:
        try:
            return service.rollback(request.version_id, note=request.note)
        except PromptVersionNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione prompt non trovata") from exc

    @router.get("", response_model=PromptVersionListResponse)
    async def list_prompt_versions(
        configuration_key: str | None = None,
        prompt_status: PromptStatus | None = Query(default=None, alias="status"),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> PromptVersionListResponse:
        items = service.list(
            configuration_key=configuration_key,
            status=prompt_status,
            limit=limit,
        )
        return PromptVersionListResponse(total=len(items), items=items)

    @router.post("", response_model=PromptVersionDetail, status_code=status.HTTP_201_CREATED)
    async def create_prompt(request: PromptVersionCreateRequest) -> PromptVersionDetail:
        try:
            return service.create(request)
        except PromptConflictError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    @router.get("/{version_id}", response_model=PromptVersionDetail)
    async def get_prompt_version(version_id: int) -> PromptVersionDetail:
        try:
            return service.get(version_id)
        except PromptVersionNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione prompt non trovata") from exc

    @router.post("/{version_id}/revisions", response_model=PromptVersionDetail, status_code=status.HTTP_201_CREATED)
    async def create_prompt_revision(
        version_id: int,
        request: PromptRevisionRequest,
    ) -> PromptVersionDetail:
        try:
            return service.revise(version_id, request)
        except PromptVersionNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione prompt non trovata") from exc

    @router.post("/{version_id}/transition", response_model=PromptTransitionResult)
    async def transition_prompt(
        version_id: int,
        request: PromptTransitionRequest,
    ) -> PromptTransitionResult:
        try:
            return service.transition(
                version_id,
                request.target_status,
                review_tests_passed=request.review_tests_passed,
                note=request.note,
            )
        except PromptVersionNotFoundError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione prompt non trovata") from exc
        except PromptTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return router
