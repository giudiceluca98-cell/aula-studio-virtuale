from __future__ import annotations

import asyncio
import hashlib
import json
import math
from time import perf_counter

from ..models import ChatRequest, ChatResponse
from .catalog import ProviderCatalog
from .models import (
    ProviderAttempt,
    ProviderCatalogStatus,
    ProviderExecutionResult,
    ProviderExecutionTelemetry,
    TokenUsage,
)
from .profiles import ExecutionProfileRegistry
from .telemetry import ProviderTelemetryStore, utc_now


class ProviderExecutionError(RuntimeError):
    pass


class ProviderBudgetExceededError(ProviderExecutionError):
    pass


class ProviderProfileError(ProviderExecutionError):
    pass


def estimate_tokens(value: object) -> int:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    canonical = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return max(1, math.ceil(len(canonical) / 4))


def sha256_for(value: object) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    canonical = json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class ProviderOrchestrator:
    def __init__(
        self,
        catalog: ProviderCatalog,
        profiles: ExecutionProfileRegistry,
        telemetry: ProviderTelemetryStore,
    ) -> None:
        self.catalog = catalog
        self.profiles = profiles
        self.telemetry = telemetry

    def status(self) -> ProviderCatalogStatus:
        providers = self.catalog.providers()
        models = self.catalog.models()
        daily_tokens, daily_cost = self.telemetry.daily_usage()
        return ProviderCatalogStatus(
            providers_count=len(providers),
            enabled_providers_count=sum(1 for item in providers if item.enabled),
            external_providers_enabled=self.catalog.external_providers_enabled,
            models_count=len(models),
            enabled_models_count=sum(1 for item in models if item.enabled),
            profiles_count=len(self.profiles.list()),
            telemetry_events_count=self.telemetry.count(),
            daily_tokens=daily_tokens,
            daily_cost_usd=daily_cost,
        )

    async def execute(
        self,
        request: ChatRequest,
        *,
        profile_key: str,
        purpose: str,
    ) -> ProviderExecutionResult:
        profile = self.profiles.get(profile_key)
        if profile.purpose != purpose and profile.purpose != "shared":
            raise ProviderProfileError(
                f"Il profilo {profile_key} non è destinato a {purpose}"
            )

        input_tokens = estimate_tokens(request)
        if input_tokens > profile.max_input_tokens:
            raise ProviderBudgetExceededError("Budget token input superato")

        daily_tokens, daily_cost = self.telemetry.daily_usage()
        if daily_tokens + input_tokens > profile.daily_token_budget:
            raise ProviderBudgetExceededError("Budget token giornaliero superato")
        if (
            profile.daily_cost_budget_usd > 0
            and daily_cost >= profile.daily_cost_budget_usd
        ):
            raise ProviderBudgetExceededError("Budget costi giornaliero esaurito")

        request_hash = sha256_for(request)
        started_all = perf_counter()
        attempts: list[ProviderAttempt] = []
        last_error: str | None = None
        chosen_provider = profile.targets[0].provider_key
        chosen_model = profile.targets[0].model_key

        for target_index, target in enumerate(profile.targets):
            if self.catalog.provider(target.provider_key).external and not profile.external_allowed:
                last_error = "ExternalProviderNotAllowed"
                continue

            for attempt_number in range(1, profile.retry.max_attempts_per_target + 1):
                chosen_provider = target.provider_key
                chosen_model = target.model_key
                attempt_started = perf_counter()
                try:
                    provider = self.catalog.create(target.provider_key, target.model_key)
                    response = await asyncio.wait_for(
                        provider.generate(request),
                        timeout=profile.retry.timeout_ms / 1_000,
                    )
                    attempt_duration = (perf_counter() - attempt_started) * 1_000
                    attempts.append(
                        ProviderAttempt(
                            provider_key=target.provider_key,
                            model_key=target.model_key,
                            attempt_number=attempt_number,
                            duration_ms=attempt_duration,
                            status="success",
                        )
                    )

                    output_tokens = estimate_tokens(response)
                    usage = TokenUsage(
                        input_tokens=input_tokens,
                        output_tokens=output_tokens,
                        total_tokens=input_tokens + output_tokens,
                    )
                    model = self.catalog.model(target.model_key)
                    cost = (
                        input_tokens * model.input_cost_per_million_usd / 1_000_000
                        + output_tokens * model.output_cost_per_million_usd / 1_000_000
                    )

                    if (
                        output_tokens > profile.max_output_tokens
                        or usage.total_tokens > profile.max_total_tokens
                    ):
                        raise ProviderBudgetExceededError(
                            "Budget token dell'esecuzione superato"
                        )
                    if cost > profile.max_cost_per_run_usd:
                        raise ProviderBudgetExceededError(
                            "Budget costo della singola esecuzione superato"
                        )
                    if (
                        profile.daily_cost_budget_usd > 0
                        and daily_cost + cost > profile.daily_cost_budget_usd
                    ):
                        raise ProviderBudgetExceededError(
                            "Budget costi giornaliero superato"
                        )

                    telemetry = ProviderExecutionTelemetry(
                        created_at=utc_now(),
                        purpose=purpose,
                        profile_key=profile_key,
                        provider_key=target.provider_key,
                        model_key=target.model_key,
                        status="success",
                        attempts_count=len(attempts),
                        fallback_used=target_index > 0,
                        duration_ms=(perf_counter() - started_all) * 1_000,
                        usage=usage,
                        estimated_cost_usd=cost,
                        request_sha256=request_hash,
                        response_sha256=sha256_for(response),
                        attempts=attempts,
                    )
                    telemetry = self.telemetry.record(telemetry)
                    return ProviderExecutionResult(
                        response=response,
                        telemetry=telemetry,
                    )
                except ProviderBudgetExceededError:
                    raise
                except Exception as exc:
                    last_error = type(exc).__name__[:120]
                    attempts.append(
                        ProviderAttempt(
                            provider_key=target.provider_key,
                            model_key=target.model_key,
                            attempt_number=attempt_number,
                            duration_ms=(perf_counter() - attempt_started) * 1_000,
                            status="failed",
                            error_code=last_error,
                        )
                    )
                    if (
                        attempt_number < profile.retry.max_attempts_per_target
                        and profile.retry.backoff_ms
                    ):
                        await asyncio.sleep(profile.retry.backoff_ms / 1_000)

        usage = TokenUsage(
            input_tokens=input_tokens,
            output_tokens=0,
            total_tokens=input_tokens,
        )
        telemetry = ProviderExecutionTelemetry(
            created_at=utc_now(),
            purpose=purpose,
            profile_key=profile_key,
            provider_key=chosen_provider,
            model_key=chosen_model,
            status="failed",
            attempts_count=len(attempts),
            fallback_used=len(
                {(attempt.provider_key, attempt.model_key) for attempt in attempts}
            )
            > 1,
            duration_ms=(perf_counter() - started_all) * 1_000,
            usage=usage,
            estimated_cost_usd=0,
            request_sha256=request_hash,
            error_code=last_error or "ProviderUnavailable",
            attempts=attempts,
        )
        self.telemetry.record(telemetry)
        raise ProviderExecutionError(
            f"Nessun provider ha completato l'esecuzione: {telemetry.error_code}"
        )


class ManagedEveProvider:
    def __init__(
        self,
        orchestrator: ProviderOrchestrator,
        *,
        profile_key: str,
        purpose: str,
    ) -> None:
        self.orchestrator = orchestrator
        self.profile_key = profile_key
        self.purpose = purpose
        profile = orchestrator.profiles.get(profile_key)
        primary = profile.targets[0]
        self.name = primary.provider_key
        self.model = primary.model_key

    async def generate(self, request: ChatRequest) -> ChatResponse:
        result = await self.orchestrator.execute(
            request,
            profile_key=self.profile_key,
            purpose=self.purpose,
        )
        return result.response
