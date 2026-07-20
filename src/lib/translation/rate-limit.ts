export const TRANSLATION_BURST_LIMIT = Object.freeze({
  maxRequests: 12,
  windowMs: 60_000,
  maxTrackedUsers: 5_000,
});

const attemptsByUser = new Map<string, number[]>();

export function consumeTranslationBurst(userId: string, now = Date.now()) {
  if (attemptsByUser.size >= TRANSLATION_BURST_LIMIT.maxTrackedUsers) {
    for (const [key, attempts] of attemptsByUser) {
      if (!attempts.some((attempt) => attempt > now - TRANSLATION_BURST_LIMIT.windowMs)) {
        attemptsByUser.delete(key);
      }
    }
  }
  const attempts = (attemptsByUser.get(userId) ?? [])
    .filter((attempt) => attempt > now - TRANSLATION_BURST_LIMIT.windowMs);
  if (attempts.length >= TRANSLATION_BURST_LIMIT.maxRequests) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((attempts[0] + TRANSLATION_BURST_LIMIT.windowMs - now) / 1000)) };
  }
  attempts.push(now);
  attemptsByUser.set(userId, attempts);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetTranslationRateLimitForTests() {
  if (process.env.NODE_ENV === "test") attemptsByUser.clear();
}
