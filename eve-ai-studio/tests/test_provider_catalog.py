import pytest

from app.providers.catalog import (
    ModelDisabledError,
    ProviderCatalog,
    ProviderDisabledError,
    build_default_catalog,
)
from app.providers.models import ModelDescriptor, ProviderDescriptor, ProviderKind


def test_default_catalog_has_mock_and_external_placeholder() -> None:
    catalog = build_default_catalog()
    assert {provider.key for provider in catalog.providers()} == {
        "mock",
        "external-template",
    }


def test_external_provider_disabled_by_default() -> None:
    catalog = build_default_catalog()
    with pytest.raises(ProviderDisabledError):
        catalog.create("external-template", "external-model-placeholder")


def test_mock_models_are_enabled() -> None:
    catalog = build_default_catalog()
    assert {model.key for model in catalog.models() if model.enabled} == {
        "eve-foundation-mock-v2",
        "eve-foundation-mock-fallback-v1",
    }


def test_create_primary_mock_model() -> None:
    provider = build_default_catalog().create("mock", "eve-foundation-mock-v2")
    assert provider.name == "mock"
    assert provider.model == "eve-foundation-mock-v2"


def test_model_must_belong_to_provider() -> None:
    catalog = build_default_catalog()
    with pytest.raises(Exception):
        catalog.create("mock", "external-model-placeholder")


def test_disabled_model_is_rejected() -> None:
    catalog = ProviderCatalog(external_providers_enabled=True)
    catalog.register_provider(
        ProviderDescriptor(
            key="x",
            label="x",
            kind=ProviderKind.MOCK,
            enabled=True,
        )
    )
    catalog.register_model(
        ModelDescriptor(
            key="m",
            provider_key="x",
            label="m",
            enabled=False,
        )
    )
    with pytest.raises(ModelDisabledError):
        catalog.create("x", "m")
