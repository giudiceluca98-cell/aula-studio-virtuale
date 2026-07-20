"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "../lib/supabase/client";
import type {
  PresenceMeta,
  PresenceStatus,
  RealtimeConnectionState,
  RoomPresenceParticipant,
} from "../lib/types";
import { reconnectDelayMs } from "./use-room-realtime";

export const DEFAULT_PRESENCE_HEARTBEAT_MS = 20_000;
export const DEFAULT_OFFLINE_GRACE_MS = 15_000;

export type PresenceSnapshot = Record<
  string,
  ReadonlyArray<Partial<PresenceMeta> & { presence_ref?: string }>
>;

const TRACKABLE_STATUSES = new Set<PresenceStatus>([
  "online",
  "studying",
  "break",
  "away",
  "in_call",
]);
const ALL_PRESENCE_STATUSES = new Set<PresenceStatus>([
  ...TRACKABLE_STATUSES,
  "offline",
]);

function isServerTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPresenceStatus(value: unknown): value is PresenceStatus {
  return (
    typeof value === "string" &&
    ALL_PRESENCE_STATUSES.has(value as PresenceStatus)
  );
}

function isDeviceLabel(value: unknown): value is PresenceMeta["deviceLabel"] {
  return (
    value === "Desktop" ||
    value === "Tablet" ||
    value === "Mobile" ||
    value === "Unknown"
  );
}

function normalizeDeviceLabel(value: unknown): PresenceMeta["deviceLabel"] {
  if (isDeviceLabel(value)) return value;
  if (typeof value !== "string") return "Unknown";
  if (/tablet|ipad/i.test(value)) return "Tablet";
  if (/mobile|telefono|phone/i.test(value)) return "Mobile";
  if (/desktop|computer|pc/i.test(value)) return "Desktop";
  return "Unknown";
}

export function detectDeviceLabel(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): PresenceMeta["deviceLabel"] {
  if (!userAgent) return "Unknown";
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

export interface ServerPresenceRecord {
  userId: string;
  status: PresenceStatus;
  currentActivity: string | null;
  deviceLabel: PresenceMeta["deviceLabel"];
  lastSeenAt: string;
}

export function serverPresenceRecordFromRow(
  row: Record<string, unknown> | null | undefined,
): ServerPresenceRecord | null {
  if (
    !row ||
    typeof row.user_id !== "string" ||
    !isPresenceStatus(row.status) ||
    !isServerTimestamp(row.last_seen_at)
  ) {
    return null;
  }
  return {
    userId: row.user_id,
    status: row.status,
    currentActivity:
      typeof row.current_activity === "string" ? row.current_activity : null,
    deviceLabel: normalizeDeviceLabel(row.device_label),
    lastSeenAt: new Date(row.last_seen_at).toISOString(),
  };
}

/**
 * Reconciles only auth-bound PostgreSQL presence rows. Realtime Presence metadata
 * is deliberately not used for identity/status because another room member can
 * author arbitrary track() payloads. Missing/offline rows get a short UI grace.
 */
export function reconcileServerPresence(
  records: readonly ServerPresenceRecord[],
  previous: readonly RoomPresenceParticipant[],
  nowMs: number,
  heartbeatMs = DEFAULT_PRESENCE_HEARTBEAT_MS,
  graceMs = DEFAULT_OFFLINE_GRACE_MS,
  deviceCounts: Readonly<Record<string, number>> = {},
): RoomPresenceParticipant[] {
  const previousByUser = new Map(previous.map((item) => [item.userId, item]));
  const next = new Map<string, RoomPresenceParticipant>();

  for (const record of records) {
    if (
      !record.userId ||
      !isPresenceStatus(record.status) ||
      !isServerTimestamp(record.lastSeenAt)
    ) {
      continue;
    }
    const lastSeenMs = Date.parse(record.lastSeenAt);
    const isFresh = nowMs < lastSeenMs + heartbeatMs * 2 + graceMs;
    const serverSaysOnline = record.status !== "offline" && isFresh;
    const prior = previousByUser.get(record.userId);
    const explicitOfflineGrace =
      record.status === "offline" && prior?.isOnline
        ? (prior.offlineAfter ?? nowMs + graceMs)
        : null;
    const isOnline =
      serverSaysOnline ||
      (explicitOfflineGrace !== null && nowMs < explicitOfflineGrace);

    next.set(record.userId, {
      userId: record.userId,
      status: isOnline
        ? serverSaysOnline
          ? record.status
          : (prior?.status ?? "online")
        : "offline",
      currentActivity: isOnline
        ? serverSaysOnline
          ? record.currentActivity
          : (prior?.currentActivity ?? null)
        : null,
      deviceLabel: normalizeDeviceLabel(record.deviceLabel),
      lastSeenAt: new Date(lastSeenMs).toISOString(),
      isOnline,
      deviceCount: isOnline
        ? Math.max(1, deviceCounts[record.userId] ?? 1)
        : 0,
      offlineAfter:
        isOnline && !serverSaysOnline ? explicitOfflineGrace : null,
    });
  }

  for (const prior of previous) {
    if (next.has(prior.userId)) continue;
    if (!prior.isOnline || prior.status === "offline") {
      next.set(prior.userId, {
        ...prior,
        status: "offline",
        currentActivity: null,
        isOnline: false,
        deviceCount: 0,
        offlineAfter: null,
      });
      continue;
    }
    const offlineAfter = prior.offlineAfter ?? nowMs + graceMs;
    const withinGrace = nowMs < offlineAfter;
    next.set(prior.userId, {
      ...prior,
      status: withinGrace ? prior.status : "offline",
      currentActivity: withinGrace ? prior.currentActivity : null,
      isOnline: withinGrace,
      deviceCount: 0,
      offlineAfter: withinGrace ? offlineAfter : null,
    });
  }

  return [...next.values()].sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.userId.localeCompare(b.userId);
  });
}

export function roomPresenceChannelName(roomId: string): string {
  return `room:${roomId}:presence`;
}

export function hasOtherPresenceSession(
  state: PresenceSnapshot,
  userId: string,
  currentSessionId: string,
): boolean {
  return Object.values(state)
    .flat()
    .some(
      (meta) =>
        meta.userId === userId &&
        typeof meta.sessionId === "string" &&
        meta.sessionId !== currentSessionId,
    );
}

export interface PresencePersistenceUpdate {
  roomId: string;
  status: Exclude<PresenceStatus, "offline">;
  currentActivity: string | null;
  deviceLabel: PresenceMeta["deviceLabel"];
}

export interface PresencePersistenceResult {
  /** Server-generated last_seen_at returned by touch_presence(). */
  serverTimestamp: string;
}

export interface UseRoomPresenceOptions {
  roomId: string | null | undefined;
  userId: string | null | undefined;
  initialStatus?: Exclude<PresenceStatus, "offline">;
  initialActivity?: string | null;
  sharingEnabled?: boolean;
  enabled?: boolean;
  heartbeatMs?: number;
  offlineGraceMs?: number;
  deviceLabel?: PresenceMeta["deviceLabel"];
  client?: SupabaseClient;
  persistPresence?: (
    update: PresencePersistenceUpdate,
  ) => Promise<PresencePersistenceResult>;
  persistLeft?: (roomId: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export interface UseRoomPresenceResult {
  participants: RoomPresenceParticipant[];
  connectionState: RealtimeConnectionState;
  isSharingPresence: boolean;
  selfStatus: Exclude<PresenceStatus, "offline">;
  setPresence: (
    status: Exclude<PresenceStatus, "offline">,
    currentActivity?: string | null,
  ) => Promise<void>;
}

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `presence-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useRoomPresence({
  roomId,
  userId,
  initialStatus = "online",
  initialActivity = null,
  sharingEnabled,
  enabled = true,
  heartbeatMs = DEFAULT_PRESENCE_HEARTBEAT_MS,
  offlineGraceMs = DEFAULT_OFFLINE_GRACE_MS,
  deviceLabel = detectDeviceLabel(),
  client,
  persistPresence,
  persistLeft,
  onError,
}: UseRoomPresenceOptions): UseRoomPresenceResult {
  const [participants, setParticipants] = useState<RoomPresenceParticipant[]>([]);
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [selfStatus, setSelfStatus] =
    useState<Exclude<PresenceStatus, "offline">>(initialStatus);
  const [isSharingPresence, setIsSharingPresence] = useState(
    sharingEnabled ?? false,
  );
  const activity = useRef(initialActivity);
  const status = useRef(initialStatus);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionId = useRef(makeSessionId());
  const snapshot = useRef<PresenceSnapshot>({});
  const errorHandler = useRef(onError);
  // Privacy is fail-closed until an explicit prop or the stored preference says yes.
  const sharingAllowed = useRef(sharingEnabled ?? false);

  useEffect(() => {
    errorHandler.current = onError;
  }, [onError]);

  const setPresence = useCallback(
    async (
      nextStatus: Exclude<PresenceStatus, "offline">,
      currentActivity = activity.current,
    ) => {
      status.current = nextStatus;
      activity.current = currentActivity;
      setSelfStatus(nextStatus);

      if (!roomId || !userId || !sharingAllowed.current) return;
      try {
        let serverTimestamp: string;
        if (persistPresence) {
          const persisted = await persistPresence({
            roomId,
            status: nextStatus,
            currentActivity,
            deviceLabel,
          });
          serverTimestamp = persisted.serverTimestamp;
        } else {
          const supabase = client ?? createClient();
          const { data, error } = await supabase.rpc("touch_presence", {
            p_room_id: roomId,
            p_status: nextStatus,
            p_current_activity: currentActivity,
            p_device_label: deviceLabel,
          });
          if (error) throw error;
          const persisted = (Array.isArray(data) ? data[0] : data) as
            | { last_seen_at?: unknown }
            | null;
          if (!isServerTimestamp(persisted?.last_seen_at)) {
            throw new Error("Presence heartbeat returned no server timestamp.");
          }
          serverTimestamp = persisted.last_seen_at;
        }
        if (!isServerTimestamp(serverTimestamp)) {
          throw new Error("Presence heartbeat returned an invalid server timestamp.");
        }
        const meta: PresenceMeta = {
          userId,
          sessionId: sessionId.current,
          status: nextStatus,
          currentActivity,
          deviceLabel,
          lastHeartbeatAt: new Date(serverTimestamp).toISOString(),
        };
        await channelRef.current?.track(meta);
      } catch (error) {
        errorHandler.current?.(
          error instanceof Error ? error : new Error("Presence heartbeat failed."),
        );
      }
    },
    [client, deviceLabel, persistPresence, roomId, userId],
  );

  useEffect(() => {
    if (!enabled || !roomId || !userId) {
      setConnectionState("idle");
      return;
    }

    const supabase = client ?? createClient();
    sharingAllowed.current = sharingEnabled ?? false;
    setIsSharingPresence(sharingAllowed.current);
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let graceTimer: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const effectSessionId = sessionId.current;
    const serverPresence = new Map<string, ServerPresenceRecord>();

    const updateParticipants = () => {
      const ownSessionCount = Object.values(snapshot.current)
        .flat()
        .filter(
          (meta) =>
            meta.userId === userId &&
            typeof meta.sessionId === "string" &&
            isServerTimestamp(meta.lastHeartbeatAt),
        ).length;
      setParticipants((previous) =>
        reconcileServerPresence(
          [...serverPresence.values()],
          previous,
          Date.now(),
          heartbeatMs,
          offlineGraceMs,
          ownSessionCount > 0 ? { [userId]: ownSessionCount } : {},
        ),
      );
    };

    const refreshServerPresence = async () => {
      const { data, error } = await supabase
        .from("presence")
        .select(
          "user_id,status,current_activity,last_seen_at,device_label",
        )
        .eq("room_id", roomId);
      if (cancelled) return;
      if (error) {
        errorHandler.current?.(
          new Error("Could not refresh server-authoritative presence."),
        );
        return;
      }
      serverPresence.clear();
      for (const row of data ?? []) {
        const record = serverPresenceRecordFromRow(
          row as Record<string, unknown>,
        );
        if (record) serverPresence.set(record.userId, record);
      }
      updateParticipants();
    };

    const removeChannel = () => {
      if (!channelRef.current) return;
      const stale = channelRef.current;
      channelRef.current = null;
      void supabase.removeChannel(stale);
    };

    const scheduleReconnect = () => {
      if (cancelled || retryTimer) return;
      if (!navigator.onLine) {
        setConnectionState("offline");
        return;
      }
      setConnectionState("reconnecting");
      retryTimer = setTimeout(() => {
        retryTimer = null;
        attempts += 1;
        subscribe();
      }, reconnectDelayMs(attempts));
    };

    const subscribe = () => {
      if (cancelled) return;
      removeChannel();
      const nextChannel = supabase.channel(roomPresenceChannelName(roomId), {
        config: { private: false, presence: { key: userId } },
      });
      const syncSnapshot = () => {
        snapshot.current = nextChannel.presenceState() as PresenceSnapshot;
        updateParticipants();
      };
      nextChannel
        .on("presence", { event: "sync" }, syncSnapshot)
        .on("presence", { event: "join" }, syncSnapshot)
        .on("presence", { event: "leave" }, syncSnapshot)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "presence",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const raw = payload as {
              eventType?: string;
              new?: Record<string, unknown>;
              old?: Record<string, unknown>;
            };
            const row = raw.eventType === "DELETE" ? raw.old : raw.new;
            const record = serverPresenceRecordFromRow(row);
            const deletedUserId =
              raw.eventType === "DELETE" && typeof row?.user_id === "string"
                ? row.user_id
                : null;
            if (deletedUserId) serverPresence.delete(deletedUserId);
            else if (record) serverPresence.set(record.userId, record);
            updateParticipants();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_room_preferences",
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            if (row.user_id !== userId || typeof row.share_presence !== "boolean") {
              return;
            }
            sharingAllowed.current = row.share_presence;
            setIsSharingPresence(row.share_presence);
            if (row.share_presence) {
              void setPresence(status.current, activity.current);
              return;
            }
            void nextChannel.untrack();
            if (persistLeft) {
              void persistLeft(roomId).catch((cause) =>
                errorHandler.current?.(
                  cause instanceof Error
                    ? cause
                    : new Error("Could not disable shared presence."),
                ),
              );
            } else {
              void supabase
                .rpc("mark_presence_left", { p_room_id: roomId })
                .then(({ error }) => {
                  if (error) errorHandler.current?.(error);
                });
            }
          },
        );

      channelRef.current = nextChannel;
      nextChannel.subscribe((channelStatus) => {
        // removeChannel() can emit CLOSED after a replacement has subscribed.
        if (cancelled || channelRef.current !== nextChannel) return;
        if (channelStatus === "SUBSCRIBED") {
          if (retryTimer) clearTimeout(retryTimer);
          retryTimer = null;
          attempts = 0;
          setConnectionState("connected");
          void refreshServerPresence().then(() => {
            if (!cancelled && channelRef.current === nextChannel) {
              return setPresence(status.current, activity.current);
            }
          });
          return;
        }
        if (
          channelStatus === "CHANNEL_ERROR" ||
          channelStatus === "TIMED_OUT" ||
          channelStatus === "CLOSED"
        ) {
          snapshot.current = {};
          updateParticipants();
          errorHandler.current?.(
            new Error(`Presence channel ${channelStatus.toLowerCase()}.`),
          );
          scheduleReconnect();
        }
      });
    };

    let authorizedToSubscribe = false;
    let authorizationInFlight = false;

    const authorizeAndSubscribe = async () => {
      if (cancelled || authorizationInFlight) return;
      authorizationInFlight = true;
      setConnectionState("connecting");
      try {
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || data.user?.id !== userId) {
          setConnectionState("error");
          errorHandler.current?.(
            new Error("Presence identity does not match the authenticated session."),
          );
          return;
        }
        let allowed = sharingEnabled;
        if (allowed === undefined) {
          const { data: preference, error: preferenceError } = await supabase
            .from("user_room_preferences")
            .select("share_presence")
            .eq("room_id", roomId)
            .eq("user_id", userId)
            .maybeSingle();
          if (cancelled) return;
          if (preferenceError || !preference) {
            sharingAllowed.current = false;
            setConnectionState("error");
            errorHandler.current?.(
              new Error("Could not verify the presence sharing preference."),
            );
            return;
          }
          allowed = preference.share_presence === true;
        }
        sharingAllowed.current = allowed;
        setIsSharingPresence(allowed);
        if (!allowed) {
          if (persistLeft) {
            await persistLeft(roomId).catch((cause) =>
              errorHandler.current?.(
                cause instanceof Error
                  ? cause
                  : new Error("Could not disable shared presence."),
              ),
            );
          } else {
            const { error: leaveError } = await supabase.rpc(
              "mark_presence_left",
              { p_room_id: roomId },
            );
            if (leaveError) errorHandler.current?.(leaveError);
          }
          authorizedToSubscribe = true;
          if (navigator.onLine) subscribe();
          else setConnectionState("offline");
          return;
        }
        authorizedToSubscribe = true;
        if (navigator.onLine) subscribe();
        else setConnectionState("offline");
      } finally {
        authorizationInFlight = false;
      }
    };

    const handleOffline = () => {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      snapshot.current = {};
      updateParticipants();
      setConnectionState("offline");
    };
    const handleOnline = () => {
      if (authorizedToSubscribe) scheduleReconnect();
      else void authorizeAndSubscribe();
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!navigator.onLine) {
      setConnectionState("offline");
    } else {
      void authorizeAndSubscribe();
    }
    heartbeatTimer = setInterval(() => {
      if (navigator.onLine) {
        void setPresence(status.current, activity.current);
      }
    }, heartbeatMs);
    graceTimer = setInterval(
      updateParticipants,
      Math.max(250, Math.min(1_000, offlineGraceMs)),
    );

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (graceTimer) clearInterval(graceTimer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      const anotherSessionIsActive = hasOtherPresenceSession(
        snapshot.current,
        userId,
        effectSessionId,
      );
      const activeChannel = channelRef.current;
      if (activeChannel) void activeChannel.untrack();
      removeChannel();
      if (anotherSessionIsActive) return;
      if (persistLeft) {
        void persistLeft(roomId).catch((error) =>
          errorHandler.current?.(
            error instanceof Error ? error : new Error("Could not mark presence left."),
          ),
        );
      } else {
        void supabase
          .rpc("mark_presence_left", { p_room_id: roomId })
          .then(({ error }) => {
            if (error) errorHandler.current?.(error);
          });
      }
    };
  }, [
    client,
    enabled,
    heartbeatMs,
    offlineGraceMs,
    persistLeft,
    roomId,
    setPresence,
    sharingEnabled,
    userId,
  ]);

  return {
    participants,
    connectionState,
    isSharingPresence,
    selfStatus,
    setPresence,
  };
}
