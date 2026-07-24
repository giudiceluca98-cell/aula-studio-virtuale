from __future__ import annotations

from ..models import ChatRequest, ChatResponse, SourceReference


class MockEveProvider:
    """Provider deterministico usato finché non viene collegato un modello reale."""

    name = "mock"
    model = "eve-foundation-mock-v2"

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
