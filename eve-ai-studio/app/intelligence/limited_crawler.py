from __future__ import annotations

import hashlib
from collections import deque
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit

from .errors import ResearchCrawlDisabledError, ResearchCrawlLimitError
from .web_acquisition import ControlledWebAcquirer


@dataclass(frozen=True, slots=True)
class CrawlPolicy:
    enabled: bool = False
    max_depth: int = 1
    max_pages: int = 10
    max_total_bytes: int = 5_000_000
    same_domain_only: bool = True


@dataclass(frozen=True, slots=True)
class CrawledPagePayload:
    url: str
    depth: int
    media_type: str
    size_bytes: int
    sha256: str
    extracted_text: str
    discovered_links: tuple[str,...]


@dataclass(frozen=True, slots=True)
class CrawlResult:
    root_url: str
    pages: tuple[CrawledPagePayload,...]
    total_bytes: int
    truncated: bool


class _PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.parts=[]; self.links=[]; self.blocked=0
    def handle_starttag(self,tag,attrs):
        tag=tag.lower()
        if tag in {'script','style','noscript','template'}: self.blocked+=1
        if tag=='a':
            href=dict(attrs).get('href')
            if href: self.links.append(href)
    def handle_endtag(self,tag):
        if tag.lower() in {'script','style','noscript','template'} and self.blocked: self.blocked-=1
    def handle_data(self,data):
        if not self.blocked and data.strip(): self.parts.append(data.strip())


def normalize_crawl_url(url:str)->str:
    parsed=urlsplit(url.strip())
    if parsed.scheme not in {'http','https'} or not parsed.hostname: raise ValueError('URL crawl non valido')
    if parsed.username or parsed.password: raise ValueError('Credenziali URL non consentite')
    host=parsed.hostname.lower().rstrip('.'); port=parsed.port
    netloc=host if port is None or (parsed.scheme=='http' and port==80) or (parsed.scheme=='https' and port==443) else f'{host}:{port}'
    return urlunsplit((parsed.scheme.lower(),netloc,parsed.path or '/',parsed.query,''))


class LimitedCrawler:
    def __init__(self, acquirer: ControlledWebAcquirer, policy: CrawlPolicy|None=None):
        self.acquirer=acquirer; self.policy=policy or CrawlPolicy()

    def crawl(self, root_url:str, *, max_depth:int|None=None, max_pages:int|None=None)->CrawlResult:
        if not self.policy.enabled: raise ResearchCrawlDisabledError('Il crawling è disattivato dal server')
        depth_limit=min(self.policy.max_depth, self.policy.max_depth if max_depth is None else max_depth)
        page_limit=min(self.policy.max_pages, self.policy.max_pages if max_pages is None else max_pages)
        if depth_limit<0 or page_limit<1: raise ResearchCrawlLimitError('Limiti crawl non validi')
        root=normalize_crawl_url(root_url); root_parts=urlsplit(root); root_host=root_parts.hostname
        queue=deque([(root,0)]); visited=set(); pages=[]; total=0; truncated=False
        while queue and len(pages)<page_limit:
            url,depth=queue.popleft()
            if url in visited: continue
            visited.add(url)
            fetched=self.acquirer.fetch(url)
            # L'acquisitore protegge ogni destinazione da SSRF, ma un redirect
            # pubblico verso un altro dominio sarebbe comunque fuori dal
            # perimetro del crawl richiesto. Verificare anche la destinazione
            # finale, non soltanto i link scoperti nella pagina.
            final=normalize_crawl_url(fetched.final_url)
            final_parts=urlsplit(final)
            if self.policy.same_domain_only and final_parts.hostname != root_host:
                raise ResearchCrawlLimitError('Redirect del crawl fuori dominio')
            if final_parts.scheme != root_parts.scheme:
                raise ResearchCrawlLimitError('Redirect del crawl con cambio di schema')
            if fetched.media_type not in {'text/html','application/xhtml+xml','text/plain','text/markdown'}: continue
            total+=len(fetched.content)
            if total>self.policy.max_total_bytes: raise ResearchCrawlLimitError('Budget byte del crawl superato')
            try: decoded=fetched.content.decode('utf-8-sig')
            except UnicodeDecodeError: continue
            parser=_PageParser(); parser.feed(decoded)
            links=[]
            if depth<depth_limit and fetched.media_type in {'text/html','application/xhtml+xml'}:
                for href in parser.links:
                    try: candidate=normalize_crawl_url(urljoin(fetched.final_url,href))
                    except ValueError: continue
                    parsed=urlsplit(candidate)
                    if self.policy.same_domain_only and parsed.hostname!=root_host: continue
                    if parsed.scheme!=root_parts.scheme: continue
                    if candidate not in visited and candidate not in links: links.append(candidate)
                for candidate in links: queue.append((candidate,depth+1))
            text='\n'.join(parser.parts) if fetched.media_type in {'text/html','application/xhtml+xml'} else decoded.strip()
            pages.append(CrawledPagePayload(url=fetched.final_url,depth=depth,media_type=fetched.media_type,size_bytes=len(fetched.content),sha256=hashlib.sha256(fetched.content).hexdigest(),extracted_text=text,discovered_links=tuple(links)))
        if queue: truncated=True
        return CrawlResult(root_url=root,pages=tuple(pages),total_bytes=total,truncated=truncated)
