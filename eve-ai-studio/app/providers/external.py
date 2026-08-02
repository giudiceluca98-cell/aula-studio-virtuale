from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from typing import Any, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from ..models import ChatRequest, ChatResponse, SourceReference


class ExternalProviderError(RuntimeError):
    code = "external_provider_error"


class ExternalProviderConfigurationError(ExternalProviderError):
    code = "external_provider_configuration_error"


class ExternalProviderTransportError(ExternalProviderError):
    code = "external_provider_transport_error"


class ExternalProviderResponseError(ExternalProviderError):
    code = "external_provider_response_error"


@dataclass(frozen=True, slots=True)
class ExternalProviderConfig:
    provider_key: str
    provider_label: str
    model_key: str
    model_label: str
    base_url: str
    api_key: str = field(repr=False)
    timeout_seconds: float = 20.0
    max_response_bytes: int = 262_144
    temperature: float = 0.2
    max_output_tokens: int = 2_000
    context_window: int = 128_000
    input_cost_per_million_usd: float = 0.0
    output_cost_per_million_usd: float = 0.0

    def __post_init__(self) -> None:
        for name in ("provider_key", "provider_label", "model_key", "model_label", "base_url", "api_key"):
            if not str(getattr(self, name)).strip():
                raise ExternalProviderConfigurationError(f"Configurazione provider incompleta: {name}")
        parsed = urlsplit(self.base_url.strip())
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ExternalProviderConfigurationError("Base URL provider non valida")
        if parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ExternalProviderConfigurationError("Base URL provider con componenti non consentite")
        if parsed.scheme != "https" and parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
            raise ExternalProviderConfigurationError("Il provider remoto deve usare HTTPS")
        if not 1 <= self.timeout_seconds <= 120:
            raise ExternalProviderConfigurationError("Timeout provider non valido")
        if not 4_096 <= self.max_response_bytes <= 2_000_000:
            raise ExternalProviderConfigurationError("Limite risposta provider non valido")
        if not 0 <= self.temperature <= 2:
            raise ExternalProviderConfigurationError("Temperatura provider non valida")
        if not 1 <= self.max_output_tokens <= 32_000:
            raise ExternalProviderConfigurationError("Limite output provider non valido")

    @property
    def endpoint(self) -> str:
        parsed = urlsplit(self.base_url.strip())
        path = parsed.path.rstrip("/") + "/chat/completions"
        return urlunsplit((parsed.scheme, parsed.netloc, path, "", ""))


class JsonChatTransport(Protocol):
    def post_json(
        self,
        endpoint: str,
        *,
        api_key: str,
        payload: dict[str, Any],
        timeout_seconds: float,
        max_response_bytes: int,
    ) -> dict[str, Any]: ...


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        return None


class UrllibJsonChatTransport:
    """Trasporto HTTP senza redirect automatici e con risposta limitata."""

    def post_json(
        self,
        endpoint: str,
        *,
        api_key: str,
        payload: dict[str, Any],
        timeout_seconds: float,
        max_response_bytes: int,
    ) -> dict[str, Any]:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        request = Request(
            endpoint,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Accept-Encoding": "identity",
                "User-Agent": "EveAIStudio/CORE-1.6",
            },
        )
        try:
            with build_opener(_NoRedirect()).open(request, timeout=timeout_seconds) as response:
                status = int(getattr(response, "status", 0))
                content_type = response.headers.get("Content-Type", "").split(";", 1)[0].lower()
                raw = response.read(max_response_bytes + 1)
        except HTTPError as error:
            raise ExternalProviderTransportError(f"Provider HTTP {int(error.code)}") from None
        except (URLError, TimeoutError, OSError):
            raise ExternalProviderTransportError("Provider non raggiungibile") from None
        if status < 200 or status >= 300:
            raise ExternalProviderTransportError(f"Provider HTTP {status}")
        if content_type not in {"application/json", "application/problem+json"}:
            raise ExternalProviderTransportError("Risposta provider non JSON")
        if len(raw) > max_response_bytes:
            raise ExternalProviderTransportError("Risposta provider oltre il limite")
        try:
            value = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise ExternalProviderTransportError("JSON provider non valido") from None
        if not isinstance(value, dict):
            raise ExternalProviderTransportError("Payload provider non valido")
        return value


class OpenAICompatibleEveProvider:
    """Adapter server-side per endpoint compatibili con /chat/completions.

    Il provider deve restituire nel contenuto del messaggio un oggetto JSON con
    message, uncertainty, sources e proposed_actions. Le azioni sono soltanto
    proposte dati: non vengono mai eseguite da questo adapter.
    """

    def __init__(self, config: ExternalProviderConfig, transport: JsonChatTransport | None = None) -> None:
        self.config = config
        self.transport = transport or UrllibJsonChatTransport()
        self.name = config.provider_key
        self.model = config.model_key

    @staticmethod
    def _system_prompt() -> str:
        return (
            "Sei Eve. Rispondi esclusivamente con JSON valido, senza markdown, con schema: "
            '{"message":"...","uncertainty":"low|medium|high","sources":'
            '[{"title":"...","locator":"..."}],"proposed_actions":[]}. '
            "Non inventare fonti. Non eseguire azioni. Se le fonti non bastano, dichiaralo."
        )

    def _payload(self, request: ChatRequest) -> dict[str, Any]:
        context = request.context.model_dump(mode="json", exclude_none=True)
        return {
            "model": self.config.model_key,
            "messages": [
                {"role": "system", "content": self._system_prompt()},
                {
                    "role": "user",
                    "content": json.dumps(
                        {"message": request.message, "mode": request.mode, "context": context},
                        ensure_ascii=False,
                        separators=(",", ":"),
                    ),
                },
            ],
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_output_tokens,
            "response_format": {"type": "json_object"},
            "store": False,
        }

    @staticmethod
    def _structured_content(payload: dict[str, Any]) -> dict[str, Any]:
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            raise ExternalProviderResponseError("Risposta provider priva di contenuto") from None
        if not isinstance(content, str) or not content.strip():
            raise ExternalProviderResponseError("Contenuto provider vuoto")
        if content.lstrip().startswith("```"):
            raise ExternalProviderResponseError("Il provider non ha rispettato l'output JSON")
        try:
            value = json.loads(content)
        except json.JSONDecodeError:
            raise ExternalProviderResponseError("Output strutturato non valido") from None
        if not isinstance(value, dict):
            raise ExternalProviderResponseError("Output strutturato non oggetto")
        return value

    async def generate(self, request: ChatRequest) -> ChatResponse:
        payload = await asyncio.to_thread(
            self.transport.post_json,
            self.config.endpoint,
            api_key=self.config.api_key,
            payload=self._payload(request),
            timeout_seconds=self.config.timeout_seconds,
            max_response_bytes=self.config.max_response_bytes,
        )
        value = self._structured_content(payload)
        message = str(value.get("message", "")).strip()
        uncertainty = str(value.get("uncertainty", "high")).strip().lower()
        if not message or len(message) > 20_000:
            raise ExternalProviderResponseError("Messaggio provider non valido")
        if uncertainty not in {"low", "medium", "high"}:
            uncertainty = "high"
        raw_sources = value.get("sources", [])
        if not isinstance(raw_sources, list) or len(raw_sources) > 20:
            raise ExternalProviderResponseError("Fonti provider non valide")
        sources: list[SourceReference] = []
        for raw in raw_sources:
            if not isinstance(raw, dict):
                raise ExternalProviderResponseError("Fonte provider non valida")
            title = str(raw.get("title", "")).strip()
            locator = str(raw.get("locator", "")).strip() or None
            if not title:
                raise ExternalProviderResponseError("Fonte provider senza titolo")
            sources.append(SourceReference(title=title[:500], locator=locator[:500] if locator else None))
        actions = value.get("proposed_actions", [])
        if not isinstance(actions, list) or len(actions) > 20 or any(not isinstance(item, dict) for item in actions):
            raise ExternalProviderResponseError("Azioni proposte non valide")
        return ChatResponse(
            message=message,
            provider=self.name,
            model=self.model,
            uncertainty=uncertainty,
            sources=sources,
            proposed_actions=actions,
        )
