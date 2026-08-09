export const ROOM_CACHE_KEY = "aula-demo-dashboard-rooms-v1";
export const ROOM_OUTBOX_KEY = "aula-room-sync-outbox-v1";
export const ROOM_MIGRATIONS_KEY = "aula-room-sync-migrations-v1";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_DEMO_IDS = new Set(["python-room", "study-method-room", "math-room", "recovery-room"]);

export function isRemoteRoomId(value) {
  return UUID_PATTERN.test(String(value || ""));
}

function timestamp(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function embeddedRoom(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value && typeof value === "object" ? value : null;
}

export function normalizeMembershipRows(rows) {
  const rooms = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const room = embeddedRoom(row?.study_rooms);
    if (!room?.id || rooms.has(String(room.id))) continue;
    rooms.set(String(room.id), {
      id: String(room.id),
      name: String(room.name || "Aula senza nome").slice(0, 60),
      inviteCode: String(room.invite_code || "").toUpperCase().slice(0, 64),
      role: ["owner", "admin", "member"].includes(row?.role) ? row.role : "member",
      online: 1,
      lastActivity: "Adesso · Sincronizzata con Aula Studio",
      createdAt: timestamp(room.created_at),
      syncState: "synced"
    });
  }
  return [...rooms.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadRemoteRooms(client, userId) {
  if (!client || !userId) throw new Error("Sessione non disponibile.");
  const { data, error } = await client
    .from("room_members")
    .select("role,joined_at,study_rooms(id,name,invite_code,created_at)")
    .eq("user_id", userId)
    .is("left_at", null)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return normalizeMembershipRows(data);
}

function rpcResult(data) {
  return Array.isArray(data) ? data[0] : data;
}

export async function createRemoteRoom(client, name) {
  const { data, error } = await client.rpc("create_study_room", { room_name: String(name || "").trim() });
  if (error) throw error;
  const result = rpcResult(data);
  if (!result?.id) throw new Error("La stanza è stata creata ma il server non ha restituito il suo identificativo.");
  return {
    id: String(result.id),
    name: String(result.name || name).slice(0, 60),
    inviteCode: String(result.invite_code || "").toUpperCase().slice(0, 64),
    role: "owner",
    online: 1,
    lastActivity: "Adesso · Stanza creata e sincronizzata",
    createdAt: Date.now(),
    syncState: "synced"
  };
}

export async function joinRemoteRoom(client, inviteCode) {
  const code = String(inviteCode || "").trim().toUpperCase();
  const { data, error } = await client.rpc("join_study_room", { invite_code: code });
  if (error) throw error;
  const result = rpcResult(data);
  const id = typeof result === "string" ? result : result?.room_id;
  if (!id) throw new Error("Ingresso completato, ma il server non ha restituito la stanza.");
  return String(id);
}

export async function leaveRemoteRoom(client, roomId) {
  const { error } = await client.rpc("leave_study_room", { room_id: roomId });
  if (error) throw error;
}

export async function deleteRemoteRoom(client, roomId) {
  const prepared = await client.rpc("prepare_study_room_deletion", { p_room_id: roomId });
  if (prepared.error) throw prepared.error;
  const deleted = await client.rpc("delete_study_room", { p_room_id: roomId });
  if (deleted.error) throw deleted.error;
}

export async function rotateRemoteInvite(client, roomId) {
  const { data, error } = await client.rpc("rotate_room_invite", { p_room_id: roomId });
  if (error) throw error;
  const code = String(data || "").toUpperCase();
  if (!code) throw new Error("Il server non ha restituito il nuovo codice.");
  return code;
}

export function readStoredList(storage, key) {
  try {
    const value = JSON.parse(storage?.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeStoredList(storage, key, value) {
  storage?.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
}

export function enqueueRoomOperation(storage, type, payload) {
  const queue = readStoredList(storage, ROOM_OUTBOX_KEY);
  const signature = type === "create"
    ? String(payload?.name || "").trim().toLocaleLowerCase("it")
    : String(payload?.inviteCode || "").trim().toUpperCase();
  const existing = queue.find((item) => {
    if (item.type !== type) return false;
    const itemSignature = type === "create"
      ? String(item.payload?.name || "").trim().toLocaleLowerCase("it")
      : String(item.payload?.inviteCode || "").trim().toUpperCase();
    return itemSignature === signature;
  });
  if (existing) return existing;
  const operation = {
    id: globalThis.crypto?.randomUUID?.() || `sync-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    payload,
    createdAt: Date.now()
  };
  queue.push(operation);
  writeStoredList(storage, ROOM_OUTBOX_KEY, queue);
  return operation;
}

export function isRetryableSyncError(error, online = true) {
  if (!online) return true;
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("fetch") || message.includes("network") || message.includes("offline") || message.includes("timeout");
}

export async function flushRoomOutbox({ client, userId, storage }) {
  const queue = readStoredList(storage, ROOM_OUTBOX_KEY);
  if (!queue.length) return { processed: 0, pending: 0, rooms: await loadRemoteRooms(client, userId) };

  let remoteRooms = await loadRemoteRooms(client, userId);
  const pending = [];
  let processed = 0;
  for (const operation of queue) {
    try {
      if (operation.type === "create") {
        const name = String(operation.payload?.name || "").trim();
        const existing = remoteRooms.find((room) => room.role === "owner" && room.name.toLocaleLowerCase("it") === name.toLocaleLowerCase("it"));
        if (!existing) await createRemoteRoom(client, name);
      } else if (operation.type === "join") {
        const code = String(operation.payload?.inviteCode || "").toUpperCase();
        const existing = remoteRooms.find((room) => room.inviteCode === code);
        if (!existing) await joinRemoteRoom(client, code);
      }
      processed += 1;
      remoteRooms = await loadRemoteRooms(client, userId);
    } catch (error) {
      if (!isRetryableSyncError(error, globalThis.navigator?.onLine !== false)) throw error;
      pending.push(operation);
    }
  }
  writeStoredList(storage, ROOM_OUTBOX_KEY, pending);
  return { processed, pending: pending.length, rooms: remoteRooms };
}

export async function migrateLegacyRooms({ client, userId, storage, localRooms }) {
  let remoteRooms = await loadRemoteRooms(client, userId);
  let migrations;
  try {
    migrations = JSON.parse(storage?.getItem(ROOM_MIGRATIONS_KEY) || "{}") || {};
  } catch {
    migrations = {};
  }

  let migrated = 0;
  for (const room of Array.isArray(localRooms) ? localRooms : []) {
    const localId = String(room?.id || "");
    if (!localId || isRemoteRoomId(localId) || LEGACY_DEMO_IDS.has(localId) || migrations[localId]) continue;
    const sameRoom = remoteRooms.find((remote) =>
      remote.name.toLocaleLowerCase("it") === String(room.name || "").toLocaleLowerCase("it") ||
      (room.inviteCode && remote.inviteCode === String(room.inviteCode).toUpperCase())
    );
    if (sameRoom) {
      migrations[localId] = sameRoom.id;
      continue;
    }
    try {
      const remoteId = room.role === "owner"
        ? (await createRemoteRoom(client, room.name)).id
        : await joinRemoteRoom(client, room.inviteCode);
      migrations[localId] = remoteId;
      migrated += 1;
      remoteRooms = await loadRemoteRooms(client, userId);
    } catch (error) {
      if (isRetryableSyncError(error, globalThis.navigator?.onLine !== false)) {
        enqueueRoomOperation(storage, room.role === "owner" ? "create" : "join", room.role === "owner"
          ? { name: room.name, legacyId: localId }
          : { inviteCode: room.inviteCode, legacyId: localId });
      }
    }
  }
  storage?.setItem(ROOM_MIGRATIONS_KEY, JSON.stringify(migrations));
  return { migrated, rooms: remoteRooms };
}
