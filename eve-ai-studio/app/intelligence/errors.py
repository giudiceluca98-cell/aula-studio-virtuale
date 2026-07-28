from __future__ import annotations


class ResearchError(RuntimeError):
    pass


class ResearchProjectNotFoundError(KeyError):
    pass


class ResearchConflictError(ResearchError):
    pass


class ResearchTransitionError(ResearchError):
    pass


class ResearchLimitError(ResearchError):
    pass
