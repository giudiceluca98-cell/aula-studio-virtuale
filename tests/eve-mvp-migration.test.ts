import { describe, expect, it } from "vitest";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/migrations/0020_eve_mvp_gate.sql", "utf8");
const rollback = fs.readFileSync("supabase/rollback/0020_eve_mvp_gate.down.sql", "utf8");
const workflow = fs.readFileSync(".github/workflows/eve-core-1.3-database-checks.yml", "utf8");

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

  it("rimuove CORE-1.7 prima dei rollback precedenti e solo con consenso", () => {
    expect(rollback).toContain("app.eve_allow_destructive_rollback");
    expect(rollback).toContain("drop table if exists public.eve_response_feedback");
    expect(rollback).toContain("drop table if exists public.eve_mvp_runs");
    expect(rollback).toContain("drop index if exists public.eve_messages_id_conversation_room_unique");
    expect(workflow.indexOf("0020_eve_mvp_gate.down.sql"))
      .toBeLessThan(workflow.indexOf("0019_eve_identity_roles_context.down.sql"));
  });
});
