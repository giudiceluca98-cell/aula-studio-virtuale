import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { normalizeSelection } from "@/lib/reader/normalize-selection";
import { getTranslationConfig } from "@/lib/translation/config";
import { createContextHash, createSafetyIdentifier, createTranslationRequestHash } from "@/lib/translation/hash";
import { estimateCostUsd, estimateTokens, routeTranslationModel } from "@/lib/translation/model-router";
import { translateWithOpenAI, TranslationProviderError } from "@/lib/translation/openai-provider";
import { consumeTranslationBurst } from "@/lib/translation/rate-limit";
import {
  cacheRowToResult,
  lookupPersonalTranslation,
  lookupTranslationCache,
  persistVocabularyTranslation,
  storedTranslationToResult,
  storeTranslationCache,
} from "@/lib/translation/repository";
import { translateRequestSchema } from "@/lib/translation/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_READER_FILE_BYTES = 2 * 1024 * 1024;

function json(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function normalizedDocumentText(value: string) {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase();
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return json({ error: "origin_not_allowed" }, 403);
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

  let decoded: unknown;
  try { decoded = await request.json(); }
  catch { return json({ error: "invalid_json" }, 400); }
  const parsed = translateRequestSchema.safeParse(decoded);
  if (!parsed.success) return json({ error: "invalid_payload" }, 400);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);

  const burst = consumeTranslationBurst(user.id);
  if (!burst.allowed) return json({ error: "rate_limit_exceeded" }, 429, { "Retry-After": String(burst.retryAfterSeconds) });

  const normalizedForm = normalizeSelection(parsed.data.selectedText);
  if (!normalizedForm) return json({ error: "single_word_required" }, 400);

  const [{ data: material }, { data: preferences }] = await Promise.all([
    supabase.from("materials").select("id,room_id,title,type,storage_path").eq("id", parsed.data.materialId).single(),
    supabase.from("user_language_preferences").select("learning_languages,default_target_language,ai_enabled").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!material) return json({ error: "material_not_accessible" }, 403);
  if (!material.storage_path || (!String(material.title).toLocaleLowerCase().endsWith(".txt") && !String(material.storage_path).toLocaleLowerCase().endsWith(".txt"))) {
    return json({ error: "unsupported_material" }, 400);
  }

  const { data: file, error: downloadError } = await supabase.storage.from("study-materials").download(material.storage_path);
  if (downloadError || !file) return json({ error: "material_download_failed" }, 503);
  if (file.size > MAX_READER_FILE_BYTES) return json({ error: "material_too_large" }, 413);
  const documentText = await file.text();
  const normalizedSentence = normalizedDocumentText(parsed.data.sentence);
  if (!normalizedDocumentText(documentText).includes(normalizedSentence)
    || !normalizedSentence.includes(normalizedForm)) {
    return json({ error: "context_not_in_material" }, 400);
  }

  const learningLanguages = Array.isArray(preferences?.learning_languages)
    ? preferences.learning_languages.filter((value): value is string => typeof value === "string")
    : [];
  const sourceLanguage = (parsed.data.sourceLanguage ?? learningLanguages[0] ?? "en").toLocaleLowerCase();
  const targetLanguage = parsed.data.targetLanguage.toLocaleLowerCase();
  const config = getTranslationConfig();
  const contextHash = createContextHash(parsed.data.sentence);
  const requestHash = createTranslationRequestHash({
    userId: user.id,
    materialId: parsed.data.materialId,
    selectedText: parsed.data.selectedText,
    sentence: parsed.data.sentence,
    sourceLanguage,
    targetLanguage,
    operation: parsed.data.operation,
    promptVersion: config.promptVersion,
  });

  let admin;
  try { admin = createAdminClient(); }
  catch { return json({ error: "server_not_configured" }, 503); }

  const personal = await lookupPersonalTranslation(admin, {
    userId: user.id, normalizedForm, sourceLanguage, targetLanguage, contextHash,
  });
  if (personal) {
    const refreshed = await persistVocabularyTranslation(admin, {
      userId: user.id, materialId: material.id, selectedText: parsed.data.selectedText,
      normalizedForm, sourceLanguage, targetLanguage, sentence: parsed.data.sentence,
      paragraphIndex: parsed.data.paragraphIndex, tokenStart: parsed.data.tokenStart,
      tokenEnd: parsed.data.tokenEnd, contextHash, result: storedTranslationToResult(personal),
    });
    await admin.from("ai_usage_events").insert({
      user_id: user.id, room_id: material.room_id, material_id: material.id,
      operation_type: parsed.data.operation, model_id: "personal_vocabulary",
      routing_mode: parsed.data.routingMode, request_hash: requestHash,
      cache_hit: true, status: "completed", completed_at: new Date().toISOString(),
      input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, actual_cost_usd: 0,
    });
    return json({ status: "completed", source: "personal_vocabulary", ...refreshed });
  }

  const cached = await lookupTranslationCache(admin, {
    normalizedForm, sourceLanguage, targetLanguage, contextHash, promptVersion: config.promptVersion,
  });
  if (cached) {
    const stored = await persistVocabularyTranslation(admin, {
      userId: user.id, materialId: material.id, selectedText: parsed.data.selectedText,
      normalizedForm, sourceLanguage, targetLanguage, sentence: parsed.data.sentence,
      paragraphIndex: parsed.data.paragraphIndex, tokenStart: parsed.data.tokenStart,
      tokenEnd: parsed.data.tokenEnd, contextHash, result: cacheRowToResult(cached),
    });
    await admin.from("ai_usage_events").insert({
      user_id: user.id, room_id: material.room_id, material_id: material.id,
      operation_type: parsed.data.operation, model_id: "translation_cache",
      routing_mode: parsed.data.routingMode, request_hash: requestHash,
      cache_hit: true, status: "completed", completed_at: new Date().toISOString(),
      input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, actual_cost_usd: 0,
    });
    return json({ status: "completed", source: "translation_cache", ...stored });
  }

  const aiAllowed = config.aiEnabled && config.provider === "openai" && Boolean(config.apiKey) && preferences?.ai_enabled !== false;
  const decision = routeTranslationModel({
    operation: parsed.data.operation,
    selectedText: parsed.data.selectedText,
    sentence: parsed.data.sentence,
    routingMode: parsed.data.routingMode,
    budgetAvailable: true,
    aiEnabled: aiAllowed,
    models: config.models,
    modelEnabled: config.modelEnabled,
    prices: { sol: config.prices.sol },
  });
  if (decision.status === "confirmation_required") {
    return json({ ...decision, requestHash }, 409);
  }
  if (decision.status === "blocked") {
    return json({ error: decision.reasonCode === "AI_DISABLED" ? "translation_not_configured" : "translation_blocked", reasonCode: decision.reasonCode }, 503);
  }
  if (decision.status === "cache_hit") return json({ error: "unexpected_cache_state" }, 500);

  const estimated = estimateTokens(parsed.data.sentence.length + parsed.data.selectedText.length, decision.tier === "luna" ? 500 : 800);
  const price = config.prices[decision.tier];
  const estimatedCost = estimateCostUsd(estimated.inputTokens, estimated.outputTokens, price);
  const { data: reservationData, error: reservationError } = await admin.rpc("reserve_ai_usage", {
    p_user_id: user.id,
    p_room_id: material.room_id,
    p_material_id: material.id,
    p_operation_type: parsed.data.operation,
    p_model_id: decision.model,
    p_routing_mode: parsed.data.routingMode,
    p_request_hash: requestHash,
    p_estimated_cost_usd: estimatedCost,
    p_daily_limit: config.dailyLimit,
  });
  const reservation = Array.isArray(reservationData) ? reservationData[0] : reservationData;
  if (reservationError || !reservation?.allowed || !reservation.usage_id) {
    const reasonCode = reservation?.reason_code ?? "RESERVATION_FAILED";
    return json({ error: reasonCode === "DAILY_LIMIT_REACHED" ? "daily_limit_reached" : reasonCode === "REQUEST_IN_PROGRESS" ? "request_in_progress" : "translation_unavailable" }, reasonCode === "DAILY_LIMIT_REACHED" ? 429 : 409);
  }

  try {
    const output = await translateWithOpenAI({
      apiKey: config.apiKey,
      model: decision.model,
      modelTier: decision.tier,
      selectedText: parsed.data.selectedText,
      sentence: parsed.data.sentence.slice(0, config.maxContextChars),
      sourceLanguage,
      targetLanguage,
      operation: parsed.data.operation,
      safetyIdentifier: createSafetyIdentifier(user.id),
      timeoutMs: config.timeoutMs,
    });
    const actualCost = estimateCostUsd(output.usage.inputTokens, output.usage.outputTokens, price, output.usage.cachedInputTokens);
    const expiresAt = new Date(Date.now() + config.cacheTtlDays * 86_400_000).toISOString();
    await storeTranslationCache(admin, {
      normalizedForm, sourceLanguage, targetLanguage, contextHash,
      promptVersion: config.promptVersion, result: output.result,
      provider: "openai", model: decision.model, expiresAt,
    });
    const stored = await persistVocabularyTranslation(admin, {
      userId: user.id, materialId: material.id, selectedText: parsed.data.selectedText,
      normalizedForm, sourceLanguage, targetLanguage, sentence: parsed.data.sentence,
      paragraphIndex: parsed.data.paragraphIndex, tokenStart: parsed.data.tokenStart,
      tokenEnd: parsed.data.tokenEnd, contextHash, result: output.result,
    });
    await admin.from("ai_usage_events").update({
      status: "completed", input_tokens: output.usage.inputTokens,
      cached_input_tokens: output.usage.cachedInputTokens, output_tokens: output.usage.outputTokens,
      actual_cost_usd: actualCost, completed_at: new Date().toISOString(),
    }).eq("id", reservation.usage_id).eq("user_id", user.id);
    return json({
      status: "completed", source: "openai", modelRole: decision.tier === "luna" ? "economic" : "accurate",
      ...stored,
    });
  } catch (error) {
    const providerError = error instanceof TranslationProviderError ? error : null;
    await admin.from("ai_usage_events").update({
      status: providerError?.dispatched ? "failed_after_dispatch" : "failed_before_dispatch",
      error_code: providerError?.code ?? "PERSISTENCE_FAILED",
      completed_at: new Date().toISOString(),
    }).eq("id", reservation.usage_id).eq("user_id", user.id);
    console.error("translation_failed", { code: providerError?.code ?? "PERSISTENCE_FAILED", requestHash, usageId: reservation.usage_id });
    return json({ error: "translation_provider_failed" }, 503);
  }
}
