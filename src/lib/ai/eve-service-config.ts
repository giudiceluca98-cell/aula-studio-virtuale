import "server-only";

export interface EveServiceConfig {
  enabled: boolean;
  baseUrl: URL;
  timeoutMs: number;
  bearerToken: string | null;
  maxResponseBytes: number;
}

function envBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true" || value?.trim() === "1";
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export function readEveServiceConfig(env: NodeJS.ProcessEnv = process.env): EveServiceConfig {
  const rawBaseUrl = env.EVE_CORE_SERVICE_URL?.trim() || "http://127.0.0.1:8000";
  const baseUrl = new URL(rawBaseUrl);
  if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error("EVE_CORE_SERVICE_URL deve usare HTTP o HTTPS");
  if (baseUrl.username || baseUrl.password) throw new Error("EVE_CORE_SERVICE_URL non può contenere credenziali");
  baseUrl.hash = "";
  baseUrl.search = "";
  if (!baseUrl.pathname.endsWith('/')) baseUrl.pathname += '/';
  return {
    enabled: envBoolean(env.EVE_CORE_INTEGRATION_ENABLED),
    baseUrl,
    timeoutMs: boundedInteger(env.EVE_CORE_SERVICE_TIMEOUT_MS, 3_000, 250, 30_000),
    bearerToken: env.EVE_CORE_SERVICE_TOKEN?.trim() || null,
    maxResponseBytes: boundedInteger(env.EVE_CORE_SERVICE_MAX_RESPONSE_BYTES, 262_144, 4_096, 1_048_576),
  };
}
