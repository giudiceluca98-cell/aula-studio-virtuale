import "server-only";

export type EveExternalProviderState = "disabled" | "misconfigured" | "ready";

export interface EveExternalProviderStatus {
  checkpoint: "CORE-1.6";
  state: EveExternalProviderState;
  providerKey: string;
  modelKey: string | null;
  profileKey: string;
  baseUrlConfigured: boolean;
  secretConfigured: boolean;
  timeoutSeconds: number;
  rateLimitPerMinute: number;
  circuitFailureThreshold: number;
  circuitRecoverySeconds: number;
  maxCostPerRunUsd: number;
  dailyCostBudgetUsd: number;
  fallback: "mock";
}

const enabled = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");
const numberValue = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function readExternalProviderStatus(
  env: Readonly<Record<string, string | undefined>> = process.env,
): EveExternalProviderStatus {
  const isEnabled = enabled(env.EVE_EXTERNAL_PROVIDERS_ENABLED);
  const baseUrlConfigured = Boolean(env.EVE_EXTERNAL_PROVIDER_BASE_URL?.trim());
  const secretConfigured = Boolean(env.EVE_EXTERNAL_PROVIDER_API_KEY?.trim());
  const modelKey = env.EVE_EXTERNAL_PROVIDER_MODEL?.trim() || null;
  const ready = isEnabled && baseUrlConfigured && secretConfigured && Boolean(modelKey);
  return {
    checkpoint: "CORE-1.6",
    state: !isEnabled ? "disabled" : ready ? "ready" : "misconfigured",
    providerKey: env.EVE_EXTERNAL_PROVIDER_KEY?.trim() || "openai-compatible",
    modelKey,
    profileKey: env.EVE_CHAT_EXECUTION_PROFILE?.trim() || "chat-development",
    baseUrlConfigured,
    secretConfigured,
    timeoutSeconds: numberValue(env.EVE_EXTERNAL_PROVIDER_TIMEOUT_SECONDS, 20),
    rateLimitPerMinute: numberValue(env.EVE_PROVIDER_RATE_LIMIT_PER_MINUTE, 30),
    circuitFailureThreshold: numberValue(env.EVE_PROVIDER_CIRCUIT_FAILURE_THRESHOLD, 3),
    circuitRecoverySeconds: numberValue(env.EVE_PROVIDER_CIRCUIT_RECOVERY_SECONDS, 60),
    maxCostPerRunUsd: numberValue(env.EVE_CHAT_PRODUCTION_MAX_COST_PER_RUN_USD, 0.25),
    dailyCostBudgetUsd: numberValue(env.EVE_CHAT_PRODUCTION_DAILY_COST_BUDGET_USD, 5),
    fallback: "mock",
  };
}
