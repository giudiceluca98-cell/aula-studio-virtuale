import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { EveFastApiAdapter } from "@/features/eve/adapters/fastapi/client";
import type { EveServiceConfig } from "@/lib/ai/eve-service-config";

const config = (overrides: Partial<EveServiceConfig> = {}): EveServiceConfig => ({
  enabled: true,
  baseUrl: new URL("http://127.0.0.1:8000/"),
  timeoutMs: 250,
  bearerToken: null,
  maxResponseBytes: 64_000,
  ...overrides,
});

describe("adapter FastAPI Eve", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("non effettua rete quando l'integrazione è disattivata", async () => {
    const fetchMock = vi.fn();
    const adapter = new EveFastApiAdapter(config({ enabled: false }), fetchMock);
    await expect(adapter.health()).rejects.toMatchObject({ code: "integration_disabled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("usa GET, no-store, redirect error e non espone token nel risultato", async () => {
    const fetchMock = vi.fn<(input: URL | RequestInfo, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ status: "ok", enabled: true, provider: "mock", environment: "test", service_version: "1.2.0" }), { status: 200, headers: { "content-type": "application/json" } }));
    const adapter = new EveFastApiAdapter(config({ bearerToken: "server-secret" }), fetchMock);
    const result = await adapter.health();
    expect(result.status).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://127.0.0.1:8000/health");
    expect(init).toMatchObject({ method: "GET", redirect: "error", cache: "no-store" });
    expect(JSON.stringify(result)).not.toContain("server-secret");
  });

  it("rifiuta contenuti non JSON e risposte oltre il limite", async () => {
    const htmlAdapter = new EveFastApiAdapter(config(), vi.fn(async () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } })));
    await expect(htmlAdapter.health()).rejects.toMatchObject({ code: "invalid_content_type" });
    const largeAdapter = new EveFastApiAdapter(config({ maxResponseBytes: 4096 }), vi.fn(async () => new Response(JSON.stringify({ data: "x".repeat(5000) }), { status: 200, headers: { "content-type": "application/json" } })));
    await expect(largeAdapter.health()).rejects.toMatchObject({ code: "response_too_large" });
  });

  it("redige gli errori di rete in un codice stabile", async () => {
    const adapter = new EveFastApiAdapter(config(), vi.fn(async () => { throw new Error("socket dettagliato e sensibile"); }));
    await expect(adapter.health()).rejects.toEqual(expect.objectContaining({ code: "network_error", message: "Connessione adapter Eve non riuscita" }));
  });
});
