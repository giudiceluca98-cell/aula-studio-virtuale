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
    label: str | None = Field(default=None, max_length=120)
    note: str | None = Field(default=None, max_length=1000)


class PlanImportResult(BaseModel):
    source_sha256: str
    catalog_sha256: str
    sections_count: int
    cards_count: int
    warnings: list[str] = Field(default_factory=list)
    import_id: int
    version_id: int
    previous_version_id: int | None = None
    created_new_version: bool
    active: bool = True


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
    catalog_sha256: str | None
    sections_count: int
    cards_count: int
    active_version_id: int | None
    versions_count: int
    persistent: bool
    schema_version: int


class RequirementVersionSummary(BaseModel):
    version_id: int
    created_at: str
    source_sha256: str
    catalog_sha256: str
    sections_count: int
    cards_count: int
    label: str | None = None
    note: str | None = None
    parent_version_id: int | None = None
    import_id: int
    import_mode: str
    active: bool


class RequirementVersionListResponse(BaseModel):
    total: int
    items: list[RequirementVersionSummary]


class RequirementImportSummary(BaseModel):
    import_id: int
    created_at: str
    completed_at: str | None = None
    status: str
    source_sha256: str
    expected_sections: int | None = None
    expected_cards: int | None = None
    label: str | None = None
    note: str | None = None
    replace: bool
    version_id: int | None = None
    error_message: str | None = None


class RequirementImportListResponse(BaseModel):
    total: int
    items: list[RequirementImportSummary]


class RequirementChangeSummary(BaseModel):
    requirement_id: str
    title: str
    module_key: str
    changed_fields: list[str] = Field(default_factory=list)


class RequirementVersionDiff(BaseModel):
    from_version_id: int
    to_version_id: int
    added_count: int
    removed_count: int
    modified_count: int
    unchanged_count: int
    added: list[RequirementChangeSummary] = Field(default_factory=list)
    removed: list[RequirementChangeSummary] = Field(default_factory=list)
    modified: list[RequirementChangeSummary] = Field(default_factory=list)


class RequirementRollbackRequest(BaseModel):
    version_id: int = Field(ge=1)
    note: str | None = Field(default=None, max_length=1000)


class RequirementRollbackResult(BaseModel):
    previous_version_id: int | None
    active_version_id: int
    source_sha256: str
    catalog_sha256: str
    sections_count: int
    cards_count: int
    rolled_back_at: str
