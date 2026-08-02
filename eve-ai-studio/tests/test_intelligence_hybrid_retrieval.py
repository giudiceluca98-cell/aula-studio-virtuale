from __future__ import annotations

import base64
import sqlite3
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.intelligence.embedding_provider import DeterministicHashEmbeddingProvider
from app.intelligence.hybrid_retrieval import HybridRetrievalPolicy, HybridRetrievalService
from app.intelligence.semantic_errors import EmbeddingDisabledError, UnapprovedMaterialError
from app.intelligence.semantic_models import (
    EmbeddingIndexRequest, HybridSearchRequest, RetrievalEvaluationRequest,
)
from app.intelligence.semantic_router import create_semantic_retrieval_router
from app.intelligence.vector_storage import SqliteHybridIndexStore
from app.materials.models import MaterialImportRequest, MaterialSourceType
from app.materials.service import MaterialService
from app.materials.storage import SqliteMaterialStore


def build_service(tmp_path: Path, *, enabled: bool = True):
    material_db = tmp_path / "materials.sqlite3"
    research_db = tmp_path / "research.sqlite3"
    material_store = SqliteMaterialStore(str(material_db))
    materials = MaterialService(material_store)
    imported = materials.import_document(MaterialImportRequest(
        room_id="room-a", title="Algoritmi verificabili", filename="algoritmi.txt",
        media_type="text/plain", source_type=MaterialSourceType.PASTED_TEXT,
        content_base64=base64.b64encode(
            ("Un algoritmo è una sequenza finita di passi. "
             "Le variabili conservano valori. Le funzioni raggruppano istruzioni. " * 30).encode()
        ).decode(),
        source_label="Fonte approvata",
    ))
    store = SqliteHybridIndexStore(research_db)
    with sqlite3.connect(research_db) as connection:
        connection.execute("""CREATE TABLE IF NOT EXISTS research_source_promotions(
          promotion_id INTEGER PRIMARY KEY,review_id INTEGER,source_id INTEGER,project_id TEXT,
          room_id TEXT,acquisition_id INTEGER,material_id TEXT,version_id INTEGER,
          idempotency_key TEXT,status TEXT,promoted_by TEXT,promoted_at TEXT)""")
        connection.execute("""INSERT INTO research_source_promotions(
          promotion_id,review_id,source_id,project_id,room_id,acquisition_id,material_id,
          version_id,idempotency_key,status,promoted_by,promoted_at)
          VALUES(1,1,11,'research-a','room-a',1,?,?, 'promotion-test','active','reviewer','now')""",
          (imported.material_id, imported.version_id))
        connection.commit()
    provider = DeterministicHashEmbeddingProvider(dimensions=64)
    service = HybridRetrievalService(
        store, material_store, provider,
        policy=HybridRetrievalPolicy(
            embeddings_enabled=enabled,retrieval_enabled=enabled,
            minimum_score=0.0,max_results=10,batch_size=4,
        ),
    )
    return service, imported


def index(service, imported, *, rebuild=False):
    return service.index_material(imported.material_id, imported.version_number,
        EmbeddingIndexRequest(room_id="room-a",actor_id="reviewer-1",
                              idempotency_key="index-material-v1",rebuild=rebuild))


def test_provider_is_stable_and_normalized():
    provider=DeterministicHashEmbeddingProvider(dimensions=32)
    first=provider.embed_many(["algoritmi e variabili"]).vectors[0]
    second=provider.embed_many(["algoritmi e variabili"]).vectors[0]
    assert first==second and len(first)==32
    assert sum(v*v for v in first)==pytest.approx(1.0)


def test_disabled_by_default(tmp_path):
    service, imported=build_service(tmp_path,enabled=False)
    with pytest.raises(EmbeddingDisabledError):index(service,imported)


def test_active_promotion_is_required(tmp_path):
    service, imported=build_service(tmp_path)
    with sqlite3.connect(service.store.path) as connection:
        connection.execute("DELETE FROM research_source_promotions");connection.commit()
    with pytest.raises(UnapprovedMaterialError):index(service,imported)


def test_index_is_idempotent(tmp_path):
    service, imported=build_service(tmp_path)
    first=index(service,imported);second=index(service,imported)
    assert first.job_id==second.job_id
    assert first.status.value=="succeeded" and first.segment_count>0
    assert service.status().indexed_segments==first.segment_count


def test_rebuild_replaces_vectors_without_duplication(tmp_path):
    service, imported=build_service(tmp_path)
    first=index(service,imported);rebuilt=index(service,imported,rebuild=True)
    assert rebuilt.job_id==first.job_id
    assert service.status().indexed_segments==rebuilt.segment_count


def test_hybrid_results_include_verifiable_locator(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    response=service.search(HybridSearchRequest(room_id="room-a",query="algoritmo passi",limit=5))
    assert response.mode=="hybrid" and response.items
    assert all(item.locator.startswith("char:") for item in response.items)
    assert all(item.material_id==imported.material_id for item in response.items)


def test_cross_room_isolation_returns_no_candidates(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    response=service.search(HybridSearchRequest(room_id="room-b",query="algoritmo",limit=5))
    assert response.total_candidates==0 and response.items==[]


def test_revoked_promotion_is_removed_from_retrieval(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    with sqlite3.connect(service.store.path) as connection:
        connection.execute(
            "UPDATE research_source_promotions SET status='revoked' WHERE promotion_id=1"
        )
        connection.commit()
    response=service.search(HybridSearchRequest(
        room_id="room-a",query="algoritmo",limit=5
    ))
    assert response.total_candidates==0 and response.items==[]


def test_lexical_fallback_when_provider_fails(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    class Broken:
        name=service.provider.name;model=service.provider.model;dimensions=service.provider.dimensions
        cost_microunits_per_1k_tokens=0
        def embed_many(self,texts):raise RuntimeError("provider offline")
    fallback=HybridRetrievalService(service.store,service.material_store,Broken(),policy=service.policy)
    response=fallback.search(HybridSearchRequest(room_id="room-a",query="variabili valori",limit=5))
    assert response.mode=="lexical_fallback" and response.items


def test_text_hash_deduplication(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    response=service.search(HybridSearchRequest(room_id="room-a",query="funzioni istruzioni",limit=10))
    hashes=[item.text_sha256 for item in response.items]
    assert len(hashes)==len(set(hashes))


def test_delete_and_rebuild_lifecycle(tmp_path):
    service, imported=build_service(tmp_path);job=index(service,imported)
    deleted=service.delete_index(imported.material_id,imported.version_number,"room-a")
    assert deleted.deleted_jobs==1 and deleted.deleted_segments==job.segment_count
    assert service.status().indexed_segments==0
    assert index(service,imported).segment_count>0


def test_precision_and_recall_are_computed(tmp_path):
    service, imported=build_service(tmp_path);index(service,imported)
    initial=service.search(HybridSearchRequest(room_id="room-a",query="algoritmo",limit=2))
    expected=[initial.items[0].locator]
    evaluation=service.evaluate(RetrievalEvaluationRequest(
        room_id="room-a",query="algoritmo",limit=2,expected_locators=expected))
    assert evaluation.precision_at_k>0 and evaluation.recall_at_k==1.0


def test_api_status_and_disabled_errors(tmp_path):
    service, imported=build_service(tmp_path,enabled=False)
    app=FastAPI();app.include_router(create_semantic_retrieval_router(service));client=TestClient(app)
    status=client.get("/v1/intelligence/retrieval/status")
    assert status.status_code==200 and status.json()["checkpoint"]=="INTELLIGENCE-0.6"
    response=client.post("/v1/intelligence/retrieval/search",json={"room_id":"room-a","query":"algoritmi"})
    assert response.status_code==503
