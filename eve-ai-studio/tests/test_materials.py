from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.materials import (
    InvalidMaterialPayloadError,
    MaterialImportRequest,
    MaterialLimits,
    MaterialRoomMismatchError,
    MaterialService,
    MaterialStatus,
    MaterialTextDecodingError,
    MaterialTooLargeError,
    MaterialVersionLimitError,
    SqliteMaterialStore,
    UnsupportedMediaTypeError,
    create_material_router,
)
from app.materials.chunking import prepare_chunks
from app.materials.extraction import extract_text


def encoded(value: bytes | str) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return base64.b64encode(value).decode("ascii")


@pytest.fixture()
def service(tmp_path: Path) -> MaterialService:
    return MaterialService(
        SqliteMaterialStore(str(tmp_path / "materials.sqlite3")),
        limits=MaterialLimits(
            max_material_bytes=10_000,
            max_extracted_chars=20_000,
            max_metadata_chars=500,
            chunk_chars=120,
            chunk_overlap_chars=20,
            max_versions_per_material=3,
        ),
    )


def request_for(
    text: str,
    *,
    room_id: str = "room-1",
    material_id: str | None = None,
    filename: str = "lezione.txt",
    media_type: str = "text/plain",
    metadata: dict | None = None,
) -> MaterialImportRequest:
    return MaterialImportRequest(
        room_id=room_id,
        title="Lezione di prova",
        filename=filename,
        media_type=media_type,
        content_base64=encoded(text),
        material_id=material_id,
        metadata=metadata or {"course": "python-zero"},
    )


def test_schema_and_empty_status(service: MaterialService) -> None:
    status = service.status()
    assert status.schema_version == 1
    assert status.persistent is True
    assert status.total_materials == 0
    assert status.total_versions == 0
    assert status.embeddings_enabled is False
    assert status.embedding_provider is None
    assert status.rag_stage == "text_extracted_and_chunked_no_embeddings"


def test_plaintext_import_checksum_and_chunks(service: MaterialService) -> None:
    text = "Titolo\n\n" + ("Un paragrafo didattico con contenuto verificabile. " * 12)
    result = service.import_document(request_for(text))
    assert result.status is MaterialStatus.READY
    assert result.duplicate is False
    assert result.checksum_sha256 == hashlib.sha256(text.encode()).hexdigest()
    assert result.extracted_chars == len(text.strip())
    assert result.chunk_count >= 2

    detail = service.get_material(result.material_id, "room-1")
    assert detail.current_version_number == 1
    assert detail.current_status is MaterialStatus.READY
    assert detail.metadata == {"course": "python-zero"}

    chunks = service.list_chunks(result.material_id, 1, "room-1")
    assert chunks.total == result.chunk_count
    assert all(chunk.embedding_status == "not_requested" for chunk in chunks.items)
    assert all(
        hashlib.sha256(chunk.text.encode()).hexdigest() == chunk.text_sha256
        for chunk in chunks.items
    )


def test_room_scoped_checksum_deduplication(service: MaterialService) -> None:
    first = service.import_document(request_for("contenuto identico"))
    duplicate = service.import_document(request_for("contenuto identico"))
    other_room = service.import_document(
        request_for("contenuto identico", room_id="room-2")
    )

    assert duplicate.duplicate is True
    assert duplicate.material_id == first.material_id
    assert duplicate.version_id == first.version_id
    assert other_room.duplicate is False
    assert other_room.material_id != first.material_id
    status = service.status()
    assert status.total_materials == 2
    assert status.total_versions == 2


def test_new_version_updates_current_version(service: MaterialService) -> None:
    first = service.import_document(request_for("versione uno"))
    second = service.import_document(
        request_for("versione due", material_id=first.material_id)
    )

    assert second.version_number == 2
    versions = service.list_versions(first.material_id, "room-1")
    assert versions.total == 2
    assert [item.version_number for item in versions.items] == [2, 1]
    assert service.get_material(first.material_id, "room-1").current_version_number == 2


def test_failed_new_version_does_not_replace_ready_current(
    service: MaterialService,
) -> None:
    first = service.import_document(request_for("versione valida"))
    with pytest.raises(UnsupportedMediaTypeError):
        service.import_document(
            request_for(
                "contenuto binario simulato",
                material_id=first.material_id,
                filename="lezione.pdf",
                media_type="application/pdf",
            )
        )
    detail = service.get_material(first.material_id, "room-1")
    assert detail.current_version_number == 1
    versions = service.list_versions(first.material_id, "room-1")
    assert versions.total == 2
    assert versions.items[0].status is MaterialStatus.FAILED
    assert versions.items[0].error_code == "unsupported_media_type"
    assert versions.items[0].error_class == "UnsupportedMediaTypeError"


def test_failed_first_import_is_visible_as_failed_version(
    service: MaterialService,
) -> None:
    with pytest.raises(UnsupportedMediaTypeError):
        service.import_document(
            request_for("pdf", filename="x.pdf", media_type="application/pdf")
        )
    status = service.status()
    assert status.total_materials == 1
    assert status.failed_versions == 1


def test_room_isolation_hides_material(service: MaterialService) -> None:
    result = service.import_document(request_for("privato"))
    with pytest.raises(MaterialRoomMismatchError):
        service.get_material(result.material_id, "room-2")


def test_invalid_base64_is_rejected_without_material(service: MaterialService) -> None:
    request = request_for("x")
    request.content_base64 = "%%%"
    with pytest.raises(InvalidMaterialPayloadError):
        service.import_document(request)
    assert service.status().total_materials == 0


def test_size_limit_is_enforced_before_persistence(service: MaterialService) -> None:
    with pytest.raises(MaterialTooLargeError):
        service.import_document(request_for("x" * 10_001))
    assert service.status().total_materials == 0


def test_metadata_limit_is_enforced(service: MaterialService) -> None:
    with pytest.raises(InvalidMaterialPayloadError):
        service.import_document(
            request_for("x", metadata={"large": "a" * 600})
        )


def test_version_limit(service: MaterialService) -> None:
    first = service.import_document(request_for("v1"))
    service.import_document(request_for("v2", material_id=first.material_id))
    service.import_document(request_for("v3", material_id=first.material_id))
    with pytest.raises(MaterialVersionLimitError):
        service.import_document(request_for("v4", material_id=first.material_id))


def test_html_extraction_excludes_script_and_style() -> None:
    text, media = extract_text(
        b"<html><style>.x{color:red}</style><body><h1>Titolo</h1><p>Testo utile</p><script>secret()</script></body></html>",
        "text/html",
        "x.html",
    )
    assert media == "text/html"
    assert "Titolo" in text and "Testo utile" in text
    assert "secret" not in text and "color:red" not in text


def test_json_extraction_is_deterministic() -> None:
    first, _ = extract_text(b'{"b":2,"a":1}', "application/json", "x.json")
    second, _ = extract_text(b'{"a":1,"b":2}', "application/json", "x.json")
    assert first == second
    assert first.index('"a"') < first.index('"b"')


def test_non_utf8_text_is_rejected() -> None:
    with pytest.raises(MaterialTextDecodingError):
        extract_text(b"\xff\xfe\xfd", "text/plain", "x.txt")


def test_chunking_is_deterministic_and_overlapping() -> None:
    text = " ".join(f"parola-{index}" for index in range(80))
    first = prepare_chunks(text, chunk_chars=120, overlap_chars=20)
    second = prepare_chunks(text, chunk_chars=120, overlap_chars=20)
    assert first == second
    assert len(first) > 1
    assert first[1].start_char < first[0].end_char
    assert all(chunk.start_char < chunk.end_char for chunk in first)


def test_list_search_status_and_pagination(service: MaterialService) -> None:
    service.import_document(request_for("alpha", filename="alpha.txt"))
    service.import_document(request_for("beta", filename="beta.txt"))
    service.import_document(
        request_for("gamma", filename="gamma.txt", room_id="room-2")
    )

    result = service.list_materials(room_id="room-1", query="beta", limit=10)
    assert result.total == 1
    assert result.items[0].filename == "beta.txt"
    page = service.list_materials(
        room_id="room-1",
        status=MaterialStatus.READY,
        offset=1,
        limit=1,
    )
    assert page.total == 2
    assert len(page.items) == 1


def test_persistence_after_reopen(tmp_path: Path) -> None:
    path = str(tmp_path / "persistent.sqlite3")
    first_service = MaterialService(SqliteMaterialStore(path))
    result = first_service.import_document(request_for("persistente"))
    second_service = MaterialService(SqliteMaterialStore(path))
    assert (
        second_service.get_material(result.material_id, "room-1").title
        == "Lezione di prova"
    )
    assert second_service.status().total_chunks == result.chunk_count


def test_api_endpoints_and_redacted_errors(tmp_path: Path) -> None:
    service = MaterialService(
        SqliteMaterialStore(str(tmp_path / "api.sqlite3")),
        limits=MaterialLimits(chunk_chars=120, chunk_overlap_chars=20),
    )
    app = FastAPI()
    app.include_router(create_material_router(service))
    client = TestClient(app)

    response = client.post(
        "/v1/materials/import",
        json=request_for("api content").model_dump(mode="json"),
    )
    assert response.status_code == 200
    payload = response.json()
    material_id = payload["material_id"]

    status_response = client.get("/v1/materials/status")
    assert status_response.status_code == 200
    assert status_response.json()["embeddings_enabled"] is False

    list_response = client.get("/v1/materials", params={"room_id": "room-1"})
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1

    detail = client.get(
        f"/v1/materials/{material_id}",
        params={"room_id": "room-1"},
    )
    assert detail.status_code == 200

    chunks = client.get(
        f"/v1/materials/{material_id}/versions/1/chunks",
        params={"room_id": "room-1"},
    )
    assert chunks.status_code == 200

    hidden = client.get(
        f"/v1/materials/{material_id}",
        params={"room_id": "room-2"},
    )
    assert hidden.status_code == 404
    assert hidden.json()["detail"] == "Materiale non trovato"

    unsupported = client.post(
        "/v1/materials/import",
        json=request_for(
            "private exception body",
            filename="x.pdf",
            media_type="application/pdf",
        ).model_dump(mode="json"),
    )
    assert unsupported.status_code == 415
    assert "private exception body" not in unsupported.text


def test_import_history_is_room_scoped_and_redacted(
    service: MaterialService,
) -> None:
    service.import_document(request_for("ready"))
    with pytest.raises(UnsupportedMediaTypeError):
        service.import_document(
            request_for(
                "private failure body",
                filename="private.pdf",
                media_type="application/pdf",
            )
        )
    service.import_document(request_for("ready"))

    history = service.list_imports("room-1")
    assert history.total == 3
    assert {item.status for item in history.items} == {
        "ready",
        "failed",
        "duplicate",
    }
    serialized = json.dumps(history.model_dump())
    assert "private failure body" not in serialized
    assert "private.pdf" not in serialized
    assert service.list_imports("room-2").total == 0


def test_wrong_room_is_checked_before_version_limit(
    service: MaterialService,
) -> None:
    first = service.import_document(request_for("v1"))
    service.import_document(request_for("v2", material_id=first.material_id))
    service.import_document(request_for("v3", material_id=first.material_id))
    with pytest.raises(MaterialRoomMismatchError):
        service.import_document(
            request_for(
                "v4",
                material_id=first.material_id,
                room_id="room-2",
            )
        )
