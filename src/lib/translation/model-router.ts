import type { TranslationModelPrice } from "./config";
import type { TranslationOperation, TranslationRoutingMode } from "./schema";

export type ExecutableModelTier = "luna" | "terra";

export type ModelRoutingDecision =
  | { status: "cache_hit"; source: "personal_vocabulary" | "translation_cache" }
  | { status: "execute"; tier: ExecutableModelTier; model: string; reasonCode: string }
  | {
      status: "confirmation_required";
      recommendedModel: string;
      fallbackModel: string;
      reasonCode: string;
      reasonText: string;
      estimatedInputTokens: number;
      estimatedOutputTokens: number;
      estimatedCostUsd: number;
    }
  | { status: "blocked"; reasonCode: string };

export interface ModelRouterInput {
  operation: TranslationOperation;
  selectedText: string;
  sentence: string;
  routingMode: TranslationRoutingMode;
  cacheSource?: "personal_vocabulary" | "translation_cache";
  budgetAvailable: boolean;
  aiEnabled: boolean;
  models: { luna: string; terra: string; sol: string };
  modelEnabled: { luna: boolean; terra: boolean; sol: boolean };
  prices: { sol: TranslationModelPrice };
}

const AMBIGUOUS_WORDS = new Set([
  "bank", "bat", "cell", "charge", "draft", "file", "light", "match",
  "right", "run", "seal", "set", "spring", "strike", "term",
]);

const TECHNICAL_PATTERN = /\b(algorithm|jurisdiction|quantum|derivative|neural|statute|compiler|isotope|mitochondri|pharmac|constitutional|encryption)\w*\b/iu;
const IDIOM_PATTERN = /\b(give up|look after|take off|in spite of|break the ice|piece of cake|under the weather)\b/iu;

export function estimateTokens(inputChars: number, outputTokens: number) {
  return {
    inputTokens: Math.max(1, Math.ceil(inputChars / 4) + 260),
    outputTokens,
  };
}

export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  price: TranslationModelPrice,
  cachedInputTokens = 0,
): number {
  const cached = Math.min(Math.max(cachedInputTokens, 0), inputTokens);
  const uncached = inputTokens - cached;
  return Number((
    (uncached / 1_000_000) * price.inputPerMillion
    + (cached / 1_000_000) * price.cachedInputPerMillion
    + (outputTokens / 1_000_000) * price.outputPerMillion
  ).toFixed(8));
}

export function routeTranslationModel(input: ModelRouterInput): ModelRoutingDecision {
  if (input.cacheSource) return { status: "cache_hit", source: input.cacheSource };
  if (!input.aiEnabled) return { status: "blocked", reasonCode: "AI_DISABLED" };
  if (!input.budgetAvailable) return { status: "blocked", reasonCode: "BUDGET_EXHAUSTED" };

  const words = input.selectedText.trim().split(/\s+/u);
  const normalized = input.selectedText.normalize("NFKC").trim().toLocaleLowerCase();
  const technical = TECHNICAL_PATTERN.test(input.sentence);
  const idiom = IDIOM_PATTERN.test(input.sentence) || words.length > 1;
  const ambiguous = AMBIGUOUS_WORDS.has(normalized);
  const explicitlyAdvanced = input.operation === "advanced_analysis";
  const highlyComplex = explicitlyAdvanced || (technical && ambiguous && input.sentence.length > 140);

  if (highlyComplex && input.modelEnabled.sol) {
    const estimate = estimateTokens(input.sentence.length + input.selectedText.length, 500);
    return {
      status: "confirmation_required",
      recommendedModel: input.models.sol,
      fallbackModel: input.models.terra,
      reasonCode: explicitlyAdvanced ? "ADVANCED_ANALYSIS_REQUESTED" : "ADVANCED_TECHNICAL_AMBIGUITY",
      reasonText: explicitlyAdvanced
        ? "Hai richiesto un’analisi linguistica avanzata."
        : "Il testo è tecnico e presenta più interpretazioni plausibili.",
      estimatedInputTokens: estimate.inputTokens,
      estimatedOutputTokens: estimate.outputTokens,
      estimatedCostUsd: estimateCostUsd(estimate.inputTokens, estimate.outputTokens, input.prices.sol),
    };
  }

  const needsTerra = input.routingMode === "accurate"
    || input.routingMode === "advanced"
    || explicitlyAdvanced
    || input.operation === "accurate_translate"
    || input.operation === "explain_context"
    || input.operation === "analyze_grammar"
    || idiom
    || technical
    || ambiguous
    || input.sentence.length > 180;

  if (needsTerra && input.modelEnabled.terra) {
    return {
      status: "execute",
      tier: "terra",
      model: input.models.terra,
      reasonCode: highlyComplex ? "SOL_DISABLED_TERRA_FALLBACK" : "CONTEXT_REQUIRES_ACCURATE_MODEL",
    };
  }
  if (input.modelEnabled.luna) {
    return {
      status: "execute",
      tier: "luna",
      model: input.models.luna,
      reasonCode: needsTerra ? "TERRA_DISABLED_LUNA_FALLBACK" : "SIMPLE_CONTEXT",
    };
  }
  return { status: "blocked", reasonCode: "NO_EXECUTABLE_MODEL" };
}
