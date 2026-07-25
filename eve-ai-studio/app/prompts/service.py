from __future__ import annotations

from .modes import DIDACTIC_MODES
from .models import (
    DidacticModeDefinition,
    PromptCatalogStatus,
    PromptRevisionRequest,
    PromptRollbackResult,
    PromptStatus,
    PromptTransitionResult,
    PromptVersionCreateRequest,
    PromptVersionDetail,
    PromptVersionDiff,
    PromptVersionSummary,
)
from .storage import SqlitePromptStore


DEFAULT_SYSTEM_PROMPT = (
    "Sei Eve, tutor didattico di Aula Studio Virtuale. Usa soltanto il contesto "
    "autorizzato, mostra le fonti quando richieste, distingui fatti e ipotesi, "
    "dichiara l'incertezza e non eseguire azioni senza il livello di autorizzazione "
    "necessario. Adatta spiegazioni, esempi e domande al livello dello studente."
)


class PromptService:
    def __init__(self, store: SqlitePromptStore, *, seed_default: bool = True) -> None:
        self.store = store
        if seed_default and store.versions_count() == 0:
            self._seed_default()

    def _seed_default(self) -> None:
        version = self.store.create(
            PromptVersionCreateRequest(
                configuration_key="eve-system",
                name="Eve Tutor Base",
                system_prompt=DEFAULT_SYSTEM_PROMPT,
                note="Configurazione iniziale del Checkpoint 0.4",
            )
        )
        self.store.transition(version.version_id, PromptStatus.IN_REVIEW)
        self.store.transition(
            version.version_id,
            PromptStatus.PUBLISHABLE,
            review_tests_passed=True,
        )
        self.store.transition(version.version_id, PromptStatus.PUBLISHED)

    def modes(self) -> list[DidacticModeDefinition]:
        return list(DIDACTIC_MODES)

    def status(self) -> PromptCatalogStatus:
        return self.store.status()

    def create(self, request: PromptVersionCreateRequest) -> PromptVersionDetail:
        return self.store.create(request)

    def revise(self, version_id: int, request: PromptRevisionRequest) -> PromptVersionDetail:
        return self.store.create_revision(version_id, request)

    def list(
        self,
        *,
        configuration_key: str | None = None,
        status: PromptStatus | None = None,
        limit: int = 100,
    ) -> list[PromptVersionSummary]:
        return self.store.list_versions(
            configuration_key=configuration_key,
            status=status,
            limit=limit,
        )

    def get(self, version_id: int) -> PromptVersionDetail:
        return self.store.get(version_id)

    def transition(
        self,
        version_id: int,
        target_status: PromptStatus,
        *,
        review_tests_passed: bool = False,
        note: str | None = None,
    ) -> PromptTransitionResult:
        return self.store.transition(
            version_id,
            target_status,
            review_tests_passed=review_tests_passed,
            note=note,
        )

    def compare(self, from_version_id: int, to_version_id: int) -> PromptVersionDiff:
        return self.store.compare(from_version_id, to_version_id)

    def rollback(self, version_id: int, *, note: str | None = None) -> PromptRollbackResult:
        return self.store.rollback(version_id, note=note)
