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
    RequirementListResponse,
)
from .requirements.parser import PlanParseError
from .requirements.registry import RequirementNotFoundError, RequirementRegistry

SERVICE_VERSION = "0.2.0"

settings = EveSettings()
provider = get_provider(settings)
audit = AuditLogger(enabled=settings.audit_enabled)
requirements = RequirementRegistry()

app = FastAPI(
    title="Eve AI Studio",
    version=SERVICE_VERSION,
    description=(
        "Fondazione modulare di Eve e importatore del piano requisiti. "
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
        )
    except PlanParseError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)) from exc


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
