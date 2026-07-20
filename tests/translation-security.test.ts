import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/0008_ai_translation_execution.sql"), "utf8").toLowerCase();
const route = readFileSync(join(process.cwd(), "src/app/api/translation/translate/route.ts"), "utf8");
const provider = readFileSync(join(process.cwd(), "src/lib/translation/openai-provider.ts"), "utf8");

describe("AI translation database security", () => {
  it("enables RLS and gives browser roles read-only access to their own rows", () => {
    expect(migration).toContain("alter table public.ai_usage_events enable row level security");
    expect(migration).toContain("alter table public.ai_model_consents enable row level security");
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).not.toMatch(/grant\s+(?:insert|update|delete)[^;]*public\.ai_(?:usage_events|model_consents)[^;]*authenticated/);
  });

  it("only exposes usage reservation to the service role", () => {
    expect(migration).toMatch(/revoke all on function public\.reserve_ai_usage\([\s\S]*?\) from public, anon, authenticated/);
    expect(migration).toMatch(/grant execute on function public\.reserve_ai_usage\([\s\S]*?\) to service_role/);
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("ai_usage_one_inflight_request_idx");
  });

  it("binds consent to Sol and stores hashes rather than selected text", () => {
    expect(migration).toContain("approved_model = 'gpt-5.6-sol'");
    expect(migration).toContain("selected_text_hash text not null");
    expect(migration).not.toMatch(/ai_usage_events[\s\S]*?selected_text\s+text/);
  });
});

describe("translation endpoint security", () => {
  it("authenticates, checks same origin and validates context against the private file", () => {
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("supabase.storage.from(\"study-materials\").download");
    expect(route).toContain("context_not_in_material");
  });

  it("cannot dispatch Sol through the normal provider", () => {
    const guard = provider.indexOf('if (input.model.includes("sol"))');
    const dispatch = provider.indexOf('fetch("https://api.openai.com/v1/responses"');
    expect(guard).toBeGreaterThan(0);
    expect(dispatch).toBeGreaterThan(guard);
    expect(provider).toContain("SOL_REQUIRES_CONSENT");
  });

  it("uses Responses structured outputs and never logs provider bodies", () => {
    expect(provider).toContain('type: "json_schema"');
    expect(provider).toContain("strict: true");
    expect(provider).toContain("translationResultSchema.safeParse");
    expect(provider).not.toMatch(/console\.(?:log|error)/);
  });
});
