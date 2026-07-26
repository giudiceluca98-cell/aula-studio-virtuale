from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from .errors import InvalidRetrievalQueryError
from .models import RetrievalSearchRequest, RetrievalSearchResponse, RetrievalStatus
from .service import RetrievalService


def create_retrieval_router(service: RetrievalService) -> APIRouter:
    router = APIRouter(prefix="/v1/retrieval", tags=["retrieval"])

    @router.get("/status", response_model=RetrievalStatus)
    async def retrieval_status() -> RetrievalStatus:
        return service.status()

    @router.post("/search", response_model=RetrievalSearchResponse)
    async def retrieval_search(request: RetrievalSearchRequest) -> RetrievalSearchResponse:
        try:
            return service.search(request)
        except InvalidRetrievalQueryError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={"code": error.code, "message": str(error)},
            ) from error

    return router
