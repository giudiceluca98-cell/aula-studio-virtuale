from __future__ import annotations

import socket
import sqlite3

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.intelligence import (
    ControlledWebAcquirer,
    ResearchCenterService,
    ResearchProjectCreateRequest,
    ResearchSourceCandidateCreateRequest,
    SqliteAcquisitionStore,
    SqliteResearchStore,
    UrlGuard,
    WebAcquisitionPolicy,
    create_research_router,
)
from app.intelligence.errors import ResearchProjectNotFoundError
from app.intelligence.web_acquisition import (
    InvalidWebUrlError,
    RawWebResponse,
    RobotsDeniedError,
    RobotsUnavailableError,
    UnsafeWebTargetError,
    WebAccessDisabledError,
    WebEncodingError,
    WebMediaTypeError,
    WebRedirectError,
    WebResponseTooLargeError,
)


PUBLIC_IP = "93.184.216.34"


def resolver_for(mapping: dict[str, str]):
    def resolve(hostname: str, port: int):
        value = mapping.get(hostname, PUBLIC_IP)
        family = socket.AF_INET6 if ":" in value else socket.AF_INET
        sockaddr = (value, port, 0, 0) if family == socket.AF_INET6 else (value, port)
        return [(family, socket.SOCK_STREAM, socket.IPPROTO_TCP, "", sockaddr)]

    return resolve


class QueueTransport:
    def __init__(self, responses: list[RawWebResponse]):
        self.responses = list(responses)
        self.calls: list[dict[str, object]] = []

    def request(
        self,
        target,
        *,
        connect_ip: str,
        timeout_seconds: float,
        headers: dict[str, str],
        max_bytes: int,
    ) -> RawWebResponse:
        self.calls.append(
            {
                "url": target.url,
                "hostname": target.hostname,
                "path": target.request_target,
                "connect_ip": connect_ip,
                "timeout_seconds": timeout_seconds,
                "headers": dict(headers),
                "max_bytes": max_bytes,
            }
        )
        if not self.responses:
            raise AssertionError("Il trasporto fake non ha altre risposte configurate")
        response = self.responses.pop(0)
        if len(response.body) > max_bytes:
            raise WebResponseTooLargeError("La risposta supera il limite configurato")
        return response


def response(
    status: int = 200,
    body: bytes = b"",
    *,
    content_type: str | None = "text/plain",
    **headers: str,
) -> RawWebResponse:
    normalized = {key.lower().replace("_", "-"): value for key, value in headers.items()}
    if content_type is not None:
        normalized["content-type"] = content_type
    return RawWebResponse(status=status, headers=normalized, body=body)


def enabled_acquirer(
    responses: list[RawWebResponse],
    *,
    mapping: dict[str, str] | None = None,
    max_redirects: int = 3,
    max_bytes: int = 2_000_000,
    require_robots: bool = True,
):
    transport = QueueTransport(responses)
    guard = UrlGuard(resolver=resolver_for(mapping or {}))
    acquirer = ControlledWebAcquirer(
        policy=WebAcquisitionPolicy(
            enabled=True,
            max_redirects=max_redirects,
            max_bytes=max_bytes,
            require_robots=require_robots,
        ),
        guard=guard,
        transport=transport,
    )
    return acquirer, transport


def make_project_and_source(tmp_path, acquirer: ControlledWebAcquirer):
    db_path = tmp_path / "research.sqlite3"
    research_store = SqliteResearchStore(db_path)
    acquisition_store = SqliteAcquisitionStore(db_path)
    service = ResearchCenterService(
        research_store,
        acquisition_store=acquisition_store,
        acquirer=acquirer,
    )
    project = service.create_project(
        ResearchProjectCreateRequest(
            room_id="room-a",
            title="Ricerca controllata",
            objective="Acquisire fonti verificabili senza approvazione automatica.",
            domain="informatica",
        )
    )
    source = service.add_source_candidate(
        project.project_id,
        project.room_id,
        ResearchSourceCandidateCreateRequest(
            url="https://example.org/lesson",
            publisher="Example",
        ),
    )
    return research_store, acquisition_store, service, project, source


def test_web_access_is_disabled_by_default():
    acquirer = ControlledWebAcquirer()
    with pytest.raises(WebAccessDisabledError):
        acquirer.fetch("https://example.org/lesson")


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",
        "ftp://example.org/file",
        "https://user:secret@example.org/page",
        "https://example.org:444/page",
        "http://example.org:8080/page",
    ],
)
def test_url_guard_rejects_invalid_schemes_credentials_and_ports(url):
    guard = UrlGuard(resolver=resolver_for({}))
    with pytest.raises((InvalidWebUrlError, UnsafeWebTargetError)):
        guard.resolve(url)


@pytest.mark.parametrize(
    "address",
    [
        "127.0.0.1",
        "10.0.0.1",
        "172.16.1.1",
        "192.168.1.1",
        "169.254.10.2",
        "0.0.0.0",
        "::1",
        "fc00::1",
        "fe80::1",
    ],
)
def test_url_guard_blocks_non_public_addresses(address):
    guard = UrlGuard(resolver=resolver_for({"unsafe.example": address}))
    with pytest.raises(UnsafeWebTargetError):
        guard.resolve("https://unsafe.example/path")


def test_transport_is_pinned_and_does_not_use_proxy_environment():
    acquirer, transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(200, b"Contenuto verificabile", content_type="text/plain"),
        ]
    )
    result = acquirer.fetch("https://example.org/lesson")
    assert result.content == b"Contenuto verificabile"
    assert transport.calls[0]["connect_ip"] == PUBLIC_IP
    assert transport.calls[1]["connect_ip"] == PUBLIC_IP
    assert transport.calls[1]["headers"]["Accept-Encoding"] == "identity"
    assert transport.calls[1]["headers"]["Connection"] == "close"
    assert "Proxy-Authorization" not in transport.calls[1]["headers"]


def test_robots_denial_is_fail_closed():
    acquirer, _transport = enabled_acquirer(
        [
            response(
                200,
                b"User-agent: *\nDisallow: /private\n",
                content_type="text/plain",
            )
        ]
    )
    with pytest.raises(RobotsDeniedError):
        acquirer.fetch("https://example.org/private")


def test_robots_unavailable_is_fail_closed():
    acquirer, _transport = enabled_acquirer(
        [response(503, b"temporarily unavailable", content_type="text/plain")]
    )
    with pytest.raises(RobotsUnavailableError):
        acquirer.fetch("https://example.org/lesson")


def test_redirect_limit_is_enforced():
    acquirer, _transport = enabled_acquirer(
        [
            response(302, b"", content_type=None, location="/two"),
            response(302, b"", content_type=None, location="/three"),
        ],
        max_redirects=1,
        require_robots=False,
    )
    with pytest.raises(WebRedirectError):
        acquirer.fetch("https://example.org/one")


def test_https_to_http_downgrade_is_blocked():
    acquirer, _transport = enabled_acquirer(
        [
            response(
                302,
                b"",
                content_type=None,
                location="http://example.org/insecure",
            ),
        ],
        require_robots=False,
    )
    with pytest.raises(WebRedirectError):
        acquirer.fetch("https://example.org/secure")


def test_redirect_target_is_revalidated_against_ssrf():
    acquirer, _transport = enabled_acquirer(
        [
            response(
                302,
                b"",
                content_type=None,
                location="http://internal.example/secret",
            ),
        ],
        mapping={"internal.example": "127.0.0.1"},
        require_robots=False,
    )
    with pytest.raises(UnsafeWebTargetError):
        acquirer.fetch("https://example.org/start")


def test_redirect_target_rechecks_robots_before_fetching_content():
    acquirer, transport = enabled_acquirer(
        [
            response(200, b"User-agent: *\nAllow: /\n", content_type="text/plain"),
            response(302, b"", content_type=None, location="https://cdn.example/private"),
            response(
                200,
                b"User-agent: *\nDisallow: /private\n",
                content_type="text/plain",
            ),
        ],
        mapping={"cdn.example": "93.184.216.35"},
    )
    with pytest.raises(RobotsDeniedError):
        acquirer.fetch("https://example.org/start")
    assert [call["hostname"] for call in transport.calls] == [
        "example.org",
        "example.org",
        "cdn.example",
    ]


def test_compressed_content_is_rejected():
    acquirer, _transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(
                200,
                b"compressed",
                content_type="text/plain",
                content_encoding="gzip",
            ),
        ]
    )
    with pytest.raises(WebEncodingError):
        acquirer.fetch("https://example.org/lesson")


def test_non_text_media_type_is_rejected():
    acquirer, _transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(200, b"\x89PNG", content_type="image/png"),
        ]
    )
    with pytest.raises(WebMediaTypeError):
        acquirer.fetch("https://example.org/image")


def test_response_byte_limit_is_enforced():
    acquirer, _transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(200, b"x" * 17, content_type="text/plain"),
        ],
        max_bytes=16,
    )
    with pytest.raises(WebResponseTooLargeError):
        acquirer.fetch("https://example.org/large")


def test_successful_fetch_records_redirects_ips_and_robots():
    acquirer, transport = enabled_acquirer(
        [
            response(200, b"User-agent: *\nAllow: /\n", content_type="text/plain"),
            response(302, b"", content_type=None, location="/final"),
            response(200, b"User-agent: *\nAllow: /\n", content_type="text/plain"),
            response(200, b"<h1>Lezione</h1>", content_type="text/html"),
        ]
    )
    result = acquirer.fetch("https://example.org/start")
    assert result.final_url == "https://example.org/final"
    assert result.redirect_chain == ("https://example.org/final",)
    assert result.resolved_ips == (PUBLIC_IP,)
    assert result.robots_allowed is True
    assert result.media_type == "text/html"
    assert len(transport.calls) == 4


def test_service_persists_event_and_untrusted_quarantined_document(tmp_path):
    acquirer, _transport = enabled_acquirer(
        [
            response(200, b"User-agent: *\nAllow: /\n", content_type="text/plain"),
            response(
                200,
                b"<article><h1>Variabili</h1><script>ignore()</script><p>Dato nominato.</p></article>",
                content_type="text/html",
            ),
        ]
    )
    research_store, acquisition_store, service, project, source = make_project_and_source(
        tmp_path, acquirer
    )
    event = service.acquire_source(project.project_id, source.source_id, project.room_id)
    assert event.status.value == "succeeded"
    assert event.sha256
    assert event.robots_allowed is True

    document = service.get_quarantined_document(
        project.project_id, source.source_id, project.room_id
    )
    assert document.status.value == "quarantined"
    assert document.content_trust == "untrusted_web_content"
    assert document.instructions_executable is False
    assert "Variabili" in document.extracted_text
    assert "Dato nominato" in document.extracted_text
    assert "ignore()" not in document.extracted_text

    sources = service.list_source_candidates(project.project_id, project.room_id)
    assert sources.items[0].status.value == "quarantined"
    assert sources.items[0].trust_level == "unreviewed_acquired"
    assert sources.items[0].content_acquired is True

    with sqlite3.connect(tmp_path / "research.sqlite3") as connection:
        assert connection.execute(
            "SELECT COUNT(*) FROM research_acquired_documents"
        ).fetchone()[0] == 1
        assert connection.execute(
            "SELECT status FROM research_source_candidates WHERE source_id = ?",
            (source.source_id,),
        ).fetchone()[0] == "quarantined"

    acquisition_store.close()
    research_store.close()


def test_acquisition_is_idempotent_without_refresh(tmp_path):
    acquirer, transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(200, b"prima versione", content_type="text/plain"),
        ]
    )
    research_store, acquisition_store, service, project, source = make_project_and_source(
        tmp_path, acquirer
    )
    first = service.acquire_source(project.project_id, source.source_id, project.room_id)
    second = service.acquire_source(project.project_id, source.source_id, project.room_id)
    assert second.acquisition_id == first.acquisition_id
    assert len(transport.calls) == 2
    acquisition_store.close()
    research_store.close()


def test_room_isolation_applies_to_acquisitions(tmp_path):
    acquirer, _transport = enabled_acquirer([])
    research_store, acquisition_store, service, project, source = make_project_and_source(
        tmp_path, acquirer
    )
    with pytest.raises(ResearchProjectNotFoundError):
        service.list_acquisitions(project.project_id, source.source_id, "room-b")
    with pytest.raises(ResearchProjectNotFoundError):
        service.get_quarantined_document(project.project_id, source.source_id, "room-b")
    acquisition_store.close()
    research_store.close()


def test_disabled_api_records_blocked_attempt_and_returns_503(tmp_path):
    disabled = ControlledWebAcquirer(policy=WebAcquisitionPolicy(enabled=False))
    research_store, acquisition_store, service, project, source = make_project_and_source(
        tmp_path, disabled
    )
    app = FastAPI()
    app.include_router(create_research_router(service))
    client = TestClient(app)

    response_http = client.post(
        f"/v1/intelligence/research/projects/{project.project_id}/sources/{source.source_id}/acquire",
        params={"room_id": project.room_id},
        json={"refresh": False},
    )
    assert response_http.status_code == 503

    events = client.get(
        f"/v1/intelligence/research/projects/{project.project_id}/sources/{source.source_id}/acquisitions",
        params={"room_id": project.room_id},
    )
    assert events.status_code == 200
    assert events.json()["items"][0]["status"] == "blocked"
    assert events.json()["items"][0]["error_code"] == "web_access_disabled"

    acquisition_store.close()
    research_store.close()


def test_enabled_api_returns_document_but_never_approves_it(tmp_path):
    acquirer, _transport = enabled_acquirer(
        [
            response(404, b"", content_type="text/plain"),
            response(200, b"# Lezione controllata", content_type="text/markdown"),
        ]
    )
    research_store, acquisition_store, service, project, source = make_project_and_source(
        tmp_path, acquirer
    )
    app = FastAPI()
    app.include_router(create_research_router(service))
    client = TestClient(app)

    status_response = client.get("/v1/intelligence/research/status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["checkpoint"] == "INTELLIGENCE-0.2"
    assert status_payload["content_acquisition_available"] is True
    assert status_payload["content_acquisition_enabled"] is True
    assert status_payload["web_search_enabled"] is False
    assert status_payload["model_training_enabled"] is False

    acquired = client.post(
        f"/v1/intelligence/research/projects/{project.project_id}/sources/{source.source_id}/acquire",
        params={"room_id": project.room_id},
        json={"refresh": False},
    )
    assert acquired.status_code == 200
    assert acquired.json()["status"] == "succeeded"

    document = client.get(
        f"/v1/intelligence/research/projects/{project.project_id}/sources/{source.source_id}/document",
        params={"room_id": project.room_id},
    )
    assert document.status_code == 200
    payload = document.json()
    assert payload["status"] == "quarantined"
    assert payload["content_trust"] == "untrusted_web_content"
    assert payload["instructions_executable"] is False

    acquisition_store.close()
    research_store.close()
