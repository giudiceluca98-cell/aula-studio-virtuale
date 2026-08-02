import "server-only";
import type { EveCompositionContextSummary } from "../contracts";
import { readEveContextConfig } from "./config";
import { EveContextConfigurationError } from "./errors";

export function readEveContextStatus(): EveCompositionContextSummary {
  try {
    const config = readEveContextConfig();
    return {
      state: config.enabled ? "ready" : "disabled",
      signingConfigured: config.signingSecret.length >= 32,
      maxSelectedChars: config.maxSelectedChars,
      maxAuthorizedMaterials: config.maxAuthorizedMaterials,
      tokenTtlSeconds: config.tokenTtlSeconds,
      sharedSelectionEnabled: config.sharedSelectionEnabled,
    };
  } catch (error) {
    if (!(error instanceof EveContextConfigurationError)) throw error;
    return {
      state: "misconfigured",
      signingConfigured: false,
      maxSelectedChars: 0,
      maxAuthorizedMaterials: 0,
      tokenTtlSeconds: 0,
      sharedSelectionEnabled: false,
    };
  }
}
