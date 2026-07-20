import "server-only";

import { translationResultSchema, type TranslationOperation, type TranslationResult } from "./schema";

export interface OpenAiTranslationInput {
  apiKey: string;
  model: string;
  modelTier: "luna" | "terra";
  selectedText: string;
  sentence: string;
  sourceLanguage: string;
  targetLanguage: string;
  operation: TranslationOperation;
  safetyIdentifier: string;
  timeoutMs: number;
}

export interface OpenAiTranslationOutput {
  result: TranslationResult;
  usage: { inputTokens: number; cachedInputTokens: number; outputTokens: number };
}

export class TranslationProviderError extends Error {
  constructor(public readonly code: string, public readonly dispatched: boolean) {
    super(code);
    this.name = "TranslationProviderError";
  }
}

const RESULT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    translation: { type: "string" },
    lemma: { type: ["string", "null"] },
    partOfSpeech: { type: ["string", "null"] },
    grammaticalFeatures: {
      type: "object",
      additionalProperties: false,
      properties: {
        tense: { type: ["string", "null"] },
        number: { type: ["string", "null"] },
        gender: { type: ["string", "null"] },
        person: { type: ["string", "null"] },
        mood: { type: ["string", "null"] },
      },
      required: ["tense", "number", "gender", "person", "mood"],
    },
    senseKey: { type: "string" },
    alternatives: { type: "array", items: { type: "string" }, maxItems: 8 },
    explanation: { type: ["string", "null"] },
    isAmbiguous: { type: "boolean" },
    ambiguityReason: { type: ["string", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    recommendedEscalation: { type: "string", enum: ["none", "terra", "sol"] },
  },
  required: [
    "translation", "lemma", "partOfSpeech", "grammaticalFeatures", "senseKey",
    "alternatives", "explanation", "isAmbiguous", "ambiguityReason", "confidence",
    "recommendedEscalation",
  ],
} as const;

interface RawResponsesPayload {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
}

function extractOutputText(payload: RawResponsesPayload): string | null {
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

export async function translateWithOpenAI(input: OpenAiTranslationInput): Promise<OpenAiTranslationOutput> {
  if (!input.apiKey) throw new TranslationProviderError("PROVIDER_NOT_CONFIGURED", false);
  if (input.model.includes("sol")) throw new TranslationProviderError("SOL_REQUIRES_CONSENT", false);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model,
        store: false,
        safety_identifier: input.safetyIdentifier,
        reasoning: { effort: input.modelTier === "luna" ? "none" : "low" },
        instructions: [
          "Translate only the selected expression using the supplied sentence as context.",
          "Preserve meaning, register and grammatical role. Do not translate the full sentence.",
          "Use concise language appropriate for a learner. Return only the required schema.",
          "recommendedEscalation is advice only and never authorizes another model call.",
        ].join(" "),
        input: JSON.stringify({
          selectedText: input.selectedText,
          sentence: input.sentence,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          operation: input.operation,
        }),
        max_output_tokens: input.modelTier === "luna" ? 500 : 800,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "contextual_translation",
            description: "A contextual translation and compact linguistic analysis.",
            strict: true,
            schema: RESULT_JSON_SCHEMA,
          },
        },
      }),
    });
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK_ERROR";
    throw new TranslationProviderError(code, true);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new TranslationProviderError(`PROVIDER_HTTP_${response.status}`, true);
  const payload = await response.json() as RawResponsesPayload;
  const outputText = extractOutputText(payload);
  if (!outputText) throw new TranslationProviderError("PROVIDER_EMPTY_OUTPUT", true);

  let decoded: unknown;
  try { decoded = JSON.parse(outputText); }
  catch { throw new TranslationProviderError("PROVIDER_INVALID_JSON", true); }
  const parsed = translationResultSchema.safeParse(decoded);
  if (!parsed.success) throw new TranslationProviderError("PROVIDER_INVALID_OUTPUT", true);

  return {
    result: parsed.data,
    usage: {
      inputTokens: payload.usage?.input_tokens ?? 0,
      cachedInputTokens: payload.usage?.input_tokens_details?.cached_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    },
  };
}
