from __future__ import annotations

from ..core.config import EveSettings
from .base import EveProvider
from .mock import MockEveProvider


def get_provider(settings: EveSettings) -> EveProvider:
    if settings.provider == "mock":
        return MockEveProvider()
    raise RuntimeError(f"Provider non configurato: {settings.provider}")
