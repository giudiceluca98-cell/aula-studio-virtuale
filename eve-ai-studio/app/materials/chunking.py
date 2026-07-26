from __future__ import annotations

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PreparedChunk:
    chunk_index: int
    start_char: int
    end_char: int
    text: str
    text_sha256: str


def _best_boundary(text: str, start: int, hard_end: int, minimum_end: int) -> int:
    candidates: list[int] = []
    for separator in ("\n\n", "\n", ". ", "; ", ", ", " "):
        position = text.rfind(separator, minimum_end, hard_end)
        if position >= minimum_end:
            candidates.append(position + len(separator))
    return max(candidates, default=hard_end)


def prepare_chunks(text: str, *, chunk_chars: int, overlap_chars: int) -> list[PreparedChunk]:
    if chunk_chars < 100:
        raise ValueError("chunk_chars deve essere almeno 100")
    if overlap_chars < 0 or overlap_chars >= chunk_chars:
        raise ValueError("overlap_chars deve essere compreso tra 0 e chunk_chars - 1")
    if not text:
        return []

    chunks: list[PreparedChunk] = []
    start = 0
    text_length = len(text)
    while start < text_length:
        hard_end = min(start + chunk_chars, text_length)
        end = hard_end
        if hard_end < text_length:
            minimum_end = min(hard_end, start + max(80, int(chunk_chars * 0.6)))
            end = _best_boundary(text, start, hard_end, minimum_end)
        if end <= start:
            end = hard_end

        raw = text[start:end]
        leading = len(raw) - len(raw.lstrip())
        trailing = len(raw) - len(raw.rstrip())
        actual_start = start + leading
        actual_end = end - trailing
        chunk_text = text[actual_start:actual_end]
        if chunk_text:
            chunks.append(
                PreparedChunk(
                    chunk_index=len(chunks),
                    start_char=actual_start,
                    end_char=actual_end,
                    text=chunk_text,
                    text_sha256=hashlib.sha256(chunk_text.encode("utf-8")).hexdigest(),
                )
            )

        if end >= text_length:
            break
        next_start = end - overlap_chars
        if next_start <= start:
            next_start = start + 1
        start = next_start

    return chunks
