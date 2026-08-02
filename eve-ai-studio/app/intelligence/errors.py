from __future__ import annotations


class ResearchError(RuntimeError):
    pass


class ResearchProjectNotFoundError(KeyError):
    pass


class ResearchSourceNotFoundError(KeyError):
    pass


class ResearchDocumentNotFoundError(KeyError):
    pass


class ResearchConflictError(ResearchError):
    pass


class ResearchTransitionError(ResearchError):
    pass


class ResearchLimitError(ResearchError):
    pass


class ResearchReviewNotFoundError(KeyError):
    pass


class ResearchPromotionNotFoundError(KeyError):
    pass


class ResearchReviewStateError(ResearchError):
    pass


class ResearchStaleReviewError(ResearchError):
    pass


class ResearchReviewDisabledError(ResearchError):
    pass


class ResearchPromotionDisabledError(ResearchError):
    pass


class ResearchSearchDisabledError(ResearchError):
    pass


class ResearchSearchProviderUnavailableError(ResearchError):
    pass


class ResearchSearchProviderError(ResearchError):
    pass


class ResearchSearchExecutionNotFoundError(KeyError):
    pass


class ResearchAdvancedIngestionDisabledError(ResearchError):
    code = "advanced_ingestion_disabled"
class ResearchDocumentFormatError(ResearchError):
    code = "document_format_rejected"
class ResearchDocumentTooLargeError(ResearchError):
    code = "document_too_large"
class ResearchDocumentEncryptedError(ResearchError):
    code = "document_encrypted"
class ResearchArchiveRejectedError(ResearchError):
    code = "archive_rejected"
class ResearchExtractionError(ResearchError):
    code = "document_extraction_failed"
class ResearchCrawlDisabledError(ResearchError):
    code = "crawl_disabled"
class ResearchCrawlLimitError(ResearchError):
    code = "crawl_limit_exceeded"
