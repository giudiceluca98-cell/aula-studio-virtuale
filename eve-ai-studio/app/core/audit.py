from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass

from ..models import ChatRequest


@dataclass(frozen=True)
class AuditEvent:
    event_type: str
    user_fingerprint: str
    room_fingerprint: str | None
    provider: str
    outcome: str


class AuditLogger:
    """Registra metadati minimi, senza messaggi, prompt o testo selezionato."""

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
