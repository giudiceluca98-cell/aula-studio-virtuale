from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import PurePosixPath
from urllib.parse import urlsplit

from app.materials.errors import MaterialError
from app.materials.extraction import extract_text

from .acquisition_storage import SqliteAcquisitionStore
from .freshness_errors import (
    CorpusReportingDisabledError,
    SourceConflictTrackingDisabledError,
    SourceHealthDisabledError,
    SourceHealthStateError,
    SourceRecheckDisabledError,
)
from .freshness_models import (
    CorpusHealthReport,
    SourceAvailabilityStatus,
    SourceConflict,
    SourceConflictCreateRequest,
    SourceConflictListResponse,
    SourceConflictResolveRequest,
    SourceConflictStatus,
    SourceConsistencyStatus,
    SourceFreshnessPolicyRequest,
    SourceFreshnessPolicyView,
    SourceFreshnessStatus,
    SourceHealthBatchRequest,
    SourceHealthBatchResult,
    SourceHealthCheckKind,
    SourceHealthCheckRequest,
    SourceHealthComponents,
    SourceHealthListResponse,
    SourceHealthServiceStatus,
    SourceHealthSnapshot,
    SourceHealthState,
    SourceHealthSummaryStatus,
    SourceReplacementRequest,
)
from .freshness_storage import SqliteSourceHealthStore
from .models import ResearchSourceStatus
from .review_storage import SqliteReviewStore
from .storage import SqliteResearchStore
from .web_acquisition import (
    ControlledWebAcquirer,
    WebAccessDisabledError,
    WebAcquisitionError,
    WebHttpStatusError,
)


def utc_now_dt() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime | None) -> str | None:
    return value.isoformat(timespec="seconds") if value is not None else None


def parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if cleaned.endswith("Z"):
        cleaned = cleaned[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(cleaned)
    except ValueError:
        try:
            parsed = datetime.fromisoformat(cleaned[:10])
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


@dataclass(frozen=True, slots=True)
class SourceHealthPolicy:
    health_enabled: bool = False
    recheck_enabled: bool = False
    conflict_tracking_enabled: bool = False
    reporting_enabled: bool = True
    default_max_age_days: int = 180
    default_recheck_interval_hours: int = 168
    max_due_per_run: int = 25
    max_consecutive_failures: int = 3

    def validate(self) -> None:
        if self.default_max_age_days < 1:
            raise ValueError("default_max_age_days deve essere positivo")
        if self.default_recheck_interval_hours < 1:
            raise ValueError("default_recheck_interval_hours deve essere positivo")
        if self.max_due_per_run < 1 or self.max_due_per_run > 100:
            raise ValueError("max_due_per_run non valido")
        if self.max_consecutive_failures < 1:
            raise ValueError("max_consecutive_failures deve essere positivo")


class SourceHealthService:
    def __init__(
        self,
        store: SqliteSourceHealthStore,
        research_store: SqliteResearchStore,
        acquisition_store: SqliteAcquisitionStore,
        review_store: SqliteReviewStore,
        acquirer: ControlledWebAcquirer,
        *,
        policy: SourceHealthPolicy | None = None,
    ) -> None:
        self.store = store
        self.research_store = research_store
        self.acquisition_store = acquisition_store
        self.review_store = review_store
        self.acquirer = acquirer
        self.policy = policy or SourceHealthPolicy()
        self.policy.validate()

    def status(self) -> SourceHealthServiceStatus:
        return SourceHealthServiceStatus(
            checkpoint="INTELLIGENCE-0.7",
            schema_version=self.store.schema_version,
            health_enabled=self.policy.health_enabled,
            recheck_enabled=self.policy.recheck_enabled,
            conflict_tracking_enabled=self.policy.conflict_tracking_enabled,
            reporting_enabled=self.policy.reporting_enabled,
            default_max_age_days=self.policy.default_max_age_days,
            default_recheck_interval_hours=self.policy.default_recheck_interval_hours,
            max_due_per_run=self.policy.max_due_per_run,
            **self.store.counts(),
        )

    def _require_health(self) -> None:
        if not self.policy.health_enabled:
            raise SourceHealthDisabledError("Il monitoraggio salute fonti è disattivato dal server")

    def _effective_policy(self, source_id: int, room_id: str) -> SourceFreshnessPolicyView:
        return self.store.get_policy(
            source_id, room_id,
            default_max_age_days=self.policy.default_max_age_days,
            default_recheck_interval_hours=self.policy.default_recheck_interval_hours,
        )

    def configure_source(
        self, source_id: int, request: SourceFreshnessPolicyRequest
    ) -> SourceFreshnessPolicyView:
        self._require_health()
        return self.store.set_policy(
            source_id=source_id, room_id=request.room_id,
            max_age_days=request.max_age_days,
            recheck_interval_hours=request.recheck_interval_hours,
            actor_id=request.actor_id, note=request.note,
        )

    def get_policy(self, source_id: int, room_id: str) -> SourceFreshnessPolicyView:
        return self._effective_policy(source_id, room_id)

    @staticmethod
    def _source_date(context: dict) -> datetime | None:
        return (
            parse_date(context.get("review_published_at"))
            or parse_date(context.get("published_at"))
            or parse_date(context.get("acquired_at"))
        )

    @staticmethod
    def _provenance_score(context: dict) -> int:
        fields = [
            context.get("review_author"),
            context.get("review_publisher") or context.get("publisher"),
            context.get("review_published_at") or context.get("published_at"),
            context.get("license_name"),
            context.get("language"),
        ]
        return sum(20 for value in fields if value)

    @staticmethod
    def _overall(components: SourceHealthComponents) -> int:
        return round(
            components.availability * 0.35
            + components.freshness * 0.30
            + components.provenance * 0.20
            + components.consistency * 0.15
        )

    @staticmethod
    def _summary(
        availability: SourceAvailabilityStatus,
        freshness: SourceFreshnessStatus,
        consistency: SourceConsistencyStatus,
        score: int,
    ) -> SourceHealthSummaryStatus:
        if availability == SourceAvailabilityStatus.REMOVED or score < 35:
            return SourceHealthSummaryStatus.CRITICAL
        if (
            availability == SourceAvailabilityStatus.UNAVAILABLE
            or freshness in {SourceFreshnessStatus.STALE, SourceFreshnessStatus.CHANGED, SourceFreshnessStatus.REPLACED}
            or consistency == SourceConsistencyStatus.CONFLICTED
            or score < 75
        ):
            return SourceHealthSummaryStatus.ATTENTION
        return SourceHealthSummaryStatus.HEALTHY

    def _components(
        self, *, context: dict, availability: SourceAvailabilityStatus,
        freshness: SourceFreshnessStatus, consistency: SourceConsistencyStatus,
        consecutive_failures: int
    ) -> SourceHealthComponents:
        availability_score = {
            SourceAvailabilityStatus.AVAILABLE: 100,
            SourceAvailabilityStatus.UNAVAILABLE: max(15, 55 - consecutive_failures * 10),
            SourceAvailabilityStatus.REMOVED: 0,
            SourceAvailabilityStatus.UNKNOWN: 25,
        }[availability]
        freshness_score = {
            SourceFreshnessStatus.CURRENT: 100,
            SourceFreshnessStatus.STALE: 35,
            SourceFreshnessStatus.CHANGED: 55,
            SourceFreshnessStatus.REPLACED: 70,
            SourceFreshnessStatus.UNKNOWN: 30,
        }[freshness]
        consistency_score = {
            SourceConsistencyStatus.CONSISTENT: 100,
            SourceConsistencyStatus.CONFLICTED: 35,
            SourceConsistencyStatus.UNASSESSED: 60,
        }[consistency]
        return SourceHealthComponents(
            availability=availability_score,
            freshness=freshness_score,
            provenance=self._provenance_score(context),
            consistency=consistency_score,
        )

    def _record(
        self, *, context: dict, request: SourceHealthCheckRequest,
        check_kind: SourceHealthCheckKind,
        availability: SourceAvailabilityStatus,
        freshness: SourceFreshnessStatus,
        previous_acquisition_id: int | None,
        observed_acquisition_id: int | None,
        previous_sha256: str | None,
        observed_sha256: str | None,
        final_url: str | None,
        http_status: int | None,
        consecutive_failures: int,
        signals: list[str],
        error_code: str | None,
        checked_at: datetime,
        source_date: datetime | None,
        expires_at: datetime | None,
        next_check_at: datetime | None,
    ) -> SourceHealthSnapshot:
        try:
            current_state = self.store.get_state(int(context["source_id"]), request.room_id)
            consistency = (
                SourceConsistencyStatus.CONFLICTED
                if current_state.open_conflicts else SourceConsistencyStatus.CONSISTENT
            )
        except Exception:
            consistency = SourceConsistencyStatus.UNASSESSED
        components = self._components(
            context=context, availability=availability, freshness=freshness,
            consistency=consistency, consecutive_failures=consecutive_failures,
        )
        score = self._overall(components)
        summary = self._summary(availability, freshness, consistency, score)
        if consecutive_failures >= self.policy.max_consecutive_failures:
            summary = SourceHealthSummaryStatus.CRITICAL
            if "failure_threshold_reached" not in signals:
                signals.append("failure_threshold_reached")
        return self.store.record_snapshot({
            "source_id": int(context["source_id"]), "project_id": str(context["project_id"]),
            "room_id": request.room_id, "check_kind": check_kind.value,
            "actor_id": request.actor_id, "availability_status": availability.value,
            "freshness_status": freshness.value, "consistency_status": consistency.value,
            "summary_status": summary.value, "components": components.model_dump(),
            "health_score": score, "previous_acquisition_id": previous_acquisition_id,
            "observed_acquisition_id": observed_acquisition_id,
            "previous_sha256": previous_sha256, "observed_sha256": observed_sha256,
            "active_promotion_id": context.get("active_promotion_id"),
            "material_id": context.get("material_id"), "version_id": context.get("version_id"),
            "source_date": iso(source_date), "acquired_at": context.get("acquired_at"),
            "checked_at": iso(checked_at), "expires_at": iso(expires_at),
            "next_check_at": iso(next_check_at), "final_url": final_url,
            "http_status": http_status, "consecutive_failures": consecutive_failures,
            "signals": signals, "error_code": error_code,
        })

    def check_source(
        self,
        source_id: int,
        request: SourceHealthCheckRequest,
        *,
        check_kind: SourceHealthCheckKind = SourceHealthCheckKind.MANUAL,
    ) -> SourceHealthSnapshot:
        self._require_health()
        if check_kind == SourceHealthCheckKind.SCHEDULED and not self.policy.recheck_enabled:
            raise SourceRecheckDisabledError("Il ricontrollo periodico è disattivato")
        context = self.store.source_context(source_id, request.room_id)
        if not context.get("acquisition_id") or not context.get("sha256"):
            raise SourceHealthStateError("La fonte deve possedere un documento acquisito")
        effective = self._effective_policy(source_id, request.room_id)
        now = utc_now_dt()
        try:
            state = self.store.get_state(source_id, request.room_id)
            if not request.force and state.next_check_at and parse_date(state.next_check_at) > now:
                if state.latest_snapshot_id is None:
                    raise SourceHealthStateError("Stato salute privo di snapshot")
                return self.store.get_snapshot(state.latest_snapshot_id, request.room_id)
            previous_failures = state.consecutive_failures
        except Exception:
            previous_failures = 0
        source_date = self._source_date(context)
        expires_at = (source_date + timedelta(days=effective.max_age_days)) if source_date else None
        next_check = now + timedelta(hours=effective.recheck_interval_hours)
        previous_id = int(context["acquisition_id"])
        previous_sha = str(context["sha256"])
        try:
            fetched = self.acquirer.fetch(str(context["url"]))
            digest = hashlib.sha256(fetched.content).hexdigest()
            stale = bool(expires_at and expires_at <= now)
            if digest == previous_sha:
                return self._record(
                    context=context, request=request, check_kind=check_kind,
                    availability=SourceAvailabilityStatus.AVAILABLE,
                    freshness=(SourceFreshnessStatus.STALE if stale else SourceFreshnessStatus.CURRENT),
                    previous_acquisition_id=previous_id, observed_acquisition_id=previous_id,
                    previous_sha256=previous_sha, observed_sha256=digest,
                    final_url=fetched.final_url, http_status=fetched.status,
                    consecutive_failures=0,
                    signals=["checksum_unchanged", "historical_citations_preserved"],
                    error_code=None, checked_at=now, source_date=source_date,
                    expires_at=expires_at, next_check_at=next_check,
                )
            parsed = urlsplit(fetched.final_url)
            filename = PurePosixPath(parsed.path).name or f"source-{source_id}.txt"
            extracted_text, normalized_media_type = extract_text(
                fetched.content, fetched.media_type, filename
            )
            acquisition_id = self.acquisition_store.begin(
                project_id=str(context["project_id"]), source_id=source_id,
                room_id=request.room_id, requested_url=str(context["url"]),
            )
            event = self.acquisition_store.complete(
                acquisition_id=acquisition_id, project_id=str(context["project_id"]),
                source_id=source_id, room_id=request.room_id,
                requested_url=fetched.requested_url, final_url=fetched.final_url,
                http_status=fetched.status, media_type=normalized_media_type,
                content=fetched.content, sha256=digest, extracted_text=extracted_text,
                robots_allowed=fetched.robots_allowed,
                resolved_ips=list(fetched.resolved_ips), redirect_chain=list(fetched.redirect_chain),
            )
            expired = self.review_store.expire_for_new_acquisition(
                source_id=source_id, project_id=str(context["project_id"]),
                room_id=request.room_id, acquisition_id=event.acquisition_id,
            )
            if expired:
                self.research_store.set_source_review_state(
                    str(context["project_id"]), source_id, request.room_id,
                    status=ResearchSourceStatus.EXPIRED,
                    trust_level="review_expired_source_changed",
                )
            return self._record(
                context=context, request=request, check_kind=check_kind,
                availability=SourceAvailabilityStatus.AVAILABLE,
                freshness=SourceFreshnessStatus.CHANGED,
                previous_acquisition_id=previous_id, observed_acquisition_id=event.acquisition_id,
                previous_sha256=previous_sha, observed_sha256=digest,
                final_url=fetched.final_url, http_status=fetched.status,
                consecutive_failures=0,
                signals=["checksum_changed", "new_acquisition_quarantined", "review_required", "historical_citations_preserved"],
                error_code=None, checked_at=now, source_date=source_date,
                expires_at=expires_at, next_check_at=now + timedelta(hours=min(24, effective.recheck_interval_hours)),
            )
        except WebAccessDisabledError as error:
            raise SourceRecheckDisabledError(
                "Il ricontrollo richiede anche EVE_RESEARCH_WEB_ENABLED=true"
            ) from error
        except WebHttpStatusError as error:
            failures = previous_failures + 1
            removed = error.status in {404, 410}
            delay = effective.recheck_interval_hours * min(4, 2 ** max(0, failures - 1))
            return self._record(
                context=context, request=request, check_kind=check_kind,
                availability=(SourceAvailabilityStatus.REMOVED if removed else SourceAvailabilityStatus.UNAVAILABLE),
                freshness=(SourceFreshnessStatus.STALE if expires_at and expires_at <= now else SourceFreshnessStatus.UNKNOWN),
                previous_acquisition_id=previous_id, observed_acquisition_id=None,
                previous_sha256=previous_sha, observed_sha256=None, final_url=None,
                http_status=error.status, consecutive_failures=failures,
                signals=["source_removed" if removed else "http_unavailable", "historical_citations_preserved"],
                error_code=error.code, checked_at=now, source_date=source_date,
                expires_at=expires_at, next_check_at=now + timedelta(hours=delay),
            )
        except (WebAcquisitionError, MaterialError) as error:
            failures = previous_failures + 1
            delay = effective.recheck_interval_hours * min(4, 2 ** max(0, failures - 1))
            return self._record(
                context=context, request=request, check_kind=check_kind,
                availability=SourceAvailabilityStatus.UNAVAILABLE,
                freshness=(SourceFreshnessStatus.STALE if expires_at and expires_at <= now else SourceFreshnessStatus.UNKNOWN),
                previous_acquisition_id=previous_id, observed_acquisition_id=None,
                previous_sha256=previous_sha, observed_sha256=None, final_url=None,
                http_status=None, consecutive_failures=failures,
                signals=["recheck_failed", "historical_citations_preserved"],
                error_code=getattr(error, "code", "source_recheck_failed"),
                checked_at=now, source_date=source_date, expires_at=expires_at,
                next_check_at=now + timedelta(hours=delay),
            )

    def run_due(self, request: SourceHealthBatchRequest) -> SourceHealthBatchResult:
        self._require_health()
        if not self.policy.recheck_enabled:
            raise SourceRecheckDisabledError("Il ricontrollo periodico è disattivato")
        limit = min(request.limit, self.policy.max_due_per_run)
        due = self.store.due_sources(request.room_id, iso(utc_now_dt()), limit)
        snapshots: list[SourceHealthSnapshot] = []
        errors: list[dict] = []
        for source_id in due:
            try:
                snapshots.append(self.check_source(
                    source_id,
                    SourceHealthCheckRequest(room_id=request.room_id, actor_id=request.actor_id, force=True),
                    check_kind=SourceHealthCheckKind.SCHEDULED,
                ))
            except Exception as error:
                errors.append({"source_id": source_id, "code": getattr(error, "code", error.__class__.__name__)})
        return SourceHealthBatchResult(
            room_id=request.room_id, requested=len(due), completed=len(snapshots),
            attention=sum(item.summary_status == SourceHealthSummaryStatus.ATTENTION for item in snapshots),
            critical=sum(item.summary_status == SourceHealthSummaryStatus.CRITICAL for item in snapshots),
            errors=errors, snapshots=snapshots,
        )

    def get_state(self, source_id: int, room_id: str) -> SourceHealthState:
        return self.store.get_state(source_id, room_id)

    def list_states(self, room_id: str) -> SourceHealthListResponse:
        items = self.store.list_states(room_id)
        return SourceHealthListResponse(total=len(items), items=items)

    def register_replacement(
        self, source_id: int, request: SourceReplacementRequest
    ) -> SourceHealthSnapshot:
        self._require_health()
        context = self.store.source_context(source_id, request.room_id)
        effective = self._effective_policy(source_id, request.room_id)
        now = utc_now_dt()
        source_date = self._source_date(context)
        expires_at = source_date + timedelta(days=effective.max_age_days) if source_date else None
        components = self._components(
            context=context, availability=SourceAvailabilityStatus.AVAILABLE,
            freshness=SourceFreshnessStatus.REPLACED,
            consistency=SourceConsistencyStatus.UNASSESSED, consecutive_failures=0,
        )
        values = {
            "source_id": source_id, "project_id": str(context["project_id"]),
            "room_id": request.room_id, "check_kind": SourceHealthCheckKind.REPLACEMENT.value,
            "actor_id": request.actor_id, "availability_status": SourceAvailabilityStatus.AVAILABLE.value,
            "freshness_status": SourceFreshnessStatus.REPLACED.value,
            "consistency_status": SourceConsistencyStatus.UNASSESSED.value,
            "summary_status": SourceHealthSummaryStatus.ATTENTION.value,
            "components": components.model_dump(), "health_score": self._overall(components),
            "previous_acquisition_id": context.get("acquisition_id"),
            "observed_acquisition_id": context.get("acquisition_id"),
            "previous_sha256": context.get("sha256"), "observed_sha256": context.get("sha256"),
            "active_promotion_id": context.get("active_promotion_id"),
            "material_id": context.get("material_id"), "version_id": context.get("version_id"),
            "source_date": iso(source_date), "acquired_at": context.get("acquired_at"),
            "checked_at": iso(now), "expires_at": iso(expires_at),
            "next_check_at": iso(now + timedelta(hours=effective.recheck_interval_hours)),
            "final_url": context.get("final_url"), "http_status": None,
            "consecutive_failures": 0, "signals": ["replacement_declared", "historical_source_retained"],
            "error_code": None,
        }
        return self.store.mark_replacement(
            source_id=source_id, room_id=request.room_id,
            replacement_source_id=request.replacement_source_id,
            actor_id=request.actor_id, rationale=request.rationale,
            snapshot_values=values,
        )

    def create_conflict(self, request: SourceConflictCreateRequest) -> SourceConflict:
        if not self.policy.conflict_tracking_enabled:
            raise SourceConflictTrackingDisabledError("Il registro conflitti è disattivato")
        return self.store.create_conflict({
            **request.model_dump(), "conflict_type": request.conflict_type.value
        })

    def list_conflicts(
        self, room_id: str, status: SourceConflictStatus | None = None
    ) -> SourceConflictListResponse:
        items = self.store.list_conflicts(room_id, status)
        return SourceConflictListResponse(total=len(items), items=items)

    def resolve_conflict(
        self, conflict_id: int, request: SourceConflictResolveRequest
    ) -> SourceConflict:
        if not self.policy.conflict_tracking_enabled:
            raise SourceConflictTrackingDisabledError("Il registro conflitti è disattivato")
        return self.store.resolve_conflict(
            conflict_id=conflict_id, room_id=request.room_id,
            actor_id=request.actor_id, resolution=request.resolution,
            rationale=request.rationale,
        )

    def generate_report(self, room_id: str, actor_id: str) -> CorpusHealthReport:
        if not self.policy.reporting_enabled:
            raise CorpusReportingDisabledError("La reportistica del corpus è disattivata")
        stats, projects = self.store.report_statistics(room_id)
        total = stats["total_sources"]
        checked = stats["checked_sources"]
        healthy = stats["healthy"]
        coverage = round(checked / total, 4) if total else 0.0
        reliability = round(healthy / checked, 4) if checked else 0.0
        notes = [
            "Il punteggio salute è informativo e non approva automaticamente alcuna fonte.",
            "Le fonti rimosse, modificate o sostituite mantengono riferimenti e cronologia.",
            "La preferenza tra fonti conflittuali richiede una decisione umana motivata.",
        ]
        return self.store.save_report({
            "room_id": room_id, "generated_by": actor_id, "generated_at": iso(utc_now_dt()),
            "total_projects": stats["total_projects"], "total_sources": total,
            "acquired_sources": stats["acquired_sources"], "approved_sources": stats["approved_sources"],
            "active_promotions": stats["active_promotions"], "checked_sources": checked,
            "healthy_sources": healthy, "attention_sources": stats["attention"],
            "critical_sources": stats["critical"], "stale_sources": stats["stale"],
            "changed_sources": stats["changed"], "unavailable_sources": stats["unavailable"],
            "removed_sources": stats["removed"], "open_conflicts": stats["open_conflicts"],
            "average_health_score": stats["average_health_score"],
            "coverage_ratio": coverage, "reliability_ratio": reliability,
            "projects": [item.model_dump() for item in projects], "notes": notes,
        })
