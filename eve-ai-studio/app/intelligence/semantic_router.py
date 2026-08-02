from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from app.materials.errors import MaterialError

from .hybrid_retrieval import HybridRetrievalService
from .semantic_errors import (
    EmbeddingDisabledError, EmbeddingProviderUnavailableError,
    HybridRetrievalDisabledError, SemanticIndexConflictError,
    SemanticIndexNotFoundError, UnapprovedMaterialError,
)
from .semantic_models import (
    EmbeddingIndexRequest, EmbeddingJob, HybridSearchRequest, HybridSearchResponse,
    RetrievalEvaluationRequest, RetrievalEvaluationResult, SemanticIndexDeleteResult,
    SemanticIndexStatus,
)


def _http(error: Exception) -> HTTPException:
    if isinstance(error,(EmbeddingDisabledError,HybridRetrievalDisabledError,
                         EmbeddingProviderUnavailableError)):
        return HTTPException(status_code=503,detail={"code":getattr(error,"code","disabled"),"message":str(error)})
    if isinstance(error,(SemanticIndexNotFoundError,)):
        return HTTPException(status_code=404,detail=str(error))
    if isinstance(error,(UnapprovedMaterialError,SemanticIndexConflictError)):
        return HTTPException(status_code=409,detail={"code":getattr(error,"code","conflict"),"message":str(error)})
    if isinstance(error,MaterialError):
        return HTTPException(status_code=422,detail={"code":getattr(error,"code","material_error"),"message":str(error)})
    return HTTPException(status_code=422,detail={"code":getattr(error,"code",error.__class__.__name__),"message":str(error)})


def create_semantic_retrieval_router(service: HybridRetrievalService) -> APIRouter:
    router = APIRouter(prefix="/v1/intelligence/retrieval",tags=["intelligence-retrieval"])

    @router.get("/status",response_model=SemanticIndexStatus)
    async def semantic_status()->SemanticIndexStatus:
        return service.status()

    @router.post(
        "/materials/{material_id}/versions/{version_number}/index",
        response_model=EmbeddingJob,status_code=status.HTTP_201_CREATED,
    )
    async def index_material(material_id:str,version_number:int,request:EmbeddingIndexRequest)->EmbeddingJob:
        try:return await run_in_threadpool(service.index_material,material_id,version_number,request)
        except Exception as error:raise _http(error) from error

    @router.delete(
        "/materials/{material_id}/versions/{version_number}/index",
        response_model=SemanticIndexDeleteResult,
    )
    async def delete_index(
        material_id:str,version_number:int,room_id:str=Query(min_length=1,max_length=120)
    )->SemanticIndexDeleteResult:
        try:return await run_in_threadpool(service.delete_index,material_id,version_number,room_id)
        except Exception as error:raise _http(error) from error

    @router.post("/search",response_model=HybridSearchResponse)
    async def hybrid_search(request:HybridSearchRequest)->HybridSearchResponse:
        try:return await run_in_threadpool(service.search,request)
        except Exception as error:raise _http(error) from error

    @router.post("/evaluate",response_model=RetrievalEvaluationResult)
    async def evaluate(request:RetrievalEvaluationRequest)->RetrievalEvaluationResult:
        try:return await run_in_threadpool(service.evaluate,request)
        except Exception as error:raise _http(error) from error

    return router
