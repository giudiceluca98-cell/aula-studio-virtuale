from __future__ import annotations

from collections.abc import Callable

from .base import EveProvider
from .mock import MockEveProvider
from .models import ModelDescriptor, ProviderDescriptor, ProviderKind

ProviderFactory = Callable[[], EveProvider]


class ProviderCatalogError(RuntimeError):
    pass


class ProviderDisabledError(ProviderCatalogError):
    pass


class ModelDisabledError(ProviderCatalogError):
    pass


class ProviderCatalog:
    def __init__(self, *, external_providers_enabled: bool = False) -> None:
        self.external_providers_enabled = bool(external_providers_enabled)
        self._providers: dict[str, ProviderDescriptor] = {}
        self._models: dict[str, ModelDescriptor] = {}
        self._factories: dict[tuple[str, str], ProviderFactory] = {}

    def register_provider(self, descriptor: ProviderDescriptor) -> None:
        self._providers[descriptor.key] = descriptor

    def register_model(
        self,
        descriptor: ModelDescriptor,
        factory: ProviderFactory | None = None,
    ) -> None:
        if descriptor.provider_key not in self._providers:
            raise ProviderCatalogError(f"Provider sconosciuto: {descriptor.provider_key}")
        self._models[descriptor.key] = descriptor
        provider = self._providers[descriptor.provider_key]
        if descriptor.key not in provider.models:
            self._providers[provider.key] = provider.model_copy(
                update={"models": [*provider.models, descriptor.key]}
            )
        if factory is not None:
            self._factories[(descriptor.provider_key, descriptor.key)] = factory

    def providers(self) -> list[ProviderDescriptor]:
        return sorted(self._providers.values(), key=lambda item: item.key)

    def models(self) -> list[ModelDescriptor]:
        return sorted(self._models.values(), key=lambda item: item.key)

    def provider(self, key: str) -> ProviderDescriptor:
        try:
            return self._providers[key]
        except KeyError as exc:
            raise ProviderCatalogError(f"Provider non registrato: {key}") from exc

    def model(self, key: str) -> ModelDescriptor:
        try:
            return self._models[key]
        except KeyError as exc:
            raise ProviderCatalogError(f"Modello non registrato: {key}") from exc

    def create(self, provider_key: str, model_key: str) -> EveProvider:
        provider = self.provider(provider_key)
        model = self.model(model_key)
        if model.provider_key != provider_key:
            raise ProviderCatalogError("Il modello non appartiene al provider richiesto")
        if not provider.enabled:
            raise ProviderDisabledError(
                provider.reason_disabled or f"Provider disattivato: {provider_key}"
            )
        if provider.external and not self.external_providers_enabled:
            raise ProviderDisabledError("I provider esterni sono disattivati")
        if not model.enabled:
            raise ModelDisabledError(
                model.reason_disabled or f"Modello disattivato: {model_key}"
            )
        try:
            factory = self._factories[(provider_key, model_key)]
        except KeyError as exc:
            raise ProviderCatalogError("Factory del modello non configurata") from exc
        return factory()


def build_default_catalog(*, external_providers_enabled: bool = False) -> ProviderCatalog:
    catalog = ProviderCatalog(external_providers_enabled=external_providers_enabled)
    catalog.register_provider(
        ProviderDescriptor(
            key="mock",
            label="Provider mock deterministico",
            kind=ProviderKind.MOCK,
            enabled=True,
            external=False,
        )
    )
    catalog.register_provider(
        ProviderDescriptor(
            key="external-template",
            label="Provider esterno non configurato",
            kind=ProviderKind.EXTERNAL,
            enabled=False,
            external=True,
            reason_disabled="Nessuna chiave o integrazione esterna configurata",
        )
    )
    catalog.register_model(
        ModelDescriptor(
            key="eve-foundation-mock-v2",
            provider_key="mock",
            label="Mock primario v2",
            enabled=True,
            deterministic=True,
            context_window=128_000,
        ),
        lambda: MockEveProvider("eve-foundation-mock-v2"),
    )
    catalog.register_model(
        ModelDescriptor(
            key="eve-foundation-mock-fallback-v1",
            provider_key="mock",
            label="Mock fallback v1",
            enabled=True,
            deterministic=True,
            context_window=64_000,
        ),
        lambda: MockEveProvider("eve-foundation-mock-fallback-v1"),
    )
    catalog.register_model(
        ModelDescriptor(
            key="external-model-placeholder",
            provider_key="external-template",
            label="Modello esterno non configurato",
            enabled=False,
            deterministic=False,
            reason_disabled="Provider esterno disattivato per impostazione predefinita",
        )
    )
    return catalog
