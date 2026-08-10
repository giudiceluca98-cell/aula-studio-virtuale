import { describe, expect, it } from "vitest";
import fs from "node:fs";
const read = (path: string) => fs.readFileSync(path, "utf8");
describe("CORE-2.0 confini", () => {
  it("mantiene provider, contesto e persistenza server-only", () => {
    for (const path of ["src/features/eve/chat/service.ts", "src/features/eve/chat/repository.ts", "src/features/eve/chat/server.ts", "src/features/eve/adapters/fastapi/client.ts"]) expect(read(path)).toContain('import "server-only"');
  });
  it("usa il client amministrativo solo dopo l'autenticazione per le scritture finali", () => {
    const route = read("src/app/api/eve/chat/route.ts");
    const repository = read("src/features/eve/chat/repository.ts");
    expect(route.indexOf("auth.getUser()")).toBeLessThan(route.indexOf("createAdminClient()"));
    expect(route).toContain("createEveGroundedChatService(client, persistenceClient)");
    expect(repository).toContain("this.persistenceClient.from(\"eve_messages\")");
    expect(repository).toContain("this.persistenceClient.from(\"eve_grounded_chat_turns\").update");
  });
  it("il client usa endpoint same-origin e non contiene segreti", () => {
    const client = read("src/features/eve/ui/chat-client.ts");
    expect(client).toContain('postJson("/api/eve/chat"');
    expect(client).not.toMatch(/https?:\/\//);
    expect(client).not.toMatch(/API_KEY|SECRET|Bearer/);
  });
  it("rifiuta fonti inventate e azioni", () => {
    const service = read("src/features/eve/chat/service.ts");
    expect(service).toContain("Il modello ha inventato una fonte");
    expect(service).toContain("proposed_actions.length");
    expect(service).toContain("memoryWritten: false");
    expect(service).toContain("actionsExecuted: false");
  });
});
