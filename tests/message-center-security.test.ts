import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0017_message_center.sql"), "utf8").toLowerCase();

describe("sicurezza del centro messaggi", () => {
  it("abilita RLS e limita conversazioni e partecipanti ai membri autorizzati", () => {
    expect(migration).toContain("alter table public.message_conversations enable row level security");
    expect(migration).toContain("alter table public.message_conversation_members enable row level security");
    expect(migration).toContain("public.is_message_conversation_member(conversation_id)");
    expect(migration).toContain("sender_id = auth.uid()");
  });

  it("conserva i messaggi esistenti nella Lobby e assegna una Lobby ai client precedenti", () => {
    expect(migration).toContain("update public.messages m");
    expect(migration).toContain("create trigger messages_assign_lobby");
    expect(migration).toContain("message_conversations_one_lobby_per_room");
  });

  it("isola gli allegati per conversazione e non permette di simulare messaggi di sistema", () => {
    expect(migration).toContain("'message-attachments'");
    expect(migration).toContain("public.is_message_conversation_member(((storage.foldername(name))[1])::uuid)");
    const insertGrant = migration.match(/grant insert \([\s\S]*?\)\s+on public\.messages to authenticated;/)?.[0] ?? "";
    expect(insertGrant).toContain("attachments");
    expect(insertGrant).not.toContain("message_type");
  });

  it("revoca l'esecuzione pubblica delle funzioni security definer", () => {
    expect(migration).toContain("revoke all on function public.create_message_conversation(uuid, text, text, uuid[]) from public, anon");
    expect(migration).toContain("revoke all on function public.mark_message_conversation_read(uuid) from public, anon");
  });
});
