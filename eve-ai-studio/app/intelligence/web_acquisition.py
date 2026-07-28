from __future__ import annotations

import http.client
import ipaddress
import socket
import ssl
from dataclasses import dataclass, field
from typing import Callable, Protocol
from urllib.parse import SplitResult, urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser


class WebAcquisitionError(RuntimeError):
    code = "web_acquisition_failed"


class WebAccessDisabledError(WebAcquisitionError):
    code = "web_access_disabled"


class InvalidWebUrlError(WebAcquisitionError):
    code = "invalid_web_url"


class UnsafeWebTargetError(WebAcquisitionError):
    code = "unsafe_web_target"


class WebRedirectError(WebAcquisitionError):
    code = "web_redirect_blocked"


class WebTimeoutError(WebAcquisitionError):
    code = "web_timeout"


class WebResponseTooLargeError(WebAcquisitionError):
    code = "web_response_too_large"


class WebMediaTypeError(WebAcquisitionError):
    code = "web_media_type_not_allowed"


class WebEncodingError(WebAcquisitionError):
    code = "web_content_encoding_not_allowed"


class WebHttpStatusError(WebAcquisitionError):
    code = "web_http_status_error"

    def __init__(self, status: int) -> None:
        self.status = status
        super().__init__(f"La fonte ha risposto con stato HTTP {status}")


class RobotsDeniedError(WebAcquisitionError):
    code = "robots_denied"


class RobotsUnavailableError(WebAcquisitionError):
    code = "robots_unavailable"


@dataclass(frozen=True)
class WebAcquisitionPolicy:
    enabled: bool = False
    timeout_seconds: float = 10.0
    max_bytes: int = 2_000_000
    max_redirects: int = 3
    robots_max_bytes: int = 512_000
    user_agent: str = "EveAulaStudioResearchBot/0.2"
    allowed_media_types: tuple[str, ...] = (
        "text/plain",
        "text/markdown",
        "text/csv",
        "text/html",
        "application/xhtml+xml",
        "application/json",
    )
    allowed_ports: tuple[int, ...] = (80, 443)
    require_robots: bool = True
    block_https_downgrade: bool = True


@dataclass(frozen=True)
class ResolvedWebTarget:
    url: str
    scheme: str
    hostname: str
    port: int
    request_target: str
    host_header: str
    addresses: tuple[str, ...]


@dataclass(frozen=True)
class RawWebResponse:
    status: int
    headers: dict[str, str]
    body: bytes


@dataclass(frozen=True)
class WebFetchResult:
    requested_url: str
    final_url: str
    status: int
    media_type: str
    content: bytes
    redirect_chain: tuple[str, ...]
    resolved_ips: tuple[str, ...]
    robots_allowed: bool
    response_headers: dict[str, str] = field(default_factory=dict)


class WebTransport(Protocol):
    def request(
        self,
        target: ResolvedWebTarget,
        *,
        connect_ip: str,
        timeout_seconds: float,
        headers: dict[str, str],
        max_bytes: int,
    ) -> RawWebResponse: ...


Resolver = Callable[[str, int], list[tuple[int, int, int, str, tuple]]]


class UrlGuard:
    def __init__(
        self,
        *,
        allowed_ports: tuple[int, ...] = (80, 443),
        resolver: Resolver | None = None,
    ) -> None:
        self.allowed_ports = frozenset(allowed_ports)
        self.resolver = resolver or self._system_resolver

    @staticmethod
    def _system_resolver(hostname: str, port: int) -> list[tuple[int, int, int, str, tuple]]:
        return socket.getaddrinfo(
            hostname,
            port,
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )

    @staticmethod
    def _normalize_host(hostname: str) -> str:
        hostname = hostname.rstrip(".").strip()
        if not hostname:
            raise InvalidWebUrlError("Hostname assente")
        try:
            return hostname.encode("idna").decode("ascii").lower()
        except UnicodeError as error:
            raise InvalidWebUrlError("Hostname non valido") from error

    @staticmethod
    def _address_is_safe(value: str) -> bool:
        address = ipaddress.ip_address(value)
        if address.ipv4_mapped is not None:
            address = address.ipv4_mapped
        return bool(
            address.is_global
            and not address.is_private
            and not address.is_loopback
            and not address.is_link_local
            and not address.is_multicast
            and not address.is_reserved
            and not address.is_unspecified
        )

    def resolve(self, url: str) -> ResolvedWebTarget:
        raw = url.strip()
        try:
            parsed = urlsplit(raw)
            port = parsed.port
        except ValueError as error:
            raise InvalidWebUrlError("Porta URL non valida") from error

        scheme = parsed.scheme.lower()
        if scheme not in {"http", "https"}:
            raise InvalidWebUrlError("Sono consentiti soltanto URL HTTP e HTTPS")
        if parsed.username or parsed.password:
            raise InvalidWebUrlError("Le credenziali incorporate nell'URL non sono consentite")
        if not parsed.hostname:
            raise InvalidWebUrlError("Hostname assente")

        hostname = self._normalize_host(parsed.hostname)
        default_port = 443 if scheme == "https" else 80
        effective_port = port or default_port
        if effective_port not in self.allowed_ports:
            raise UnsafeWebTargetError("La porta richiesta non è consentita")
        if scheme == "http" and effective_port != 80:
            raise UnsafeWebTargetError("HTTP è consentito soltanto sulla porta 80")
        if scheme == "https" and effective_port != 443:
            raise UnsafeWebTargetError("HTTPS è consentito soltanto sulla porta 443")

        addresses: list[str] = []
        try:
            literal = ipaddress.ip_address(hostname)
            addresses = [str(literal)]
        except ValueError:
            try:
                resolved = self.resolver(hostname, effective_port)
            except OSError as error:
                raise UnsafeWebTargetError("Risoluzione DNS non riuscita") from error
            for family, _socktype, _proto, _canonname, sockaddr in resolved:
                if family not in {socket.AF_INET, socket.AF_INET6}:
                    continue
                value = str(sockaddr[0])
                if value not in addresses:
                    addresses.append(value)

        if not addresses:
            raise UnsafeWebTargetError("Nessun indirizzo IP utilizzabile")
        unsafe = [value for value in addresses if not self._address_is_safe(value)]
        if unsafe:
            raise UnsafeWebTargetError(
                "La destinazione risolve verso indirizzi non pubblici o riservati"
            )

        path = parsed.path or "/"
        request_target = path + (f"?{parsed.query}" if parsed.query else "")
        host_for_authority = f"[{hostname}]" if ":" in hostname else hostname
        authority = host_for_authority
        if effective_port != default_port:
            authority = f"{authority}:{effective_port}"
        normalized = urlunsplit(
            SplitResult(scheme, authority, path, parsed.query, "")
        )
        return ResolvedWebTarget(
            url=normalized,
            scheme=scheme,
            hostname=hostname,
            port=effective_port,
            request_target=request_target,
            host_header=authority,
            addresses=tuple(addresses),
        )


class _PinnedHTTPConnection(http.client.HTTPConnection):
    def __init__(self, hostname: str, port: int, connect_ip: str, timeout: float) -> None:
        super().__init__(hostname, port=port, timeout=timeout)
        self._connect_ip = connect_ip

    def connect(self) -> None:
        self.sock = socket.create_connection(
            (self._connect_ip, self.port),
            self.timeout,
            self.source_address,
        )
        if self._tunnel_host:
            self._tunnel()


class _PinnedHTTPSConnection(http.client.HTTPSConnection):
    def __init__(
        self,
        hostname: str,
        port: int,
        connect_ip: str,
        timeout: float,
        context: ssl.SSLContext,
    ) -> None:
        super().__init__(hostname, port=port, timeout=timeout, context=context)
        self._connect_ip = connect_ip

    def connect(self) -> None:
        raw_socket = socket.create_connection(
            (self._connect_ip, self.port),
            self.timeout,
            self.source_address,
        )
        self.sock = self._context.wrap_socket(raw_socket, server_hostname=self.host)


class PinnedHttpTransport:
    """Trasporto senza proxy che connette soltanto all'IP già validato."""

    def __init__(self, *, ssl_context: ssl.SSLContext | None = None) -> None:
        self.ssl_context = ssl_context or ssl.create_default_context()
        self.ssl_context.set_alpn_protocols(["http/1.1"])

    def request(
        self,
        target: ResolvedWebTarget,
        *,
        connect_ip: str,
        timeout_seconds: float,
        headers: dict[str, str],
        max_bytes: int,
    ) -> RawWebResponse:
        connection: http.client.HTTPConnection
        if target.scheme == "https":
            connection = _PinnedHTTPSConnection(
                target.hostname,
                target.port,
                connect_ip,
                timeout_seconds,
                self.ssl_context,
            )
        else:
            connection = _PinnedHTTPConnection(
                target.hostname,
                target.port,
                connect_ip,
                timeout_seconds,
            )
        try:
            connection.request("GET", target.request_target, headers=headers)
            response = connection.getresponse()
            content_length = response.getheader("Content-Length")
            if content_length:
                try:
                    declared = int(content_length)
                except ValueError:
                    declared = -1
                if declared > max_bytes:
                    raise WebResponseTooLargeError(
                        "La dimensione dichiarata supera il limite configurato"
                    )
            body = response.read(max_bytes + 1)
            if len(body) > max_bytes:
                raise WebResponseTooLargeError(
                    "La risposta supera il limite configurato"
                )
            response_headers = {
                key.lower(): value.strip()
                for key, value in response.getheaders()
                if key.lower()
                in {
                    "content-type",
                    "content-length",
                    "content-encoding",
                    "location",
                    "last-modified",
                    "etag",
                    "cache-control",
                }
            }
            return RawWebResponse(
                status=int(response.status),
                headers=response_headers,
                body=body,
            )
        except socket.timeout as error:
            raise WebTimeoutError("Timeout durante l'acquisizione") from error
        except ssl.SSLError as error:
            raise WebAcquisitionError("Errore TLS durante l'acquisizione") from error
        except OSError as error:
            raise WebAcquisitionError("Errore di rete durante l'acquisizione") from error
        finally:
            connection.close()


class ControlledWebAcquirer:
    REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})

    def __init__(
        self,
        *,
        policy: WebAcquisitionPolicy | None = None,
        guard: UrlGuard | None = None,
        transport: WebTransport | None = None,
    ) -> None:
        self.policy = policy or WebAcquisitionPolicy()
        self.guard = guard or UrlGuard(allowed_ports=self.policy.allowed_ports)
        self.transport = transport or PinnedHttpTransport()

    def _headers(self, target: ResolvedWebTarget) -> dict[str, str]:
        return {
            "Host": target.host_header,
            "User-Agent": self.policy.user_agent,
            "Accept": ", ".join((*self.policy.allowed_media_types, "text/plain")),
            "Accept-Encoding": "identity",
            "Connection": "close",
        }

    def _request_once(
        self,
        target: ResolvedWebTarget,
        *,
        max_bytes: int,
    ) -> RawWebResponse:
        # Tutti gli indirizzi sono stati validati; la connessione viene fissata
        # al primo indirizzo pubblico deterministico.
        connect_ip = sorted(target.addresses)[0]
        return self.transport.request(
            target,
            connect_ip=connect_ip,
            timeout_seconds=self.policy.timeout_seconds,
            headers=self._headers(target),
            max_bytes=max_bytes,
        )

    def _follow(
        self,
        url: str,
        *,
        max_bytes: int,
        allowed_media_types: tuple[str, ...] | None,
    ) -> tuple[ResolvedWebTarget, RawWebResponse, tuple[str, ...], tuple[str, ...]]:
        current = self.guard.resolve(url)
        chain: list[str] = []
        all_ips: list[str] = []
        for redirect_index in range(self.policy.max_redirects + 1):
            for value in current.addresses:
                if value not in all_ips:
                    all_ips.append(value)
            response = self._request_once(current, max_bytes=max_bytes)
            if response.status not in self.REDIRECT_STATUSES:
                if allowed_media_types is not None and 200 <= response.status < 300:
                    self._validate_payload(response, allowed_media_types)
                return current, response, tuple(chain), tuple(all_ips)
            if redirect_index >= self.policy.max_redirects:
                raise WebRedirectError("Numero massimo di redirect superato")
            location = response.headers.get("location")
            if not location:
                raise WebRedirectError("Redirect privo di intestazione Location")
            next_target = self.guard.resolve(urljoin(current.url, location))
            if (
                self.policy.block_https_downgrade
                and current.scheme == "https"
                and next_target.scheme != "https"
            ):
                raise WebRedirectError("Downgrade da HTTPS a HTTP bloccato")
            chain.append(next_target.url)
            current = next_target
        raise WebRedirectError("Catena redirect non valida")

    def _validate_payload(
        self,
        response: RawWebResponse,
        allowed_media_types: tuple[str, ...],
    ) -> str:
        encoding = response.headers.get("content-encoding", "identity").lower()
        if encoding not in {"", "identity"}:
            raise WebEncodingError("Le risposte compresse non sono consentite")
        media_type = response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
        if media_type not in allowed_media_types:
            raise WebMediaTypeError(
                f"Tipo MIME non consentito: {media_type or 'assente'}"
            )
        return media_type

    def _robots_allowed(self, target: ResolvedWebTarget) -> bool:
        robots_url = urlunsplit(
            SplitResult(target.scheme, target.host_header, "/robots.txt", "", "")
        )
        try:
            _final, response, _redirects, _ips = self._follow(
                robots_url,
                max_bytes=self.policy.robots_max_bytes,
                allowed_media_types=None,
            )
        except WebAcquisitionError as error:
            raise RobotsUnavailableError(
                "robots.txt non raggiungibile: acquisizione bloccata"
            ) from error

        if 200 <= response.status < 300:
            content_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
            if content_type and content_type != "text/plain":
                raise RobotsUnavailableError("robots.txt non è text/plain")
            try:
                lines = response.body.decode("utf-8-sig").splitlines()
            except UnicodeDecodeError as error:
                raise RobotsUnavailableError("robots.txt non è UTF-8") from error
            parser = RobotFileParser()
            parser.set_url(robots_url)
            parser.parse(lines)
            return parser.can_fetch(self.policy.user_agent, target.url)

        if response.status == 404:
            return True
        if 400 <= response.status < 500:
            return response.status not in {401, 403, 407, 429}
        raise RobotsUnavailableError(
            f"robots.txt non disponibile: stato HTTP {response.status}"
        )

    def fetch(self, url: str) -> WebFetchResult:
        if not self.policy.enabled:
            raise WebAccessDisabledError("L'acquisizione web è disattivata dal server")

        initial = self.guard.resolve(url)
        robots_allowed = True
        if self.policy.require_robots:
            robots_allowed = self._robots_allowed(initial)
            if not robots_allowed:
                raise RobotsDeniedError("robots.txt non consente l'acquisizione")

        final, response, redirect_chain, resolved_ips = self._follow(
            initial.url,
            max_bytes=self.policy.max_bytes,
            allowed_media_types=self.policy.allowed_media_types,
        )
        if not 200 <= response.status < 300:
            raise WebHttpStatusError(response.status)
        media_type = self._validate_payload(response, self.policy.allowed_media_types)
        return WebFetchResult(
            requested_url=initial.url,
            final_url=final.url,
            status=response.status,
            media_type=media_type,
            content=response.body,
            redirect_chain=redirect_chain,
            resolved_ips=resolved_ips,
            robots_allowed=robots_allowed,
            response_headers=response.headers,
        )
