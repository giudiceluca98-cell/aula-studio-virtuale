from __future__ import annotations

import hashlib
import math
import re
import time
from collections import Counter
from dataclasses import dataclass
from typing import Sequence

from app.materials.models import MaterialStatus
from app.materials.storage import SqliteMaterialStore

from .embedding_provider import EmbeddingProvider, validate_vector
from .semantic_errors import (
    EmbeddingDisabledError,
    EmbeddingProviderUnavailableError,
    HybridRetrievalDisabledError,
    SemanticIndexError,
)
from .semantic_models import (
    EmbeddingIndexRequest,
    EmbeddingJob,
    HybridSearchHit,
    HybridSearchRequest,
    HybridSearchResponse,
    RetrievalEvaluationRequest,
    RetrievalEvaluationResult,
    SemanticIndexDeleteResult,
    SemanticIndexStatus,
)
from .vector_storage import SqliteHybridIndexStore

_TOKEN_RE = re.compile(r"[\wÀ-ÿ]+", re.UNICODE)


@dataclass(frozen=True, slots=True)
class HybridRetrievalPolicy:
    embeddings_enabled: bool = False
    retrieval_enabled: bool = False
    lexical_fallback_enabled: bool = True
    semantic_weight: float = 0.65
    lexical_weight: float = 0.35
    minimum_score: float = 0.15
    max_results: int = 10
    max_candidates: int = 1_000
    batch_size: int = 32
    max_excerpt_chars: int = 700

    def validate(self) -> None:
        if self.semantic_weight < 0 or self.lexical_weight < 0:
            raise ValueError("I pesi non possono essere negativi")
        if self.semantic_weight + self.lexical_weight <= 0:
            raise ValueError("Almeno un peso deve essere positivo")
        if not 0 <= self.minimum_score <= 1:
            raise ValueError("minimum_score non valido")
        if self.max_results < 1 or self.max_candidates < self.max_results:
            raise ValueError("Limiti risultati/candidati non validi")
        if self.batch_size < 1 or self.max_excerpt_chars < 80:
            raise ValueError("Batch o excerpt non validi")


class HybridRetrievalService:
    def __init__(
        self, store: SqliteHybridIndexStore, material_store: SqliteMaterialStore,
        provider: EmbeddingProvider | None, *, policy: HybridRetrievalPolicy | None = None,
    ) -> None:
        self.store = store
        self.material_store = material_store
        self.provider = provider
        self.policy = policy or HybridRetrievalPolicy()
        self.policy.validate()

    @property
    def provider_name(self) -> str:
        return self.provider.name if self.provider is not None else "unconfigured"

    @property
    def model_name(self) -> str:
        return self.provider.model if self.provider is not None else "unconfigured"

    @property
    def dimensions(self) -> int:
        return self.provider.dimensions if self.provider is not None else 0

    def status(self) -> SemanticIndexStatus:
        return SemanticIndexStatus(
            checkpoint="INTELLIGENCE-0.6",
            embeddings_enabled=self.policy.embeddings_enabled,
            hybrid_retrieval_enabled=self.policy.retrieval_enabled,
            lexical_fallback_enabled=self.policy.lexical_fallback_enabled,
            provider=self.provider_name, model=self.model_name, dimensions=self.dimensions,
            max_results=self.policy.max_results, minimum_score=self.policy.minimum_score,
            **self.store.counts(),
        )

    def _provider(self) -> EmbeddingProvider:
        if self.provider is None:
            raise EmbeddingProviderUnavailableError("Provider embedding non configurato")
        return self.provider

    def index_material(
        self, material_id: str, version_number: int, request: EmbeddingIndexRequest
    ) -> EmbeddingJob:
        if not self.policy.embeddings_enabled:
            raise EmbeddingDisabledError("Indicizzazione embedding disattivata dal server")
        provider = self._provider()
        version = self.material_store.get_version(material_id, version_number, request.room_id)
        if version.status != MaterialStatus.READY:
            raise SemanticIndexError("La versione materiale non è pronta")
        project_id, source_id, promotion_id = self.store.require_active_promotion(
            room_id=request.room_id, material_id=material_id, version_id=version.version_id
        )
        existing = self.store.find_job(
            room_id=request.room_id, material_id=material_id, version_id=version.version_id,
            provider=provider.name, model=provider.model,
        )
        if existing is not None and existing.status.value == "succeeded" and not request.rebuild:
            return existing
        job = self.store.begin_job(
            room_id=request.room_id, project_id=project_id, source_id=source_id,
            promotion_id=promotion_id, material_id=material_id, version_id=version.version_id,
            version_number=version.version_number, checksum_sha256=version.checksum_sha256,
            provider=provider.name, model=provider.model, dimensions=provider.dimensions,
            idempotency_key=request.idempotency_key, rebuild=request.rebuild,
        )
        try:
            chunks = self.material_store.list_chunks(material_id, version_number, request.room_id)
            if not chunks:
                raise SemanticIndexError("Materiale privo di chunk verificabili")
            segments: list[dict] = []
            total_tokens = 0
            total_cost = 0
            for start in range(0, len(chunks), self.policy.batch_size):
                batch_chunks = chunks[start:start + self.policy.batch_size]
                batch = provider.embed_many([chunk.text for chunk in batch_chunks])
                if len(batch.vectors) != len(batch_chunks):
                    raise EmbeddingProviderUnavailableError("Il provider ha restituito un batch incompleto")
                total_tokens += batch.token_count
                total_cost += batch.cost_microunits
                for chunk, raw_vector in zip(batch_chunks, batch.vectors):
                    vector = validate_vector(raw_vector, provider.dimensions)
                    segments.append({
                        "locator": f"char:{chunk.start_char}-{chunk.end_char}",
                        "text": chunk.text, "text_sha256": chunk.text_sha256,
                        "vector": vector, "norm": 1.0,
                    })
            return self.store.complete_job(
                job_id=job.job_id, segments=segments, token_count=total_tokens,
                cost_microunits=total_cost,
            )
        except Exception as error:
            self.store.fail_job(job.job_id, getattr(error, "code", error.__class__.__name__))
            raise

    @staticmethod
    def _tokens(text: str) -> list[str]:
        return _TOKEN_RE.findall(text.casefold())

    @staticmethod
    def _cosine(first: Sequence[float], second: Sequence[float]) -> float:
        if len(first) != len(second):
            return 0.0
        return max(-1.0, min(1.0, sum(a*b for a,b in zip(first,second))))

    def _lexical_scores(self, query: str, candidates: list[dict]) -> dict[int, float]:
        query_terms = Counter(self._tokens(query))
        if not query_terms:
            return {item["segment_id"]:0.0 for item in candidates}
        docs = {item["segment_id"]:Counter(self._tokens(item["text"])) for item in candidates}
        n = max(1, len(docs))
        document_frequency = Counter()
        for terms in docs.values():
            document_frequency.update(set(terms))
        query_weight = sum(
            count * (math.log((n + 1)/(document_frequency.get(term,0)+1)) + 1)
            for term,count in query_terms.items()
        ) or 1.0
        scores = {}
        for segment_id, terms in docs.items():
            value = 0.0
            for term, count in query_terms.items():
                idf = math.log((n + 1)/(document_frequency.get(term,0)+1)) + 1
                value += min(count, terms.get(term,0)) * idf
            scores[segment_id] = max(0.0, min(1.0, value/query_weight))
        return scores

    def search(self, request: HybridSearchRequest) -> HybridSearchResponse:
        if not self.policy.retrieval_enabled:
            raise HybridRetrievalDisabledError("Retrieval ibrido disattivato dal server")
        started = time.perf_counter()
        provider = self.provider
        provider_name = self.provider_name
        model_name = self.model_name
        candidates = self.store.list_segments(
            room_id=request.room_id, project_id=request.project_id,
            material_ids=request.material_ids, source_ids=request.source_ids,
            provider=provider_name, model=model_name, limit=self.policy.max_candidates,
        )
        lexical = self._lexical_scores(request.query, candidates)
        semantic: dict[int,float] = {item["segment_id"]:0.0 for item in candidates}
        token_count = 0; cost = 0; mode = "hybrid"
        if provider is None:
            if not self.policy.lexical_fallback_enabled:
                raise EmbeddingProviderUnavailableError("Provider embedding non configurato")
            mode = "lexical_fallback"
        else:
            try:
                batch = provider.embed_many([request.query])
                query_vector = validate_vector(batch.vectors[0], provider.dimensions)
                token_count = batch.token_count; cost = batch.cost_microunits
                semantic = {
                    item["segment_id"]: max(0.0, self._cosine(query_vector,item["vector"]))
                    for item in candidates
                }
            except Exception as error:
                if not self.policy.lexical_fallback_enabled:
                    raise EmbeddingProviderUnavailableError(str(error)) from error
                mode = "lexical_fallback"
                semantic = {item["segment_id"]:0.0 for item in candidates}
        sw = self.policy.semantic_weight if mode == "hybrid" else 0.0
        lw = self.policy.lexical_weight if mode == "hybrid" else 1.0
        weight_total = sw + lw or 1.0
        phrase = request.query.casefold().strip()
        scored = []
        for item in candidates:
            lexical_score = lexical[item["segment_id"]]
            semantic_score = semantic[item["segment_id"]]
            rerank_bonus = 0.05 if phrase and phrase in item["text"].casefold() else 0.0
            score = min(1.0, (sw*semantic_score + lw*lexical_score)/weight_total + rerank_bonus)
            scored.append((score,semantic_score,lexical_score,rerank_bonus,item))
        threshold = request.min_score if request.min_score is not None else self.policy.minimum_score
        scored.sort(key=lambda row:(-row[0],-row[2],row[4]["material_id"],row[4]["locator"]))
        items: list[HybridSearchHit] = []
        seen_hashes: set[str] = set()
        max_results = min(request.limit,self.policy.max_results)
        for score,semantic_score,lexical_score,bonus,item in scored:
            if score < threshold or item["text_sha256"] in seen_hashes:
                continue
            seen_hashes.add(item["text_sha256"])
            excerpt = item["text"][:self.policy.max_excerpt_chars]
            items.append(HybridSearchHit(
                segment_id=item["segment_id"],project_id=item["project_id"],
                source_id=item["source_id"],material_id=item["material_id"],
                version_number=item["version_number"],locator=item["locator"],excerpt=excerpt,
                score=round(score,6),semantic_score=round(semantic_score,6),
                lexical_score=round(lexical_score,6),rerank_bonus=round(bonus,6),
                text_sha256=item["text_sha256"],provider=item["provider"],model=item["model"],
            ))
            if len(items) >= max_results:
                break
        latency_ms = (time.perf_counter()-started)*1000
        run_id = self.store.record_run(
            room_id=request.room_id,project_id=request.project_id,
            query_sha256=hashlib.sha256(request.query.encode()).hexdigest(),mode=mode,
            candidate_count=len(candidates),result_count=len(items),latency_ms=latency_ms,
            token_count=token_count,cost_microunits=cost,provider=provider_name,model=model_name,
        )
        return HybridSearchResponse(
            run_id=run_id,mode=mode,query=request.query,total_candidates=len(candidates),
            latency_ms=round(latency_ms,3),token_count=token_count,cost_microunits=cost,items=items,
        )

    def evaluate(self, request: RetrievalEvaluationRequest) -> RetrievalEvaluationResult:
        response = self.search(HybridSearchRequest(**request.model_dump(exclude={"expected_locators"})))
        expected = set(request.expected_locators)
        returned = [item.locator for item in response.items]
        matched = sorted(expected.intersection(returned))
        precision = len(matched)/len(returned) if returned else 0.0
        recall = len(matched)/len(expected) if expected else 1.0
        return RetrievalEvaluationResult(
            response=response,precision_at_k=round(precision,6),recall_at_k=round(recall,6),
            matched_locators=matched,missing_locators=sorted(expected-set(matched)),
        )

    def delete_index(
        self, material_id: str, version_number: int, room_id: str
    ) -> SemanticIndexDeleteResult:
        if not self.policy.embeddings_enabled:
            raise EmbeddingDisabledError("Cancellazione indice disattivata dal server")
        jobs, segments = self.store.delete_index(
            room_id=room_id,material_id=material_id,version_number=version_number
        )
        return SemanticIndexDeleteResult(
            material_id=material_id,version_number=version_number,
            deleted_jobs=jobs,deleted_segments=segments,
        )
