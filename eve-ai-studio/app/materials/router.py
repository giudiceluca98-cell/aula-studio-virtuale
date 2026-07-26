from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from .errors import (
    InvalidMaterialPayloadError,
    MaterialNotFoundError,
    MaterialProcessingError,
    MaterialRoomMismatchError,
    MaterialTextDecodingError,
    MaterialTextTooLargeError,
    MaterialTooLargeError,
    MaterialVersionLimitError,
    MaterialVersionNotFoundError,
    UnsupportedMediaTypeError,
)
from .models import (
    MaterialCatalogStatus,
    MaterialChunkListResponse,
    MaterialDetail,
    MaterialImportEventListResponse,
    MaterialImportRequest,
    MaterialImportResult,
    MaterialListResponse,
    MaterialStatus,
    MaterialVersionListResponse,
    MaterialVersionSummary,
)
from .service import MaterialService


def _http_error(error: Exception) -> HTTPException:
    if isinstance(error, MaterialTooLargeError | MaterialTextTooLargeError):
        return HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(error))
    if isinstance(error, UnsupportedMediaTypeError):
        return HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=str(error))
    if isinstance(
        error,
        MaterialNotFoundError | MaterialVersionNotFoundError | MaterialRoomMismatchError,
    ):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Materiale non trovato")
    if isinstance(error, MaterialVersionLimitError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    if isinstance(error, InvalidMaterialPayloadError | MaterialTextDecodingError):
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error))
    if isinstance(error, MaterialProcessingError):
        return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Errore materiali")


def create_material_router(service: MaterialService) -> APIRouter:
    router = APIRouter(prefix="/v1/materials", tags=["materials"])

    @router.get("/status", response_model=MaterialCatalogStatus)
    async def catalog_status() -> MaterialCatalogStatus:
        return service.status()

    @router.get("/imports", response_model=MaterialImportEventListResponse)
    async def list_imports(
        room_id: str = Query(min_length=1, max_length=120),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> MaterialImportEventListResponse:
        return service.list_imports(room_id, limit=limit)

    @router.post("/import", response_model=MaterialImportResult)
    async def import_material(request: MaterialImportRequest) -> MaterialImportResult:
        try:
            return service.import_document(request)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("", response_model=MaterialListResponse)
    async def list_materials(
        room_id: str = Query(min_length=1, max_length=120),
        material_status: MaterialStatus | None = Query(default=None, alias="status"),
        q: str | None = Query(default=None, max_length=240),
        offset: int = Query(default=0, ge=0),
        limit: int = Query(default=100, ge=1, le=500),
    ) -> MaterialListResponse:
        return service.list_materials(
            room_id=room_id,
            status=material_status,
            query=q,
            offset=offset,
            limit=limit,
        )

    @router.get("/{material_id}", response_model=MaterialDetail)
    async def get_material(
        material_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> MaterialDetail:
        try:
            return service.get_material(material_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/{material_id}/versions", response_model=MaterialVersionListResponse)
    async def list_versions(
        material_id: str,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> MaterialVersionListResponse:
        try:
            return service.list_versions(material_id, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.get("/{material_id}/versions/{version_number}", response_model=MaterialVersionSummary)
    async def get_version(
        material_id: str,
        version_number: int,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> MaterialVersionSummary:
        try:
            return service.get_version(material_id, version_number, room_id)
        except Exception as error:
            raise _http_error(error) from error

    @router.get(
        "/{material_id}/versions/{version_number}/chunks",
        response_model=MaterialChunkListResponse,
    )
    async def list_chunks(
        material_id: str,
        version_number: int,
        room_id: str = Query(min_length=1, max_length=120),
    ) -> MaterialChunkListResponse:
        try:
            return service.list_chunks(material_id, version_number, room_id)
        except Exception as error:
            raise _http_error(error) from error

    return router
