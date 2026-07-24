from __future__ import annotations

from ..models import PermissionLevel


class PermissionDeniedError(RuntimeError):
    pass


_PERMISSION_ORDER = {
    PermissionLevel.READ: 0,
    PermissionLevel.PROPOSE: 1,
    PermissionLevel.CONFIRM: 2,
    PermissionLevel.LIMITED_AUTOMATION: 3,
    PermissionLevel.ADMIN: 4,
}


def require_permission(actual: PermissionLevel, required: PermissionLevel) -> None:
    """Valida i permessi nel codice server, mai nel solo prompt."""

    if _PERMISSION_ORDER[actual] < _PERMISSION_ORDER[required]:
        raise PermissionDeniedError(f"Permesso richiesto: {required.value}")
