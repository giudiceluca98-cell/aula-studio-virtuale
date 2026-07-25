from __future__ import annotations

import hashlib
import json
import sqlite3

from .models import (
    EvaluationScenarioCreateRequest,
    EvaluationScenarioDetail,
    EvaluationScenarioRevisionRequest,
    EvaluationScenarioSummary,
    EvaluationSeverity,
    ScenarioStatus,
)
from .storage_base import (
    EvaluationConflictError,
    EvaluationScenarioNotFoundError,
    utc_now,
)


def scenario_checksum(request: EvaluationScenarioCreateRequest) -> str:
    payload = request.model_dump(mode="json", exclude={"note"})
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class ScenarioStorageMixin:
    def scenario_versions_count(self) -> int:
        with self._lock:
            return int(self._connection.execute(
                "SELECT COUNT(*) FROM evaluation_scenario_versions"
            ).fetchone()[0])

    def active_scenarios_count(self) -> int:
        with self._lock:
            return int(self._connection.execute(
                "SELECT COUNT(*) FROM evaluation_scenario_versions WHERE active = 1"
            ).fetchone()[0])

    def scenario_keys_count(self) -> int:
        with self._lock:
            return int(self._connection.execute(
                "SELECT COUNT(DISTINCT scenario_key) FROM evaluation_scenario_versions"
            ).fetchone()[0])

    def create_scenario(self, request: EvaluationScenarioCreateRequest) -> EvaluationScenarioDetail:
        with self._lock, self._connection:
            existing = self._connection.execute(
                "SELECT 1 FROM evaluation_scenario_versions WHERE scenario_key = ? LIMIT 1",
                (request.scenario_key,),
            ).fetchone()
            if existing:
                raise EvaluationConflictError(
                    f"Lo scenario {request.scenario_key!r} esiste già"
                )
            scenario_id = self._insert_scenario(
                request=request,
                version_number=1,
                parent_version_id=None,
            )
        return self.get_scenario(scenario_id)

    def revise_scenario(
        self,
        scenario_version_id: int,
        request: EvaluationScenarioRevisionRequest,
    ) -> EvaluationScenarioDetail:
        source = self.get_scenario(scenario_version_id)
        revised = EvaluationScenarioCreateRequest(
            scenario_key=source.scenario_key,
            name=request.name if request.name is not None else source.name,
            description=request.description if request.description is not None else source.description,
            category=request.category if request.category is not None else source.category,
            severity=request.severity if request.severity is not None else source.severity,
            weight=request.weight if request.weight is not None else source.weight,
            minimum_score=(
                request.minimum_score
                if request.minimum_score is not None
                else source.minimum_score
            ),
            required=request.required if request.required is not None else source.required,
            input_payload=(
                request.input_payload if request.input_payload is not None else source.input_payload
            ),
            expected_behaviors=(
                request.expected_behaviors
                if request.expected_behaviors is not None
                else source.expected_behaviors
            ),
            note=request.note,
        )
        with self._lock, self._connection:
            version_number = int(self._connection.execute(
                """
                SELECT COALESCE(MAX(version_number), 0) + 1
                FROM evaluation_scenario_versions WHERE scenario_key = ?
                """,
                (source.scenario_key,),
            ).fetchone()[0])
            self._connection.execute(
                """
                UPDATE evaluation_scenario_versions
                SET active = 0, status = ?
                WHERE scenario_key = ? AND active = 1
                """,
                (ScenarioStatus.ARCHIVED.value, source.scenario_key),
            )
            scenario_id = self._insert_scenario(
                request=revised,
                version_number=version_number,
                parent_version_id=source.scenario_version_id,
            )
        return self.get_scenario(scenario_id)

    def _insert_scenario(
        self,
        *,
        request: EvaluationScenarioCreateRequest,
        version_number: int,
        parent_version_id: int | None,
    ) -> int:
        cursor = self._connection.execute(
            """
            INSERT INTO evaluation_scenario_versions (
                scenario_key, version_number, created_at, status, name, description,
                category, severity, weight, minimum_score, required, input_json,
                expected_json, checksum, parent_version_id, note, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                request.scenario_key,
                version_number,
                utc_now(),
                ScenarioStatus.ACTIVE.value,
                request.name,
                request.description,
                request.category,
                request.severity.value,
                request.weight,
                request.minimum_score,
                int(request.required),
                json.dumps(request.input_payload, ensure_ascii=False, sort_keys=True),
                json.dumps(request.expected_behaviors, ensure_ascii=False),
                scenario_checksum(request),
                parent_version_id,
                request.note,
            ),
        )
        return int(cursor.lastrowid)

    def list_scenarios(
        self,
        *,
        active_only: bool = False,
        category: str | None = None,
        limit: int = 200,
    ) -> list[EvaluationScenarioSummary]:
        clauses: list[str] = []
        args: list[object] = []
        if active_only:
            clauses.append("active = 1")
        if category:
            clauses.append("category = ?")
            args.append(category)
        where = f" WHERE {' AND '.join(clauses)}" if clauses else ""
        args.append(limit)
        with self._lock:
            rows = self._connection.execute(
                f"""
                SELECT * FROM evaluation_scenario_versions
                {where}
                ORDER BY scenario_key, version_number DESC
                LIMIT ?
                """,
                args,
            ).fetchall()
        return [self._scenario_summary_from_row(row) for row in rows]

    def active_scenarios(self) -> list[EvaluationScenarioDetail]:
        with self._lock:
            rows = self._connection.execute(
                """
                SELECT * FROM evaluation_scenario_versions
                WHERE active = 1 ORDER BY scenario_key
                """
            ).fetchall()
        return [self._scenario_detail_from_row(row) for row in rows]

    def get_scenario(self, scenario_version_id: int) -> EvaluationScenarioDetail:
        with self._lock:
            row = self._connection.execute(
                "SELECT * FROM evaluation_scenario_versions WHERE id = ?",
                (scenario_version_id,),
            ).fetchone()
        if not row:
            raise EvaluationScenarioNotFoundError(scenario_version_id)
        return self._scenario_detail_from_row(row)

    @staticmethod
    def _scenario_summary_from_row(row: sqlite3.Row) -> EvaluationScenarioSummary:
        return EvaluationScenarioSummary(
            scenario_version_id=int(row["id"]),
            scenario_key=str(row["scenario_key"]),
            version_number=int(row["version_number"]),
            created_at=str(row["created_at"]),
            status=ScenarioStatus(str(row["status"])),
            name=str(row["name"]),
            category=str(row["category"]),
            severity=EvaluationSeverity(str(row["severity"])),
            weight=float(row["weight"]),
            minimum_score=float(row["minimum_score"]),
            required=bool(row["required"]),
            checksum=str(row["checksum"]),
            parent_version_id=(
                int(row["parent_version_id"]) if row["parent_version_id"] is not None else None
            ),
            active=bool(row["active"]),
        )

    @classmethod
    def _scenario_detail_from_row(cls, row: sqlite3.Row) -> EvaluationScenarioDetail:
        summary = cls._scenario_summary_from_row(row)
        return EvaluationScenarioDetail(
            **summary.model_dump(),
            description=str(row["description"]),
            input_payload=json.loads(str(row["input_json"])),
            expected_behaviors=json.loads(str(row["expected_json"])),
            note=str(row["note"]) if row["note"] else None,
        )
