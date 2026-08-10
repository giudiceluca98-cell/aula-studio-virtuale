import "server-only";
import { EveMvpValidationError } from "./errors";

export interface EveMvpConfig {
  enabled: boolean;
  maxQuestionChars: number;
  maxSources: number;
  requireCitations: boolean;
  feedbackEnabled: boolean;
}

const booleanValue = (name: string, fallback: boolean, env: NodeJS.ProcessEnv): boolean => {
  const raw = env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  throw new EveMvpValidationError(`${name} non valido`);
};

const integerValue = (
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
  env: NodeJS.ProcessEnv,
): number => {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new EveMvpValidationError(`${name} deve essere tra ${minimum} e ${maximum}`);
  }
  return parsed;
};

export function readEveMvpConfig(env: NodeJS.ProcessEnv = process.env): EveMvpConfig {
  return {
    enabled: booleanValue("EVE_MVP_GATE_ENABLED", false, env),
    maxQuestionChars: integerValue("EVE_MVP_MAX_QUESTION_CHARS", 8_000, 1, 20_000, env),
    maxSources: integerValue("EVE_MVP_MAX_SOURCES", 4, 1, 10, env),
    requireCitations: booleanValue("EVE_MVP_REQUIRE_CITATIONS", true, env),
    feedbackEnabled: booleanValue("EVE_MVP_FEEDBACK_ENABLED", true, env),
  };
}
