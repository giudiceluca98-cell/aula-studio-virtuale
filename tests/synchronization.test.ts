import { describe, expect, it } from "vitest";

import {
  RealtimeEventDeduplicator,
  RoomRealtimeEventGate,
  normalizeRoomRealtimeEvent,
  reconnectDelayMs,
} from "@/hooks/use-room-realtime";
import {
  hasOtherPresenceSession,
  reconcileServerPresence,
  serverPresenceRecordFromRow,
} from "@/hooks/use-room-presence";
import {
  SessionAutosaveBuffer,
  createUserLeftRoomPayload,
  sendSessionBeacon,
} from "@/hooks/use-autosave-session";
import { generateSessionSummary } from "@/lib/session-summary";
import type {
  RawPostgresChangePayload,
  SessionAutosaveDraft,
} from "@/lib/types";

const ROOM_ID = "00000000-0000-4000-8000-000000000001";
const USER_ID = "00000000-0000-4000-8000-000000000002";

function progressPayload(
  timestamp: string,
  percentage: number,
): RawPostgresChangePayload {
  return {
    table: "progress_entries",
    eventType: "UPDATE",
    commit_timestamp: timestamp,
    new: {
      id: "progress-1",
      room_id: ROOM_ID,
      user_id: USER_ID,
      progress_percentage: percentage,
    },
    old: {
      id: "progress-1",
      room_id: ROOM_ID,
      user_id: USER_ID,
      progress_percentage: percentage - 5,
    },
  };
}

describe("room realtime synchronization", () => {
  it("normalizes only events for the requested room with a server timestamp", () => {
    const event = normalizeRoomRealtimeEvent(
      progressPayload("2026-07-17T14:30:00.123Z", 20),
      ROOM_ID,
    );

    expect(event).toMatchObject({
      roomId: ROOM_ID,
      table: "progress_entries",
      type: "UPDATE",
      serverTimestamp: "2026-07-17T14:30:00.123Z",
    });
    expect(
      normalizeRoomRealtimeEvent(
        { ...progressPayload("2026-07-17T14:30:00Z", 20), commit_timestamp: undefined },
        ROOM_ID,
      ),
    ).toBeNull();
    expect(
      normalizeRoomRealtimeEvent(
        {
          ...progressPayload("2026-07-17T14:30:00Z", 20),
          new: { id: "progress-1", room_id: "another-room" },
        },
        ROOM_ID,
      ),
    ).toBeNull();
  });

  it("drops reconnect replays and older conflicting updates", () => {
    const gate = new RoomRealtimeEventGate();
    const current = normalizeRoomRealtimeEvent(
      progressPayload("2026-07-17T14:31:00Z", 30),
      ROOM_ID,
    )!;
    const stale = normalizeRoomRealtimeEvent(
      progressPayload("2026-07-17T14:30:00Z", 20),
      ROOM_ID,
    )!;
    const newest = normalizeRoomRealtimeEvent(
      progressPayload("2026-07-17T14:32:00Z", 40),
      ROOM_ID,
    )!;

    expect(gate.accept(current)).toBe(true);
    expect(gate.accept(current)).toBe(false);
    expect(gate.accept(stale)).toBe(false);
    expect(gate.accept(newest)).toBe(true);
  });

  it("orders composite-key rows independently", () => {
    const gate = new RoomRealtimeEventGate();
    const readEvent = (messageId: string, timestamp: string) =>
      normalizeRoomRealtimeEvent(
        {
          table: "message_reads",
          eventType: "INSERT",
          commit_timestamp: timestamp,
          new: { room_id: ROOM_ID, user_id: USER_ID, message_id: messageId },
        },
        ROOM_ID,
      )!;

    expect(gate.accept(readEvent("message-newer", "2026-07-17T14:40:00Z"))).toBe(true);
    expect(gate.accept(readEvent("message-older", "2026-07-17T14:30:00Z"))).toBe(true);
  });

  it("expires deduplication keys and bounds reconnect backoff", () => {
    let now = 1_000;
    const deduplicator = new RealtimeEventDeduplicator(500, 10, () => now);
    expect(deduplicator.accept("event-1")).toBe(true);
    expect(deduplicator.accept("event-1")).toBe(false);
    now += 501;
    expect(deduplicator.accept("event-1")).toBe(true);

    expect(reconnectDelayMs(0, () => 0.5)).toBe(1_000);
    expect(reconnectDelayMs(20, () => 0.5)).toBe(30_000);
  });
});

describe("presence reconciliation", () => {
  it("keeps a participant online during the grace window, then marks offline", () => {
    const base = Date.parse("2026-07-17T14:30:01Z");
    const first = reconcileServerPresence(
      [
        {
          userId: USER_ID,
          status: "studying",
          currentActivity: "Capitolo 1",
          deviceLabel: "Desktop",
          lastSeenAt: "2026-07-17T14:30:01Z",
        },
      ],
      [],
      base,
      20_000,
      5_000,
      { [USER_ID]: 2 },
    );
    expect(first[0]).toMatchObject({
      userId: USER_ID,
      isOnline: true,
      status: "studying",
      deviceCount: 2,
      lastSeenAt: "2026-07-17T14:30:01.000Z",
    });
    expect(serverPresenceRecordFromRow({ user_id: USER_ID, status: "online" })).toBeNull();
    expect(
      serverPresenceRecordFromRow({
        user_id: USER_ID,
        status: "online",
        last_seen_at: "2026-07-17T14:30:01Z",
        device_label: "Computer",
      })?.deviceLabel,
    ).toBe("Desktop");

    const temporarilyMissing = reconcileServerPresence(
      [],
      first,
      base + 1_000,
      20_000,
      5_000,
    );
    expect(temporarilyMissing[0]).toMatchObject({
      isOnline: true,
      status: "studying",
      offlineAfter: base + 6_000,
    });

    const offline = reconcileServerPresence(
      [],
      temporarilyMissing,
      base + 6_001,
      20_000,
      5_000,
    );
    expect(offline[0]).toMatchObject({
      isOnline: false,
      status: "offline",
      currentActivity: null,
    });
    expect(
      reconcileServerPresence([], offline, base + 8_000, 20_000, 5_000)[0],
    ).toMatchObject({
      isOnline: false,
      status: "offline",
      offlineAfter: null,
    });
  });

  it("does not mark the aggregate presence offline while another tab is active", () => {
    expect(
      hasOtherPresenceSession(
        {
          [USER_ID]: [
            { userId: USER_ID, sessionId: "tab-a" },
            { userId: USER_ID, sessionId: "tab-b" },
          ],
        },
        USER_ID,
        "tab-a",
      ),
    ).toBe(true);
  });
});

describe("session autosave and summary", () => {
  const initialDraft: SessionAutosaveDraft = {
    sessionId: "00000000-0000-4000-8000-000000000003",
    roomId: ROOM_ID,
    startedAt: "2026-07-17T14:00:00Z",
    lessonsCompleted: [],
    exercisesCompleted: 0,
    lastMaterialId: null,
    notesAdded: 0,
    timerStatus: "running",
    clientElapsedSeconds: 0,
  };

  it("does not lose a newer revision when an older save completes", () => {
    const buffer = new SessionAutosaveBuffer(initialDraft);
    expect(buffer.envelope("periodic")).toBeNull();
    expect(buffer.envelope("pagehide", undefined, true)?.revision).toBe(1);

    buffer.update({ exercisesCompleted: 2, clientElapsedSeconds: 600 });
    const firstSave = buffer.envelope(
      "periodic",
      () => new Date("2026-07-17T14:10:00Z"),
    )!;
    buffer.update({ exercisesCompleted: 3 });
    buffer.markSaved(firstSave.revision);

    expect(buffer.isDirty()).toBe(true);
    expect(buffer.envelope("online")?.revision).toBe(2);
    expect(buffer.envelope("pagehide", undefined, true)?.revision).toBe(3);
  });

  it("creates a compact leave payload without trusting a frontend user id", () => {
    const buffer = new SessionAutosaveBuffer(initialDraft);
    buffer.update({
      lessonsCompleted: ["Why Program?"],
      exercisesCompleted: 3,
      lastResourceOpened: "Why Program?",
      notesAdded: 2,
      clientElapsedSeconds: 2_701.4,
      timerStatus: "paused",
    });
    const payload = createUserLeftRoomPayload(buffer.envelope("pagehide")!);

    expect(payload).toMatchObject({
      event: "user_left_room",
      roomId: ROOM_ID,
      data: {
        durationSeconds: 2701,
        lessonsCompleted: ["Why Program?"],
        exercisesCompleted: 3,
        lastResourceOpened: "Why Program?",
        notesAdded: 2,
        finalTimerStatus: "paused",
        hasOtherActiveConnection: false,
      },
    });
    expect(payload).not.toHaveProperty("userId");

    buffer.update({ hasOtherActiveConnection: true });
    expect(
      createUserLeftRoomPayload(buffer.envelope("pagehide")!).data
        .hasOtherActiveConnection,
    ).toBe(true);

    let destination = "";
    const queued = sendSessionBeacon("/api/session/leave", buffer.envelope(
      "pagehide",
      undefined,
      true,
    )!, (url, body) => {
      destination = url;
      expect(body).toBeTruthy();
      return true;
    });
    expect(queued).toBe(true);
    expect(destination).toBe("/api/session/leave");
  });

  it("generates a friendly copyable summary", () => {
    const text = generateSessionSummary(
      {
        roomName: "Python insieme",
        generatedAt: "2026-07-17T14:30:00Z",
        participants: [
          {
            displayName: "Marta",
            course: "Python for Everybody",
            chapter: "Capitolo 1",
            lesson: "Why Program?",
            currentFocus: "Esercizi sulle funzioni",
            progressPercentage: 20,
            studyMinutes: 45,
            exercisesCompleted: 3,
            completedItems: ["Esercizio 1"],
            pendingItems: ["Quiz del capitolo"],
            lastMaterialOpened: "Why Program?",
            difficulties: ["Cicli annidati"],
            nextGoals: ["Completare il quiz"],
          },
        ],
        sharedNotes: ["Ripassare le funzioni"],
      },
      "Tatiana",
    );

    expect(text).toContain("Riepilogo per Tatiana");
    expect(text).toContain("Tempo studiato: 45 min");
    expect(text).toContain("Esercizi completati: 3");
    expect(text).toContain("Completati automaticamente: Esercizio 1");
    expect(text).toContain("Da completare o riprendere: Quiz del capitolo");
    expect(text).toContain("Ultimo materiale aperto: Why Program?");
    expect(text).toContain("Cicli annidati");
    expect(text).toContain("Completare il quiz");
  });
});
