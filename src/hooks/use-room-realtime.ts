"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "../lib/supabase/client";
import type {
  RawPostgresChangePayload,
  RealtimeConnectionState,
  RealtimeTable,
  RoomRealtimeEvent,
} from "../lib/types";

export const DEFAULT_ROOM_REALTIME_TABLES: readonly RealtimeTable[] = [
  "room_members",
  "presence",
  "courses",
  "materials",
  "progress_entries",
  "study_sessions",
  "tasks",
  "task_assignees",
  "messages",
  "message_reads",
  "shared_notes",
  "activity_events",
  "material_reader_progress",
  "session_summaries",
  "call_sessions",
  "call_participants",
] as const;

const VALID_TABLES = new Set<string>(DEFAULT_ROOM_REALTIME_TABLES);

function validServerTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function rowIdentity(row: Record<string, unknown> | undefined): string {
  if (!row) return "unknown";
  const id = row.id ?? row.event_id;
  if (typeof id === "string" || typeof id === "number") return String(id);

  // Composite-key tables: use the entity key before the room/user fallback.
  const taskId = row.task_id;
  if (
    (typeof taskId === "string" || typeof taskId === "number") &&
    (typeof row.user_id === "string" || typeof row.user_id === "number")
  ) {
    return `task:${String(taskId)}:${String(row.user_id)}`;
  }
  const messageId = row.message_id;
  if (
    (typeof messageId === "string" || typeof messageId === "number") &&
    (typeof row.user_id === "string" || typeof row.user_id === "number")
  ) {
    return `message:${String(messageId)}:${String(row.user_id)}`;
  }
  const callId = row.call_id;
  if (
    (typeof callId === "string" || typeof callId === "number") &&
    (typeof row.user_id === "string" || typeof row.user_id === "number")
  ) {
    return `call:${String(callId)}:${String(row.user_id)}`;
  }

  // room_members and presence.
  const userId = row.user_id;
  const roomId = row.room_id;
  if (typeof userId === "string" && typeof roomId === "string") {
    return `${roomId}:${userId}`;
  }

  return "unknown";
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? String(value);
  }
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableValue(record[key])}`)
    .join(",")}}`;
}

function shortHash(value: unknown): string {
  const input = stableValue(value);
  let hash = 2_166_136_261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Converts a Supabase payload to a stable domain event. A missing commit timestamp
 * is rejected: using Date.now() here would make conflict resolution unreliable.
 */
export function normalizeRoomRealtimeEvent(
  payload: RawPostgresChangePayload,
  expectedRoomId: string,
): RoomRealtimeEvent | null {
  if (!VALID_TABLES.has(payload.table)) return null;
  if (!validServerTimestamp(payload.commit_timestamp)) return null;

  const current = payload.new ?? undefined;
  const previous = payload.old ?? undefined;
  const source = payload.eventType === "DELETE" ? previous : current;
  const roomId = source?.room_id ?? current?.room_id ?? previous?.room_id;
  if (roomId !== expectedRoomId) return null;

  const record = payload.eventType === "DELETE" ? previous : current;
  const identity = rowIdentity(record);
  const serverTimestamp = new Date(payload.commit_timestamp).toISOString();

  return {
    id: `${payload.table}:${payload.eventType}:${identity}:${serverTimestamp}:${shortHash(record)}`,
    roomId: expectedRoomId,
    table: payload.table as RealtimeTable,
    type: payload.eventType,
    record: record ?? null,
    previous: previous ?? null,
    serverTimestamp,
  };
}

/** Bounded, expiring cache: reconnect replays do not produce duplicate UI events. */
export class RealtimeEventDeduplicator {
  private readonly seen = new Map<string, number>();

  constructor(
    private readonly ttlMs = 5 * 60_000,
    private readonly maxEntries = 2_000,
    private readonly now: () => number = Date.now,
  ) {}

  accept(eventId: string): boolean {
    const now = this.now();
    this.prune(now);
    if (this.seen.has(eventId)) return false;

    this.seen.set(eventId, now);
    while (this.seen.size > this.maxEntries) {
      const oldest = this.seen.keys().next().value as string | undefined;
      if (!oldest) break;
      this.seen.delete(oldest);
    }
    return true;
  }

  clear(): void {
    this.seen.clear();
  }

  private prune(now: number): void {
    for (const [key, seenAt] of this.seen) {
      if (now - seenAt <= this.ttlMs) break;
      this.seen.delete(key);
    }
  }
}

/** Deduplication plus last-write-wins ordering based on PostgreSQL commit time. */
export class RoomRealtimeEventGate {
  private readonly latestCommit = new Map<string, number>();

  constructor(
    private readonly deduplicator = new RealtimeEventDeduplicator(),
    private readonly maxTrackedRows = 5_000,
  ) {}

  accept(event: RoomRealtimeEvent): boolean {
    if (!this.deduplicator.accept(event.id)) return false;

    const record = (event.record ?? event.previous ?? {}) as Record<string, unknown>;
    const key = `${event.table}:${rowIdentity(record)}`;
    const timestamp = Date.parse(event.serverTimestamp);
    const latest = this.latestCommit.get(key);
    if (latest !== undefined && timestamp < latest) return false;

    // Refresh insertion order so the bounded map retains recently active rows.
    this.latestCommit.delete(key);
    this.latestCommit.set(key, timestamp);
    while (this.latestCommit.size > this.maxTrackedRows) {
      const oldest = this.latestCommit.keys().next().value as string | undefined;
      if (!oldest) break;
      this.latestCommit.delete(oldest);
    }
    return true;
  }

  clear(): void {
    this.latestCommit.clear();
    this.deduplicator.clear();
  }
}

export function reconnectDelayMs(
  attempt: number,
  random: () => number = Math.random,
): number {
  const base = Math.min(30_000, 1_000 * 2 ** Math.max(0, attempt));
  return Math.round(base * (0.8 + random() * 0.4));
}

export function roomRealtimeChannelName(roomId: string): string {
  return `room:${roomId}:database`;
}

export interface UseRoomRealtimeOptions {
  roomId: string | null | undefined;
  enabled?: boolean;
  tables?: readonly RealtimeTable[];
  client?: SupabaseClient;
  onEvent?: (event: RoomRealtimeEvent) => void;
  onError?: (error: Error) => void;
}

export interface UseRoomRealtimeResult {
  connectionState: RealtimeConnectionState;
  reconnectAttempt: number;
  lastServerTimestamp: string | null;
}

export function useRoomRealtime({
  roomId,
  enabled = true,
  tables = DEFAULT_ROOM_REALTIME_TABLES,
  client,
  onEvent,
  onError,
}: UseRoomRealtimeOptions): UseRoomRealtimeResult {
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [lastServerTimestamp, setLastServerTimestamp] = useState<string | null>(
    null,
  );
  const eventHandler = useRef(onEvent);
  const errorHandler = useRef(onError);
  const tableKey = [...tables].sort().join(",");

  useEffect(() => {
    eventHandler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    errorHandler.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!enabled || !roomId) {
      setConnectionState("idle");
      return;
    }

    const supabase = client ?? createClient();
    const selectedTables = tableKey.split(",").filter(Boolean) as RealtimeTable[];
    const gate = new RoomRealtimeEventGate();
    let channel: RealtimeChannel | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let attempts = 0;

    const reportError = (message: string) => {
      errorHandler.current?.(new Error(message));
    };

    const removeCurrentChannel = () => {
      if (!channel) return;
      const staleChannel = channel;
      channel = null;
      void supabase.removeChannel(staleChannel);
    };

    const scheduleReconnect = () => {
      if (cancelled || retryTimer) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setConnectionState("offline");
        return;
      }

      setConnectionState("reconnecting");
      attempts += 1;
      setReconnectAttempt(attempts);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        subscribe();
      }, reconnectDelayMs(attempts - 1));
    };

    const subscribe = () => {
      if (cancelled) return;
      removeCurrentChannel();
      setConnectionState(attempts === 0 ? "connecting" : "reconnecting");

      let nextChannel = supabase.channel(roomRealtimeChannelName(roomId), {
        config: { private: false },
      });
      for (const table of selectedTables) {
        nextChannel = nextChannel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `room_id=eq.${roomId}`,
          },
          (rawPayload) => {
            const event = normalizeRoomRealtimeEvent(
              rawPayload as RawPostgresChangePayload,
              roomId,
            );
            if (!event || !gate.accept(event)) return;
            setLastServerTimestamp(event.serverTimestamp);
            eventHandler.current?.(event);
          },
        );
      }

      channel = nextChannel;
      nextChannel.subscribe((status) => {
        // Ignore CLOSED emitted by a channel we deliberately replaced.
        if (cancelled || channel !== nextChannel) return;
        if (status === "SUBSCRIBED") {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = null;
          attempts = 0;
          setReconnectAttempt(0);
          setConnectionState("connected");
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          reportError(`Realtime channel ${status.toLowerCase()}.`);
          scheduleReconnect();
        }
      });
    };

    const handleOffline = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      setConnectionState("offline");
    };
    const handleOnline = () => {
      if (cancelled) return;
      scheduleReconnect();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (navigator.onLine) subscribe();
    else setConnectionState("offline");

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      removeCurrentChannel();
      gate.clear();
    };
  }, [client, enabled, roomId, tableKey]);

  return { connectionState, reconnectAttempt, lastServerTimestamp };
}
