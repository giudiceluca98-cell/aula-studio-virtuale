from __future__ import annotations


class SourceHealthError(RuntimeError):
    code = "source_health_error"


class SourceHealthDisabledError(SourceHealthError):
    code = "source_health_disabled"


class SourceRecheckDisabledError(SourceHealthError):
    code = "source_recheck_disabled"


class SourceConflictTrackingDisabledError(SourceHealthError):
    code = "source_conflict_tracking_disabled"


class CorpusReportingDisabledError(SourceHealthError):
    code = "corpus_reporting_disabled"


class SourceHealthNotFoundError(KeyError):
    code = "source_health_not_found"


class SourceHealthStateError(SourceHealthError):
    code = "source_health_state_error"


class SourceConflictNotFoundError(KeyError):
    code = "source_conflict_not_found"


class SourceConflictStateError(SourceHealthError):
    code = "source_conflict_state_error"
