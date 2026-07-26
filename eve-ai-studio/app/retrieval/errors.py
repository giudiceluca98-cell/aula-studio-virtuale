from __future__ import annotations


class RetrievalError(RuntimeError):
    code = "retrieval_error"
    public_message = "La ricerca non può essere completata"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.public_message)


class InvalidRetrievalQueryError(RetrievalError):
    code = "invalid_retrieval_query"
    public_message = "La query di ricerca non contiene termini utilizzabili"
