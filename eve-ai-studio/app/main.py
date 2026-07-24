from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, status

from .context.validation import ContextTooLargeError, validate_context_size
from .core.audit import AuditLogger
from .core.config import EveSettings
from .models import ChatRequest, ChatResponse, HealthResponse
from .providers.registry import get_provider
from .requirements.models import (
    PlanImportRequest,
    PlanImportResult,
    PlanSection,
    RequirementCard,
    RequirementCatalogStatus,
    RequirementImportListResponse,
    RequirementListResponse,
    RequirementRollbackRequest,
    RequirementRollbackResult,
    RequirementVersionDiff,
    RequirementVersionListResponse,
    RequirementVersionSummary,
)
from .requirements.parser import PlanParseError
from .requirements.registry import RequirementNotFoundError, RequirementRegistry
from .requirements.storage import RequirementVersionNotFoundError, SqliteRequirementStore

SERVICE_VERSION = "0.3.0"

settings = EveSettings()
provider = get_provider(settings)
audit = AuditLogger(enabled=settings.audit_enabled)
requirement_store = SqliteRequirementStore(settings.requirements_db_path)
requirements = RequirementRegistry(store=requirement_store)

app = FastAPI(
    title="Eve AI Studio",
    version=SERVICE_VERSION,
    description=(
        "Fondazione modulare di Eve con catalogo requisiti persistente, versionato e reversibile. "
        "Nessun modello esterno è collegato."
    ),
)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok" if settings.enabled else "disabled",
        enabled=settings.enabled,
        provider=settings.provider,
        environment=settings.environment,
        service_version=SERVICE_VERSION,
    )


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not settings.enabled:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Eve è disattivata")

    try:
        validate_context_size(request, settings.max_context_chars)
        response = await provider.generate(request)
    except ContextTooLargeError as exc:
        audit.record(event_type="chat", request=request, provider=provider.name, outcome="rejected_context")
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(exc)) from exc
    except Exception as exc:
        audit.record(event_type="chat", request=request, provider=provider.name, outcome="provider_error")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Provider Eve non disponibile") from exc

    audit.record(event_type="chat", request=request, provider=provider.name, outcome="success")
    return response


@app.get("/v1/requirements/status", response_model=RequirementCatalogStatus)
async def requirements_status() -> RequirementCatalogStatus:
    return requirements.status()


@app.post("/v1/requirements/import", response_model=PlanImportResult)
async def import_requirements(request: PlanImportRequest) -> PlanImportResult:
    if len(request.text) > settings.max_plan_chars:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Il plaintext supera il limite configurato",
        )
    try:
        return requirements.import_text(
            request.text,
            expected_sections=request.expected_sections,
            expected_cards=request.expected_cards,
            replace=request.replace,
            label=request.label,
            note=request.note,
        )
    except PlanParseError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc


@app.get("/v1/requirements/imports", response_model=RequirementImportListResponse)
async def list_requirement_imports(
    limit: int = Query(default=100, ge=1, le=500),
) -> RequirementImportListResponse:
    items = requirements.imports(limit=limit)
    return RequirementImportListResponse(total=len(items), items=items)


@app.get("/v1/requirements/versions", response_model=RequirementVersionListResponse)
async def list_requirement_versions(
    limit: int = Query(default=100, ge=1, le=500),
) -> RequirementVersionListResponse:
    items = requirements.versions(limit=limit)
    return RequirementVersionListResponse(total=len(items), items=items)


@app.get("/v1/requirements/versions/{version_id}", response_model=RequirementVersionSummary)
async def get_requirement_version(version_id: int) -> RequirementVersionSummary:
    try:
        return requirements.version(version_id)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione non trovata") from exc


@app.get("/v1/requirements/compare", response_model=RequirementVersionDiff)
async def compare_requirement_versions(
    from_version_id: int = Query(ge=1),
    to_version_id: int = Query(ge=1),
) -> RequirementVersionDiff:
    try:
        return requirements.compare(from_version_id, to_version_id)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione non trovata") from exc


@app.post("/v1/requirements/rollback", response_model=RequirementRollbackResult)
async def rollback_requirements(request: RequirementRollbackRequest) -> RequirementRollbackResult:
    try:
        return requirements.rollback(request.version_id, note=request.note)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versione non trovata") from exc


@app.get("/v1/requirements/sections", response_model=list[PlanSection])
async def list_requirement_sections() -> list[PlanSection]:
    return requirements.sections()


@app.get("/v1/requirements", response_model=RequirementListResponse)
async def list_requirements(
    section: int | None = Query(default=None, ge=1),
    module_key: str | None = None,
    q: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> RequirementListResponse:
    total, items = requirements.list(
        section=section,
        module_key=module_key,
        query=q,
        offset=offset,
        limit=limit,
    )
    return RequirementListResponse(total=total, offset=offset, limit=limit, items=items)


@app.get("/v1/requirements/{requirement_id}", response_model=RequirementCard)
async def get_requirement(requirement_id: str) -> RequirementCard:
    try:
        return requirements.get(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scheda non trovata") from exc
