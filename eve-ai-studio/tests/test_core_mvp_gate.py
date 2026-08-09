from __future__ import annotations

import base64

import pytest

from app.materials import MaterialImportRequest, MaterialService, SqliteMaterialStore
from app.rag import RagChatRequest, RagChatService
from app.retrieval import RetrievalService
from app.sources import SourceHashMismatchError, SourceOpenRequest, SourceOpeningService
from app.models import StudyContext


def build_services():
    store = SqliteMaterialStore(":memory:")
    materials = MaterialService(store)
    content = b"La fotosintesi converte energia luminosa in energia chimica nelle piante."
    imported = materials.import_document(MaterialImportRequest(
        room_id="room-a", title="Biologia", filename="biologia.txt", media_type="text/plain",
        content_base64=base64.b64encode(content).decode("ascii"),
    ))
    retrieval = RetrievalService(store)
    rag = RagChatService(retrieval)
    sources = SourceOpeningService(store)
    return imported, rag, sources


def test_gate_answer_citation_open_and_no_actions():
    imported, rag, sources = build_services()
    answer = rag.answer(RagChatRequest(
        message="Che cosa fa la fotosintesi?",
        context=StudyContext(user_id="user-a", room_id="room-a"),
        material_ids=[imported.material_id],
    ))
    assert answer.grounded is True
    assert answer.sources
    assert answer.proposed_actions == []
    citation = answer.sources[0].citation
    opened = sources.open(SourceOpenRequest(
        room_id="room-a", locator=citation.locator,
        expected_text_sha256=citation.text_sha256,
    ))
    assert opened.integrity_verified is True
    assert opened.material_id == imported.material_id
    assert opened.instructions_executable is False


def test_gate_cross_room_returns_no_authorized_source():
    imported, rag, _ = build_services()
    answer = rag.answer(RagChatRequest(
        message="Che cosa fa la fotosintesi?",
        context=StudyContext(user_id="user-b", room_id="room-b"),
        material_ids=[imported.material_id],
    ))
    assert answer.grounded is False
    assert answer.sources == []


def test_gate_source_hash_mismatch_is_blocked():
    _imported, rag, sources = build_services()
    answer = rag.answer(RagChatRequest(
        message="Che cosa fa la fotosintesi?",
        context=StudyContext(user_id="user-a", room_id="room-a"),
    ))
    with pytest.raises(SourceHashMismatchError):
        sources.open(SourceOpenRequest(
            room_id="room-a", locator=answer.sources[0].citation.locator,
            expected_text_sha256="0" * 64,
        ))
