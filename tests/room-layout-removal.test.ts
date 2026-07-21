import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ROOM_REALTIME_TABLES } from "@/hooks/use-room-realtime";
import { isAuthorizedRoomContentRole, parseCleanupJobs } from "@/lib/room-content-removal";
import { processRoomContentCleanupJobs } from "@/lib/server/room-content-cleanup";

const root = process.cwd();
const room = readFileSync(join(root, "src/components/room/study-room.tsx"), "utf8");
const dialog = readFileSync(join(root, "src/components/room/room-content-removal-dialog.tsx"), "utf8");
const migration = readFileSync(join(root, "supabase/migrations/0014_modular_room_layout_and_safe_removal.sql"), "utf8").toLowerCase();
const courseRoute = readFileSync(join(root, "src/app/api/rooms/[roomId]/courses/[courseId]/route.ts"), "utf8");
const materialRoute = readFileSync(join(root, "src/app/api/rooms/[roomId]/materials/[materialId]/route.ts"), "utf8");

describe("layout modulare dell'aula", () => {
  it("espone i nove strumenti accessibili e non conserva la griglia fissa a tre colonne", () => {
    for (const label of ["Corsi", "Materiali", "Checklist", "Progressi", "Appunti", "Partecipanti", "Attività recente", "Timer", "Chat"]) {
      expect(room).toContain(`\"${label}\"`);
    }
    expect(room).toContain('aria-label="Strumenti dell’aula"');
    expect(room).toContain("aria-expanded={activeTool === tool}");
    expect(room).toContain('id="room-workspace"');
    expect(room).not.toContain("xl:grid-cols-[280px_minmax(440px,1fr)_340px]");
  });

  it("fa scorrere via testata e strumenti insieme al contenuto dell’aula", () => {
    expect(room).toMatch(/id="room-scroll-shell"[^>]+lg:overflow-y-auto/);
    expect(room).toContain('aria-label="Area di lavoro" className="min-w-0 space-y-px bg-black/[0.05]"');
    expect(room).not.toContain('aria-label="Area di lavoro" className="min-w-0 space-y-px bg-black/[0.05] lg:overflow-y-auto"');
  });

  it("mantiene una sola sessione timer e integra timer e chat nella barra", () => {
    expect(room.match(/useAutosaveSession\(/g)).toHaveLength(1);
    expect(room).toContain('id="room-tool-timer"');
    expect(room).toContain('id="room-tool-chat"');
    expect(room).not.toContain('id="study-timer-widget"');
    expect(room).not.toContain('id="room-chat-widget"');
    expect(room).toContain('activeTool !== "chat"');
    expect(room).toContain("setUnreadCount(unread.length)");
    expect(room).toContain("aula:room-ui:");
  });

  it("supporta Escape, focus trap e focus restoration nelle conferme", () => {
    expect(room).toContain('event.key !== "Escape"');
    expect(dialog).toContain('event.key === "Escape"');
    expect(dialog).toContain('event.key !== "Tab"');
    expect(dialog).toContain("previousFocus.current?.focus()");
    expect(dialog).toContain('aria-modal="true"');
  });

  it("continua ad ascoltare rimozioni di corsi, materiali, task e messaggi", () => {
    expect(DEFAULT_ROOM_REALTIME_TABLES).toEqual(expect.arrayContaining(["courses", "materials", "tasks", "messages"]));
    expect(room).toContain("onEvent: scheduleRefresh");
    expect(room).toContain("Il materiale aperto è stato rimosso dall’aula.");
  });
});

describe("rimozione sicura dei contenuti", () => {
  it("autorizza owner/admin e limita i member ai propri contenuti", () => {
    expect(isAuthorizedRoomContentRole("owner", "other", "me")).toBe(true);
    expect(isAuthorizedRoomContentRole("admin", "other", "me")).toBe(true);
    expect(isAuthorizedRoomContentRole("member", "me", "me")).toBe(true);
    expect(isAuthorizedRoomContentRole("member", "other", "me")).toBe(false);
    expect(migration).toContain("public.is_room_admin(p_room_id)");
    expect(migration).toContain("created_by is distinct from v_user");
  });

  it("archivia in transazione, preserva progressi e rende la seconda richiesta idempotente", () => {
    expect(migration).toContain("begin;");
    expect(migration).toContain("commit;");
    expect(migration).toContain("if v_course.archived_at is not null");
    expect(migration).toContain("if v_material.archived_at is not null");
    expect(migration).toContain("'alreadyremoved', true");
    expect(migration).not.toContain("delete from public.progress_entries");
    expect(migration).not.toContain("delete from public.catalog_materials");
    expect(migration).not.toContain("delete from public.materials where");
    expect(migration).not.toContain("delete from public.courses where");
  });

  it("rimuove l'importazione dalla stanza ma conserva e rende reimportabile il Catalogo", () => {
    expect(migration).toContain("delete from public.learning_path_room_imports");
    expect(migration).toContain("v_existing_archived is not null");
    expect(migration).toContain("archived_at = null, archived_by = null");
    expect(migration).toContain("add_catalog_material_to_room");
    expect(migration).toContain("add_learning_path_to_room");
  });

  it("protegge le route mutate con sessione, same-origin e identificativi validati", () => {
    for (const route of [courseRoute, materialRoute]) {
      expect(route).toContain("isSameOriginRequest(request)");
      expect(route).toContain("supabase.auth.getUser()");
      expect(route).toContain("roomContentIdSchema.safeParse");
      expect(route).not.toMatch(/userId\s*:/);
      expect(route).not.toMatch(/storagePath\s*:/);
    }
  });

  it("mantiene privata la coda Storage e usa solo percorsi prodotti dal database", () => {
    expect(migration).toContain("alter table public.room_content_cleanup_jobs enable row level security");
    expect(migration).toContain("revoke all on public.room_content_cleanup_jobs from public, anon, authenticated");
    expect(migration).toContain("not exists (");
    expect(migration).toContain("active.storage_path = archived.storage_path");
    expect(parseCleanupJobs([{ id: "job", storage_path: "room/user/file.pdf" }, { id: 1, storage_path: "bad" }])).toEqual([{ id: "job", storagePath: "room/user/file.pdf" }]);
  });

  it("elimina il file esatto e completa il job soltanto dopo il successo Storage", async () => {
    const remove = vi.fn(async () => ({ error: null }));
    const updateEq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq: updateEq })) }));
    const admin = {
      storage: { from: vi.fn(() => ({ remove })) },
      from: vi.fn(() => ({ update })),
    } as unknown as SupabaseClient;
    const result = await processRoomContentCleanupJobs(admin, [{ id: "job", storagePath: "room/user/file.pdf" }]);
    expect(remove).toHaveBeenCalledWith(["room/user/file.pdf"]);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    expect(result).toEqual({ removed: 1, pending: 0 });
  });
});
