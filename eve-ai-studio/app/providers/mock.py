from __future__ import annotations

import asyncio

from ..models import ChatRequest, ChatResponse, SourceReference


class MockEveProvider:
    """Provider deterministico configurabile, senza chiavi o chiamate esterne."""

    name = "mock"

    def __init__(
        self,
        model: str = "eve-foundation-mock-v2",
        *,
        delay_ms: float = 0,
        failures_before_success: int = 0,
    ) -> None:
        self.model = model
        self.delay_ms = float(delay_ms)
        self.failures_before_success = int(failures_before_success)
        self.calls = 0

    async def generate(self, request: ChatRequest) -> ChatResponse:
        self.calls += 1
        if self.delay_ms:
            await asyncio.sleep(self.delay_ms / 1_000)
        if self.calls <= self.failures_before_success:
            raise RuntimeError("mock transient failure")

        context = request.context
        available = [
            value
            for value in (
                context.room_id,
                context.course_id,
                context.lesson_id,
                context.section_id,
            )
            if value
        ]
        context_label = " · ".join(available) if available else "nessun contesto didattico"
        sources = []
        if context.lesson_id:
            sources.append(
                SourceReference(title="Lezione corrente", locator=context.lesson_id)
            )

        return ChatResponse(
            message=(
                "Questa è una risposta simulata della fondazione modulare di Eve. "
                f"Ho ricevuto la modalità '{request.mode}' e il contesto: {context_label}. "
                "Non è ancora collegato un modello AI esterno."
            ),
            provider=self.name,
            model=self.model,
            uncertainty="simulazione: nessuna generazione AI reale",
            sources=sources,
            proposed_actions=[],
        )
