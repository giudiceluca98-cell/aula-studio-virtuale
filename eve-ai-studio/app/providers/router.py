from __future__ import annotations

from fastapi import APIRouter, Query

from .models import (
    ExecutionProfile,
    ModelDescriptor,
    ProviderCatalogStatus,
    ProviderDescriptor,
    ProviderExecutionTelemetry,
    ProviderRuntimeStatus,
)
from .orchestrator import ProviderOrchestrator


def create_provider_router(orchestrator: ProviderOrchestrator) -> APIRouter:
    router = APIRouter(prefix="/v1/providers", tags=["providers"])

    @router.get("/status", response_model=ProviderCatalogStatus)
    async def provider_status() -> ProviderCatalogStatus:
        return orchestrator.status()

    @router.get("/catalog", response_model=list[ProviderDescriptor])
    async def provider_catalog() -> list[ProviderDescriptor]:
        return orchestrator.catalog.providers()

    @router.get("/models", response_model=list[ModelDescriptor])
    async def provider_models() -> list[ModelDescriptor]:
        return orchestrator.catalog.models()

    @router.get("/profiles", response_model=list[ExecutionProfile])
    async def provider_profiles() -> list[ExecutionProfile]:
        return orchestrator.profiles.list()

    @router.get("/runtime", response_model=ProviderRuntimeStatus)
    async def provider_runtime() -> ProviderRuntimeStatus:
        return orchestrator.runtime_status()

    @router.get("/telemetry", response_model=list[ProviderExecutionTelemetry])
    async def provider_telemetry(
        limit: int = Query(default=100, ge=1, le=500),
    ) -> list[ProviderExecutionTelemetry]:
        return orchestrator.telemetry.list(limit)

    return router
