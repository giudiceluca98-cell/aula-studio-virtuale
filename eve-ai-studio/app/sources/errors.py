from __future__ import annotations


class SourceOpeningError(RuntimeError):
    code = "source_opening_error"


class InvalidSourceLocatorError(SourceOpeningError):
    code = "invalid_source_locator"

    def __init__(self, message: str = "Il locator della fonte non è valido") -> None:
        super().__init__(message)


class SourceNotFoundError(SourceOpeningError):
    code = "source_not_found"

    def __init__(self) -> None:
        super().__init__("Fonte non trovata")


class SourceIntegrityError(SourceOpeningError):
    code = "source_integrity_failed"

    def __init__(self, message: str = "La fonte non supera il controllo di integrità") -> None:
        super().__init__(message)


class SourceHashMismatchError(SourceOpeningError):
    code = "source_hash_mismatch"

    def __init__(self) -> None:
        super().__init__("L'impronta attesa non corrisponde alla fonte")


class SourceCoordinatesMismatchError(SourceOpeningError):
    code = "source_coordinates_mismatch"

    def __init__(self) -> None:
        super().__init__("Le coordinate del locator non corrispondono al chunk")


class SourceOutdatedError(SourceOpeningError):
    code = "source_outdated"

    def __init__(self) -> None:
        super().__init__("La citazione indica una versione non più corrente")
