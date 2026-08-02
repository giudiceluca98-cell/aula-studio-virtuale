from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class EveSettings(BaseSettings):
    """Configurazione server-side. Le chiavi dei provider non devono arrivare al client."""

    model_config = SettingsConfigDict(
        env_prefix="EVE_",
        env_file=".env",
        extra="ignore",
    )

    environment: str = "development"
    provider: str = "mock"
    enabled: bool = True
    daily_request_limit: int = 100
    max_context_chars: int = 12_000
    max_plan_chars: int = 4_000_000
    audit_enabled: bool = True

    requirements_db_path: str = "data/eve-requirements.sqlite3"
    prompts_db_path: str = "data/eve-prompts.sqlite3"
    evaluations_db_path: str = "data/eve-evaluations.sqlite3"
    provider_telemetry_db_path: str = "data/eve-provider-telemetry.sqlite3"
    materials_db_path: str = "data/eve-materials.sqlite3"
    research_db_path: str = "data/eve-research.sqlite3"

    evaluation_publish_score: float = 85.0
    evaluation_evidence_max_chars: int = 500
    evaluation_latency_budget_ms: float = 750.0

    external_providers_enabled: bool = False
    external_provider_key: str = "openai-compatible"
    external_provider_label: str = "Provider OpenAI-compatible"
    external_provider_base_url: str = ""
    external_provider_api_key: str = ""
    external_provider_model: str = ""
    external_provider_model_label: str = "Modello esterno configurato"
    external_provider_timeout_seconds: float = 20.0
    external_provider_max_response_bytes: int = 262_144
    external_provider_temperature: float = 0.2
    external_provider_max_output_tokens: int = 2_000
    external_provider_context_window: int = 128_000
    external_provider_input_cost_per_million_usd: float = 0.0
    external_provider_output_cost_per_million_usd: float = 0.0
    provider_rate_limit_per_minute: int = 30
    provider_circuit_failure_threshold: int = 3
    provider_circuit_recovery_seconds: float = 60.0
    chat_production_max_input_tokens: int = 12_000
    chat_production_max_output_tokens: int = 4_000
    chat_production_max_total_tokens: int = 16_000
    chat_production_max_cost_per_run_usd: float = 0.25
    chat_production_daily_token_budget: int = 250_000
    chat_production_daily_cost_budget_usd: float = 5.0
    chat_execution_profile: str = "chat-development"
    evaluation_execution_profile: str = "evaluation-safe"

    material_max_bytes: int = 2_000_000
    material_max_text_chars: int = 2_000_000
    material_max_metadata_chars: int = 16_000
    material_chunk_chars: int = 1_200
    material_chunk_overlap_chars: int = 150
    material_max_versions: int = 50

    retrieval_max_query_chars: int = 500
    retrieval_max_results: int = 10
    retrieval_max_excerpt_chars: int = 600
    retrieval_min_score: float = 1.0

    rag_max_sources: int = 4
    rag_max_answer_chars: int = 4_000

    source_max_context_chars: int = 2_000

    research_max_projects_per_room: int = 50
    research_max_queries_per_project: int = 100
    research_max_sources_per_project: int = 500

    research_web_enabled: bool = False
    research_web_timeout_seconds: float = 10.0
    research_web_max_bytes: int = 2_000_000
    research_web_max_redirects: int = 3
    research_robots_max_bytes: int = 512_000
    research_robots_required: bool = True
    research_web_user_agent: str = "EveAulaStudioResearchBot/0.2"
    research_review_enabled: bool = True
    research_promotion_enabled: bool = False
    research_search_enabled: bool = False
    research_search_timeout_seconds: float = 8.0
    research_search_max_results: int = 20
    research_search_max_executions_per_project: int = 100
    research_search_max_executions_per_room_day: int = 200
    research_search_max_executions_per_actor_day: int = 50
    research_search_max_retries: int = 1
    research_search_provider_order: str = ""
    research_advanced_ingestion_enabled: bool = False
    research_advanced_max_bytes: int = 12_000_000
    research_advanced_max_text_chars: int = 4_000_000
    research_advanced_max_archive_files: int = 2_000
    research_advanced_max_archive_bytes: int = 48_000_000
    research_advanced_max_pdf_pages: int = 1_000
    research_advanced_max_segments: int = 5_000
    research_near_duplicate_threshold: float = 0.88
    research_crawl_enabled: bool = False
    research_crawl_max_depth: int = 1
    research_crawl_max_pages: int = 10
    research_crawl_max_total_bytes: int = 5_000_000

    research_embeddings_enabled: bool = False
    research_hybrid_retrieval_enabled: bool = False
    research_embedding_provider: str = "deterministic-local"
    research_embedding_model: str = "hash-embedding-v1"
    research_embedding_dimensions: int = 96
    research_embedding_batch_size: int = 32
    research_hybrid_max_results: int = 10
    research_hybrid_max_candidates: int = 1_000
    research_hybrid_min_score: float = 0.15
    research_hybrid_semantic_weight: float = 0.65
    research_hybrid_lexical_weight: float = 0.35
    research_hybrid_lexical_fallback: bool = True
