from __future__ import annotations


class MaterialError(Exception):
    """Errore controllato del catalogo materiali."""

    code = "material_error"
    public_message = "Operazione sui materiali non riuscita"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.public_message)


class InvalidMaterialPayloadError(MaterialError):
    code = "invalid_payload"
    public_message = "Il contenuto del materiale non è valido"


class MaterialTooLargeError(MaterialError):
    code = "material_too_large"
    public_message = "Il materiale supera il limite configurato"


class MaterialTextTooLargeError(MaterialError):
    code = "extracted_text_too_large"
    public_message = "Il testo estratto supera il limite configurato"


class UnsupportedMediaTypeError(MaterialError):
    code = "unsupported_media_type"
    public_message = "Formato documentale non supportato in questo checkpoint"


class MaterialTextDecodingError(MaterialError):
    code = "text_decoding_failed"
    public_message = "Il documento testuale non è codificato in UTF-8"


class MaterialNotFoundError(MaterialError):
    code = "material_not_found"
    public_message = "Materiale non trovato"


class MaterialVersionNotFoundError(MaterialError):
    code = "material_version_not_found"
    public_message = "Versione del materiale non trovata"


class MaterialRoomMismatchError(MaterialError):
    code = "material_room_mismatch"
    public_message = "Materiale non disponibile nell'aula richiesta"


class MaterialVersionLimitError(MaterialError):
    code = "material_version_limit"
    public_message = "Il materiale ha raggiunto il numero massimo di versioni"


class MaterialProcessingError(MaterialError):
    code = "material_processing_failed"
    public_message = "Elaborazione del materiale non riuscita"
