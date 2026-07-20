import type { WebhookPayload } from "@/lib/webhook/schema";

export type EnqueueWebhookResult =
  | { outcome: "accepted" }
  | { outcome: "duplicate" };

export class WebhookEventStoreError extends Error {
  constructor(
    readonly code: "configuration" | "unavailable" | "invalid_response",
  ) {
    super("Webhook event store is unavailable");
    this.name = "WebhookEventStoreError";
  }
}

interface SupabaseEventStoreConfig {
  url: string;
  secretKey: string;
}

interface MemoryWebhookEvent {
  payload: WebhookPayload;
  status: "received";
  receivedAt: string;
}

const testEvents = new Map<string, MemoryWebhookEvent>();

function getSupabaseConfig(): SupabaseEventStoreConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url && !secretKey) return null;
  if (!url || !secretKey) {
    throw new WebhookEventStoreError("configuration");
  }

  try {
    const parsedUrl = new URL(url);
    const isLoopback =
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname === "127.0.0.1" ||
      parsedUrl.hostname === "[::1]";
    if (parsedUrl.protocol !== "https:" && !isLoopback) {
      throw new Error("Unsupported Supabase URL");
    }
  } catch {
    throw new WebhookEventStoreError("configuration");
  }

  return { url, secretKey };
}

async function enqueueInSupabase(
  payload: WebhookPayload,
  config: SupabaseEventStoreConfig,
): Promise<EnqueueWebhookResult> {
  const endpoint = new URL("/rest/v1/webhook_events", config.url);
  endpoint.searchParams.set("on_conflict", "event_id");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
      headers: {
        apikey: config.secretKey,
        Authorization: `Bearer ${config.secretKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({
        event_id: payload.eventId,
        event_type: payload.event,
        room_id: payload.roomId,
        user_id: payload.userId,
        payload,
        status: "received",
      }),
    });
  } catch {
    throw new WebhookEventStoreError("unavailable");
  }

  if (!response.ok) {
    throw new WebhookEventStoreError("unavailable");
  }

  let insertedRows: unknown;
  try {
    insertedRows = await response.json();
  } catch {
    throw new WebhookEventStoreError("invalid_response");
  }

  if (!Array.isArray(insertedRows)) {
    throw new WebhookEventStoreError("invalid_response");
  }

  return insertedRows.length === 0
    ? { outcome: "duplicate" }
    : { outcome: "accepted" };
}

function enqueueInTestMemory(payload: WebhookPayload): EnqueueWebhookResult {
  // Map#set is synchronous, so duplicate checks are atomic within a Vitest
  // worker, including concurrent Promise.all calls.
  if (testEvents.has(payload.eventId)) return { outcome: "duplicate" };

  testEvents.set(payload.eventId, {
    payload,
    status: "received",
    receivedAt: new Date().toISOString(),
  });
  return { outcome: "accepted" };
}

/**
 * Atomically enqueues a durable event. `event_id` is a database primary key,
 * and PostgREST's ignore-duplicates preference makes retries idempotent. Long
 * processing is intentionally decoupled: a worker can claim `received` rows
 * and transition them through processing/processed/failed after this endpoint
 * has already returned 202.
 */
export async function enqueueWebhookEvent(
  payload: WebhookPayload,
): Promise<EnqueueWebhookResult> {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.WEBHOOK_TEST_USE_SUPABASE !== "1"
  ) {
    return enqueueInTestMemory(payload);
  }

  const config = getSupabaseConfig();
  if (!config) throw new WebhookEventStoreError("configuration");
  return enqueueInSupabase(payload, config);
}

export function resetWebhookEventStoreForTests(): void {
  if (process.env.NODE_ENV === "test") testEvents.clear();
}

export function getWebhookEventsForTests(): ReadonlyMap<
  string,
  MemoryWebhookEvent
> {
  if (process.env.NODE_ENV !== "test") return new Map();
  return new Map(testEvents);
}
