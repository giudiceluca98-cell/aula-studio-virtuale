import { describe, expect, it } from "vitest";
import fs from "node:fs";
const sql = fs.readFileSync("supabase/migrations/0021_eve_grounded_chat.sql", "utf8");
describe("CORE-2.0 migration", () => {
  it("crea turni privati con RLS e ownership", () => {
    expect(sql).toContain("create table if not exists public.eve_grounded_chat_turns");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("actor_id = auth.uid()");
    expect(sql).toContain("c.status = 'active'");
    expect(sql).toContain("foreign key (user_message_id, conversation_id, room_id)");
    expect(sql).toContain("foreign key (assistant_message_id, conversation_id, room_id)");
  });
  it("impedisce uso generale non autorizzato e cancellazioni", () => {
    expect(sql).toContain("allow_general_knowledge or coalesce(general_knowledge_used, false) = false");
    expect(sql).toContain("revoke delete on public.eve_grounded_chat_turns");
    expect(sql).toContain("grant select, insert on public.eve_grounded_chat_turns to authenticated");
    expect(sql).not.toContain("grant select, insert, update on public.eve_grounded_chat_turns to authenticated");
  });
});
