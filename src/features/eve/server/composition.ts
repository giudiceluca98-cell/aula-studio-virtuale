import "server-only";

import { readEveServiceConfig } from "@/lib/ai/eve-service-config";
import { EveFastApiAdapter } from "../adapters/fastapi/client";
import type { EveCompositionStatus, EveServiceProbe } from "../contracts";
import { EVE_FEATURE_REGISTRY } from "../registry";

const unavailable = (key: EveServiceProbe["key"], detail: string): EveServiceProbe => ({ key, state: "unavailable", checkpoint: null, detail });
const disabled = (key: EveServiceProbe["key"]): EveServiceProbe => ({ key, state: "disabled", checkpoint: null, detail: "Integrazione server disattivata dal feature flag" });

export async function composeEveStatus(): Promise<EveCompositionStatus> {
  const config = readEveServiceConfig();
  if (!config.enabled) {
    return {
      checkpoint: "CORE-1.2",
      integrationEnabled: false,
      architectureReady: true,
      serviceConfigured: Boolean(process.env.EVE_CORE_SERVICE_URL),
      generatedAt: new Date().toISOString(),
      features: EVE_FEATURE_REGISTRY,
      probes: [disabled("health"), disabled("requirements"), disabled("materials"), disabled("research")],
    };
  }

  const adapter = new EveFastApiAdapter(config);
  const calls = [
    ["health", () => adapter.health()],
    ["requirements", () => adapter.requirementsStatus()],
    ["materials", () => adapter.materialsStatus()],
    ["research", () => adapter.researchStatus()],
  ] as const;
  const probes = await Promise.all(calls.map(async ([key, call]): Promise<EveServiceProbe> => {
    try {
      const result = await call();
      const checkpoint = "checkpoint" in result && typeof result.checkpoint === "string" ? result.checkpoint : null;
      return { key, state: "available", checkpoint, detail: "Adapter tipizzato disponibile" };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Adapter non disponibile";
      return unavailable(key, detail);
    }
  }));

  return {
    checkpoint: "CORE-1.2",
    integrationEnabled: true,
    architectureReady: true,
    serviceConfigured: true,
    generatedAt: new Date().toISOString(),
    features: EVE_FEATURE_REGISTRY,
    probes,
  };
}
