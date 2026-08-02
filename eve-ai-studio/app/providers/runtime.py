from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from threading import RLock
from time import monotonic
from typing import Callable

from .models import ProviderCircuitStatus, ProviderRuntimeStatus


class ProviderRateLimitExceededError(RuntimeError):
    pass


class ProviderCircuitOpenError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class ProviderRuntimePolicy:
    requests_per_minute: int = 30
    circuit_failure_threshold: int = 3
    circuit_recovery_seconds: float = 60.0

    def validate(self) -> None:
        if not 1 <= self.requests_per_minute <= 10_000:
            raise ValueError("requests_per_minute non valido")
        if not 1 <= self.circuit_failure_threshold <= 100:
            raise ValueError("circuit_failure_threshold non valido")
        if not 1 <= self.circuit_recovery_seconds <= 86_400:
            raise ValueError("circuit_recovery_seconds non valido")


class ProviderRuntimeGuard:
    def __init__(self, policy: ProviderRuntimePolicy, *, clock: Callable[[], float] = monotonic) -> None:
        policy.validate()
        self.policy = policy
        self.clock = clock
        self._lock = RLock()
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._failures: dict[str, int] = defaultdict(int)
        self._opened_at: dict[str, float] = {}

    def check_rate(self, key: str) -> None:
        now = self.clock()
        with self._lock:
            queue = self._requests[key]
            while queue and now - queue[0] >= 60:
                queue.popleft()
            if len(queue) >= self.policy.requests_per_minute:
                raise ProviderRateLimitExceededError("Limite richieste provider raggiunto")
            queue.append(now)

    def before_attempt(self, target_key: str) -> None:
        now = self.clock()
        with self._lock:
            opened_at = self._opened_at.get(target_key)
            if opened_at is None:
                return
            if now - opened_at >= self.policy.circuit_recovery_seconds:
                self._opened_at.pop(target_key, None)
                self._failures[target_key] = 0
                return
            raise ProviderCircuitOpenError("Circuit breaker provider aperto")

    def record_success(self, target_key: str) -> None:
        with self._lock:
            self._failures[target_key] = 0
            self._opened_at.pop(target_key, None)

    def record_failure(self, target_key: str) -> None:
        with self._lock:
            failures = self._failures[target_key] + 1
            self._failures[target_key] = failures
            if failures >= self.policy.circuit_failure_threshold:
                self._opened_at[target_key] = self.clock()

    def status(self) -> ProviderRuntimeStatus:
        now = self.clock()
        with self._lock:
            targets = sorted(set(self._failures) | set(self._opened_at))
            circuits = []
            for target in targets:
                opened_at = self._opened_at.get(target)
                retry_after = None
                state = "closed"
                if opened_at is not None:
                    remaining = max(0.0, self.policy.circuit_recovery_seconds - (now - opened_at))
                    if remaining > 0:
                        state = "open"
                        retry_after = remaining
                circuits.append(
                    ProviderCircuitStatus(
                        target_key=target,
                        state=state,
                        failures=self._failures.get(target, 0),
                        retry_after_seconds=retry_after,
                    )
                )
            return ProviderRuntimeStatus(
                enabled=True,
                requests_per_minute=self.policy.requests_per_minute,
                circuit_failure_threshold=self.policy.circuit_failure_threshold,
                circuit_recovery_seconds=self.policy.circuit_recovery_seconds,
                circuits=circuits,
            )
