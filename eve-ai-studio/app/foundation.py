from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Protocol

from pydantic_settings import BaseSettings, SettingsConfigDict

from .models import ChatRequest, ChatResponse, HealthResponse, PermissionLevel, SourceReference


class EveSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="EVE_", env_file=".env", extra="ignore")

    environment: str = "development"
    provider: str = "mock"
    enabled: bool = True
    daily_request_limit: int = 100
    max_context_chars: int = 12_000
    audit_enabled: bool = True


class PermissionDeniedError(RuntimeError):
    pass


class ContextTooLargeError(ValueError):
    pass


class EveProvider(Protocol):
    name: str
    model: str

    async def generate(self, request: ChatRequest) -> ChatResponse: ...


class MockEveProvider:
    """Provider deterministico usato finché non viene collegato un modello reale."""

    name = "mock"
    model = "eve-foundation-mock-v1"

    async def generate(self, request: ChatRequest) -> ChatResponse:
        context = request.context
        available = [
            value
            for value in (context.room_id, context.course_id, context.lesson_id, context.section_id)
            if value
        ]
        context_label = " · ".join(available) if available else "nessun contesto didattico"
        sources = []
        if context.lesson_id:
            sources.append(SourceReference(title="Lezione corrente", locator=context.lesson_id))

        return ChatResponse(
            message=(
                "Questa è una risposta simulata della fondazione di Eve. "
                f"Ho ricevuto la modalità '{request.mode}' e il contesto: {context_label}. "
                "Non è ancora collegato un modello AI esterno."
            ),
            provider=self.name,
            model=self.model,
            uncertainty="simulazione: nessuna generazione AI reale",
            sources=sources,
            proposed_actions=[],
        )


@dataclass(frozen=True)
class AuditEvent:
    event_type: str
    user_fingerprint: str
    room_fingerprint: str | None
    provider: str
    outcome: str


class AuditLogger:
    """Registra metadati minimi e non salva messaggi, prompt o testo selezionato."""

    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled
        self.logger = logging.getLogger("eve.audit")

    @staticmethod
    def _fingerprint(value: str | None) -> str | None:
        if not value:
            return None
        return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]

    def record(self, *, event_type: str, request: ChatRequest, provider: str, outcome: str) -> AuditEvent:
        event = AuditEvent(
            event_type=event_type,
            user_fingerprint=self._fingerprint(request.context.user_id) or "missing",
            room_fingerprint=self._fingerprint(request.context.room_id),
            provider=provider,
            outcome=outcome,
        )
        if self.enabled:
            self.logger.info("eve_event=%s", event)
        return event


def require_permission(actual: PermissionLevel, required: PermissionLevel) -> None:
    order = {
        PermissionLevel.READ: 0,
        PermissionLevel.PROPOSE: 1,
        PermissionLevel.CONFIRM: 2,
        PermissionLevel.LIMITED_AUTOMATION: 3,
        PermissionLevel.ADMIN: 4,
    }
    if order[actual] < order[required]:
        raise PermissionDeniedError(f"Permesso richiesto: {required.value}")


def validate_context_size(request: ChatRequest, max_chars: int) -> None:
    selected = request.context.selected_text or ""
    if len(selected) > max_chars:
        raise ContextTooLargeError("Il testo selezionato supera il limite configurato")


def get_provider(settings: EveSettings) -> EveProvider:
    if settings.provider == "mock":
        return MockEveProvider()
    raise RuntimeError(f"Provider non configurato: {settings.provider}")


def health(settings: EveSettings) -> HealthResponse:
    return HealthResponse(
        status="ok" if settings.enabled else "disabled",
        enabled=settings.enabled,
        provider=settings.provider,
        environment=settings.environment,
    )
