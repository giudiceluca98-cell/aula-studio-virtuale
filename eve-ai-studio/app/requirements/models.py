from __future__ import annotations

from pydantic import BaseModel, Field


class PlanSection(BaseModel):
    number: int
    title: str


class RequirementCard(BaseModel):
    requirement_id: str
    section_number: int
    section_title: str
    card_number: int
    title: str
    objective: str
    user_experience: str
    implementation: str
    data_permissions: str
    risks: str
    verification: str
    owner_hint: str
    module_key: str


class PlanImportRequest(BaseModel):
    text: str = Field(min_length=1)
    expected_sections: int | None = Field(default=None, ge=1)
    expected_cards: int | None = Field(default=None, ge=1)
    replace: bool = True


class PlanImportResult(BaseModel):
    source_sha256: str
    sections_count: int
    cards_count: int
    warnings: list[str] = Field(default_factory=list)


class RequirementSummary(BaseModel):
    requirement_id: str
    section_number: int
    section_title: str
    card_number: int
    title: str
    owner_hint: str
    module_key: str


class RequirementListResponse(BaseModel):
    total: int
    offset: int
    limit: int
    items: list[RequirementSummary]


class RequirementCatalogStatus(BaseModel):
    loaded: bool
    source_sha256: str | None
    sections_count: int
    cards_count: int
