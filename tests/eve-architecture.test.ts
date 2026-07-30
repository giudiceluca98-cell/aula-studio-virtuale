import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const featureRoot = join(root, "src/features/eve");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const expectedLayers = ["ui", "agent", "prompts", "context", "retrieval", "memory", "tools", "voice", "safety", "evaluation"];

describe("CORE-1.2 architettura Eve", () => {
  it("mantiene tutti i confini features/eve previsti dal piano", () => {
    const directories = readdirSync(featureRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    for (const layer of expectedLayers) expect(directories).toContain(layer);
  });

  it("espone dal barrel pubblico soltanto contratti e registro client-safe", () => {
    const barrel = read("src/features/eve/index.ts");
    expect(barrel).toContain("./contracts");
    expect(barrel).toContain("./registry");
    expect(barrel).not.toContain("./server");
    expect(barrel).not.toContain("fastapi");
  });

  it("non permette provider, segreti o fetch nella UI", () => {
    const ui = read("src/features/eve/ui/index.ts");
    for (const forbidden of ["process.env", "OPENAI_API_KEY", "EVE_CORE_SERVICE_TOKEN", "fetch(", "server-only"]) expect(ui).not.toContain(forbidden);
  });

  it("concentra configurazione e rete nei moduli server-only", () => {
    for (const path of ["src/lib/ai/eve-service-config.ts", "src/features/eve/adapters/fastapi/client.ts", "src/features/eve/server/composition.ts"]) {
      expect(read(path)).toContain('import "server-only"');
    }
  });

  it("usa una allowlist di endpoint e non importa direttamente i prototipi Python", () => {
    const contracts = read("src/features/eve/adapters/fastapi/contracts.ts");
    const client = read("src/features/eve/adapters/fastapi/client.ts");
    expect(contracts).toContain('/v1/intelligence/research/status');
    expect(contracts).toContain('/v1/materials/status');
    expect(client).toContain("FASTAPI_PROBE_PATHS");
    expect(client).not.toContain("eve-ai-studio/app");
    expect(client).not.toContain("app/intelligence");
  });

  it("la route di composizione non contiene provider o chiavi", () => {
    const route = read("src/app/api/eve/composition/route.ts");
    expect(route).toContain("composeEveStatus");
    expect(route).not.toContain("OPENAI_API_KEY");
    expect(route).not.toContain("process.env");
    expect(route).not.toContain("fetch(");
  });
});
