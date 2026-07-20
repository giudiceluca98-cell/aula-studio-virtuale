import "server-only";

function integerEnv(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function numberEnv(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function enabled(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export interface TranslationModelPrice {
  inputPerMillion: number;
  cachedInputPerMillion: number;
  outputPerMillion: number;
}

export function getTranslationConfig() {
  return {
    aiEnabled: enabled("TRANSLATION_AI_ENABLED", false),
    provider: process.env.TRANSLATION_PROVIDER ?? "disabled",
    apiKey: process.env.OPENAI_API_KEY ?? "",
    models: {
      luna: process.env.OPENAI_MODEL_LUNA ?? "gpt-5.6-luna",
      terra: process.env.OPENAI_MODEL_TERRA ?? "gpt-5.6-terra",
      sol: process.env.OPENAI_MODEL_SOL ?? "gpt-5.6-sol",
    },
    modelEnabled: {
      luna: enabled("AI_LUNA_ENABLED", true),
      terra: enabled("AI_TERRA_ENABLED", true),
      sol: enabled("AI_SOL_ENABLED", false),
    },
    prices: {
      luna: {
        inputPerMillion: numberEnv("MODEL_PRICE_LUNA_INPUT_PER_MTOK", 1, 0, 10_000),
        cachedInputPerMillion: numberEnv("MODEL_PRICE_LUNA_CACHED_INPUT_PER_MTOK", 0.1, 0, 10_000),
        outputPerMillion: numberEnv("MODEL_PRICE_LUNA_OUTPUT_PER_MTOK", 6, 0, 10_000),
      },
      terra: {
        inputPerMillion: numberEnv("MODEL_PRICE_TERRA_INPUT_PER_MTOK", 2.5, 0, 10_000),
        cachedInputPerMillion: numberEnv("MODEL_PRICE_TERRA_CACHED_INPUT_PER_MTOK", 0.25, 0, 10_000),
        outputPerMillion: numberEnv("MODEL_PRICE_TERRA_OUTPUT_PER_MTOK", 15, 0, 10_000),
      },
      sol: {
        inputPerMillion: numberEnv("MODEL_PRICE_SOL_INPUT_PER_MTOK", 5, 0, 10_000),
        cachedInputPerMillion: numberEnv("MODEL_PRICE_SOL_CACHED_INPUT_PER_MTOK", 0.5, 0, 10_000),
        outputPerMillion: numberEnv("MODEL_PRICE_SOL_OUTPUT_PER_MTOK", 30, 0, 10_000),
      },
    } satisfies Record<"luna" | "terra" | "sol", TranslationModelPrice>,
    dailyLimit: integerEnv("AI_DAILY_REQUEST_LIMIT_PER_USER", integerEnv("TRANSLATION_DAILY_LIMIT", 30, 1, 10_000), 1, 10_000),
    maxContextChars: integerEnv("AI_MAX_CONTEXT_CHARS", integerEnv("TRANSLATION_MAX_CONTEXT_CHARS", 1500, 100, 4000), 100, 4000),
    timeoutMs: integerEnv("AI_REQUEST_TIMEOUT_MS", integerEnv("TRANSLATION_TIMEOUT_MS", 15_000, 1000, 120_000), 1000, 120_000),
    cacheTtlDays: integerEnv("TRANSLATION_CACHE_TTL_DAYS", 90, 1, 3650),
    promptVersion: "translation-v1",
  } as const;
}
