from __future__ import annotations

import base64
import binascii
import hashlib
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import PurePosixPath
from urllib.parse import urlsplit

from app.materials.errors import MaterialError
from app.materials.extraction import extract_text
from app.materials.models import MaterialImportRequest, MaterialSourceType
from app.materials.service import MaterialService

from .acquisition_storage import SqliteAcquisitionStore
from .advanced_ingestion import AdvancedDocumentExtractor, AdvancedIngestionPolicy
from .ingestion_storage import SqliteIngestionStore
from .limited_crawler import CrawlPolicy, LimitedCrawler
from .errors import (
    ResearchConflictError,
    ResearchLimitError,
    ResearchPromotionDisabledError,
    ResearchReviewDisabledError,
    ResearchReviewStateError,
    ResearchStaleReviewError,
    ResearchSearchDisabledError,
    ResearchSearchProviderError,
    ResearchSearchProviderUnavailableError,
    ResearchAdvancedIngestionDisabledError,
    ResearchDocumentTooLargeError,
    ResearchCrawlDisabledError,
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
    ResearchSearchExecuteRequest,
    ResearchSearchExecution,
    ResearchSearchExecutionListResponse,
    ResearchSearchResult,
    ResearchQueryStatus,
    ResearchAdvancedImportRequest, ResearchIngestedDocument, ResearchIngestionEventListResponse,
    ResearchCrawlRequest, ResearchCrawlRun,
)
from .review_analysis import analyze_untrusted_content
from .review_storage import SqliteReviewStore
from .storage import SqliteResearchStore
from .search_provider import (
    SearchProviderRegistry, SearchProviderRequest, filter_and_rank_items,
)
from .search_storage import SqliteSearchStore
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


@dataclass(frozen=True)
class ResearchSearchPolicy:
    enabled: bool = False
    timeout_seconds: float = 8.0
    max_results: int = 20
    max_executions_per_project: int = 100
    max_executions_per_room_day: int = 200
    max_executions_per_actor_day: int = 50
    max_retries: int = 1
    provider_order: tuple[str, ...] = ()


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
        search_store: SqliteSearchStore | None = None,
        search_providers: SearchProviderRegistry | None = None,
        search_policy: ResearchSearchPolicy | None = None,
        ingestion_store: SqliteIngestionStore | None = None,
        advanced_extractor: AdvancedDocumentExtractor | None = None,
        ingestion_policy: AdvancedIngestionPolicy | None = None,
        crawler: LimitedCrawler | None = None,
        crawl_policy: CrawlPolicy | None = None,
    ) -> None:
        self.store = store
        self.limits = limits or ResearchLimits()
        self.acquisition_store = acquisition_store
        self.acquirer = acquirer
        self.review_store = review_store
        self.material_service = material_service
        self.review_policy = review_policy or ResearchReviewPolicy()
        self.search_store = search_store
        self.search_providers = search_providers
        self.search_policy = search_policy or ResearchSearchPolicy()
        self.ingestion_store = ingestion_store
        self.advanced_extractor = advanced_extractor
        self.ingestion_policy = ingestion_policy or AdvancedIngestionPolicy()
        self.crawler = crawler
        self.crawl_policy = crawl_policy or CrawlPolicy()


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
            search_available = self.search_store is not None and self.search_providers is not None
            policy = self.acquirer.policy if self.acquirer is not None else None
            review_counts = self.review_store.counts() if self.review_store is not None else {}
            provider_count = len(self.search_providers.names) if self.search_providers is not None else 0
            ingestion_available = self.ingestion_store is not None and self.advanced_extractor is not None
            crawl_available = self.ingestion_store is not None and self.crawler is not None
            return base.model_copy(
                update={
                    "checkpoint": (
                        "INTELLIGENCE-0.5" if ingestion_available else
                        "INTELLIGENCE-0.4" if search_available else
                        "INTELLIGENCE-0.3" if review_available else
                        "INTELLIGENCE-0.2" if acquisition_available else "INTELLIGENCE-0.1"
                    ),
                    "stage": (
                        "advanced_documents_and_limited_crawl_quarantine" if ingestion_available else
                        "provider_search_query_to_quarantined_candidates" if search_available else
                        "human_review_quality_explicit_core_promotion" if review_available else
                        "controlled_web_acquisition_quarantine_no_approval" if acquisition_available else
                        "research_projects_and_source_catalog_no_network"
                    ),
                    "successful_acquisitions": (
                        self.acquisition_store.count_successful()
                        if self.acquisition_store is not None else 0
                    ),
                    "review_available": review_available,
                    "review_enabled": review_available and self.review_policy.review_enabled,
                    "promotion_enabled": review_available and self.review_policy.promotion_enabled,
                    "under_review_sources": review_counts.get("under_review_sources", 0),
                    "approved_sources": review_counts.get("approved_sources", 0),
                    "rejected_sources": review_counts.get("rejected_sources", 0),
                    "active_promotions": review_counts.get("active_promotions", 0),
                    "search_available": search_available,
                    "search_provider_count": provider_count,
                    "search_execution_count": (
                        self.search_store.count_executions() if self.search_store is not None else 0
                    ),
                    "search_result_count": (
                        self.search_store.count_results() if self.search_store is not None else 0
                    ),
                    "max_search_results": self.search_policy.max_results if search_available else 0,
                    "max_search_executions_per_room_day": (
                        self.search_policy.max_executions_per_room_day if search_available else 0
                    ),
                    "web_search_enabled": bool(
                        search_available and self.search_policy.enabled and provider_count > 0
                    ),
                    "content_acquisition_available": acquisition_available,
                    "content_acquisition_enabled": bool(policy and policy.enabled),
                    "model_training_enabled": False,
                    "max_acquisition_bytes": policy.max_bytes if policy else 0,
                    "max_redirects": policy.max_redirects if policy else 0,
                    "robots_required": policy.require_robots if policy else True,
                    "advanced_ingestion_available": ingestion_available,
                    "advanced_ingestion_enabled": bool(ingestion_available and self.ingestion_policy.enabled),
                    "ingested_document_count": self.ingestion_store.count_documents() if self.ingestion_store else 0,
                    "crawl_available": crawl_available,
                    "crawl_enabled": bool(crawl_available and self.crawl_policy.enabled),
                    "crawl_count": self.ingestion_store.count_crawls() if self.ingestion_store else 0,
                    "max_crawl_depth": self.crawl_policy.max_depth if crawl_available else 0,
                    "max_crawl_pages": self.crawl_policy.max_pages if crawl_available else 0,
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


    def _require_search_components(self) -> tuple[SqliteSearchStore, SearchProviderRegistry]:
        if not self.search_policy.enabled:
            raise ResearchSearchDisabledError("La ricerca web è disattivata dal server")
        if self.search_store is None or self.search_providers is None:
            raise ResearchSearchProviderUnavailableError(
                "Il modulo provider di ricerca non è configurato"
            )
        return self.search_store, self.search_providers

    def execute_query(
        self,
        project_id: str,
        query_id: int,
        room_id: str,
        request: ResearchSearchExecuteRequest,
    ) -> ResearchSearchExecution:
        search_store, providers = self._require_search_components()
        project = self.store.get_project(project_id, room_id)
        if project.status == ResearchProjectStatus.ARCHIVED:
            raise ResearchTransitionError("Un progetto archiviato non può eseguire query")
        query = self.store.get_query(project_id, query_id, room_id)
        today = datetime.now(timezone.utc).date().isoformat()
        if search_store.count_executions(project_id=project_id) >= self.search_policy.max_executions_per_project:
            raise ResearchLimitError("Limite delle esecuzioni per progetto raggiunto")
        if search_store.count_executions(room_id=room_id, day_prefix=today) >= self.search_policy.max_executions_per_room_day:
            raise ResearchLimitError("Limite giornaliero delle ricerche per aula raggiunto")
        if search_store.count_executions(room_id=room_id, actor_id=request.actor_id, day_prefix=today) >= self.search_policy.max_executions_per_actor_day:
            raise ResearchLimitError("Limite giornaliero delle ricerche per utente raggiunto")
        effective_limit = min(request.max_results, self.search_policy.max_results)
        provider_order = providers.resolve(request.provider, self.search_policy.provider_order)
        execution_id = search_store.begin(
            query_id=query_id,
            project_id=project_id,
            room_id=room_id,
            actor_id=request.actor_id,
            provider_name=request.provider or "auto",
            filters=request.filters,
            requested_limit=effective_limit,
        )
        self.store.set_query_status(project_id, query_id, room_id, ResearchQueryStatus.RUNNING)
        attempts = 0
        failures: list[str] = []
        try:
            for provider in provider_order:
                for _retry in range(self.search_policy.max_retries + 1):
                    attempts += 1
                    try:
                        response = provider.search(
                            SearchProviderRequest(
                                text=query.text,
                                language=request.filters.language or query.language,
                                purpose=query.purpose,
                                max_results=effective_limit,
                                timeout_seconds=self.search_policy.timeout_seconds,
                                included_domains=tuple(request.filters.included_domains),
                                excluded_domains=tuple(request.filters.excluded_domains),
                                published_after=request.filters.published_after,
                                published_before=request.filters.published_before,
                                source_types=tuple(request.filters.source_types),
                            )
                        )
                    except (TimeoutError, ResearchSearchProviderError) as error:
                        failures.append(f"{provider.name}:{error.__class__.__name__}")
                        continue
                    ranked = filter_and_rank_items(
                        response.items,
                        included_domains=request.filters.included_domains,
                        excluded_domains=request.filters.excluded_domains,
                        language=request.filters.language,
                        published_after=request.filters.published_after,
                        published_before=request.filters.published_before,
                        source_types=request.filters.source_types,
                        max_results=effective_limit,
                    )
                    results: list[ResearchSearchResult] = []
                    for rank, (item, normalized_url, reasons) in enumerate(ranked, start=1):
                        source_id: int | None = None
                        if request.register_candidates:
                            existing = self.store.find_source_candidate_by_url(
                                project_id, room_id, normalized_url
                            )
                            if existing is None:
                                candidate = self.add_source_candidate(
                                    project_id,
                                    room_id,
                                    ResearchSourceCandidateCreateRequest(
                                        url=normalized_url,
                                        title=item.title,
                                        publisher=item.publisher,
                                        published_at=item.published_at,
                                        notes="Registrata da ricerca provider; acquisizione non avviata.",
                                        metadata={
                                            "search_execution_id": execution_id,
                                            "search_provider": provider.name,
                                            "search_rank": rank,
                                            "ranking_reasons": list(reasons),
                                            "provider_score": item.score,
                                            "source_type": item.source_type,
                                            "language": item.language,
                                            **item.metadata,
                                        },
                                    ),
                                )
                                source_id = candidate.source_id
                            else:
                                source_id = existing.source_id
                        results.append(
                            ResearchSearchResult(
                                rank=rank,
                                original_url=item.url,
                                normalized_url=normalized_url,
                                title=item.title,
                                snippet=item.snippet,
                                publisher=item.publisher,
                                published_at=item.published_at,
                                language=item.language,
                                source_type=item.source_type,
                                provider_score=item.score,
                                ranking_reasons=list(reasons),
                                metadata=item.metadata,
                                source_id=source_id,
                            )
                        )
                    execution = search_store.complete(
                        execution_id,
                        provider_name=provider.name,
                        attempts=attempts,
                        cost_units=response.cost_units,
                        provider_request_id=response.provider_request_id,
                        results=results,
                    )
                    self.store.set_query_status(
                        project_id, query_id, room_id, ResearchQueryStatus.SUCCEEDED
                    )
                    return execution
            raise ResearchSearchProviderError(
                "Tutti i provider di ricerca hanno fallito: " + ", ".join(failures)
            )
        except Exception as error:
            search_store.fail(
                execution_id,
                attempts=attempts,
                error_code=getattr(error, 'code', error.__class__.__name__),
            )
            self.store.set_query_status(
                project_id, query_id, room_id, ResearchQueryStatus.FAILED
            )
            raise

    def list_search_executions(
        self, project_id: str, query_id: int, room_id: str, *, limit: int = 100
    ) -> ResearchSearchExecutionListResponse:
        if self.search_store is None:
            raise ResearchSearchProviderUnavailableError("Archivio ricerche non configurato")
        self.store.get_query(project_id, query_id, room_id)
        return self.search_store.list_for_query(project_id, query_id, room_id, limit=limit)

    def get_search_execution(self, execution_id: int, room_id: str) -> ResearchSearchExecution:
        if self.search_store is None:
            raise ResearchSearchProviderUnavailableError("Archivio ricerche non configurato")
        return self.search_store.get(execution_id, room_id=room_id)

    def _require_advanced_ingestion(self) -> tuple[SqliteIngestionStore, AdvancedDocumentExtractor]:
        if not self.ingestion_policy.enabled:
            raise ResearchAdvancedIngestionDisabledError("L'ingestione avanzata è disattivata dal server")
        if self.ingestion_store is None or self.advanced_extractor is None:
            raise ResearchConflictError("Il modulo di ingestione avanzata non è configurato")
        return self.ingestion_store, self.advanced_extractor

    def import_advanced_document(self, project_id: str, room_id: str, request: ResearchAdvancedImportRequest) -> ResearchIngestedDocument:
        store, extractor = self._require_advanced_ingestion()
        existing = store.get_event_by_key(room_id, request.idempotency_key)
        if existing is not None:
            if existing.project_id != project_id or existing.filename != request.filename:
                raise ResearchConflictError("Idempotency key già usata per un'altra importazione")
            if existing.document_id is None:
                raise ResearchConflictError("Importazione idempotente non completata")
            return store.get_document(existing.document_id, room_id)
        maximum=((self.ingestion_policy.max_document_bytes+2)//3)*4+8
        if len(request.content_base64)>maximum: raise ResearchDocumentTooLargeError()
        try: content=base64.b64decode(request.content_base64,validate=True)
        except (binascii.Error,ValueError) as exc: raise ResearchConflictError("Contenuto base64 non valido") from exc
        ingestion_id=store.begin_import(project_id=project_id,room_id=room_id,source_id=request.source_id,actor_id=request.actor_id,idempotency_key=request.idempotency_key,filename=request.filename,media_type=request.media_type)
        try:
            extracted=extractor.extract(filename=request.filename,media_type=request.media_type,content=content)
            return store.complete_import(ingestion_id=ingestion_id,project_id=project_id,room_id=room_id,source_id=request.source_id,content=content,extracted=extracted,near_threshold=self.ingestion_policy.near_duplicate_threshold)
        except Exception as error:
            store.fail_import(ingestion_id,getattr(error,'code',error.__class__.__name__))
            raise

    def list_advanced_ingestions(self, project_id: str, room_id: str, *, limit: int = 100) -> ResearchIngestionEventListResponse:
        if self.ingestion_store is None: raise ResearchConflictError("Archivio ingestione non configurato")
        items=self.ingestion_store.list_events(project_id,room_id,limit=limit)
        return ResearchIngestionEventListResponse(total=len(items),items=items)

    def get_ingested_document(self, document_id: int, room_id: str) -> ResearchIngestedDocument:
        if self.ingestion_store is None: raise ResearchConflictError("Archivio ingestione non configurato")
        return self.ingestion_store.get_document(document_id,room_id)

    def crawl_source(self, project_id: str, source_id: int, room_id: str, request: ResearchCrawlRequest) -> ResearchCrawlRun:
        if not self.crawl_policy.enabled: raise ResearchCrawlDisabledError("Il crawling è disattivato dal server")
        if self.ingestion_store is None or self.crawler is None: raise ResearchConflictError("Crawler limitato non configurato")
        source=self.store.get_source_candidate(project_id,source_id,room_id)
        crawl_id=self.ingestion_store.begin_crawl(project_id=project_id,source_id=source_id,room_id=room_id,actor_id=request.actor_id,root_url=source.url)
        try:
            result=self.crawler.crawl(source.url,max_depth=request.max_depth,max_pages=request.max_pages)
            return self.ingestion_store.complete_crawl(crawl_id,result)
        except Exception as error:
            self.ingestion_store.fail_crawl(crawl_id,getattr(error,'code',error.__class__.__name__))
            raise

    def get_crawl(self, crawl_id: int, room_id: str) -> ResearchCrawlRun:
        if self.ingestion_store is None: raise ResearchConflictError("Archivio crawl non configurato")
        return self.ingestion_store.get_crawl(crawl_id,room_id)
