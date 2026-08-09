import test from "node:test";
import assert from "node:assert/strict";
import {
  ROOM_OUTBOX_KEY,
  enqueueRoomOperation,
  flushRoomOutbox,
  isRemoteRoomId,
  normalizeMembershipRows,
  readStoredList
} from "../src/sync/room-sync.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
}

function fakeClient(initialRows = []) {
  const rows = [...initialRows];
  const rpcCalls = [];
  return {
    rpcCalls,
    from(table) {
      assert.equal(table, "room_members");
      const chain = {
        select() { return chain; },
        eq() { return chain; },
        is() { return chain; },
        order() { return Promise.resolve({ data: rows, error: null }); }
      };
      return chain;
    },
    async rpc(name, payload) {
      rpcCalls.push({ name, payload });
      if (name === "create_study_room") {
        rows.unshift({
          role: "owner",
          joined_at: new Date().toISOString(),
          study_rooms: {
            id: "7bbac4df-568c-4fb7-9f7e-bdfa9f5e261c",
            name: payload.room_name,
            invite_code: "AULA-REMOTE",
            created_at: new Date().toISOString()
          }
        });
        return { data: [rows[0].study_rooms], error: null };
      }
      return { data: null, error: null };
    }
  };
}

test("normalizza e deduplica le stanze restituite da Supabase", () => {
  const room = {
    id: "7bbac4df-568c-4fb7-9f7e-bdfa9f5e261c",
    name: "Biologia",
    invite_code: "BIOLOGIA24",
    created_at: "2026-08-09T10:00:00Z"
  };
  const result = normalizeMembershipRows([
    { role: "owner", study_rooms: room },
    { role: "owner", study_rooms: [room] }
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Biologia");
  assert.equal(result[0].syncState, "synced");
  assert.equal(isRemoteRoomId(result[0].id), true);
});

test("mantiene una creazione offline e la invia una sola volta alla riconnessione", async () => {
  const storage = memoryStorage();
  enqueueRoomOperation(storage, "create", { name: "Fisica" });
  enqueueRoomOperation(storage, "create", { name: " fisica " });
  assert.equal(readStoredList(storage, ROOM_OUTBOX_KEY).length, 1);
  const client = fakeClient();
  const result = await flushRoomOutbox({ client, userId: "user-1", storage });
  assert.equal(result.processed, 1);
  assert.equal(result.pending, 0);
  assert.equal(result.rooms.length, 1);
  assert.equal(client.rpcCalls.filter((call) => call.name === "create_study_room").length, 1);
  assert.equal(readStoredList(storage, ROOM_OUTBOX_KEY).length, 0);
});
