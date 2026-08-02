import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");

describe("CORE-1.4 confini Context Builder", () => {
  it("mantiene configurazione, repository, firma e builder server-only", () => {
    for (const path of [
      "src/features/eve/context/config.ts", "src/features/eve/context/repository.ts",
      "src/features/eve/context/signature.ts", "src/features/eve/context/builder.ts",
    ]) expect(read(path)).toContain('import "server-only"');
  });
  it("non esporta segreti dal barrel client-safe", () => {
    const barrel = read("src/features/eve/context/index.ts");
    expect(barrel).not.toContain("signingSecret");
    expect(barrel).not.toContain("./server");
    expect(barrel).not.toContain("process.env");
  });
  it("la route usa la sessione server e non accetta userId dal payload", () => {
    const route = read("src/app/api/eve/context/route.ts");
    expect(route).toContain("auth.getUser()");
    expect(route).not.toContain("userId: optionalId");
    expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
  it("l'audit non persiste selected_text", () => {
    const sql = read("supabase/migrations/0019_eve_identity_roles_context.sql");
    expect(sql).toContain("selected_text_sha256");
    expect(sql).not.toMatch(/\bselected_text\s+text\b/);
    expect(sql).toContain("eve_context_audit_append_only");
  });
  it("mantiene i flag disattivati per impostazione predefinita", () => {
    const env = read(".env.example");
    expect(env).toContain("EVE_CONTEXT_BUILDER_ENABLED=false");
    expect(env).toContain("EVE_CONTEXT_SHARED_SELECTION_ENABLED=false");
    expect(env).toContain("EVE_CONTEXT_SIGNING_SECRET=\n");
  });
});
