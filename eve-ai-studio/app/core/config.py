from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class EveSettings(BaseSettings):
    """Configurazione server-side. Le chiavi dei provider non devono arrivare al client."""

    model_config = SettingsConfigDict(env_prefix="EVE_", env_file=".env", extra="ignore")

    environment: str = "development"
    provider: str = "mock"
    enabled: bool = True
    daily_request_limit: int = 100
    max_context_chars: int = 12_000
    max_plan_chars: int = 4_000_000
    audit_enabled: bool = True
    requirements_db_path: str = "data/eve-requirements.sqlite3"
    prompts_db_path: str = "data/eve-prompts.sqlite3"
