import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");
describe("CORE-1.3 confini applicativi database", () => {
  it("mantiene configurazione e accesso DB server-only", () => { for (const path of ["src/features/eve/data/config.ts","src/features/eve/data/status.ts","src/features/eve/data/import-service.ts"]) expect(read(path)).toContain('import "server-only"'); });
  it("mantiene i flag database e import OFF", () => { const env = read(".env.example"); expect(env).toContain("EVE_PRODUCTION_DATABASE_ENABLED=false"); expect(env).toContain("EVE_SQLITE_IMPORT_ENABLED=false"); });
  it("la route richiede autenticazione e non espone chiavi", () => { const route = read("src/app/api/eve/database/status/route.ts"); expect(route).toContain("getUser()"); expect(route).toContain("Non autenticato"); expect(route).not.toContain("SUPABASE_SERVICE_ROLE_KEY"); });
  it("il rollback richiede un consenso distruttivo esplicito", () => { expect(read("supabase/rollback/0018_eve_core_production_data.down.sql")).toContain("eve_allow_destructive_rollback"); });
});
