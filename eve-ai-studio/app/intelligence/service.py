from __future__ import annotations

import base64
import hashlib
from dataclasses import dataclass
from pathlib import PurePosixPath
from urllib.parse import urlsplit

from app.materials.errors import MaterialError
from app.materials.extraction import extract_text
from app.materials.models import MaterialImportRequest, MaterialSourceType
from app.materials.service import MaterialService

from .acquisition_storage import SqliteAcquisitionStore
from .errors import (
    ResearchConflictError,
    ResearchLimitError,
    ResearchPromotionDisabledError,
    ResearchReviewDisabledError,
    ResearchReviewStateError,
    ResearchStaleReviewError,
)
from .models import (
    ResearchAcquisitionEvent,
    ResearchAcquisitionEventListResponse,
    ResearchCenterStatus,
    ResearchProjectCreateRequest,
    ResearchProjectDetail,
    ResearchProjectListResponse,
    ResearchProjectStatus,
    ResearchProjectTransitionRequest,
    ResearchPromotion,
    ResearchPromotionRequest,
    ResearchPromotionRevocationRequest,
    ResearchQualityScores,
    ResearchQuarantinedDocument,
    ResearchQuery,
    ResearchQueryCreateRequest,
    ResearchQueryListResponse,
    ResearchReviewDecision,
    ResearchReviewDecisionRequest,
    ResearchReviewEvent,
    ResearchReviewStartRequest,
    ResearchReviewStatus,
    ResearchSourceCandidate,
    ResearchSourceCandidateCreateRequest,
    ResearchSourceCandidateListResponse,
    ResearchSourceReview,
    ResearchSourceReviewListResponse,
    ResearchSourceStatus,
    ResearchSourceVersionComparison,
    ResearchTransitionEvent,
)
from .review_analysis import analyze_untrusted_content
from .review_storage import SqliteReviewStore
from .storage import SqliteResearchStore
from .web_acquisition import (
    ControlledWebAcquirer,
    InvalidWebUrlError,
    RobotsDeniedError,
    RobotsUnavailableError,
    UnsafeWebTargetError,
    WebAccessDisabledError,
    WebAcquisitionError,
    WebEncodingError,
    WebMediaTypeError,
    WebRedirectError,
    WebResponseTooLargeError,
)


@dataclass(frozen=True)
class ResearchLimits:
    max_projects_per_room: int = 50
    max_queries_per_project: int = 100
    max_sources_per_project: int = 500


@dataclass(frozen=True)
class ResearchReviewPolicy:
    review_enabled: bool = True
    promotion_enabled: bool = False


_BLOCKED_ACQUISITION_ERRORS = (
    WebAccessDisabledError,
    InvalidWebUrlError,
    UnsafeWebTargetError,
    WebRedirectError,
    WebResponseTooLargeError,
    WebMediaTypeError,
    WebEncodingError,
    RobotsDeniedError,
    RobotsUnavailableError,
    MaterialError,
)


class ResearchCenterService:
    """Projects, acquisition, human review and explicit CORE promotion."""

    def __init__(
        self,
        store: SqliteResearchStore,
        *,
        limits: ResearchLimits | None = None,
        acquisition_store: SqliteAcquisitionStore | None = None,
        acquirer: ControlledWebAcquirer | None = None,
        review_store: SqliteReviewStore | None = None,
        material_service: MaterialService | None = None,
        review_policy: ResearchReviewPolicy | None = None,
    ) -> None:
        self.store = store
        self.limits = limits or ResearchLimits()
        self.acquisition_store = acquisition_store
        self.acquirer = acquirer
        self.review_store = review_store
        self.material_service = material_service
        self.review_policy = review_policy or ResearchReviewPolicy()

    def status(self) -> ResearchCenterStatus:
        base = self.store.raw_status(
            max_projects_per_room=self.limits.max_projects_per_room,
            max_queries_per_project=self.limits.max_queries_per_project,
            max_sources_per_project=self.limits.max_sources_per_project,
        )
        acquisition_available = self.acquisition_store is not None and self.acquirer is not None
        review_available = (
            acquisition_available
            and self.review_store is not None
            and self.material_service is not None
        )
        policy = self.acquirer.policy if self.acquirer is not None else None
        review_counts = self.review_store.counts() if self.review_store is not None else {}
        return base.model_copy(
            update={
                "checkpoint": (
                    "INTELLIGENCE-0.3"
                    if review_available
                    else "INTELLIGENCE-0.2" if acquisition_available else "INTELLIGENCE-0.1"
                ),
                "stage": (
                    "human_review_quality_explicit_core_promotion"
                    if review_available
                    else "controlled_web_acquisition_quarantine_no_approval"
                    if acquisition_available
                    else "research_projects_and_source_catalog_no_network"
                ),
                "successful_acquisitions": (
                    self.acquisition_store.count_successful()
                    if self.acquisition_store is not None
                    else 0
                ),
                "review_available": review_available,
                "review_enabled": review_available and self.review_policy.review_enabled,
                "promotion_enabled": review_available and self.review_policy.promotion_enabled,
                "under_review_sources": review_counts.get("under_review_sources", 0),
                "approved_sources": review_counts.get("approved_sources", 0),
                "rejected_sources": review_counts.get("rejected_sources", 0),
                "active_promotions": review_counts.get("active_promotions", 0),
                "web_search_enabled": False,
                "content_acquisition_available": acquisition_available,
                "content_acquisition_enabled": bool(policy and policy.enabled),
                "model_training_enabled": False,
                "max_acquisition_bytes": policy.max_bytes if policy else 0,
                "max_redirects": policy.max_redirects if policy else 0,
                "robots_required": policy.require_robots if policy else True,
            }
        )

    def create_project(self, request: ResearchProjectCreateRequest) -> ResearchProjectDetail:
        if self.store.count_projects(request.room_id) >= self.limits.max_projects_per_room:
            raise ResearchLimitError("Limite dei progetti di ricerca per aula raggiunto")
        if request.max_sources > self.limits.max_sources_per_project:
            raise ResearchLimitError(
                "Il limite richiesto supera il massimo configurato per progetto"
            )
        return self.store.create_project(request)

    def list_projects(
        self,
        *,
        room_id: str,
        status: ResearchProjectStatus | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> ResearchProjectListResponse:
        total, items = self.store.list_projects(
            room_id=room_id,
            status=status,
            query=query,
            offset=offset,
            limit=limit,
        )
        return ResearchProjectListResponse(total=total, offset=offset, limit=limit, items=items)

    def get_project(self, project_id: str, room_id: str) -> ResearchProjectDetail:
        return self.store.get_project(project_id, room_id)

    def transition_project(
        self,
        project_id: str,
        room_id: str,
        request: ResearchProjectTransitionRequest,
    ) -> ResearchProjectDetail:
        return self.store.transition_project(project_id, room_id, request.status, request.note)

    def add_query(
        self,
        project_id: str,
        room_id: str,
        request: ResearchQueryCreateRequest,
    ) -> ResearchQuery:
        if self.store.count_queries(project_id) >= self.limits.max_queries_per_project:
            raise ResearchLimitError("Limite delle query pianificate raggiunto")
        return self.store.add_query(project_id, room_id, request)

    def list_queries(self, project_id: str, room_id: str) -> ResearchQueryListResponse:
        items = self.store.list_queries(project_id, room_id)
        return ResearchQueryListResponse(total=len(items), items=items)

    def add_source_candidate(
        self,
        project_id: str,
        room_id: str,
        request: ResearchSourceCandidateCreateRequest,
    ) -> ResearchSourceCandidate:
        project = self.store.get_project(project_id, room_id)
        effective_limit = min(project.max_sources, self.limits.max_sources_per_project)
        if self.store.count_sources(project_id) >= effective_limit:
            raise ResearchLimitError("Limite delle fonti candidate raggiunto")
        return self.store.add_source_candidate(project_id, room_id, request)

    def list_source_candidates(
        self, project_id: str, room_id: str
    ) -> ResearchSourceCandidateListResponse:
        items = self.store.list_source_candidates(project_id, room_id)
        return ResearchSourceCandidateListResponse(total=len(items), items=items)

    def list_transition_events(
        self, project_id: str, room_id: str
    ) -> list[ResearchTransitionEvent]:
        return self.store.list_transition_events(project_id, room_id)

    def _require_acquisition_components(
        self,
    ) -> tuple[SqliteAcquisitionStore, ControlledWebAcquirer]:
        if self.acquisition_store is None or self.acquirer is None:
            raise ResearchConflictError("Il modulo di acquisizione web non è configurato")
        return self.acquisition_store, self.acquirer

    def _require_review_components(
        self,
    ) -> tuple[SqliteAcquisitionStore, SqliteReviewStore, MaterialService]:
        if not self.review_policy.review_enabled:
            raise ResearchReviewDisabledError("La revisione umana è disattivata dal server")
        if self.acquisition_store is None or self.review_store is None or self.material_service is None:
            raise ResearchConflictError("Il modulo di revisione non è configurato")
        return self.acquisition_store, self.review_store, self.material_service

    def acquire_source(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        *,
        refresh: bool = False,
    ) -> ResearchAcquisitionEvent:
        acquisition_store, acquirer = self._require_acquisition_components()
        if acquisition_store.has_document(project_id, source_id, room_id) and not refresh:
            return acquisition_store.latest_successful_event(project_id, source_id, room_id)
        requested_url = acquisition_store.get_source_url(project_id, source_id, room_id)
        acquisition_id = acquisition_store.begin(
            project_id=project_id,
            source_id=source_id,
            room_id=room_id,
            requested_url=requested_url,
        )
        try:
            fetched = acquirer.fetch(requested_url)
            parsed = urlsplit(fetched.final_url)
            filename = PurePosixPath(parsed.path).name or f"source-{source_id}.txt"
            extracted_text, normalized_media_type = extract_text(
                fetched.content, fetched.media_type, filename
            )
            digest = hashlib.sha256(fetched.content).hexdigest()
            event = acquisition_store.complete(
                acquisition_id=acquisition_id,
                project_id=project_id,
                source_id=source_id,
                room_id=room_id,
                requested_url=fetched.requested_url,
                final_url=fetched.final_url,
                http_status=fetched.status,
                media_type=normalized_media_type,
                content=fetched.content,
                sha256=digest,
                extracted_text=extracted_text,
                robots_allowed=fetched.robots_allowed,
                resolved_ips=list(fetched.resolved_ips),
                redirect_chain=list(fetched.redirect_chain),
            )
            if self.review_store is not None:
                expired = self.review_store.expire_for_new_acquisition(
                    source_id=source_id,
                    project_id=project_id,
                    room_id=room_id,
                    acquisition_id=event.acquisition_id,
                )
                if expired:
                    self.store.set_source_review_state(
                        project_id,
                        source_id,
                        room_id,
                        status=ResearchSourceStatus.EXPIRED,
                        trust_level="review_expired_new_acquisition",
                    )
            return event
        except (WebAcquisitionError, MaterialError) as error:
            error_code = getattr(error, "code", "web_content_extraction_failed")
            acquisition_store.fail(
                acquisition_id=acquisition_id,
                project_id=project_id,
                source_id=source_id,
                room_id=room_id,
                error_code=error_code,
                blocked=isinstance(error, _BLOCKED_ACQUISITION_ERRORS),
            )
            raise

    def list_acquisitions(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchAcquisitionEventListResponse:
        acquisition_store, _ = self._require_acquisition_components()
        items = acquisition_store.list_events(project_id, source_id, room_id)
        return ResearchAcquisitionEventListResponse(total=len(items), items=items)

    def get_quarantined_document(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchQuarantinedDocument:
        acquisition_store, _ = self._require_acquisition_components()
        return acquisition_store.get_document(project_id, source_id, room_id)

    def start_review(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        request: ResearchReviewStartRequest,
    ) -> ResearchSourceReview:
        acquisition_store, review_store, _ = self._require_review_components()
        document = acquisition_store.get_document_payload(project_id, source_id, room_id)
        safety = analyze_untrusted_content(document.extracted_text)
        review = review_store.start_review(
            source_id=source_id,
            project_id=project_id,
            room_id=room_id,
            acquisition_id=document.acquisition_id,
            reviewer_id=request.reviewer_id,
            reviewer_role=request.reviewer_role,
            safety_analysis=safety,
        )
        self.store.set_source_review_state(
            project_id,
            source_id,
            room_id,
            status=ResearchSourceStatus.UNDER_REVIEW,
            trust_level="human_review_in_progress",
        )
        return review

    def get_review(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchSourceReview:
        _, review_store, _ = self._require_review_components()
        return review_store.get_review(project_id, source_id, room_id)

    def list_reviews(
        self,
        *,
        room_id: str,
        status: ResearchReviewStatus | None = None,
    ) -> ResearchSourceReviewListResponse:
        _, review_store, _ = self._require_review_components()
        items = review_store.list_reviews(room_id=room_id, status=status)
        return ResearchSourceReviewListResponse(total=len(items), items=items)

    def decide_review(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        request: ResearchReviewDecisionRequest,
    ) -> ResearchSourceReview:
        acquisition_store, review_store, _ = self._require_review_components()
        review = review_store.get_review(project_id, source_id, room_id)
        current = acquisition_store.get_document_payload(project_id, source_id, room_id)
        if current.acquisition_id != review.acquisition_id:
            raise ResearchStaleReviewError("La revisione non corrisponde all'acquisizione corrente")
        if request.decision == ResearchReviewDecision.APPROVE:
            if request.scores is None:
                raise ResearchReviewStateError("L'approvazione richiede tutti i punteggi di qualità")
            if review.safety_analysis.suspicious_content and not request.risk_acknowledged:
                raise ResearchReviewStateError(
                    "Il contenuto sospetto richiede una presa d'atto esplicita del rischio"
                )
            decision_status = ResearchReviewStatus.APPROVED
            source_status = ResearchSourceStatus.APPROVED
            trust_level = "human_review_approved"
        else:
            decision_status = ResearchReviewStatus.REJECTED
            source_status = ResearchSourceStatus.REJECTED
            trust_level = "human_review_rejected"
        decided = review_store.decide_review(
            review_id=review.review_id,
            decision_status=decision_status,
            reviewer_id=request.reviewer_id,
            rationale=request.rationale,
            title=request.title,
            author=request.author,
            publisher=request.publisher,
            published_at=request.published_at,
            license_name=request.license_name,
            language=request.language,
            scores=request.scores,
            risk_acknowledged=request.risk_acknowledged,
        )
        self.store.set_source_review_state(
            project_id,
            source_id,
            room_id,
            status=source_status,
            trust_level=trust_level,
        )
        return decided

    def list_review_events(
        self, project_id: str, source_id: int, room_id: str
    ) -> list[ResearchReviewEvent]:
        _, review_store, _ = self._require_review_components()
        review = review_store.get_review(project_id, source_id, room_id)
        return review_store.list_events(review.review_id, room_id)

    def compare_source_versions(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchSourceVersionComparison:
        acquisition_store, _ = self._require_acquisition_components()
        events = acquisition_store.successful_events(project_id, source_id, room_id, limit=2)
        if not events:
            raise ResearchConflictError("La fonte non ha acquisizioni riuscite")
        current = events[0]
        previous = events[1] if len(events) > 1 else None
        return ResearchSourceVersionComparison(
            source_id=source_id,
            project_id=project_id,
            current_acquisition_id=current.acquisition_id,
            previous_acquisition_id=previous.acquisition_id if previous else None,
            checksum_changed=bool(previous and current.sha256 != previous.sha256),
            final_url_changed=bool(previous and current.final_url != previous.final_url),
            size_delta=(
                (current.size_bytes or 0) - (previous.size_bytes or 0) if previous else None
            ),
            extracted_chars_delta=(
                (current.extracted_chars or 0) - (previous.extracted_chars or 0)
                if previous
                else None
            ),
            current_sha256=current.sha256 or "",
            previous_sha256=previous.sha256 if previous else None,
        )

    def promote_source(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        request: ResearchPromotionRequest,
    ) -> ResearchPromotion:
        acquisition_store, review_store, material_service = self._require_review_components()
        if not self.review_policy.promotion_enabled:
            raise ResearchPromotionDisabledError("La promozione verso CORE è disattivata dal server")
        existing = review_store.get_promotion_by_key(room_id, request.idempotency_key)
        if existing is not None:
            return existing
        review = review_store.get_review(project_id, source_id, room_id)
        if review.status != ResearchReviewStatus.APPROVED:
            raise ResearchReviewStateError("Soltanto una revisione approvata può essere promossa")
        document = acquisition_store.get_document_payload(project_id, source_id, room_id)
        if document.acquisition_id != review.acquisition_id:
            raise ResearchStaleReviewError("L'approvazione non corrisponde al documento corrente")
        source = self.store.get_source_candidate(project_id, source_id, room_id)
        parsed = urlsplit(document.final_url)
        filename = PurePosixPath(parsed.path).name or f"research-source-{source_id}.txt"
        title = request.title or review.title or source.title or filename
        source_label = request.source_label or source.publisher or document.final_url
        metadata = {
            "origin": "intelligence_research",
            "research_project_id": project_id,
            "research_source_id": source_id,
            "research_acquisition_id": document.acquisition_id,
            "research_review_id": review.review_id,
            "requested_url": document.requested_url,
            "final_url": document.final_url,
            "source_sha256": document.sha256,
            "reviewer_id": review.reviewer_id,
            "review_rationale": review.rationale,
            "review_scores": review.scores.model_dump() if review.scores else None,
            "author": review.author,
            "publisher": review.publisher or source.publisher,
            "published_at": review.published_at or source.published_at,
            "license": review.license_name,
            "language": review.language,
            "safety_analysis": review.safety_analysis.model_dump(),
            "risk_acknowledged": review.risk_acknowledged,
            "promotion_idempotency_key": request.idempotency_key,
        }
        result = material_service.import_document(
            MaterialImportRequest(
                room_id=room_id,
                title=title,
                filename=filename,
                media_type=document.media_type,
                content_base64=base64.b64encode(document.raw_content).decode("ascii"),
                source_type=MaterialSourceType.RESEARCH_PROMOTION,
                source_label=source_label,
                metadata=metadata,
            )
        )
        material_service.store.activate_material_version(
            result.material_id, result.version_id, room_id
        )
        try:
            return review_store.record_promotion(
                review=review,
                material_id=result.material_id,
                version_id=result.version_id,
                idempotency_key=request.idempotency_key,
                promoted_by=request.actor_id,
            )
        except Exception:
            if review_store.active_promotions_for_material(result.material_id) == 0:
                material_service.store.deactivate_material(result.material_id, room_id)
            raise

    def get_active_promotion(
        self, project_id: str, source_id: int, room_id: str
    ) -> ResearchPromotion:
        _, review_store, _ = self._require_review_components()
        return review_store.get_active_promotion(project_id, source_id, room_id)

    def revoke_promotion(
        self,
        project_id: str,
        source_id: int,
        room_id: str,
        request: ResearchPromotionRevocationRequest,
    ) -> ResearchPromotion:
        _, review_store, material_service = self._require_review_components()
        promotion = review_store.get_active_promotion(project_id, source_id, room_id)
        revoked = review_store.revoke_promotion(
            promotion_id=promotion.promotion_id,
            actor_id=request.actor_id,
            rationale=request.rationale,
        )
        if review_store.active_promotions_for_material(revoked.material_id) == 0:
            material_service.store.deactivate_material(revoked.material_id, room_id)
        review_store.set_review_status(
            review_id=revoked.review_id,
            status=request.source_status,
            actor_id=request.actor_id,
            rationale=request.rationale,
        )
        self.store.set_source_review_state(
            project_id,
            source_id,
            room_id,
            status=(
                ResearchSourceStatus.EXPIRED
                if request.source_status == ResearchReviewStatus.EXPIRED
                else ResearchSourceStatus.SUPERSEDED
            ),
            trust_level="human_review_promotion_revoked",
        )
        return revoked
