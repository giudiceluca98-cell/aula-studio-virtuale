from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ..retrieval import InvalidRetrievalQueryError
from .errors import RagRoomRequiredError
from .models import RagChatRequest, RagChatResponse, RagStatus
from .service import RagChatService


def create_rag_router(service: RagChatService) -> APIRouter:
    router = APIRouter(prefix="/v1/rag", tags=["rag"])

    @router.get("/status", response_model=RagStatus)
    async def rag_status() -> RagStatus:
        return service.status()

    @router.post("/chat", response_model=RagChatResponse)
    async def rag_chat(request: RagChatRequest) -> RagChatResponse:
        try:
            return service.answer(request)
        except RagRoomRequiredError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={"code": error.code, "message": str(error)},
            ) from error
        except InvalidRetrievalQueryError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={"code": error.code, "message": str(error)},
            ) from error

    return router
