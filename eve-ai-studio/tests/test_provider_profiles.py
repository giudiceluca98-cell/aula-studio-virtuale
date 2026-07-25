import pytest

from app.providers.profiles import (
    ExecutionProfileDisabledError,
    build_default_profiles,
)


def test_default_profiles_count() -> None:
    assert len(build_default_profiles().list()) == 3


def test_evaluation_profile_has_fallback() -> None:
    profile = build_default_profiles().get("evaluation-safe")
    assert len(profile.targets) == 2
    assert profile.external_allowed is False


def test_chat_profile_retry_and_timeout() -> None:
    profile = build_default_profiles().get("chat-development")
    assert profile.retry.max_attempts_per_target == 2
    assert profile.retry.timeout_ms == 2_000


def test_external_profile_disabled() -> None:
    with pytest.raises(ExecutionProfileDisabledError):
        build_default_profiles().get("external-review")
