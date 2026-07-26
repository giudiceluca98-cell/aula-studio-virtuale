from __future__ import annotations

import hashlib
from dataclasses import dataclass

from app.materials.storage import SqliteMaterialStore

from .errors import InvalidRetrievalQueryError
from .models import (
    RetrievalCitation,
    RetrievalHit,
    RetrievalSearchRequest,
    RetrievalSearchResponse,
    RetrievalStatus,
)
from .ranking import build_excerpt, rank_candidate, tokenize


@dataclass(frozen=True, slots=True)
class RetrievalLimits:
    max_query_chars: int = 500
    max_results: int = 10
    max_excerpt_chars: int = 600
    minimum_score: float = 1.0

    def validate(self) -> None:
        if self.max_query_chars < 1:
            raise ValueError("max_query_chars deve essere positivo")
        if self.max_results < 1 or self.max_results > 50:
            raise ValueError("max_results deve essere compreso tra 1 e 50")
        if self.max_excerpt_chars < 80:
            raise ValueError("max_excerpt_chars deve essere almeno 80")
        if self.minimum_score < 0:
            raise ValueError("minimum_score non può essere negativo")


class RetrievalService:
    stage = "lexical_ranked_citations_no_embeddings"
    algorithm = "eve-lexical-v1"

    def __init__(self, material_store: SqliteMaterialStore, *, limits: RetrievalLimits | None = None) -> None:
        self.material_store = material_store
        self.limits = limits or RetrievalLimits()
        self.limits.validate()

    def status(self) -> RetrievalStatus:
        with self.material_store.connection() as connection:
            current_ready_chunks = int(
                connection.execute(
                    """
                    SELECT COUNT(*) AS total
                    FROM materials m
                    JOIN material_versions v ON v.version_id = m.current_version_id
                    JOIN material_chunks c ON c.version_id = v.version_id
                    WHERE v.status = 'ready'
                    """
                ).fetchone()["total"]
            )
        return RetrievalStatus(
            enabled=True,
            deterministic=True,
            embeddings_enabled=False,
            embedding_provider=None,
            retrieval_stage=self.stage,
            ranking_algorithm=self.algorithm,
            current_ready_chunks=current_ready_chunks,
            max_query_chars=self.limits.max_query_chars,
            max_results=self.limits.max_results,
            max_excerpt_chars=self.limits.max_excerpt_chars,
            minimum_score=self.limits.minimum_score,
            source_scope="current_ready_versions_in_authorized_room",
        )

    def _candidate_rows(self, request: RetrievalSearchRequest):
        clauses = ["m.room_id = ?", "v.status = 'ready'"]
        parameters: list[object] = [request.room_id]
        if request.material_ids:
            placeholders = ",".join("?" for _ in request.material_ids)
            clauses.append(f"m.material_id IN ({placeholders})")
            parameters.extend(request.material_ids)
        where = " AND ".join(clauses)
        with self.material_store.connection() as connection:
            return connection.execute(
                f"""
                SELECT
                    m.material_id, m.title,
                    v.version_id, v.version_number, v.filename, v.media_type,
                    c.chunk_id, c.chunk_index, c.start_char, c.end_char,
                    c.text_content, c.text_sha256
                FROM materials m
                JOIN material_versions v ON v.version_id = m.current_version_id
                JOIN material_chunks c ON c.version_id = v.version_id
                WHERE {where}
                ORDER BY m.material_id, c.chunk_index
                """,
                parameters,
            ).fetchall()

    def search(self, request: RetrievalSearchRequest) -> RetrievalSearchResponse:
        query = request.query.strip()
        if len(query) > self.limits.max_query_chars:
            raise InvalidRetrievalQueryError(
                f"La query supera il limite di {self.limits.max_query_chars} caratteri"
            )
        if not tokenize(query):
            raise InvalidRetrievalQueryError()

        rows = self._candidate_rows(request)
        integrity_failures = 0
        candidates: list[tuple[float, bool, str, int, RetrievalHit]] = []
        for row in rows:
            text = str(row["text_content"])
            actual_sha256 = hashlib.sha256(text.encode("utf-8")).hexdigest()
            if actual_sha256 != str(row["text_sha256"]):
                integrity_failures += 1
                continue
            ranking = rank_candidate(
                query=query,
                title=str(row["title"]),
                filename=str(row["filename"]),
                text=text,
            )
            if ranking is None or ranking.score < self.limits.minimum_score:
                continue
            excerpt, excerpt_start, excerpt_end = build_excerpt(
                text,
                first_match=ranking.first_match,
                max_chars=self.limits.max_excerpt_chars,
            )
            citation = RetrievalCitation(
                locator=(
                    f"material:{row['material_id']}:v{row['version_number']}:"
                    f"chunk:{row['chunk_index']}:{row['start_char']}-{row['end_char']}"
                ),
                material_id=str(row["material_id"]),
                version_id=int(row["version_id"]),
                version_number=int(row["version_number"]),
                chunk_id=int(row["chunk_id"]),
                chunk_index=int(row["chunk_index"]),
                title=str(row["title"]),
                filename=str(row["filename"]),
                media_type=str(row["media_type"]),
                start_char=int(row["start_char"]),
                end_char=int(row["end_char"]),
                text_sha256=str(row["text_sha256"]),
            )
            hit = RetrievalHit(
                rank=0,
                score=ranking.score,
                excerpt=excerpt,
                excerpt_start_char=excerpt_start,
                excerpt_end_char=excerpt_end,
                matched_terms=ranking.matched_terms,
                exact_phrase=ranking.exact_phrase,
                suspicious_content=bool(ranking.safety_flags),
                safety_flags=ranking.safety_flags,
                citation=citation,
            )
            candidates.append(
                (
                    ranking.score,
                    ranking.exact_phrase,
                    str(row["material_id"]),
                    int(row["chunk_index"]),
                    hit,
                )
            )

        candidates.sort(key=lambda item: (-item[0], -int(item[1]), item[2], item[3]))
        effective_limit = min(request.limit, self.limits.max_results)
        hits = [item[4].model_copy(update={"rank": index}) for index, item in enumerate(candidates[:effective_limit], start=1)]
        return RetrievalSearchResponse(
            room_id=request.room_id,
            query=query,
            query_sha256=hashlib.sha256(query.encode("utf-8")).hexdigest(),
            total_candidates=len(rows),
            integrity_failures=integrity_failures,
            returned_hits=len(hits),
            embeddings_enabled=False,
            retrieval_stage=self.stage,
            hits=hits,
        )
