import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogActionSchema, catalogSearchRequestSchema } from "@/lib/catalog/schema";

const root = process.cwd();
const migration = ["0010_web_catalog_saves.sql", "0011_web_files_and_free_roadmaps.sql", "0012_eve_curriculum_cache.sql"]
  .map((file) => readFileSync(join(root, "supabase/migrations", file), "utf8"))
  .join("\n")
  .toLowerCase();
const searchRoute = readFileSync(join(root, "src/app/api/catalog/search/route.ts"), "utf8");
const pathRoute = readFileSync(join(root, "src/app/api/catalog/path/route.ts"), "utf8");
const config = readFileSync(join(root, "src/lib/catalog/config.ts"), "utf8");
const explorer = readFileSync(join(root, "src/components/catalog/catalog-explorer.tsx"), "utf8");

describe("catalogo locale e aggiunta manuale", () => {
  it("accetta soltanto URL HTTPS nel payload di salvataggio", () => {
    const valid = catalogActionSchema.safeParse({ action: "save_web_material", title: "Dispensa", description: "Fonte citata", provider: "example.org", url: "https://example.org/dispensa.pdf", language: "it", resourceType: "pdf", fileExtension: "pdf" });
    const invalid = catalogActionSchema.safeParse({ action: "save_web_material", title: "Corso", description: "Fonte citata", provider: "example.org", url: "http://example.org/course", language: "it" });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("non contiene chiamate OpenAI nelle route del catalogo e dei percorsi", () => {
    expect(searchRoute).not.toContain("callEve");
    expect(searchRoute).not.toContain("OPENAI_API_KEY");
    expect(searchRoute).not.toContain("createAdminClient");
    expect(pathRoute).not.toContain("callEve");
    expect(pathRoute).not.toContain("OPENAI_API_KEY");
    expect(pathRoute).not.toContain("createAdminClient");
    expect(config).toContain("eveEnabled: false");
    expect(config).toContain("webSearchEnabled: false");
    expect(config).toContain("automaticCurriculumEnabled: false");
  });

  it("usa soltanto il catalogo e mantiene il collegamento a Google", () => {
    expect(catalogSearchRequestSchema.parse({ query: "biologia" }).includeWeb).toBe(false);
    expect(explorer).toContain("includeWeb: false");
    expect(explorer).toContain("Cerca nel catalogo");
    expect(explorer).toContain("Cerca percorso su Google");
    expect(explorer).toContain("Aggiungi materiale");
    expect(explorer).toContain("dalle basi al livello desiderato corsi video PDF esercizi guida");
    expect(explorer).not.toContain("Crea percorso con Eve");
    expect(explorer).not.toContain("Solo catalogo");
  });

  it("mantiene private le fonti web non verificate", () => {
    expect(migration).toContain("verification_status in ('verified', 'official_source')");
    expect(migration).toContain("created_by = (select auth.uid())");
    expect(migration).toContain("s.user_id = (select auth.uid())");
    expect(migration).toContain("'pending', 'community'");
    expect(migration).toContain("create table if not exists public.catalog_curriculum_cache");
    expect(migration).toContain("user_id = (select auth.uid())");
  });

  it("deduplica per URL e protegge la RPC", () => {
    expect(migration).toContain("where m.source_url = p_source_url");
    expect(migration).toContain("exception when unique_violation");
    expect(migration).toContain("revoke all on function public.save_web_result_to_catalog");
    expect(migration).toContain("grant execute on function public.save_web_result_to_catalog(text,text,text,text,text) to authenticated");
    expect(migration).toContain("grant execute on function public.save_web_result_to_catalog(text,text,text,text,text,text) to authenticated");
    expect(migration).toContain("p_material_type not in ('article', 'pdf', 'documentation', 'exercise')");
    expect(migration).toContain("exe|msi|dmg|pkg|apk|bat|cmd|ps1|sh|scr");
    expect(migration).toMatch(/p_source_url\s+!~\*\s+'\^https:\/\/'/);
    expect(migration).toContain("jsonb_array_length(p_materials) not between 1 and 24");
    expect(migration).toContain("save_eve_discoveries_to_catalog");
    expect(migration).toContain("on conflict (user_id, material_id) do nothing");
  });
});
