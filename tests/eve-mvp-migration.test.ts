import { describe, expect, it } from "vitest";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/migrations/0020_eve_mvp_gate.sql", "utf8");

describe("CORE-1.7 migrazione MVP", () => {
  it("crea run e feedback con RLS", () => {
    expect(sql).toContain("create table if not exists public.eve_mvp_runs");
    expect(sql).toContain("create table if not exists public.eve_response_feedback");
    expect(sql).toContain("alter table public.eve_mvp_runs enable row level security");
    expect(sql).toContain("alter table public.eve_response_feedback enable row level security");
  });

  it("impedisce cancellazioni utente e conserva ownership", () => {
    expect(sql).toContain("revoke delete on public.eve_mvp_runs");
    expect(sql).toContain("actor_id = auth.uid()");
    expect(sql).toContain("user_id = auth.uid()");
    expect(sql).not.toContain("eve_mvp_runs_update_owner");
    expect(sql).toContain("grant select, insert on public.eve_mvp_runs to authenticated");
    expect(sql).toContain("status = 'running'");
  });

  it("vincola ogni messaggio alla stessa conversazione e aula", () => {
    expect(sql).toContain("eve_messages_id_conversation_room_unique");
    expect(sql).toContain("foreign key (user_message_id, conversation_id, room_id)");
    expect(sql).toContain("foreign key (assistant_message_id, conversation_id, room_id)");
    expect(sql).toContain("foreign key (response_message_id, conversation_id, room_id)");
    expect(sql).not.toContain("foreign key (user_message_id) references");
    expect(sql).not.toContain("foreign key (response_message_id) references");
  });
});
