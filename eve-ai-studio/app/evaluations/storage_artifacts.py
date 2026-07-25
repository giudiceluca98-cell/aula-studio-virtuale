from __future__ import annotations

from .models import EvaluationRunArtifact, EvaluationRunArtifactInput
from .storage_base import EvaluationRunNotFoundError, EvaluationRunStateError


class ArtifactStorageMixin:
    def save_artifacts(
        self,
        run_id: int,
        artifacts: list[EvaluationRunArtifactInput],
    ) -> list[EvaluationRunArtifact]:
        with self._lock:
            run = self._connection.execute(
                "SELECT id FROM evaluation_runs WHERE id = ?",
                (run_id,),
            ).fetchone()
            if not run:
                raise EvaluationRunNotFoundError(run_id)
            expected = {
                int(row["scenario_version_id"])
                for row in self._connection.execute(
                    "SELECT scenario_version_id FROM evaluation_run_scenarios WHERE run_id = ?",
                    (run_id,),
                ).fetchall()
            }
        provided = {item.scenario_version_id for item in artifacts}
        if expected != provided:
            raise EvaluationRunStateError(
                "Gli artefatti non coprono esattamente lo snapshot della suite"
            )
        with self._lock, self._connection:
            self._connection.executemany(
                """
                INSERT INTO evaluation_run_artifacts (
                    run_id, scenario_version_id, provider, model, duration_ms,
                    output_sha256, output_chars, sources_count,
                    proposed_actions_count, redacted, error_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        run_id,
                        item.scenario_version_id,
                        item.provider,
                        item.model,
                        item.duration_ms,
                        item.output_sha256,
                        item.output_chars,
                        item.sources_count,
                        item.proposed_actions_count,
                        int(item.redacted),
                        item.error_code,
                    )
                    for item in artifacts
                ],
            )
        return self.list_artifacts(run_id)

    def list_artifacts(self, run_id: int) -> list[EvaluationRunArtifact]:
        with self._lock:
            run = self._connection.execute(
                "SELECT id FROM evaluation_runs WHERE id = ?",
                (run_id,),
            ).fetchone()
            if not run:
                raise EvaluationRunNotFoundError(run_id)
            rows = self._connection.execute(
                """
                SELECT * FROM evaluation_run_artifacts
                WHERE run_id = ?
                ORDER BY scenario_version_id
                """,
                (run_id,),
            ).fetchall()
        return [
            EvaluationRunArtifact(
                run_id=int(row["run_id"]),
                scenario_version_id=int(row["scenario_version_id"]),
                provider=str(row["provider"]),
                model=str(row["model"]),
                duration_ms=float(row["duration_ms"]),
                output_sha256=str(row["output_sha256"]),
                output_chars=int(row["output_chars"]),
                sources_count=int(row["sources_count"]),
                proposed_actions_count=int(row["proposed_actions_count"]),
                redacted=bool(row["redacted"]),
                error_code=str(row["error_code"]) if row["error_code"] else None,
            )
            for row in rows
        ]
