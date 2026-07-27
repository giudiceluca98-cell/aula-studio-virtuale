from __future__ import annotations


class RagError(RuntimeError):
    code = "rag_error"


class RagRoomRequiredError(RagError):
    code = "rag_room_required"

    def __init__(self) -> None:
        super().__init__("La chat RAG richiede un'aula autorizzata")
