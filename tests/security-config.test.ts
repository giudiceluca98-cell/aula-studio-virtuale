import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "supabase/migrations/0001_initial_schema.sql"), "utf8").toLowerCase();
const policies = readFileSync(join(root, "supabase/migrations/0002_rls_policies.sql"), "utf8").toLowerCase();
const envExample = readFileSync(join(root, ".env.example"), "utf8");

const publicTables = Array.from(
  schema.matchAll(/create table public\.([a-z_]+)/g),
  (match) => match[1],
);

describe("configurazione di sicurezza", () => {
  it("abilita RLS su ogni tabella pubblica", () => {
    expect(publicTables.length).toBeGreaterThan(0);
    for (const table of publicTables) {
      expect(
        policies,
        `manca ENABLE ROW LEVEL SECURITY per public.${table}`,
      ).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("non espone chiavi privilegiate come variabili pubbliche", () => {
    expect(envExample).not.toMatch(/NEXT_PUBLIC_(?:SUPABASE_)?(?:SECRET|SERVICE_ROLE)/);
    expect(envExample).toContain("WEBHOOK_SECRET=");
    expect(envExample).toContain("SUPABASE_SECRET_KEY=");
  });

  it("nega l'inbox webhook ai ruoli browser e protegge i canali stanza", () => {
    expect(policies).toContain("revoke all on all tables in schema public from anon");
    expect(policies).toContain("revoke all on all tables in schema public from authenticated");
    expect(policies).not.toMatch(/grant\s+[^;]*\s+on public\.webhook_events\s+to\s+(?:anon|authenticated)/);
    expect(policies).toContain("alter table realtime.messages enable row level security");
    expect(policies).toContain("room_channels_receive_for_members");
    expect(policies).toContain("room_channels_send_for_members");
  });

  it("mantiene privato lo Storage e applica un limite agli upload", () => {
    expect(policies).toMatch(/'study-materials',\s*'study-materials',\s*false,\s*10485760/);
    expect(policies).toContain("10485760");
    expect(policies).toContain("study_materials_insert_member_own_folder");
  });
});
