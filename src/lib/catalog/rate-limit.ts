const WINDOW_MS = 60_000;
const MAX_REQUESTS = 15;
const buckets = new Map<string, number[]>();

export function consumeCatalogBurst(userId: string) {
  const now = Date.now();
  const current = (buckets.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);
  if (current.length >= MAX_REQUESTS) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - current[0])) / 1000)) };
  current.push(now);
  buckets.set(userId, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

