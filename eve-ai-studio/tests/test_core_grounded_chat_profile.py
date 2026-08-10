from __future__ import annotations

from app.core.config import EveSettings


def test_grounded_chat_profile_defaults_to_production():
    settings = EveSettings(_env_file=None)
    assert settings.grounded_chat_execution_profile == "chat-production"


def test_grounded_chat_profile_can_be_overridden(monkeypatch):
    monkeypatch.setenv("EVE_GROUNDED_CHAT_EXECUTION_PROFILE", "chat-development")
    settings = EveSettings(_env_file=None)
    assert settings.grounded_chat_execution_profile == "chat-development"
