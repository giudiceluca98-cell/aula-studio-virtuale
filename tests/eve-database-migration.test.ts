import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync("supabase/migrations/0018_eve_core_production_data.sql", "utf8");
const tables = ["eve_prompt_families","eve_prompt_versions","eve_material_assets","eve_material_versions","eve_material_chunks","eve_research_projects","eve_research_sources","eve_source_reviews","eve_source_promotions","eve_conversations","eve_messages","eve_audit_events","eve_import_batches","eve_import_items"];

describe("CORE-1.3 migrazione database Eve", () => {
  it("crea tutte le tabelle di produzione e abilita RLS", () => { for (const table of tables) { expect(sql).toContain(`create table if not exists public.${table}`); expect(sql).toContain(`alter table public.${table} enable row level security`); } });
  it("impone isolamento di aula e relazioni composite", () => { expect(sql).toContain("references public.eve_conversations(id, room_id)"); expect(sql).toContain("references public.eve_material_versions(id, room_id)"); expect(sql).toContain("references public.courses(id, room_id)"); });
  it("mantiene audit append-only e import server-only", () => { expect(sql).toContain("eve_audit_append_only"); expect(sql).toContain("revoke all on public.eve_import_batches, public.eve_import_items from anon, authenticated"); expect(sql).toContain("revoke insert, update, delete on public.eve_audit_events"); });
  it("separa conversazioni private e scritture amministrative", () => { expect(sql).toContain("eve_conversations_select_owner"); expect(sql).toContain("owner_id = auth.uid()"); expect(sql).toContain("eve_require_room_admin(room_id)"); });
  it("registra versione, checkpoint e import disattivato", () => { expect(sql).toContain("'schema_version', '\"1.3.0\"'"); expect(sql).toContain("'checkpoint', '\"CORE-1.3\"'"); expect(sql).toContain("'sqlite_import_enabled_by_default', 'false'"); });
});
