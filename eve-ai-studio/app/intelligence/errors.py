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
