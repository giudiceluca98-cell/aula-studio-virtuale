import { z } from "zod";

export const translationOperationSchema = z.enum([
  "quick_translate",
  "accurate_translate",
  "explain_context",
  "analyze_grammar",
  "advanced_analysis",
]);

export const routingModeSchema = z.enum(["economic", "automatic", "accurate", "advanced"]);

export const translateRequestSchema = z.object({
  materialId: z.uuid(),
  selectedText: z.string().trim().min(1).max(240),
  sentence: z.string().trim().min(1).max(1500),
  sourceLanguage: z.string().trim().min(2).max(35).optional(),
  targetLanguage: z.string().trim().min(2).max(35),
  paragraphIndex: z.number().int().min(0).max(1_000_000),
  tokenStart: z.number().int().min(0).max(10_000_000),
  tokenEnd: z.number().int().min(1).max(10_000_000),
  operation: translationOperationSchema.default("quick_translate"),
  routingMode: routingModeSchema.default("automatic"),
}).refine((value) => value.tokenEnd > value.tokenStart, {
  message: "tokenEnd must be greater than tokenStart",
  path: ["tokenEnd"],
});

export const translationResultSchema = z.object({
  translation: z.string().trim().min(1).max(1000),
  lemma: z.string().trim().min(1).max(240).nullable(),
  partOfSpeech: z.string().trim().min(1).max(80).nullable(),
  grammaticalFeatures: z.object({
    tense: z.string().max(80).nullable(),
    number: z.string().max(80).nullable(),
    gender: z.string().max(80).nullable(),
    person: z.string().max(80).nullable(),
    mood: z.string().max(80).nullable(),
  }).strict(),
  senseKey: z.string().trim().min(1).max(160),
  alternatives: z.array(z.string().trim().min(1).max(240)).max(8),
  explanation: z.string().trim().min(1).max(4000).nullable(),
  isAmbiguous: z.boolean(),
  ambiguityReason: z.string().trim().min(1).max(1000).nullable(),
  confidence: z.number().min(0).max(1),
  recommendedEscalation: z.enum(["none", "terra", "sol"]),
});

export type TranslationOperation = z.infer<typeof translationOperationSchema>;
export type TranslationRoutingMode = z.infer<typeof routingModeSchema>;
export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type TranslationResult = z.infer<typeof translationResultSchema>;
