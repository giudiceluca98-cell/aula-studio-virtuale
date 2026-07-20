"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AutosaveReason,
  SessionAutosaveDraft,
  SessionSaveEnvelope,
} from "../lib/types";

export const DEFAULT_AUTOSAVE_INTERVAL_MS = 15_000;

function cloneDraft(draft: SessionAutosaveDraft): SessionAutosaveDraft {
  return { ...draft, lessonsCompleted: [...draft.lessonsCompleted] };
}

/** Framework-free state container used by both the React hook and unit tests. */
export class SessionAutosaveBuffer {
  private draft: SessionAutosaveDraft;
  private revision = 0;
  private savedRevision = 0;

  constructor(initialDraft: SessionAutosaveDraft) {
    this.draft = cloneDraft(initialDraft);
  }

  update(
    patch:
      | Partial<SessionAutosaveDraft>
      | ((current: SessionAutosaveDraft) => Partial<SessionAutosaveDraft>),
  ): SessionAutosaveDraft {
    const change = typeof patch === "function" ? patch(cloneDraft(this.draft)) : patch;
    this.draft = cloneDraft({ ...this.draft, ...change });
    this.revision += 1;
    return this.value();
  }

  value(): SessionAutosaveDraft {
    return cloneDraft(this.draft);
  }

  isDirty(): boolean {
    return this.revision > this.savedRevision;
  }

  envelope(
    reason: AutosaveReason,
    now: () => Date = () => new Date(),
    force = false,
  ): SessionSaveEnvelope | null {
    if (!force && !this.isDirty()) return null;
    return {
      draft: this.value(),
      // A final beacon must outrank a simultaneous visibility/periodic save.
      revision: force ? Math.max(1, this.revision + 1) : this.revision,
      reason,
      clientSentAt: now().toISOString(),
    };
  }

  markSaved(revision: number): void {
    this.savedRevision = Math.max(this.savedRevision, revision);
  }
}

export interface UserLeftRoomBeaconPayload {
  event: "user_left_room";
  roomId: string;
  sessionId: string;
  revision: number;
  clientSentAt: string;
  data: {
    durationSeconds: number;
    lessonsCompleted: string[];
    exercisesCompleted: number;
    lastMaterialId: string | null;
    lastResourceOpened: string | null;
    notesAdded: number;
    finalTimerStatus: SessionAutosaveDraft["timerStatus"];
    hasOtherActiveConnection: boolean;
  };
}

export function createUserLeftRoomPayload(
  envelope: SessionSaveEnvelope,
): UserLeftRoomBeaconPayload {
  const { draft } = envelope;
  return {
    event: "user_left_room",
    roomId: draft.roomId,
    sessionId: draft.sessionId,
    revision: envelope.revision,
    clientSentAt: envelope.clientSentAt,
    data: {
      durationSeconds: Number.isFinite(draft.clientElapsedSeconds)
        ? Math.max(0, Math.round(draft.clientElapsedSeconds))
        : 0,
      lessonsCompleted: [...draft.lessonsCompleted],
      exercisesCompleted: Number.isFinite(draft.exercisesCompleted)
        ? Math.max(0, Math.round(draft.exercisesCompleted))
        : 0,
      lastMaterialId: draft.lastMaterialId,
      lastResourceOpened:
        draft.lastResourceOpened?.trim().slice(0, 4_096) || null,
      notesAdded: Number.isFinite(draft.notesAdded)
        ? Math.max(0, Math.round(draft.notesAdded))
        : 0,
      finalTimerStatus: draft.timerStatus,
      hasOtherActiveConnection: draft.hasOtherActiveConnection === true,
    },
  };
}

export function sendSessionBeacon(
  endpoint: string,
  envelope: SessionSaveEnvelope,
  sender: (url: string, data?: BodyInit | null) => boolean = (url, data) =>
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon(url, data),
): boolean {
  const body = JSON.stringify(createUserLeftRoomPayload(envelope));
  const data =
    typeof Blob === "undefined"
      ? body
      : new Blob([body], { type: "application/json" });
  return sender(endpoint, data);
}

export async function postSessionAutosave(
  envelope: SessionSaveEnvelope,
  endpoint = "/api/session/autosave",
  request: typeof fetch = fetch,
): Promise<void> {
  const response = await request(endpoint, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(envelope),
    keepalive: true,
  });
  if (!response.ok) {
    throw new Error(`Session autosave failed with status ${response.status}.`);
  }
}

export interface UseAutosaveSessionOptions {
  initialDraft: SessionAutosaveDraft;
  save?: (envelope: SessionSaveEnvelope) => Promise<void>;
  enabled?: boolean;
  intervalMs?: number;
  autosaveEndpoint?: string;
  beaconEndpoint?: string | null;
  beaconSender?: (url: string, data?: BodyInit | null) => boolean;
}

export interface UseAutosaveSessionResult {
  draft: SessionAutosaveDraft;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  error: Error | null;
  patchDraft: (
    patch:
      | Partial<SessionAutosaveDraft>
      | ((current: SessionAutosaveDraft) => Partial<SessionAutosaveDraft>),
  ) => void;
  flush: (reason?: AutosaveReason) => Promise<void>;
}

/**
 * Periodic + visibility + online autosave. pagehide additionally queues a small
 * same-origin beacon; no correctness path relies solely on beforeunload.
 */
export function useAutosaveSession({
  initialDraft,
  save,
  enabled = true,
  intervalMs = DEFAULT_AUTOSAVE_INTERVAL_MS,
  autosaveEndpoint = "/api/session/autosave",
  beaconEndpoint = "/api/session/leave",
  beaconSender,
}: UseAutosaveSessionOptions): UseAutosaveSessionResult {
  const buffer = useRef(new SessionAutosaveBuffer(initialDraft));
  const activeSessionId = useRef(initialDraft.sessionId);
  const [draft, setDraft] = useState(() => cloneDraft(initialDraft));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const saveRef = useRef<(envelope: SessionSaveEnvelope) => Promise<void>>(
    save ?? ((envelope) => postSessionAutosave(envelope, autosaveEndpoint)),
  );

  useEffect(() => {
    saveRef.current =
      save ?? ((envelope) => postSessionAutosave(envelope, autosaveEndpoint));
  }, [autosaveEndpoint, save]);

  useEffect(() => {
    if (activeSessionId.current === initialDraft.sessionId) return;
    activeSessionId.current = initialDraft.sessionId;
    buffer.current = new SessionAutosaveBuffer(initialDraft);
    setDraft(buffer.current.value());
    setIsDirty(false);
    setLastSavedAt(null);
    setError(null);
  }, [initialDraft]);

  const patchDraft = useCallback<UseAutosaveSessionResult["patchDraft"]>((patch) => {
    setDraft(buffer.current.update(patch));
    setIsDirty(true);
  }, []);

  const flush = useCallback(
    async (reason: AutosaveReason = "manual") => {
      if (!enabled) return;
      if (inFlight.current) {
        await inFlight.current;
        if (!buffer.current.isDirty()) return;
      }

      const envelope = buffer.current.envelope(reason);
      if (!envelope) return;
      const operation = (async () => {
        setIsSaving(true);
        setError(null);
        try {
          await saveRef.current(envelope);
          buffer.current.markSaved(envelope.revision);
          setIsDirty(buffer.current.isDirty());
          setLastSavedAt(new Date().toISOString());
        } catch (cause) {
          setError(
            cause instanceof Error ? cause : new Error("Session autosave failed."),
          );
          throw cause;
        } finally {
          setIsSaving(false);
        }
      })();
      inFlight.current = operation;
      try {
        await operation;
      } finally {
        if (inFlight.current === operation) inFlight.current = null;
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    const interval = window.setInterval(() => {
      void flush("periodic").catch(() => undefined);
    }, intervalMs);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flush("hidden").catch(() => undefined);
      }
    };
    const handleOnline = () => void flush("online").catch(() => undefined);
    const handlePageHide = (event: PageTransitionEvent) => {
      // A page kept in the back/forward cache is suspended, not actually left.
      if (event.persisted) return;
      if (!beaconEndpoint) return;
      const envelope = buffer.current.envelope("pagehide", undefined, true);
      if (envelope) sendSessionBeacon(beaconEndpoint, envelope, beaconSender);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [beaconEndpoint, beaconSender, enabled, flush, intervalMs]);

  return {
    draft,
    isDirty,
    isSaving,
    lastSavedAt,
    error,
    patchDraft,
    flush,
  };
}
