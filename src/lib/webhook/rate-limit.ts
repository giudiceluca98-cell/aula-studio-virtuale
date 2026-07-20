import { isIP } from "node:net";

export const WEBHOOK_RATE_LIMIT = Object.freeze({
  maxRequests: 30,
  windowMs: 60_000,
  maxTrackedClients: 5_000,
});

interface RateLimitEntry {
  attempts: number[];
  lastSeenAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

const clients = new Map<string, RateLimitEntry>();

function pruneExpiredClients(now: number): void {
  for (const [key, entry] of clients) {
    if (now - entry.lastSeenAt >= WEBHOOK_RATE_LIMIT.windowMs) {
      clients.delete(key);
    }
  }
}

/**
 * Per-instance sliding-window limiter: 30 attempts/minute for each client.
 * Vercel deployments needing a global limit can replace this module with a
 * shared Redis/KV adapter without changing the route contract.
 */
export function consumeWebhookRateLimit(
  key: string,
  now = Date.now(),
): RateLimitResult {
  if (clients.size >= WEBHOOK_RATE_LIMIT.maxTrackedClients) {
    pruneExpiredClients(now);
  }

  let entry = clients.get(key);
  if (!entry) {
    if (clients.size >= WEBHOOK_RATE_LIMIT.maxTrackedClients) {
      return {
        allowed: false,
        limit: WEBHOOK_RATE_LIMIT.maxRequests,
        remaining: 0,
        retryAfterSeconds: Math.ceil(WEBHOOK_RATE_LIMIT.windowMs / 1_000),
      };
    }
    entry = { attempts: [], lastSeenAt: now };
    clients.set(key, entry);
  }

  const windowStart = now - WEBHOOK_RATE_LIMIT.windowMs;
  entry.attempts = entry.attempts.filter((attempt) => attempt > windowStart);
  entry.lastSeenAt = now;

  if (entry.attempts.length >= WEBHOOK_RATE_LIMIT.maxRequests) {
    const retryAt = entry.attempts[0] + WEBHOOK_RATE_LIMIT.windowMs;
    return {
      allowed: false,
      limit: WEBHOOK_RATE_LIMIT.maxRequests,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1_000)),
    };
  }

  entry.attempts.push(now);
  return {
    allowed: true,
    limit: WEBHOOK_RATE_LIMIT.maxRequests,
    remaining: WEBHOOK_RATE_LIMIT.maxRequests - entry.attempts.length,
    retryAfterSeconds: 0,
  };
}

export function getWebhookClientKey(request: Request): string {
  const forwarded =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",", 1)[0]?.trim();

  // Vercel overwrites its forwarding headers. Invalid/untrusted values share a
  // conservative fallback bucket instead of creating unbounded map keys.
  if (!candidate || candidate.length > 64 || isIP(candidate) === 0) {
    return "unknown";
  }

  return candidate;
}

export function resetWebhookRateLimitForTests(): void {
  if (process.env.NODE_ENV === "test") clients.clear();
}
