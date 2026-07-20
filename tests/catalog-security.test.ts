import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/0009_intelligent_catalog.sql"), "utf8").toLowerCase();
const pathRoute = readFileSync(join(root, "src/app/api/catalog/path/route.ts"), "utf8");
const provider = readFileSync(join(root, "src/lib/catalog/eve-provider.ts"), "utf8");
const envExample = readFileSync(join(root, ".env.example"), "utf8");

const catalogTables = Array.from(migration.matchAll(/create table public\.([a-z_]+)/g), (match) => match[1]);

describe("sicurezza del catalogo e di Eve", () => {
  it("abilita RLS su ogni nuova tabella", () => {
    expect(catalogTables.length).toBeGreaterThanOrEqual(10);
    for (const table of catalogTables) expect(migration).toContain(`alter table public.${table} enable row level security`);
  });

  it("mantiene ricerche, preferenze e percorsi isolati per proprietario", () => {
    expect(migration).toContain("catalog_searches_own");
    expect(migration).toContain("user_learning_preferences_own");
    expect(migration).toContain("learning_paths_own");
    expect(migration).toContain("owner_user_id = (select auth.uid())");
  });

  it("riserva i consumi AI soltanto tramite service role", () => {
    expect(migration).toContain("revoke all on function public.reserve_catalog_ai_usage");
    expect(migration).toContain("grant execute on function public.reserve_catalog_ai_usage(uuid, text, text, numeric, integer) to service_role");
    expect(migration).not.toContain("grant execute on function public.reserve_catalog_ai_usage(uuid, text, text, numeric, integer) to authenticated");
  });

  it("costruisce i percorsi soltanto con materiali del catalogo e senza provider AI", () => {
    expect(pathRoute).toContain("catalog.materials.filter");
    expect(pathRoute).toContain("allowedRequested.has(material.id)");
    expect(pathRoute).toContain("createSubjectRoadmap");
    expect(pathRoute).not.toContain("callEve");
    expect(pathRoute).not.toContain("OPENAI_API_KEY");
    expect(migration).toContain("raise exception 'unknown_catalog_material'");
    expect(provider).toContain("store: false");
  });

  it("non espone la chiave OpenAI nel frontend", () => {
    expect(envExample).toContain("OPENAI_API_KEY=");
    expect(envExample).not.toContain("NEXT_PUBLIC_OPENAI_API_KEY");
  });
});
