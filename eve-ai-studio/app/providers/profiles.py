from __future__ import annotations

from .models import ExecutionProfile, ExecutionTarget, RetryPolicy


class ExecutionProfileNotFoundError(KeyError):
    pass


class ExecutionProfileDisabledError(RuntimeError):
    pass


class ExecutionProfileRegistry:
    def __init__(self, profiles: list[ExecutionProfile]) -> None:
        self._profiles = {item.key: item for item in profiles}

    def list(self) -> list[ExecutionProfile]:
        return sorted(self._profiles.values(), key=lambda item: item.key)

    def get(self, key: str) -> ExecutionProfile:
        try:
            profile = self._profiles[key]
        except KeyError as exc:
            raise ExecutionProfileNotFoundError(key) from exc
        if not profile.enabled:
            raise ExecutionProfileDisabledError(f"Profilo disattivato: {key}")
        return profile


def build_default_profiles() -> ExecutionProfileRegistry:
    return ExecutionProfileRegistry(
        [
            ExecutionProfile(
                key="chat-development",
                label="Chat sviluppo sicura",
                purpose="chat",
                targets=[
                    ExecutionTarget(
                        provider_key="mock",
                        model_key="eve-foundation-mock-v2",
                    )
                ],
                retry=RetryPolicy(
                    max_attempts_per_target=2,
                    timeout_ms=2_000,
                    backoff_ms=10,
                ),
                external_allowed=False,
                max_input_tokens=8_000,
                max_output_tokens=4_000,
                max_total_tokens=12_000,
                max_cost_per_run_usd=0,
                daily_token_budget=250_000,
                daily_cost_budget_usd=0,
            ),
            ExecutionProfile(
                key="evaluation-safe",
                label="Valutazioni deterministiche",
                purpose="evaluation",
                targets=[
                    ExecutionTarget(
                        provider_key="mock",
                        model_key="eve-foundation-mock-v2",
                    ),
                    ExecutionTarget(
                        provider_key="mock",
                        model_key="eve-foundation-mock-fallback-v1",
                    ),
                ],
                retry=RetryPolicy(
                    max_attempts_per_target=2,
                    timeout_ms=1_500,
                    backoff_ms=5,
                ),
                external_allowed=False,
                max_input_tokens=12_000,
                max_output_tokens=4_000,
                max_total_tokens=16_000,
                max_cost_per_run_usd=0,
                daily_token_budget=1_000_000,
                daily_cost_budget_usd=0,
            ),
            ExecutionProfile(
                key="external-review",
                label="Revisione provider esterno",
                purpose="review",
                enabled=False,
                external_allowed=True,
                targets=[
                    ExecutionTarget(
                        provider_key="external-template",
                        model_key="external-model-placeholder",
                    )
                ],
                retry=RetryPolicy(
                    max_attempts_per_target=1,
                    timeout_ms=15_000,
                    backoff_ms=0,
                ),
                max_input_tokens=16_000,
                max_output_tokens=4_000,
                max_total_tokens=20_000,
                max_cost_per_run_usd=0.25,
                daily_token_budget=100_000,
                daily_cost_budget_usd=2.0,
            ),
        ]
    )
