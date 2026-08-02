from __future__ import annotations

from ..core.config import EveSettings
from .base import EveProvider
from .bootstrap import build_provider_runtime


def get_provider(settings: EveSettings) -> EveProvider:
    """Compatibilità con i checkpoint precedenti, senza esporre segreti."""

    runtime = build_provider_runtime(settings)
    if settings.provider == "mock":
        return runtime.catalog.create("mock", "eve-foundation-mock-v2")
    if settings.provider == settings.external_provider_key:
        return runtime.catalog.create(settings.external_provider_key, settings.external_provider_model)
    raise RuntimeError(f"Provider non configurato: {settings.provider}")
