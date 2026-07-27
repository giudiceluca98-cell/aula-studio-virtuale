from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

from ..retrieval import RetrievalSearchRequest, RetrievalService
from .errors import RagRoomRequiredError
from .models import RagChatRequest, RagChatResponse, RagSource, RagStatus


@dataclass(frozen=True, slots=True)
class RagLimits:
    max_sources: int = 4
    max_answer_chars: int = 4_000

    def validate(self) -> None:
        if self.max_sources < 1 or self.max_sources > 10:
            raise ValueError("max_sources deve essere compreso tra 1 e 10")
        if self.max_answer_chars < 500:
            raise ValueError("max_answer_chars deve essere almeno 500")


class RagChatService:
    provider = "local-rag"
    model = "eve-grounded-extractive-v1"
    stage = "grounded_extractive_chat_no_embeddings"
    knowledge_scope = "authorized_room_current_ready_materials_only"

    def __init__(
        self,
        retrieval: RetrievalService,
        *,
        limits: RagLimits | None = None,
    ) -> None:
        self.retrieval = retrieval
        self.limits = limits or RagLimits()
        self.limits.validate()

    def status(self) -> RagStatus:
        return RagStatus(
            enabled=True,
            deterministic=True,
            provider=self.provider,
            model=self.model,
            retrieval_stage=self.stage,
            embeddings_enabled=False,
            external_provider_enabled=False,
            source_scope=self.knowledge_scope,
            suspicious_source_policy="exclude_from_answer_and_citations",
            max_sources=self.limits.max_sources,
            max_answer_chars=self.limits.max_answer_chars,
        )

    @staticmethod
    def _statement(excerpt: str) -> str:
        compact = " ".join(excerpt.split())
        if not compact:
            return ""
        sentences = re.split(r"(?<=[.!?])\s+", compact)
        statement = next((item.strip() for item in sentences if item.strip()), compact)
        if len(statement) > 360:
            statement = statement[:357].rstrip() + "..."
        return statement

    def _build_answer(self, request: RagChatRequest, sources: list[RagSource]) -> str:
        mode_labels = {
            "summary": "Sintesi",
            "summarize": "Sintesi",
            "explain": "Spiegazione",
            "technical": "Spiegazione tecnica",
            "socratic": "Punti di partenza",
        }
        label = mode_labels.get(request.mode.casefold(), "Risposta")
        lines = [
            "Risposta basata esclusivamente sui materiali autorizzati dell'aula.",
            "",
            f"{label}:",
        ]
        seen: set[str] = set()
        for index, source in enumerate(sources, start=1):
            statement = self._statement(source.excerpt)
            key = statement.casefold()
            if not statement or key in seen:
                continue
            seen.add(key)
            lines.append(f"{index}. {statement} [{index}]")
        if not seen:
            lines.append("I passaggi recuperati non contengono testo utilizzabile.")
        lines.extend(
            [
                "",
                "Le citazioni [n] rimandano ai passaggi verificati elencati nella risposta strutturata.",
            ]
        )
        answer = "\n".join(lines)
        if len(answer) > self.limits.max_answer_chars:
            answer = answer[: self.limits.max_answer_chars - 3].rstrip() + "..."
        return answer

    def answer(self, request: RagChatRequest) -> RagChatResponse:
        room_id = request.context.room_id
        if not room_id:
            raise RagRoomRequiredError()

        effective_limit = min(request.limit, self.limits.max_sources)
        search_limit = min(
            self.retrieval.limits.max_results,
            max(effective_limit * 3, effective_limit),
        )
        retrieved = self.retrieval.search(
            RetrievalSearchRequest(
                room_id=room_id,
                query=request.message,
                limit=search_limit,
                material_ids=request.material_ids,
            )
        )

        safe_hits = [hit for hit in retrieved.hits if not hit.suspicious_content]
        excluded_suspicious = len(retrieved.hits) - len(safe_hits)
        selected_hits = safe_hits[:effective_limit]
        sources = [
            RagSource(
                rank=index,
                score=hit.score,
                excerpt=hit.excerpt,
                matched_terms=hit.matched_terms,
                exact_phrase=hit.exact_phrase,
                suspicious_content=hit.suspicious_content,
                safety_flags=hit.safety_flags,
                citation=hit.citation,
            )
            for index, hit in enumerate(selected_hits, start=1)
        ]

        if sources:
            message = self._build_answer(request, sources)
            uncertainty = (
                "Risposta estrattiva deterministica: usa soltanto i passaggi citati e "
                "non rappresenta ancora una generazione AI reale."
            )
            grounded = True
        elif excluded_suspicious:
            message = (
                "Ho trovato soltanto passaggi contrassegnati come contenuto sospetto. "
                "Non li uso per costruire la risposta e non aggiungo informazioni non supportate."
            )
            uncertainty = "Fonti pertinenti escluse dalla policy di sicurezza documentale."
            grounded = False
        elif retrieved.integrity_failures:
            message = (
                "I passaggi potenzialmente pertinenti non hanno superato il controllo di integrità. "
                "Non produco una risposta basata su fonti alterate."
            )
            uncertainty = "Nessuna fonte integra disponibile per questa domanda."
            grounded = False
        else:
            message = (
                "Non ho trovato nei materiali autorizzati dell'aula passaggi sufficientemente "
                "pertinenti per rispondere. Non aggiungo informazioni non supportate."
            )
            uncertainty = "Nessuna fonte pertinente trovata nel perimetro autorizzato."
            grounded = False

        return RagChatResponse(
            message=message,
            provider=self.provider,
            model=self.model,
            uncertainty=uncertainty,
            grounded=grounded,
            knowledge_scope=self.knowledge_scope,
            retrieval_stage=self.stage,
            query_sha256=retrieved.query_sha256,
            answer_sha256=hashlib.sha256(message.encode("utf-8")).hexdigest(),
            total_candidates=retrieved.total_candidates,
            integrity_failures=retrieved.integrity_failures,
            excluded_suspicious_hits=excluded_suspicious,
            sources=sources,
            proposed_actions=[],
        )
