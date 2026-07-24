from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class PermissionLevel(StrEnum):
    READ = "read"
    PROPOSE = "propose"
    CONFIRM = "confirm"
    LIMITED_AUTOMATION = "limited_automation"
    ADMIN = "admin"


class StudyContext(BaseModel):
    user_id: str = Field(min_length=1)
    room_id: str | None = None
    course_id: str | None = None
    lesson_id: str | None = None
    section_id: str | None = None
    selected_text: str | None = None
    permission_level: PermissionLevel = PermissionLevel.READ


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    context: StudyContext
    mode: str = Field(default="explain", max_length=64)


class SourceReference(BaseModel):
    title: str
    locator: str | None = None


class ChatResponse(BaseModel):
    message: str
    provider: str
    model: str
    uncertainty: str
    sources: list[SourceReference] = Field(default_factory=list)
    proposed_actions: list[dict[str, Any]] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    enabled: bool
    provider: str
    environment: str
