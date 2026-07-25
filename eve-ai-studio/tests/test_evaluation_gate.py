from types import SimpleNamespace

import pytest

from app.prompts.models import PromptStatus
from app.prompts.service import PromptService
from app.prompts.storage import PromptTransitionError


class FakePromptStore:
    def __init__(self) -> None:
        self.calls: list[tuple[object, ...]] = []

    def versions_count(self) -> int:
        return 1

    def transition(
        self,
        version_id: int,
        target_status: PromptStatus,
        *,
        review_tests_passed: bool = False,
        note: str | None = None,
    ):
        self.calls.append(
            (version_id, target_status, review_tests_passed, note)
        )
        return SimpleNamespace()


def test_prompt_publishable_uses_persisted_gate_not_legacy_boolean() -> None:
    store = FakePromptStore()
    service = PromptService(
        store,  # type: ignore[arg-type]
        seed_default=False,
        evaluation_gate=lambda _: SimpleNamespace(
            eligible=True,
            latest_run_id=12,
            reasons=[],
        ),
    )
    service.transition(
        3,
        PromptStatus.PUBLISHABLE,
        review_tests_passed=False,
    )
    assert store.calls[-1][2] is True
    assert "12" in str(store.calls[-1][3])


def test_prompt_publishable_is_blocked_even_when_legacy_boolean_true() -> None:
    store = FakePromptStore()
    service = PromptService(
        store,  # type: ignore[arg-type]
        seed_default=False,
        evaluation_gate=lambda _: SimpleNamespace(
            eligible=False,
            latest_run_id=13,
            reasons=["Errore critico"],
        ),
    )
    with pytest.raises(PromptTransitionError, match="Errore critico"):
        service.transition(
            3,
            PromptStatus.PUBLISHABLE,
            review_tests_passed=True,
        )
    assert store.calls == []
