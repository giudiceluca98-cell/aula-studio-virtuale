from __future__ import annotations


class SemanticIndexError(RuntimeError):
    code = "semantic_index_error"


class EmbeddingDisabledError(SemanticIndexError):
    code = "embeddings_disabled"


class HybridRetrievalDisabledError(SemanticIndexError):
    code = "hybrid_retrieval_disabled"


class EmbeddingProviderUnavailableError(SemanticIndexError):
    code = "embedding_provider_unavailable"


class EmbeddingVectorError(SemanticIndexError):
    code = "embedding_vector_invalid"


class UnapprovedMaterialError(SemanticIndexError):
    code = "material_not_approved"


class SemanticIndexNotFoundError(KeyError):
    code = "semantic_index_not_found"


class SemanticIndexConflictError(SemanticIndexError):
    code = "semantic_index_conflict"
