from __future__ import annotations

import re

from .models import ResearchSafetyAnalysis


_PATTERNS: tuple[tuple[str, re.Pattern[str], int], ...] = (
    (
        "ignore_previous_instructions",
        re.compile(r"\b(ignore|disregard|forget)\b.{0,80}\b(previous|prior|system|developer)\b.{0,40}\b(instructions?|messages?|rules?)\b", re.I | re.S),
        3,
    ),
    (
        "system_prompt_request",
        re.compile(r"\b(system prompt|developer message|hidden instructions?|internal policy)\b", re.I),
        2,
    ),
    (
        "secret_exfiltration",
        re.compile(r"\b(api[_ -]?key|access token|password|secret|credential)\b.{0,80}\b(send|reveal|print|upload|exfiltrate|return)\b", re.I | re.S),
        3,
    ),
    (
        "tool_execution_instruction",
        re.compile(r"\b(execute|run|invoke|call)\b.{0,60}\b(command|shell|terminal|tool|function|script)\b", re.I | re.S),
        2,
    ),
    (
        "role_override",
        re.compile(r"\b(you are now|act as|pretend to be|new role)\b", re.I),
        1,
    ),
    (
        "jailbreak_language",
        re.compile(r"\b(jailbreak|DAN mode|bypass (?:the )?(?:rules|policy|filters?))\b", re.I),
        3,
    ),
)


def analyze_untrusted_content(text: str) -> ResearchSafetyAnalysis:
    """Deterministic safety hints for human review; never approves or rejects."""
    flags: list[str] = []
    weight = 0
    for flag, pattern, score in _PATTERNS:
        if pattern.search(text):
            flags.append(flag)
            weight += score

    if weight >= 5:
        severity = "high"
    elif weight >= 3:
        severity = "medium"
    elif weight:
        severity = "low"
    else:
        severity = "none"

    prompt_injection_flags = {
        "ignore_previous_instructions",
        "system_prompt_request",
        "secret_exfiltration",
        "tool_execution_instruction",
        "role_override",
        "jailbreak_language",
    }
    prompt_injection_detected = any(flag in prompt_injection_flags for flag in flags)
    return ResearchSafetyAnalysis(
        suspicious_content=bool(flags),
        prompt_injection_detected=prompt_injection_detected,
        severity=severity,
        flags=flags,
    )
