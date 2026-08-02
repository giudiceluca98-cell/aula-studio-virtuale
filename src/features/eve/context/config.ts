import "server-only";
import { EveContextConfigurationError } from "./errors";

export interface EveContextConfig {
  enabled: boolean;
  maxSelectedChars: number;
  maxAuthorizedMaterials: number;
  tokenTtlSeconds: number;
  sharedSelectionEnabled: boolean;
  signingSecret: string;
}

const readBoolean = (name: string, fallback: boolean): boolean => {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new EveContextConfigurationError(`${name} deve essere true oppure false`);
};

const readInteger = (name: string, fallback: number, min: number, max: number): number => {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new EveContextConfigurationError(`${name} deve essere un intero tra ${min} e ${max}`);
  }
  return parsed;
};

export function readEveContextConfig(): EveContextConfig {
  const config: EveContextConfig = {
    enabled: readBoolean("EVE_CONTEXT_BUILDER_ENABLED", false),
    maxSelectedChars: readInteger("EVE_CONTEXT_MAX_SELECTED_CHARS", 4_000, 1, 20_000),
    maxAuthorizedMaterials: readInteger("EVE_CONTEXT_MAX_AUTHORIZED_MATERIALS", 20, 1, 100),
    tokenTtlSeconds: readInteger("EVE_CONTEXT_TOKEN_TTL_SECONDS", 300, 30, 3_600),
    sharedSelectionEnabled: readBoolean("EVE_CONTEXT_SHARED_SELECTION_ENABLED", false),
    signingSecret: process.env.EVE_CONTEXT_SIGNING_SECRET?.trim() ?? "",
  };
  if (config.enabled && config.signingSecret.length < 32) {
    throw new EveContextConfigurationError(
      "EVE_CONTEXT_SIGNING_SECRET deve contenere almeno 32 caratteri quando il Context Builder è attivo",
    );
  }
  return config;
}
