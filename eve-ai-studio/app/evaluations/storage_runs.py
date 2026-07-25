from __future__ import annotations

import sqlite3

from .models import (
    CriterionOutcome,
    CriterionResult,
    EvaluationCatalogStatus,
    EvaluationGateStatus,
    EvaluationRunCompleteRequest,
    EvaluationRunDetail,
    EvaluationRunStatus,
    EvaluationRunSummary,
    EvaluationSeverity,
    ScenarioRunResult,
)
from .storage_base import (
    EvaluationConflictError,
    EvaluationRunNotFoundError,
    EvaluationRunStateError,
    utc_now,
)


class RunStorageMixin:
    def start_run(
        self,
        *,
        prompt_version_id: int,
        scenario_version_ids: list[int] | None,
        note: str | None,
    ) -> EvaluationRunDetail:
        if scenario_version_ids is None:
            scenarios = self.active_scenarios()
        else:
            scenarios = [self.get_scenario(item) for item in scenario_version_ids]
            inactive = [item.scenario_version_id for item in scenarios if not item.active]
            if inactive:
                raise EvaluationConflictError(
                    f"Gli scenari non attivi non possono avviare una nuova esecuzione: {inactive}"
                )
        if not scenarios:
            raise EvaluationConflictError("Non esistono scenari attivi da eseguire")
        created_at = utc_now()
        with self._lock, self._connection:
            cursor = self._connection.execute(
                """
                INSERT INTO evaluation_runs (
                    prompt_version_id, created_at, status, note, total_scenarios
                ) VALUES (?, ?, ?, ?, ?)
                """,
                (
                    prompt_version_id,
                    created_at,
                    EvaluationRunStatus.RUNNING.value,
                    note,
                    len(scenarios),
                ),
            )
            run_id = int(cursor.lastrowid)
            self._connection.executemany(
                """
                INSERT INTO evaluation_run_scenarios(run_id, scenario_version_id)
                VALUES (?, ?)
                """,
                [(run_id, item.scenario_version_id) for item in scenarios],
            )
        return self.get_run(run_id)

    def complete_run(
        self,
        run_id: int,
        request: EvaluationRunCompleteRequest,
    ) -> EvaluationRunDetail:
        run = self.get_run(run_id)
        if run.status is not EvaluationRunStatus.RUNNING:
            raise EvaluationRunStateError("L'esecuzione è già stata completata")
        expected_ids = set(run.scenario_version_ids)
        provided_ids = {item.scenario_version_id for item in request.results}
        if expected_ids != provided_ids:
            missing = sorted(expected_ids - provided_ids)
            extra = sorted(provided_ids - expected_ids)
            raise EvaluationRunStateError(
                f"I risultati non coprono lo snapshot della suite; mancanti={missing}, extra={extra}"
            )

        scenario_results = []
        result_rows = []
        for result in request.results:
            scenario = self.get_scenario(result.scenario_version_id)
            average = sum(item.score for item in result.criteria) / len(result.criteria)
            passed = (
                all(item.outcome is CriterionOutcome.PASS for item in result.criteria)
                and average >= scenario.minimum_score
            )
            scenario_results.append((scenario, average, passed))
            for criterion in result.criteria:
                result_rows.append(
                    (
                        run_id,
                        scenario.scenario_version_id,
                        criterion.criterion_key,
                        criterion.score,
                        criterion.outcome.value,
                        int(criterion.outcome is CriterionOutcome.PASS),
                        criterion.message,
                        criterion.evidence_summary,
                    )
                )

        total_weight = sum(item.weight for item, _, _ in scenario_results)
        weighted_score = (
            sum(item.weight * score for item, score, _ in scenario_results) / total_weight
            if total_weight
            else 0.0
        )
        passed_scenarios = sum(1 for _, _, passed in scenario_results if passed)
        failed_scenarios = len(scenario_results) - passed_scenarios
        critical_failures = sum(
            1
            for scenario, _, passed in scenario_results
            if not passed and scenario.severity is EvaluationSeverity.CRITICAL
        )
        required_failures = sum(
            1
            for scenario, _, passed in scenario_results
            if not passed and scenario.required
        )
        overall_passed = (
            critical_failures == 0
            and required_failures == 0
            and weighted_score >= self.publish_threshold
        )
        completed_at = utc_now()
        status = EvaluationRunStatus.PASSED if overall_passed else EvaluationRunStatus.FAILED

        with self._lock, self._connection:
            self._connection.executemany(
                """
                INSERT INTO evaluation_results (
                    run_id, scenario_version_id, criterion_key, score, outcome,
                    passed, message, evidence_summary
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                result_rows,
            )
            self._connection.execute(
                """
                UPDATE evaluation_runs
                SET completed_at = ?, status = ?, weighted_score = ?,
                    passed_scenarios = ?, failed_scenarios = ?,
                    critical_failures = ?, required_failures = ?
                WHERE id = ?
                """,
                (
                    completed_at,
                    status.value,
                    weighted_score,
                    passed_scenarios,
                    failed_scenarios,
                    critical_failures,
                    required_failures,
                    run_id,
                ),
            )
        return self.get_run(run_id)

    def list_runs(
        self,
        *,
        prompt_version_id: int | None = None,
        limit: int = 100,
    ) -> list[EvaluationRunSummary]:
        args: list[object] = []
        where = ""
        if prompt_version_id is not None:
            where = " WHERE prompt_version_id = ?"
            args.append(prompt_version_id)
        args.append(limit)
        with self._lock:
            rows = self._connection.execute(
                f"SELECT * FROM evaluation_runs{where} ORDER BY id DESC LIMIT ?",
                args,
            ).fetchall()
        return [self._run_summary_from_row(row) for row in rows]

    def runs_count(self, *, prompt_version_id: int | None = None) -> int:
        with self._lock:
            if prompt_version_id is None:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM evaluation_runs"
                ).fetchone()
            else:
                row = self._connection.execute(
                    "SELECT COUNT(*) FROM evaluation_runs WHERE prompt_version_id = ?",
                    (prompt_version_id,),
                ).fetchone()
        return int(row[0])

    def get_run(self, run_id: int) -> EvaluationRunDetail:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM evaluation_runs WHERE id = ?", (run_id,)
            ).fetchone()
            if not row:
                raise EvaluationRunNotFoundError(run_id)
            scenario_rows = self._connection.execute(
                """
                SELECT scenario_version_id FROM evaluation_run_scenarios
                WHERE run_id = ? ORDER BY scenario_version_id
                """,
                (run_id,),
            ).fetchall()
            result_rows = self._connection.execute(
                """
                SELECT * FROM evaluation_results
                WHERE run_id = ?
                ORDER BY scenario_version_id, criterion_key
                """,
                (run_id,),
            ).fetchall()
        scenario_ids = [int(item["scenario_version_id"]) for item in scenario_rows]
        grouped: dict[int, list[sqlite3.Row]] = {}
        for result_row in result_rows:
            grouped.setdefault(int(result_row["scenario_version_id"]), []).append(result_row)
        results: list[ScenarioRunResult] = []
        for scenario_id in scenario_ids:
            if scenario_id not in grouped:
                continue
            scenario = self.get_scenario(scenario_id)
            criteria = [
                CriterionResult(
                    criterion_key=str(item["criterion_key"]),
                    score=float(item["score"]),
                    outcome=CriterionOutcome(str(item["outcome"])),
                    passed=bool(item["passed"]),
                    message=str(item["message"]) if item["message"] else None,
                    evidence_summary=(
                        str(item["evidence_summary"]) if item["evidence_summary"] else None
                    ),
                )
                for item in grouped[scenario_id]
            ]
            score = sum(item.score for item in criteria) / len(criteria)
            passed = (
                all(item.outcome is CriterionOutcome.PASS for item in criteria)
                and score >= scenario.minimum_score
            )
            results.append(
                ScenarioRunResult(
                    scenario_version_id=scenario.scenario_version_id,
                    scenario_key=scenario.scenario_key,
                    name=scenario.name,
                    severity=scenario.severity,
                    required=scenario.required,
                    weight=scenario.weight,
                    minimum_score=scenario.minimum_score,
                    score=score,
                    passed=passed,
                    criteria=criteria,
                )
            )
        summary = self._run_summary_from_row(row)
        return EvaluationRunDetail(
            **summary.model_dump(),
            scenario_version_ids=scenario_ids,
            results=results,
        )

    def gate(self, prompt_version_id: int) -> EvaluationGateStatus:
        with self._lock:
            row = self._connection.execute(
                """
                SELECT * FROM evaluation_runs
                WHERE prompt_version_id = ? AND status IN (?, ?, ?)
                ORDER BY id DESC LIMIT 1
                """,
                (
                    prompt_version_id,
                    EvaluationRunStatus.PASSED.value,
                    EvaluationRunStatus.FAILED.value,
                    EvaluationRunStatus.ERROR.value,
                ),
            ).fetchone()
        if not row:
            return EvaluationGateStatus(
                prompt_version_id=prompt_version_id,
                eligible=False,
                publish_threshold=self.publish_threshold,
                reasons=["Nessuna esecuzione completata per questa versione prompt"],
            )
        run = self.get_run(int(row["id"]))
        active_ids = {item.scenario_version_id for item in self.active_scenarios()}
        run_ids = set(run.scenario_version_ids)
        suite_current = active_ids == run_ids
        reasons: list[str] = []
        if not suite_current:
            reasons.append("La suite attiva è cambiata dopo l'esecuzione")
        if run.status is not EvaluationRunStatus.PASSED:
            reasons.append("L'ultima esecuzione non ha superato il gate")
        if run.critical_failures:
            reasons.append(f"Errori critici: {run.critical_failures}")
        if run.required_failures:
            reasons.append(f"Scenari obbligatori falliti: {run.required_failures}")
        if run.weighted_score is None or run.weighted_score < self.publish_threshold:
            reasons.append(
                f"Punteggio inferiore alla soglia {self.publish_threshold:.1f}"
            )
        return EvaluationGateStatus(
            prompt_version_id=prompt_version_id,
            eligible=not reasons,
            latest_run_id=run.run_id,
            latest_run_status=run.status,
            weighted_score=run.weighted_score,
            publish_threshold=self.publish_threshold,
            critical_failures=run.critical_failures,
            required_failures=run.required_failures,
            suite_current=suite_current,
            reasons=reasons,
        )

    def status(self) -> EvaluationCatalogStatus:
        with self._lock:
            runs = {
                str(row["status"]): int(row["count"])
                for row in self._connection.execute(
                    "SELECT status, COUNT(*) AS count FROM evaluation_runs GROUP BY status"
                ).fetchall()
            }
            latest = self._connection.execute(
                "SELECT id FROM evaluation_runs ORDER BY id DESC LIMIT 1"
            ).fetchone()
        return EvaluationCatalogStatus(
            scenarios_count=self.scenario_keys_count(),
            active_scenarios_count=self.active_scenarios_count(),
            scenario_versions_count=self.scenario_versions_count(),
            runs_count=sum(runs.values()),
            passed_runs_count=runs.get(EvaluationRunStatus.PASSED.value, 0),
            failed_runs_count=runs.get(EvaluationRunStatus.FAILED.value, 0),
            latest_run_id=int(latest["id"]) if latest else None,
            publish_threshold=self.publish_threshold,
            schema_version=self.schema_version,
        )

    @staticmethod
    def _run_summary_from_row(row: sqlite3.Row) -> EvaluationRunSummary:
        return EvaluationRunSummary(
            run_id=int(row["id"]),
            prompt_version_id=int(row["prompt_version_id"]),
            created_at=str(row["created_at"]),
            completed_at=str(row["completed_at"]) if row["completed_at"] else None,
            status=EvaluationRunStatus(str(row["status"])),
            weighted_score=(
                float(row["weighted_score"]) if row["weighted_score"] is not None else None
            ),
            passed_scenarios=int(row["passed_scenarios"]),
            failed_scenarios=int(row["failed_scenarios"]),
            critical_failures=int(row["critical_failures"]),
            required_failures=int(row["required_failures"]),
            total_scenarios=int(row["total_scenarios"]),
            note=str(row["note"]) if row["note"] else None,
        )
