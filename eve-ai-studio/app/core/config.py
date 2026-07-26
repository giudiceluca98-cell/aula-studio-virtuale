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

    evaluation_publish_score: float = 85.0
    evaluation_evidence_max_chars: int = 500
    evaluation_latency_budget_ms: float = 750.0

    external_providers_enabled: bool = False
    chat_execution_profile: str = "chat-development"
    evaluation_execution_profile: str = "evaluation-safe"

    material_max_bytes: int = 2_000_000
    material_max_text_chars: int = 2_000_000
    material_max_metadata_chars: int = 16_000
    material_chunk_chars: int = 1_200
    material_chunk_overlap_chars: int = 150
    material_max_versions: int = 50
