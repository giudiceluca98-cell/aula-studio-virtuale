from __future__ import annotations

from ..models import ChatRequest


class ContextTooLargeError(ValueError):
    pass


def validate_context_size(request: ChatRequest, max_chars: int) -> None:
    selected = request.context.selected_text or ""
    if len(selected) > max_chars:
        raise ContextTooLargeError("Il testo selezionato supera il limite configurato")
