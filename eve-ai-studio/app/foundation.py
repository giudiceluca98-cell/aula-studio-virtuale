"""Compatibilità temporanea per il checkpoint 0.1.

Il codice reale è ora separato nei moduli core, context e providers.
Questo file verrà rimosso quando tutte le integrazioni useranno i nuovi percorsi.
"""

from .context.validation import ContextTooLargeError, validate_context_size
from .core.audit import AuditEvent, AuditLogger
from .core.config import EveSettings
from .core.permissions import PermissionDeniedError, require_permission
from .providers.base import EveProvider
from .providers.mock import MockEveProvider
from .providers.registry import get_provider

__all__ = [
    "AuditEvent",
    "AuditLogger",
    "ContextTooLargeError",
    "EveProvider",
    "EveSettings",
    "MockEveProvider",
    "PermissionDeniedError",
    "get_provider",
    "require_permission",
    "validate_context_size",
]
