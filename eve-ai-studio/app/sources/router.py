from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from .errors import (
    InvalidSourceLocatorError,
    SourceCoordinatesMismatchError,
    SourceHashMismatchError,
    SourceIntegrityError,
    SourceNotFoundError,
    SourceOutdatedError,
)
from .models import SourceOpenRequest, SourceOpenResponse, SourceOpeningStatus
from .service import SourceOpeningService


def create_source_router(service: SourceOpeningService) -> APIRouter:
    router = APIRouter(prefix="/v1/sources", tags=["sources"])

    @router.get("/status", response_model=SourceOpeningStatus)
    async def source_status() -> SourceOpeningStatus:
        return service.status()

    @router.post("/open", response_model=SourceOpenResponse)
    async def open_source(request: SourceOpenRequest) -> SourceOpenResponse:
        try:
            return service.open(request)
        except InvalidSourceLocatorError as error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail={"code": error.code, "message": str(error)},
            ) from error
        except SourceNotFoundError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": error.code, "message": str(error)},
            ) from error
        except (
            SourceCoordinatesMismatchError,
            SourceHashMismatchError,
            SourceIntegrityError,
            SourceOutdatedError,
        ) as error:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": error.code, "message": str(error)},
            ) from error

    return router
