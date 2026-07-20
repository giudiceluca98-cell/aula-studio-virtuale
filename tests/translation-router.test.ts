import { describe, expect, it } from "vitest";

import { estimateCostUsd, routeTranslationModel, type ModelRouterInput } from "@/lib/translation/model-router";

const baseInput: ModelRouterInput = {
  operation: "quick_translate",
  selectedText: "wall",
  sentence: "The wall is very high.",
  routingMode: "automatic",
  budgetAvailable: true,
  aiEnabled: true,
  models: { luna: "gpt-5.6-luna", terra: "gpt-5.6-terra", sol: "gpt-5.6-sol" },
  modelEnabled: { luna: true, terra: true, sol: false },
  prices: { sol: { inputPerMillion: 5, cachedInputPerMillion: 0.5, outputPerMillion: 30 } },
};

describe("deterministic translation model router", () => {
  it("uses personal memory or cache without executing a model", () => {
    expect(routeTranslationModel({ ...baseInput, cacheSource: "personal_vocabulary" }))
      .toEqual({ status: "cache_hit", source: "personal_vocabulary" });
  });

  it("routes a simple single word to Luna", () => {
    expect(routeTranslationModel(baseInput)).toMatchObject({
      status: "execute",
      tier: "luna",
      model: "gpt-5.6-luna",
    });
  });

  it("routes idioms and explicit explanations to Terra", () => {
    expect(routeTranslationModel({
      ...baseInput,
      selectedText: "give up",
      sentence: "I decided to give up after trying twice.",
    })).toMatchObject({ status: "execute", tier: "terra" });
    expect(routeTranslationModel({ ...baseInput, operation: "explain_context" }))
      .toMatchObject({ status: "execute", tier: "terra" });
  });

  it("only recommends Sol and never returns it as executable", () => {
    const decision = routeTranslationModel({
      ...baseInput,
      operation: "advanced_analysis",
      modelEnabled: { ...baseInput.modelEnabled, sol: true },
    });
    expect(decision).toMatchObject({
      status: "confirmation_required",
      recommendedModel: "gpt-5.6-sol",
      fallbackModel: "gpt-5.6-terra",
    });
    expect(decision.status === "execute" && decision.model.includes("sol")).toBe(false);
  });

  it("falls back to Terra when advanced execution is disabled", () => {
    expect(routeTranslationModel({ ...baseInput, operation: "advanced_analysis" }))
      .toMatchObject({ status: "execute", tier: "terra", reasonCode: "SOL_DISABLED_TERRA_FALLBACK" });
  });

  it("blocks before routing when AI or budget is disabled", () => {
    expect(routeTranslationModel({ ...baseInput, aiEnabled: false }))
      .toEqual({ status: "blocked", reasonCode: "AI_DISABLED" });
    expect(routeTranslationModel({ ...baseInput, budgetAvailable: false }))
      .toEqual({ status: "blocked", reasonCode: "BUDGET_EXHAUSTED" });
  });
});

describe("translation cost estimate", () => {
  it("separates cached input, regular input and output", () => {
    expect(estimateCostUsd(1000, 100, {
      inputPerMillion: 1,
      cachedInputPerMillion: 0.1,
      outputPerMillion: 6,
    }, 500)).toBe(0.00115);
  });
});
