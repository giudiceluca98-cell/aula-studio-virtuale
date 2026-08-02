from __future__ import annotations

from fastapi import FastAPI, HTTPException, Query

from .context.validation import ContextTooLargeError, validate_context_size
from .core.audit import AuditLogger
from .core.config import EveSettings
from .evaluations.automatic import AutomaticEvaluationService
from .evaluations.automatic_router import create_automatic_evaluation_router
from .evaluations.router import create_evaluation_router
from .evaluations.service import EvaluationService
from .evaluations.storage import SqliteEvaluationStore
from .intelligence import (
    ControlledWebAcquirer, AdvancedDocumentExtractor, AdvancedIngestionPolicy, SqliteIngestionStore, CrawlPolicy, LimitedCrawler,
    ResearchCenterService,
    ResearchLimits,
    ResearchReviewPolicy,
    ResearchSearchPolicy,
    SearchProviderRegistry,
    SqliteAcquisitionStore,
    SqliteReviewStore,
    SqliteSearchStore,
    SqliteResearchStore,
    WebAcquisitionPolicy,
    create_research_router,
    DeterministicHashEmbeddingProvider,
    HybridRetrievalPolicy,
    HybridRetrievalService,
    SqliteHybridIndexStore,
    create_semantic_retrieval_router,
    SqliteSourceHealthStore,
    SourceHealthPolicy,
    SourceHealthService,
    create_source_health_router,
)
from .materials import MaterialLimits, MaterialService, SqliteMaterialStore, create_material_router
from .models import ChatRequest, ChatResponse, HealthResponse
from .prompts.router import create_prompt_router
from .prompts.service import PromptService
from .prompts.storage import SqlitePromptStore
from .providers import (
    ManagedEveProvider,
    ProviderOrchestrator,
    ProviderTelemetryStore,
    build_provider_runtime,
)
from .providers.orchestrator import ProviderBudgetExceededError, ProviderExecutionError
from .providers.router import create_provider_router
from .rag import RagChatService, RagLimits, create_rag_router
from .retrieval import RetrievalLimits, RetrievalService, create_retrieval_router
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
from .sources import SourceOpeningLimits, SourceOpeningService, create_source_router

SERVICE_VERSION = "1.2.0"

settings = EveSettings()
audit = AuditLogger(enabled=settings.audit_enabled)

provider_runtime = build_provider_runtime(settings)
provider_catalog = provider_runtime.catalog
execution_profiles = provider_runtime.profiles
provider_telemetry = ProviderTelemetryStore(settings.provider_telemetry_db_path)
provider_orchestrator = ProviderOrchestrator(
    provider_catalog,
    execution_profiles,
    provider_telemetry,
    runtime_guard=provider_runtime.guard,
)
evaluation_provider = ManagedEveProvider(
    provider_orchestrator,
    profile_key=settings.evaluation_execution_profile,
    purpose="evaluation",
)

requirement_store = SqliteRequirementStore(settings.requirements_db_path)
requirements = RequirementRegistry(requirement_store)
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
retrieval = RetrievalService(
    material_store,
    limits=RetrievalLimits(
        max_query_chars=settings.retrieval_max_query_chars,
        max_results=settings.retrieval_max_results,
        max_excerpt_chars=settings.retrieval_max_excerpt_chars,
        minimum_score=settings.retrieval_min_score,
    ),
)
rag = RagChatService(
    retrieval,
    limits=RagLimits(
        max_sources=settings.rag_max_sources,
        max_answer_chars=settings.rag_max_answer_chars,
    ),
)
source_opening = SourceOpeningService(
    material_store,
    limits=SourceOpeningLimits(
        max_context_chars=settings.source_max_context_chars,
    ),
)
research_store = SqliteResearchStore(settings.research_db_path)
research_acquisition_store = SqliteAcquisitionStore(settings.research_db_path)
research_review_store = SqliteReviewStore(settings.research_db_path)
research_search_store = SqliteSearchStore(settings.research_db_path)
# Nessun provider reale viene registrato automaticamente: attivazione esplicita richiesta.
research_search_providers = SearchProviderRegistry()
research_acquirer = ControlledWebAcquirer(
    policy=WebAcquisitionPolicy(
        enabled=settings.research_web_enabled,
        timeout_seconds=settings.research_web_timeout_seconds,
        max_bytes=settings.research_web_max_bytes,
        max_redirects=settings.research_web_max_redirects,
        robots_max_bytes=settings.research_robots_max_bytes,
        user_agent=settings.research_web_user_agent,
        require_robots=settings.research_robots_required,
    )
)
research_ingestion_store = SqliteIngestionStore(settings.research_db_path)
research_ingestion_policy = AdvancedIngestionPolicy(enabled=settings.research_advanced_ingestion_enabled,max_document_bytes=settings.research_advanced_max_bytes,max_extracted_chars=settings.research_advanced_max_text_chars,max_archive_files=settings.research_advanced_max_archive_files,max_archive_uncompressed_bytes=settings.research_advanced_max_archive_bytes,max_pdf_pages=settings.research_advanced_max_pdf_pages,max_segments=settings.research_advanced_max_segments,near_duplicate_threshold=settings.research_near_duplicate_threshold)
research_advanced_extractor = AdvancedDocumentExtractor(research_ingestion_policy)
research_crawl_policy = CrawlPolicy(enabled=settings.research_crawl_enabled,max_depth=settings.research_crawl_max_depth,max_pages=settings.research_crawl_max_pages,max_total_bytes=settings.research_crawl_max_total_bytes,same_domain_only=True)
research_crawler = LimitedCrawler(research_acquirer,research_crawl_policy)
research_embedding_provider = DeterministicHashEmbeddingProvider(
    model=settings.research_embedding_model,
    dimensions=settings.research_embedding_dimensions,
)
research_hybrid_store = SqliteHybridIndexStore(settings.research_db_path)
research_hybrid_retrieval = HybridRetrievalService(
    research_hybrid_store, material_store, research_embedding_provider,
    policy=HybridRetrievalPolicy(
        embeddings_enabled=settings.research_embeddings_enabled,
        retrieval_enabled=settings.research_hybrid_retrieval_enabled,
        lexical_fallback_enabled=settings.research_hybrid_lexical_fallback,
        semantic_weight=settings.research_hybrid_semantic_weight,
        lexical_weight=settings.research_hybrid_lexical_weight,
        minimum_score=settings.research_hybrid_min_score,
        max_results=settings.research_hybrid_max_results,
        max_candidates=settings.research_hybrid_max_candidates,
        batch_size=settings.research_embedding_batch_size,
    ),
)
research_source_health_store = SqliteSourceHealthStore(settings.research_db_path)
research_source_health = SourceHealthService(
    research_source_health_store,
    research_store,
    research_acquisition_store,
    research_review_store,
    research_acquirer,
    policy=SourceHealthPolicy(
        health_enabled=settings.research_source_health_enabled,
        recheck_enabled=settings.research_source_recheck_enabled,
        conflict_tracking_enabled=settings.research_source_conflicts_enabled,
        reporting_enabled=settings.research_corpus_reporting_enabled,
        default_max_age_days=settings.research_source_default_max_age_days,
        default_recheck_interval_hours=settings.research_source_recheck_interval_hours,
        max_due_per_run=settings.research_source_max_due_per_run,
        max_consecutive_failures=settings.research_source_max_consecutive_failures,
    ),
)
research_center = ResearchCenterService(
    research_store,
    limits=ResearchLimits(
        max_projects_per_room=settings.research_max_projects_per_room,
        max_queries_per_project=settings.research_max_queries_per_project,
        max_sources_per_project=settings.research_max_sources_per_project,
    ),
    acquisition_store=research_acquisition_store,
    acquirer=research_acquirer,
    review_store=research_review_store,
    material_service=materials,
    review_policy=ResearchReviewPolicy(
        review_enabled=settings.research_review_enabled,
        promotion_enabled=settings.research_promotion_enabled,
    ),
    search_store=research_search_store,
    search_providers=research_search_providers,
    ingestion_store=research_ingestion_store,
    advanced_extractor=research_advanced_extractor,
    ingestion_policy=research_ingestion_policy,
    crawler=research_crawler,
    crawl_policy=research_crawl_policy,
    search_policy=ResearchSearchPolicy(
        enabled=settings.research_search_enabled,
        timeout_seconds=settings.research_search_timeout_seconds,
        max_results=settings.research_search_max_results,
        max_executions_per_project=settings.research_search_max_executions_per_project,
        max_executions_per_room_day=settings.research_search_max_executions_per_room_day,
        max_executions_per_actor_day=settings.research_search_max_executions_per_actor_day,
        max_retries=settings.research_search_max_retries,
        provider_order=tuple(
            value.strip() for value in settings.research_search_provider_order.split(",")
            if value.strip()
        ),
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
        "Fondazione modulare di Eve con requisiti, prompt, valutazioni, runner, "
        "provider controllati, materiali, retrieval locale, chat RAG citata, "
        "apertura verificabile delle fonti e centro ricerca INTELLIGENCE con "
        "progetti, acquisizione URL controllata, revisione umana attribuibile, "
        "promozione esplicita e provider di ricerca configurabili. Ricerca, rete e promozione restano "
        "opt-in; nessun punteggio approva automaticamente una fonte. Embedding versionati "
        "e retrieval ibrido sono disponibili soltanto sotto feature flag; provider reali "
        "restano opt-in, server-side e protetti da budget, fallback e circuit breaker; "
        "addestramento del modello escluso."
    ),
)
app.include_router(create_prompt_router(prompts))
app.include_router(create_evaluation_router(evaluations))
app.include_router(create_automatic_evaluation_router(automatic_evaluations))
app.include_router(create_provider_router(provider_orchestrator))
app.include_router(create_material_router(materials))
app.include_router(create_retrieval_router(retrieval))
app.include_router(create_rag_router(rag))
app.include_router(create_source_router(source_opening))
app.include_router(create_research_router(research_center))
app.include_router(create_semantic_retrieval_router(research_hybrid_retrieval))
app.include_router(create_source_health_router(research_source_health))


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
        raise HTTPException(503, "Eve è disattivata")
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
        raise HTTPException(413, str(exc)) from exc
    except ProviderBudgetExceededError as exc:
        audit.record(
            event_type="chat",
            request=request,
            provider=settings.provider,
            outcome="rejected_budget",
        )
        raise HTTPException(429, str(exc)) from exc
    except ProviderExecutionError as exc:
        audit.record(
            event_type="chat",
            request=request,
            provider=settings.provider,
            outcome="provider_error",
        )
        raise HTTPException(502, "Provider Eve non disponibile") from exc
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
        raise HTTPException(413, "Il plaintext supera il limite configurato")
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
        raise HTTPException(422, str(exc)) from exc


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
        raise HTTPException(404, "Versione non trovata") from exc


@app.get("/v1/requirements/compare", response_model=RequirementVersionDiff)
async def compare_requirement_versions(
    from_version_id: int = Query(ge=1),
    to_version_id: int = Query(ge=1),
) -> RequirementVersionDiff:
    try:
        return requirements.compare(from_version_id, to_version_id)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(404, "Versione non trovata") from exc


@app.post("/v1/requirements/rollback", response_model=RequirementRollbackResult)
async def rollback_requirements(
    request: RequirementRollbackRequest,
) -> RequirementRollbackResult:
    try:
        return requirements.rollback(request.version_id, note=request.note)
    except RequirementVersionNotFoundError as exc:
        raise HTTPException(404, "Versione non trovata") from exc


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
        raise HTTPException(404, "Scheda non trovata") from exc
