from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass

_TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)
_SUSPICIOUS_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("instruction_override", re.compile(r"\b(ignore|ignora)\b.{0,40}\b(previous|precedenti|istruzioni|instructions)\b", re.I | re.S)),
    ("system_prompt_reference", re.compile(r"\b(system prompt|prompt di sistema|developer message|messaggio sviluppatore)\b", re.I)),
    ("active_script", re.compile(r"<\s*script\b|javascript\s*:", re.I)),
    ("tool_impersonation", re.compile(r"\b(call|chiama|esegui|execute)\b.{0,30}\b(tool|strumento|function|funzione)\b", re.I | re.S)),
)


def normalize_text(value: str) -> str:
    return unicodedata.normalize("NFKC", value).casefold()


def tokenize(value: str) -> list[str]:
    return _TOKEN_RE.findall(normalize_text(value))


@dataclass(frozen=True, slots=True)
class RankingResult:
    score: float
    matched_terms: list[str]
    exact_phrase: bool
    first_match: int
    safety_flags: list[str]


def detect_suspicious_content(text: str) -> list[str]:
    return [name for name, pattern in _SUSPICIOUS_PATTERNS if pattern.search(text)]


def rank_candidate(*, query: str, title: str, filename: str, text: str) -> RankingResult | None:
    query_tokens = list(dict.fromkeys(tokenize(query)))
    if not query_tokens:
        return None

    normalized_query = normalize_text(query).strip()
    normalized_text = normalize_text(text)
    normalized_title = normalize_text(title)
    normalized_filename = normalize_text(filename)
    text_counts = Counter(tokenize(text))
    title_counts = Counter(tokenize(title))
    filename_counts = Counter(tokenize(filename))

    matched = [token for token in query_tokens if text_counts[token] or title_counts[token] or filename_counts[token]]
    if not matched:
        return None

    coverage = len(matched) / len(query_tokens)
    text_frequency = sum(min(text_counts[token], 4) for token in matched)
    title_hits = sum(1 for token in query_tokens if title_counts[token])
    filename_hits = sum(1 for token in query_tokens if filename_counts[token])
    exact_phrase = len(normalized_query) >= 3 and normalized_query in normalized_text
    title_phrase = len(normalized_query) >= 3 and normalized_query in normalized_title
    filename_phrase = len(normalized_query) >= 3 and normalized_query in normalized_filename

    score = coverage * 50.0
    score += math.log1p(text_frequency) * 8.0
    score += title_hits * 12.0
    score += filename_hits * 6.0
    if exact_phrase:
        score += 30.0
    if title_phrase:
        score += 24.0
    if filename_phrase:
        score += 12.0
    if title_hits == len(query_tokens):
        score += 10.0

    positions = [normalized_text.find(token) for token in matched]
    first_match = min((position for position in positions if position >= 0), default=0)
    return RankingResult(
        score=round(score, 6),
        matched_terms=matched,
        exact_phrase=exact_phrase,
        first_match=first_match,
        safety_flags=detect_suspicious_content(text),
    )


def build_excerpt(text: str, *, first_match: int, max_chars: int) -> tuple[str, int, int]:
    if len(text) <= max_chars:
        return text, 0, len(text)
    half = max_chars // 2
    start = max(0, first_match - half)
    end = min(len(text), start + max_chars)
    start = max(0, end - max_chars)
    excerpt = text[start:end]
    if start:
        excerpt = "…" + excerpt.lstrip()
    if end < len(text):
        excerpt = excerpt.rstrip() + "…"
    return excerpt, start, end
