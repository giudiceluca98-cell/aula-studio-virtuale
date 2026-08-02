from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass
from typing import Protocol, Sequence

from .semantic_errors import EmbeddingVectorError

_TOKEN_RE = re.compile(r"[\wÀ-ÿ]+", re.UNICODE)


@dataclass(frozen=True, slots=True)
class EmbeddingBatch:
    vectors: tuple[tuple[float, ...], ...]
    token_count: int
    cost_microunits: int


class EmbeddingProvider(Protocol):
    name: str
    model: str
    dimensions: int
    cost_microunits_per_1k_tokens: int

    def embed_many(self, texts: Sequence[str]) -> EmbeddingBatch: ...


def validate_vector(vector: Sequence[float], dimensions: int) -> tuple[float, ...]:
    if len(vector) != dimensions:
        raise EmbeddingVectorError(
            f"Dimensione embedding non valida: {len(vector)} invece di {dimensions}"
        )
    values = tuple(float(value) for value in vector)
    if not values or any(not math.isfinite(value) for value in values):
        raise EmbeddingVectorError("Embedding con valori non finiti")
    norm = math.sqrt(sum(value * value for value in values))
    if norm <= 0:
        raise EmbeddingVectorError("Embedding con norma nulla")
    return tuple(value / norm for value in values)


class DeterministicHashEmbeddingProvider:
    """Provider locale deterministico per test e sviluppo, senza rete o modelli esterni.

    Non pretende equivalenza con un modello semantico di produzione. Implementa lo
    stesso contratto tipizzato, rende ripetibili i test e mantiene il provider
    sostituibile. L'attivazione resta protetta dai feature flag server-side.
    """

    name = "deterministic-local"
    cost_microunits_per_1k_tokens = 0

    def __init__(self, *, model: str = "hash-embedding-v1", dimensions: int = 96) -> None:
        if dimensions < 16 or dimensions > 4096:
            raise ValueError("dimensions deve essere compreso tra 16 e 4096")
        self.model = model
        self.dimensions = dimensions

    @staticmethod
    def _tokens(text: str) -> list[str]:
        return _TOKEN_RE.findall(text.casefold())

    def _embed_one(self, text: str) -> tuple[tuple[float, ...], int]:
        tokens = self._tokens(text)
        features = list(tokens)
        features.extend(f"{a}::{b}" for a, b in zip(tokens, tokens[1:]))
        vector = [0.0] * self.dimensions
        for position, feature in enumerate(features):
            digest = hashlib.sha256(feature.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = -1.0 if digest[4] & 1 else 1.0
            weight = 1.0 / math.sqrt(1.0 + position / 32.0)
            vector[index] += sign * weight
        if not features:
            digest = hashlib.sha256(b"<empty>").digest()
            vector[int.from_bytes(digest[:4], "big") % self.dimensions] = 1.0
        return validate_vector(vector, self.dimensions), len(tokens)

    def embed_many(self, texts: Sequence[str]) -> EmbeddingBatch:
        vectors: list[tuple[float, ...]] = []
        token_count = 0
        for text in texts:
            vector, tokens = self._embed_one(str(text))
            vectors.append(vector)
            token_count += tokens
        return EmbeddingBatch(
            vectors=tuple(vectors),
            token_count=token_count,
            cost_microunits=0,
        )
