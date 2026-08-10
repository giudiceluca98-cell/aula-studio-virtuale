import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("CORE-1.7 confini", () => {
  it("mantiene provider e repository nei moduli server-only", () => {
    for (const file of [
      "src/features/eve/mvp/service.ts",
      "src/features/eve/mvp/repository.ts",
      "src/features/eve/mvp/server.ts",
      "src/features/eve/adapters/fastapi/client.ts",
    ]) expect(read(file)).toContain('import "server-only"');
  });

  it("il client usa soltanto endpoint same-origin e non contiene segreti", () => {
    const client = read("src/features/eve/ui/mvp-client.ts");
    expect(client).toContain('postJson("/api/eve/mvp"');
    expect(client).not.toMatch(/https?:\/\//);
    expect(client).not.toMatch(/API_KEY|SECRET|Bearer/);
  });

  it("dichiara esplicitamente assenza di memoria e azioni", () => {
    const service = read("src/features/eve/mvp/service.ts");
    expect(service).toContain("memoryWritten: false");
    expect(service).toContain("actionsExecuted: false");
    expect(service).toContain("proposed_actions.length > 0");
  });

  it("separa autorizzazione utente e persistenza privilegiata solo server", () => {
    const route = read("src/app/api/eve/mvp/route.ts");
    const server = read("src/features/eve/mvp/server.ts");
    expect(route).toContain("auth.getUser()");
    expect(route).toContain("createAdminClient()");
    expect(route).not.toMatch(/SUPABASE_(?:SECRET|SERVICE_ROLE)/);
    expect(server).toContain("persistenceClient");
  });
});
