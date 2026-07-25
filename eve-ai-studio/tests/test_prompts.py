from __future__ import annotations

from pathlib import Path

import pytest

from app.prompts.models import (
    DidacticMode,
    PromptParameters,
    PromptRevisionRequest,
    PromptStatus,
    PromptVersionCreateRequest,
)
from app.prompts.service import PromptService
from app.prompts.storage import (
    PromptConflictError,
    PromptTransitionError,
    PromptVersionNotFoundError,
    SqlitePromptStore,
)


BASE_PROMPT = (
    "Sei Eve, tutor didattico di Aula Studio Virtuale. Usa il contesto autorizzato, "
    "cita le fonti e guida lo studente con spiegazioni progressive e verificabili."
)


def make_service(tmp_path: Path, *, seed_default: bool = False) -> PromptService:
    return PromptService(SqlitePromptStore(tmp_path / "prompts.sqlite3"), seed_default=seed_default)


def create_base(service: PromptService):
    return service.create(
        PromptVersionCreateRequest(
            configuration_key="eve-test",
            name="Eve Test",
            system_prompt=BASE_PROMPT,
        )
    )


def test_schema_and_tables_are_created(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    assert service.store.schema_version == 1
    assert service.store.table_names() == {
        "prompt_versions",
        "prompt_transition_events",
        "prompt_active_state",
    }


def test_default_configuration_is_seeded_and_published(tmp_path: Path) -> None:
    service = make_service(tmp_path, seed_default=True)
    status = service.status()
    assert status.versions_count == 1
    assert status.published_count == 1
    assert status.active_configuration_key == "eve-system"
    active = service.get(status.active_version_id or 0)
    assert active.status is PromptStatus.PUBLISHED
    assert active.active is True


def test_create_starts_as_draft_and_duplicate_key_is_rejected(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    version = create_base(service)
    assert version.version_number == 1
    assert version.status is PromptStatus.DRAFT
    with pytest.raises(PromptConflictError):
        create_base(service)


def test_revision_is_immutable_and_increments_number(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    base = create_base(service)
    revised = service.revise(
        base.version_id,
        PromptRevisionRequest(
            system_prompt=BASE_PROMPT + " Non fornire subito la soluzione.",
            didactic_mode=DidacticMode.SOCRATIC,
        ),
    )
    assert revised.version_number == 2
    assert revised.parent_version_id == base.version_id
    assert revised.status is PromptStatus.DRAFT
    assert service.get(base.version_id).system_prompt == BASE_PROMPT


def test_invalid_transition_is_blocked(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    version = create_base(service)
    with pytest.raises(PromptTransitionError):
        service.transition(version.version_id, PromptStatus.PUBLISHED)


def test_publishable_requires_review_tests(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    version = create_base(service)
    service.transition(version.version_id, PromptStatus.IN_REVIEW)
    with pytest.raises(PromptTransitionError):
        service.transition(version.version_id, PromptStatus.PUBLISHABLE)
    result = service.transition(
        version.version_id,
        PromptStatus.PUBLISHABLE,
        review_tests_passed=True,
    )
    assert result.current_status is PromptStatus.PUBLISHABLE


def test_publishing_archives_previous_active_version(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    first = create_base(service)
    service.transition(first.version_id, PromptStatus.IN_REVIEW)
    service.transition(first.version_id, PromptStatus.PUBLISHABLE, review_tests_passed=True)
    service.transition(first.version_id, PromptStatus.PUBLISHED)

    second = service.revise(
        first.version_id,
        PromptRevisionRequest(system_prompt=BASE_PROMPT + " Usa esempi concreti."),
    )
    service.transition(second.version_id, PromptStatus.IN_REVIEW)
    service.transition(second.version_id, PromptStatus.PUBLISHABLE, review_tests_passed=True)
    service.transition(second.version_id, PromptStatus.PUBLISHED)

    assert service.get(first.version_id).status is PromptStatus.ARCHIVED
    assert service.get(first.version_id).active is False
    assert service.get(second.version_id).active is True


def test_compare_reports_content_and_parameter_changes(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    first = create_base(service)
    second = service.revise(
        first.version_id,
        PromptRevisionRequest(
            system_prompt=BASE_PROMPT + " Usa indizi graduati.",
            didactic_mode=DidacticMode.SOCRATIC,
            parameters=PromptParameters(depth=4, solution_policy="never_immediate"),
        ),
    )
    diff = service.compare(first.version_id, second.version_id)
    assert diff.changed is True
    assert "system_prompt" in diff.changed_fields
    assert "didactic_mode" in diff.changed_fields
    assert "parameters.depth" in diff.changed_fields
    assert "parameters.solution_policy" in diff.changed_fields


def test_rollback_creates_new_draft_without_deleting_history(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    first = create_base(service)
    second = service.revise(
        first.version_id,
        PromptRevisionRequest(system_prompt=BASE_PROMPT + " Versione due."),
    )
    rollback = service.rollback(first.version_id, note="Ripristino controllato")
    assert rollback.version_number == 3
    assert rollback.status is PromptStatus.DRAFT
    assert service.get(rollback.new_version_id).system_prompt == first.system_prompt
    assert len(service.list(configuration_key="eve-test")) == 3
    assert service.get(second.version_id).system_prompt.endswith("Versione due.")


def test_persistence_survives_reopen(tmp_path: Path) -> None:
    db_path = tmp_path / "prompts.sqlite3"
    first_store = SqlitePromptStore(db_path)
    first_service = PromptService(first_store, seed_default=False)
    created = create_base(first_service)
    first_store.close()

    second_store = SqlitePromptStore(db_path)
    second_service = PromptService(second_store, seed_default=False)
    restored = second_service.get(created.version_id)
    assert restored.configuration_key == "eve-test"
    assert restored.system_prompt == BASE_PROMPT


def test_missing_version_raises_specific_error(tmp_path: Path) -> None:
    service = make_service(tmp_path)
    with pytest.raises(PromptVersionNotFoundError):
        service.get(999)
