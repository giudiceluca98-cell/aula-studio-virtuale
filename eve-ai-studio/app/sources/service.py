from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass

from app.materials.storage import SqliteMaterialStore
from app.retrieval.ranking import detect_suspicious_content

from .errors import (
    InvalidSourceLocatorError,
    SourceCoordinatesMismatchError,
    SourceHashMismatchError,
    SourceIntegrityError,
    SourceNotFoundError,
    SourceOutdatedError,
)
from .models import SourceNavigation, SourceOpenRequest, SourceOpenResponse, SourceOpeningStatus

_LOCATOR_RE = re.compile(
    r"^material:(?P<material_id>[A-Za-z0-9._-]{1,160}):"
    r"v(?P<version_number>[1-9][0-9]*):chunk:(?P<chunk_index>[0-9]+):"
    r"(?P<start_char>[0-9]+)-(?P<end_char>[1-9][0-9]*)$"
)


@dataclass(frozen=True, slots=True)
class SourceOpeningLimits:
    max_context_chars: int = 2_000

    def validate(self) -> None:
        if self.max_context_chars < 0 or self.max_context_chars > 20_000:
            raise ValueError("max_context_chars deve essere compreso tra 0 e 20000")


@dataclass(frozen=True, slots=True)
class ParsedLocator:
    material_id: str
    version_number: int
    chunk_index: int
    start_char: int
    end_char: int


class SourceOpeningService:
    stage = "verified_source_opening_v1"
    locator_format = "material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}"

    def __init__(
        self,
        material_store: SqliteMaterialStore,
        *,
        limits: SourceOpeningLimits | None = None,
    ) -> None:
        self.material_store = material_store
        self.limits = limits or SourceOpeningLimits()
        self.limits.validate()

    def status(self) -> SourceOpeningStatus:
        return SourceOpeningStatus(
            enabled=True,
            deterministic=True,
            stage=self.stage,
            locator_format=self.locator_format,
            source_scope="authorized_room_and_explicit_version",
            integrity_checks=[
                "locator_coordinates",
                "stored_chunk_sha256",
                "extracted_text_slice",
                "optional_expected_sha256",
            ],
            historical_ready_versions_openable=True,
            max_context_chars=self.limits.max_context_chars,
        )

    @staticmethod
    def parse_locator(locator: str) -> ParsedLocator:
        match = _LOCATOR_RE.fullmatch(locator.strip())
        if match is None:
            raise InvalidSourceLocatorError()
        parsed = ParsedLocator(
            material_id=match.group("material_id"),
            version_number=int(match.group("version_number")),
            chunk_index=int(match.group("chunk_index")),
            start_char=int(match.group("start_char")),
            end_char=int(match.group("end_char")),
        )
        if parsed.end_char <= parsed.start_char:
            raise InvalidSourceLocatorError("L'intervallo del locator non è valido")
        return parsed

    def _row(self, *, room_id: str, locator: ParsedLocator):
        with self.material_store.connection() as connection:
            return connection.execute(
                """
                SELECT
                    m.material_id, m.room_id, m.title, m.source_label, m.current_version_id,
                    current_version.version_number AS current_version_number,
                    v.version_id, v.version_number, v.filename, v.media_type, v.source_type,
                    v.status, v.metadata_json, v.extracted_text,
                    c.chunk_id, c.chunk_index, c.start_char, c.end_char,
                    c.text_content, c.text_sha256
                FROM materials m
                JOIN material_versions v ON v.material_id = m.material_id
                JOIN material_chunks c ON c.version_id = v.version_id
                LEFT JOIN material_versions current_version ON current_version.version_id = m.current_version_id
                WHERE m.room_id = ?
                  AND m.material_id = ?
                  AND v.version_number = ?
                  AND c.chunk_index = ?
                  AND v.status = 'ready'
                LIMIT 1
                """,
                (
                    room_id,
                    locator.material_id,
                    locator.version_number,
                    locator.chunk_index,
                ),
            ).fetchone()

    def open(self, request: SourceOpenRequest) -> SourceOpenResponse:
        locator = self.parse_locator(request.locator)
        if request.context_chars > self.limits.max_context_chars:
            raise InvalidSourceLocatorError(
                f"Il contesto supera il limite di {self.limits.max_context_chars} caratteri"
            )

        row = self._row(room_id=request.room_id, locator=locator)
        if row is None:
            raise SourceNotFoundError()

        if int(row["start_char"]) != locator.start_char or int(row["end_char"]) != locator.end_char:
            raise SourceCoordinatesMismatchError()

        text = str(row["text_content"])
        stored_sha256 = str(row["text_sha256"])
        actual_sha256 = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if actual_sha256 != stored_sha256:
            raise SourceIntegrityError()

        extracted_text = row["extracted_text"]
        if not isinstance(extracted_text, str):
            raise SourceIntegrityError("Il testo estratto della fonte non è disponibile")
        if locator.end_char > len(extracted_text):
            raise SourceIntegrityError("Le coordinate superano il testo estratto")
        if extracted_text[locator.start_char : locator.end_char] != text:
            raise SourceIntegrityError("Il chunk non corrisponde al testo estratto")

        expected_hash_verified: bool | None = None
        if request.expected_text_sha256 is not None:
            expected_hash_verified = request.expected_text_sha256 == actual_sha256
            if not expected_hash_verified:
                raise SourceHashMismatchError()

        is_current = int(row["current_version_id"]) == int(row["version_id"])
        if request.require_current and not is_current:
            raise SourceOutdatedError()

        context_start = max(0, locator.start_char - request.context_chars)
        context_end = min(len(extracted_text), locator.end_char + request.context_chars)
        metadata = json.loads(row["metadata_json"] or "{}")
        page_number = metadata.get("page_number")
        if not isinstance(page_number, int) or page_number < 1:
            page_number = None
        safety_flags = detect_suspicious_content(text)

        return SourceOpenResponse(
            room_id=request.room_id,
            locator=request.locator.strip(),
            material_id=str(row["material_id"]),
            title=str(row["title"]),
            source_label=row["source_label"],
            version_id=int(row["version_id"]),
            version_number=int(row["version_number"]),
            current_version_number=(
                int(row["current_version_number"])
                if row["current_version_number"] is not None
                else None
            ),
            is_current=is_current,
            stale=not is_current,
            filename=str(row["filename"]),
            media_type=str(row["media_type"]),
            source_type=str(row["source_type"]),
            chunk_id=int(row["chunk_id"]),
            chunk_index=int(row["chunk_index"]),
            start_char=locator.start_char,
            end_char=locator.end_char,
            text=text,
            text_sha256=actual_sha256,
            integrity_verified=True,
            expected_hash_verified=expected_hash_verified,
            context_start_char=context_start,
            context_end_char=context_end,
            context_text=extracted_text[context_start:context_end],
            suspicious_content=bool(safety_flags),
            safety_flags=safety_flags,
            navigation=SourceNavigation(
                resource_path=(
                    f"/v1/materials/{row['material_id']}/versions/"
                    f"{row['version_number']}/chunks"
                ),
                anchor=f"chunk-{row['chunk_index']}-chars-{locator.start_char}-{locator.end_char}",
                page_number=page_number,
            ),
        )
