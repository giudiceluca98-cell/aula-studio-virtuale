from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query, status

from .context.validation import ContextTooLargeError, validate_context_size
from .core.audit import AuditLogger
from .core.config import EveSettings
from .evaluations.automatic import AutomaticEvaluationService
from .evaluations.automatic_router import create_automatic_evaluation_router
from .evaluations.router import create_evaluation_router
from .evaluations.service import EvaluationService
from .evaluations.storage import SqliteEvaluationStore
from .materials import MaterialLimits, MaterialService, SqliteMaterialStore, create_material_router
from .models import ChatRequest, ChatResponse, HealthResponse
from .prompts.router import create_prompt_router
from .prompts.service import PromptService
from .prompts.storage import SqlitePromptStore
from .providers import (
    ManagedEveProvider,
    ProviderOrchestrator,
    ProviderTelemetryStore,
    build_default_catalog,
    build_default_profiles,
)
from .providers.orchestrator import (
    ProviderBudgetExceededError,
    ProviderExecutionError,
)
from .providers.router import create_provider_router
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

SERVICE_VERSION = "0.8.0"

settings = EveSettings()
audit = AuditLogger(enabled=settings.audit_enabled)

provider_catalog = build_default_catalog(
    external_providers_enabled=settings.external_providers_enabled
)
execution_profiles = build_default_profiles()
provider_telemetry = ProviderTelemetryStore(settings.provider_telemetry_db_path)
provider_orchestrator = ProviderOrchestrator(
    provider_catalog,
    execution_profiles,
    provider_telemetry,
)
evaluation_provider = ManagedEveProvider(
    provider_orchestrator,
    profile_key=settings.evaluation_execution_profile,
    purpose="evaluation",
)

requirement_store = SqliteRequirementStore(settings.requirements_db_path)
requirements = RequirementRegistry(store=requirement_store)
prompt_store = SqlitePromptStore(settings.prompts_db_path)
prompts = PromptService(prompt_store, seed_default=True)
evaluation_store = SqliteEvaluationStore(
    settings.evaluations_db_path,
    publish_threshold=settings.evaluation_publish_score,
)
evaluations = EvaluationService(
    evaluation_store,
    prompt_version_getter=prompts.get,
    seed_default=True,
)
automatic_evaluations = AutomaticEvaluationService(
    evaluations,
    evaluation_store,
    provider=evaluation_provider,
    prompt_version_getter=prompts.get,
    evidence_max_chars=settings.evaluation_evidence_max_chars,
    latency_budget_ms=settings.evaluation_latency_budget_ms,
    migrate_empty_inputs=True,
)
material_store = SqliteMaterialStore(settings.materials_db_path)
materials = MaterialService(
    material_store,
    limits=MaterialLimits(
        max_material_bytes=settings.material_max_bytes,
        max_extracted_chars=settings.material_max_text_chars,
        max_metadata_chars=settings.material_max_metadata_chars,
        chunk_chars=settings.material_chunk_chars,
        chunk_overlap_chars=settings.material_chunk_overlap_chars,
        max_versions_per_material=settings.material_max_versions,
    ),
)
active_prompt_version_id = prompts.status().active_version_id
if active_prompt_version_id is not None and not evaluation_store.runs_count(
    prompt_version_id=active_prompt_version_id
):
    evaluations.seed_baseline(active_prompt_version_id)
prompts.set_evaluation_gate(evaluations.gate)

app = FastAPI(
    title="Eve AI Studio",
    version=SERVICE_VERSION,
    description=(
        "Fondazione modulare di Eve con requisiti, prompt, valutazioni, runner automatico, "
        "registro provider, profili controllati, catalogo materiali e preparazione RAG. "
        "I provider esterni e gli embedding esterni sono disattivati."
    ),
)
app.include_router(create_prompt_router(prompts))
app.include_router(create_evaluation_router(evaluations))
app.include_router(create_automatic_evaluation_router(automatic_evaluations))
app.include_router(create_provider_router(provider_orchestrator))
app.include_router(create_material_router(materials))


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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Eve è disattivata",
        )

    try:
        validate_context_size(request, settings.max_context_chars)
        execution = await provider_orchestrator.execute(
            request,
            profile_key=settings.chat_execution_profile,
            purpose="chat",
        )
        response = execution.response
    except ContextTooLargeError as exc:
        audit.record(
            event_type="chat",
            request=request,
            provider=settings.provider,
            outcome="rejected_context",
        )
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=str(exc),
        ) from exc
    except ProviderBudgetExceededError as exc:
        audit.record(
            event_type="chat",
            request=request,
            provider=settings.provider,
            outcome="rejected_budget",
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except ProviderExecutionError as exc:
        audit.record(
            event_type="chat",
            request=request,
            provider=settings.provider,
            outcome="provider_error",
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Provider Eve non disponibile",
        ) from exc

    audit.record(
        event_type="chat",
        request=request,
        provider=response.provider,
        outcome="success",
    )
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
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc


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


@app.get(
    "/v1/requirements/versions/{version_id}",
    response_model=RequirementVersionSummary,
)
async def get_requirement_version(version_id: int) -> RequirementVersionSummary:
    try:
        return requirements.version(version_id)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Versione non trovata",
        ) from exc


@app.get("/v1/requirements/compare", response_model=RequirementVersionDiff)
async def compare_requirement_versions(
    from_version_id: int = Query(ge=1),
    to_version_id: int = Query(ge=1),
) -> RequirementVersionDiff:
    try:
        return requirements.compare(from_version_id, to_version_id)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Versione non trovata",
        ) from exc


@app.post("/v1/requirements/rollback", response_model=RequirementRollbackResult)
async def rollback_requirements(
    request: RequirementRollbackRequest,
) -> RequirementRollbackResult:
    try:
        return requirements.rollback(request.version_id, note=request.note)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Versione non trovata",
        ) from exc


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
    return RequirementListResponse(
        total=total,
        offset=offset,
        limit=limit,
        items=items,
    )


@app.get("/v1/requirements/{requirement_id}", response_model=RequirementCard)
async def get_requirement(requirement_id: str) -> RequirementCard:
    try:
        return requirements.get(requirement_id)
    except RequirementNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheda non trovata",
        ) from exc
