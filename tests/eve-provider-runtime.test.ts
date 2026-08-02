import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readExternalProviderStatus } from "@/lib/ai/provider-runtime";

const root = process.cwd();
const statusRoute = readFileSync(join(root, "src/app/api/eve/provider/status/route.ts"), "utf8");
const panelProvider = readFileSync(join(root, "src/features/eve/ui/eve-panel-provider.tsx"), "utf8");
const envExample = readFileSync(join(root, ".env.example"), "utf8");

describe("CORE-1.6 provider runtime", () => {
  it("resta disattivato senza configurazione", () => {
    const status = readExternalProviderStatus({});
    expect(status.state).toBe("disabled");
    expect(status.secretConfigured).toBe(false);
    expect(status.fallback).toBe("mock");
  });

  it("segnala configurazione incompleta senza restituire il segreto", () => {
    const status = readExternalProviderStatus({ EVE_EXTERNAL_PROVIDERS_ENABLED: "true" });
    expect(status.state).toBe("misconfigured");
    expect(JSON.stringify(status)).not.toContain("apiKey");
  });

  it("non espone chiavi nel client", () => {
    expect(panelProvider).not.toContain("EVE_EXTERNAL_PROVIDER_API_KEY");
    expect(panelProvider).not.toContain("OPENAI_API_KEY");
    expect(statusRoute).not.toContain("process.env.EVE_EXTERNAL_PROVIDER_API_KEY");
    expect(envExample).not.toContain("NEXT_PUBLIC_EVE_EXTERNAL_PROVIDER_API_KEY");
  });
});
