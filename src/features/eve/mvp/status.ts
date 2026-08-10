import "server-only";
import type { EveMvpStatus } from "./contracts";
import { readEveMvpConfig } from "./config";

const enabled = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");

export function readEveMvpStatus(env: NodeJS.ProcessEnv = process.env): EveMvpStatus {
  const config = readEveMvpConfig(env);
  const contextEnabled = enabled(env.EVE_CONTEXT_BUILDER_ENABLED);
  const integrationEnabled = enabled(env.EVE_CORE_INTEGRATION_ENABLED);
  const panelEnabled = enabled(env.EVE_PANEL_ENABLED);
  const externalProviderEnabled = enabled(env.EVE_EXTERNAL_PROVIDERS_ENABLED);
  const prerequisites = contextEnabled && integrationEnabled && panelEnabled;
  return {
    checkpoint: "CORE-1.7",
    state: !config.enabled ? "disabled" : prerequisites ? "ready" : "misconfigured",
    enabled: config.enabled,
    contextEnabled,
    integrationEnabled,
    panelEnabled,
    externalProviderEnabled,
    feedbackEnabled: config.feedbackEnabled,
    requireCitations: config.requireCitations,
    maxQuestionChars: config.maxQuestionChars,
    maxSources: config.maxSources,
    memoryWrites: false,
    actionsExecuted: false,
  };
}
