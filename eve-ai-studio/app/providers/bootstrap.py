from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from ..core.config import EveSettings
from .catalog import ProviderCatalog, build_default_catalog
from .external import ExternalProviderConfig, JsonChatTransport, OpenAICompatibleEveProvider
from .models import (
    ExecutionProfile,
    ExecutionTarget,
    ModelDescriptor,
    ProviderDescriptor,
    ProviderKind,
    RetryPolicy,
)
from .profiles import ExecutionProfileRegistry, build_default_profiles
from .runtime import ProviderRuntimeGuard, ProviderRuntimePolicy


@dataclass(frozen=True, slots=True)
class ProviderRuntimeBundle:
    catalog: ProviderCatalog
    profiles: ExecutionProfileRegistry
    guard: ProviderRuntimeGuard | None
    external_configured: bool
    external_reason: str | None


def _external_config(settings: EveSettings) -> tuple[ExternalProviderConfig | None, str | None]:
    if not settings.external_providers_enabled:
        return None, "Provider esterni disattivati"
    missing = [
        name
        for name, value in (
            ("EVE_EXTERNAL_PROVIDER_BASE_URL", settings.external_provider_base_url),
            ("EVE_EXTERNAL_PROVIDER_API_KEY", settings.external_provider_api_key),
            ("EVE_EXTERNAL_PROVIDER_MODEL", settings.external_provider_model),
        )
        if not str(value).strip()
    ]
    if missing:
        return None, "Configurazione incompleta: " + ", ".join(missing)
    try:
        return ExternalProviderConfig(
            provider_key=settings.external_provider_key.strip(),
            provider_label=settings.external_provider_label.strip(),
            model_key=settings.external_provider_model.strip(),
            model_label=settings.external_provider_model_label.strip(),
            base_url=settings.external_provider_base_url.strip(),
            api_key=settings.external_provider_api_key.strip(),
            timeout_seconds=settings.external_provider_timeout_seconds,
            max_response_bytes=settings.external_provider_max_response_bytes,
            temperature=settings.external_provider_temperature,
            max_output_tokens=settings.external_provider_max_output_tokens,
            context_window=settings.external_provider_context_window,
            input_cost_per_million_usd=settings.external_provider_input_cost_per_million_usd,
            output_cost_per_million_usd=settings.external_provider_output_cost_per_million_usd,
        ), None
    except ValueError as error:
        return None, str(error)[:300]


def _production_profile(settings: EveSettings, config: ExternalProviderConfig | None) -> ExecutionProfile:
    provider_key = config.provider_key if config else settings.external_provider_key.strip() or "openai-compatible"
    model_key = config.model_key if config else settings.external_provider_model.strip() or "external-model-unconfigured"
    return ExecutionProfile(
        key="chat-production",
        label="Chat provider reale con fallback mock",
        purpose="chat",
        enabled=config is not None,
        external_allowed=True,
        targets=[
            ExecutionTarget(provider_key=provider_key, model_key=model_key),
            ExecutionTarget(provider_key="mock", model_key="eve-foundation-mock-fallback-v1"),
        ],
        retry=RetryPolicy(
            max_attempts_per_target=2,
            timeout_ms=max(1_000, min(120_000, int(settings.external_provider_timeout_seconds * 1_000))),
            backoff_ms=100,
        ),
        max_input_tokens=settings.chat_production_max_input_tokens,
        max_output_tokens=settings.chat_production_max_output_tokens,
        max_total_tokens=settings.chat_production_max_total_tokens,
        max_cost_per_run_usd=settings.chat_production_max_cost_per_run_usd,
        daily_token_budget=settings.chat_production_daily_token_budget,
        daily_cost_budget_usd=settings.chat_production_daily_cost_budget_usd,
    )


def build_provider_runtime(
    settings: EveSettings,
    *,
    transport: JsonChatTransport | None = None,
) -> ProviderRuntimeBundle:
    catalog = build_default_catalog(external_providers_enabled=settings.external_providers_enabled)
    config, reason = _external_config(settings)
    profiles = build_default_profiles().list()
    guard = None
    if settings.external_providers_enabled:
        provider_key = config.provider_key if config else settings.external_provider_key.strip() or "openai-compatible"
        model_key = config.model_key if config else settings.external_provider_model.strip() or "external-model-unconfigured"
        catalog.register_provider(
            ProviderDescriptor(
                key=provider_key,
                label=config.provider_label if config else settings.external_provider_label,
                kind=ProviderKind.EXTERNAL,
                enabled=config is not None,
                external=True,
                reason_disabled=reason,
            )
        )
        catalog.register_model(
            ModelDescriptor(
                key=model_key,
                provider_key=provider_key,
                label=config.model_label if config else settings.external_provider_model_label,
                enabled=config is not None,
                deterministic=False,
                context_window=config.context_window if config else settings.external_provider_context_window,
                input_cost_per_million_usd=config.input_cost_per_million_usd if config else 0,
                output_cost_per_million_usd=config.output_cost_per_million_usd if config else 0,
                reason_disabled=reason,
            ),
            (lambda: OpenAICompatibleEveProvider(config, transport)) if config else None,
        )
        profiles.append(_production_profile(settings, config))
        if config:
            guard = ProviderRuntimeGuard(
                ProviderRuntimePolicy(
                    requests_per_minute=settings.provider_rate_limit_per_minute,
                    circuit_failure_threshold=settings.provider_circuit_failure_threshold,
                    circuit_recovery_seconds=settings.provider_circuit_recovery_seconds,
                )
            )
    return ProviderRuntimeBundle(
        catalog=catalog,
        profiles=ExecutionProfileRegistry(profiles),
        guard=guard,
        external_configured=config is not None,
        external_reason=reason,
    )
