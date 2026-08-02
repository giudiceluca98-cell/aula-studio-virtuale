from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol, Sequence
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from .errors import ResearchSearchProviderError, ResearchSearchProviderUnavailableError

_TRACKING_QUERY_KEYS = {
    "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src",
    "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term",
}


@dataclass(frozen=True, slots=True)
class SearchProviderRequest:
    text: str
    language: str
    purpose: str | None
    max_results: int
    timeout_seconds: float
    included_domains: tuple[str, ...] = ()
    excluded_domains: tuple[str, ...] = ()
    published_after: str | None = None
    published_before: str | None = None
    source_types: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class SearchProviderItem:
    url: str
    title: str
    snippet: str = ""
    publisher: str | None = None
    published_at: str | None = None
    language: str | None = None
    source_type: str = "web"
    score: float = 0.0
    ranking_reasons: tuple[str, ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class SearchProviderResponse:
    items: tuple[SearchProviderItem, ...]
    cost_units: float = 0.0
    provider_request_id: str | None = None


class SearchProvider(Protocol):
    name: str

    def search(self, request: SearchProviderRequest) -> SearchProviderResponse:
        ...


def _clean_domain(value: str) -> str:
    value = value.strip().lower().rstrip('.')
    if value.startswith('www.'):
        value = value[4:]
    return value


def normalize_search_url(url: str) -> str:
    """Normalizza senza effettuare rete e rimuove frammenti/tracking noti."""
    parsed = urlsplit(url.strip())
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Risultato con URL non HTTP/HTTPS")
    if parsed.username or parsed.password:
        raise ValueError("Risultato con credenziali incorporate")
    scheme = parsed.scheme.lower()
    host = parsed.hostname.lower().rstrip('.')
    port = parsed.port
    if port is not None and not ((scheme == 'http' and port == 80) or (scheme == 'https' and port == 443)):
        netloc = f"{host}:{port}"
    else:
        netloc = host
    path = parsed.path or '/'
    query_pairs = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key.lower() not in _TRACKING_QUERY_KEYS
    ]
    query_pairs.sort(key=lambda pair: (pair[0].lower(), pair[1]))
    return urlunsplit((scheme, netloc, path, urlencode(query_pairs, doseq=True), ''))


def domain_matches(hostname: str, configured_domain: str) -> bool:
    host = _clean_domain(hostname)
    domain = _clean_domain(configured_domain)
    return bool(domain) and (host == domain or host.endswith('.' + domain))


def filter_and_rank_items(
    items: Sequence[SearchProviderItem],
    *,
    included_domains: Sequence[str],
    excluded_domains: Sequence[str],
    language: str | None,
    published_after: str | None,
    published_before: str | None,
    source_types: Sequence[str],
    max_results: int,
) -> list[tuple[SearchProviderItem, str, tuple[str, ...]]]:
    """Filtra, normalizza e deduplica prima della registrazione in quarantena."""
    deduplicated: dict[str, tuple[SearchProviderItem, tuple[str, ...]]] = {}
    allowed_types = {value.strip().lower() for value in source_types if value.strip()}
    for item in items:
        try:
            normalized = normalize_search_url(item.url)
        except (ValueError, UnicodeError):
            continue
        host = urlsplit(normalized).hostname or ''
        if included_domains and not any(domain_matches(host, value) for value in included_domains):
            continue
        if excluded_domains and any(domain_matches(host, value) for value in excluded_domains):
            continue
        if language and item.language and item.language.lower() != language.lower():
            continue
        if published_after and item.published_at and item.published_at < published_after:
            continue
        if published_before and item.published_at and item.published_at > published_before:
            continue
        if allowed_types and item.source_type.lower() not in allowed_types:
            continue
        reasons = list(item.ranking_reasons)
        reasons.append(f"provider_score={item.score:.3f}")
        if included_domains:
            reasons.append('dominio incluso dal filtro')
        if language:
            reasons.append(f"lingua richiesta={language}")
        current = deduplicated.get(normalized)
        if current is None or item.score > current[0].score:
            deduplicated[normalized] = (item, tuple(dict.fromkeys(reasons)))
    ordered = sorted(
        ((item, normalized, reasons) for normalized, (item, reasons) in deduplicated.items()),
        key=lambda value: (-value[0].score, value[1]),
    )
    return ordered[:max_results]


class SearchProviderRegistry:
    def __init__(self, providers: Sequence[SearchProvider] = ()) -> None:
        self._providers: dict[str, SearchProvider] = {}
        for provider in providers:
            self.register(provider)

    def register(self, provider: SearchProvider) -> None:
        name = provider.name.strip().lower()
        if not name:
            raise ValueError("Il provider deve avere un nome")
        if name in self._providers:
            raise ValueError(f"Provider già registrato: {name}")
        self._providers[name] = provider

    @property
    def names(self) -> tuple[str, ...]:
        return tuple(sorted(self._providers))

    def resolve(self, requested: str | None, fallback_order: Sequence[str]) -> list[SearchProvider]:
        if requested:
            provider = self._providers.get(requested.strip().lower())
            if provider is None:
                raise ResearchSearchProviderUnavailableError(
                    f"Provider di ricerca non disponibile: {requested}"
                )
            return [provider]
        resolved: list[SearchProvider] = []
        for name in fallback_order:
            provider = self._providers.get(name.strip().lower())
            if provider is not None and provider not in resolved:
                resolved.append(provider)
        for name in sorted(self._providers):
            provider = self._providers[name]
            if provider not in resolved:
                resolved.append(provider)
        if not resolved:
            raise ResearchSearchProviderUnavailableError(
                "Nessun provider di ricerca configurato"
            )
        return resolved


class StaticSearchProvider:
    """Provider deterministico per test e sviluppo; non viene registrato in produzione."""

    def __init__(
        self,
        name: str,
        items: Sequence[SearchProviderItem],
        *,
        cost_units: float = 0.0,
        failures_before_success: int = 0,
    ) -> None:
        self.name = name
        self.items = tuple(items)
        self.cost_units = cost_units
        self.failures_before_success = failures_before_success
        self.calls = 0

    def search(self, request: SearchProviderRequest) -> SearchProviderResponse:
        self.calls += 1
        if self.calls <= self.failures_before_success:
            raise ResearchSearchProviderError(f"Errore simulato del provider {self.name}")
        return SearchProviderResponse(
            items=self.items[: request.max_results],
            cost_units=self.cost_units,
            provider_request_id=f"static-{self.name}-{self.calls}",
        )
