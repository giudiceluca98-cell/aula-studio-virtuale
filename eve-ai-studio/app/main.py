from __future__ import annotations

from fastapi import FastAPI, HTTPException, status

from .foundation import (
    AuditLogger,
    ContextTooLargeError,
    EveSettings,
    get_provider,
    health,
    validate_context_size,
)
from .models import ChatRequest, ChatResponse, HealthResponse

settings = EveSettings()
provider = get_provider(settings)
audit = AuditLogger(enabled=settings.audit_enabled)

app = FastAPI(
    title="Eve AI Studio",
    version="0.1.0",
    description="Fondazione isolata del servizio Eve. Nessun modello esterno è collegato.",
)


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return health(settings)


@app.post("/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not settings.enabled:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Eve è disattivata")

    try:
        validate_context_size(request, settings.max_context_chars)
        response = await provider.generate(request)
    except ContextTooLargeError as exc:
        audit.record(event_type="chat", request=request, provider=provider.name, outcome="rejected_context")
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=str(exc)) from exc
    except Exception as exc:
        audit.record(event_type="chat", request=request, provider=provider.name, outcome="provider_error")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Provider Eve non disponibile") from exc

    audit.record(event_type="chat", request=request, provider=provider.name, outcome="success")
    return response
