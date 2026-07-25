from __future__ import annotations

from ..core.config import EveSettings
from .base import EveProvider
from .catalog import build_default_catalog


def get_provider(settings: EveSettings) -> EveProvider:
    """Compatibilità con i checkpoint precedenti.

    Il nuovo codice usa ProviderOrchestrator. Questa funzione mantiene il
    contratto storico senza abilitare provider esterni.
    """

    catalog = build_default_catalog(
        external_providers_enabled=settings.external_providers_enabled
    )
    if settings.provider == "mock":
        return catalog.create("mock", "eve-foundation-mock-v2")
    raise RuntimeError(f"Provider non configurato: {settings.provider}")
