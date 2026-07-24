from __future__ import annotations

from typing import Protocol

from ..models import ChatRequest, ChatResponse


class EveProvider(Protocol):
    name: str
    model: str

    async def generate(self, request: ChatRequest) -> ChatResponse: ...
