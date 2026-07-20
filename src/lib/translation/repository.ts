import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TranslationResult } from "./schema";

export interface StoredTranslation {
  vocabularyId: string;
  translation: string;
  lemma: string | null;
  partOfSpeech: string | null;
  grammaticalFeatures: Record<string, unknown>;
  senseKey: string;
  alternatives: string[];
  explanation: string | null;
  confidence: number | null;
  learningState: string;
  masteryScore: number;
}

interface VocabularyRow {
  id: string;
  contextual_translation: string;
  lemma: string | null;
  part_of_speech: string | null;
  grammatical_features: Record<string, unknown>;
  sense_key: string;
  alternative_translations: string[];
  explanation: string | null;
  confidence: number | null;
  learning_state: string;
  mastery_score: number;
  times_seen: number;
  distinct_exposure_days: number;
  distinct_contexts: number;
  last_seen_at: string;
}

interface CacheRow {
  contextual_translation: string;
  lemma: string | null;
  part_of_speech: string | null;
  grammatical_features: Record<string, unknown>;
  sense_key: string;
  alternative_translations: string[];
  explanation: string | null;
  confidence: number | null;
  provider: string;
  model: string;
}

function asStored(row: VocabularyRow): StoredTranslation {
  return {
    vocabularyId: row.id,
    translation: row.contextual_translation,
    lemma: row.lemma,
    partOfSpeech: row.part_of_speech,
    grammaticalFeatures: row.grammatical_features ?? {},
    senseKey: row.sense_key,
    alternatives: Array.isArray(row.alternative_translations) ? row.alternative_translations : [],
    explanation: row.explanation,
    confidence: row.confidence == null ? null : Number(row.confidence),
    learningState: row.learning_state,
    masteryScore: row.mastery_score,
  };
}

export async function lookupPersonalTranslation(
  admin: SupabaseClient,
  input: { userId: string; normalizedForm: string; sourceLanguage: string; targetLanguage: string; contextHash: string },
): Promise<StoredTranslation | null> {
  const { data: occurrence } = await admin
    .from("vocabulary_occurrences")
    .select("vocabulary_id")
    .eq("user_id", input.userId)
    .eq("context_hash", input.contextHash)
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!occurrence?.vocabulary_id) return null;

  const { data } = await admin
    .from("user_vocabulary")
    .select("id,contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,learning_state,mastery_score,times_seen,distinct_exposure_days,distinct_contexts,last_seen_at")
    .eq("id", occurrence.vocabulary_id)
    .eq("user_id", input.userId)
    .eq("normalized_form", input.normalizedForm)
    .eq("source_language", input.sourceLanguage)
    .eq("target_language", input.targetLanguage)
    .maybeSingle();
  return data ? asStored(data as VocabularyRow) : null;
}

export async function lookupTranslationCache(
  admin: SupabaseClient,
  input: { normalizedForm: string; sourceLanguage: string; targetLanguage: string; contextHash: string; promptVersion: string },
): Promise<CacheRow | null> {
  const { data } = await admin
    .from("translation_cache")
    .select("contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,provider,model")
    .eq("normalized_form", input.normalizedForm)
    .eq("source_language", input.sourceLanguage)
    .eq("target_language", input.targetLanguage)
    .eq("context_hash", input.contextHash)
    .eq("prompt_version", input.promptVersion)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data as CacheRow : null;
}

export function cacheRowToResult(row: CacheRow): TranslationResult {
  const features = row.grammatical_features ?? {};
  return {
    translation: row.contextual_translation,
    lemma: row.lemma,
    partOfSpeech: row.part_of_speech,
    grammaticalFeatures: {
      tense: typeof features.tense === "string" ? features.tense : null,
      number: typeof features.number === "string" ? features.number : null,
      gender: typeof features.gender === "string" ? features.gender : null,
      person: typeof features.person === "string" ? features.person : null,
      mood: typeof features.mood === "string" ? features.mood : null,
    },
    senseKey: row.sense_key,
    alternatives: Array.isArray(row.alternative_translations) ? row.alternative_translations : [],
    explanation: row.explanation,
    isAmbiguous: false,
    ambiguityReason: null,
    confidence: row.confidence == null ? 0.8 : Number(row.confidence),
    recommendedEscalation: "none",
  };
}

export function storedTranslationToResult(row: StoredTranslation): TranslationResult {
  const features = row.grammaticalFeatures ?? {};
  return {
    translation: row.translation,
    lemma: row.lemma,
    partOfSpeech: row.partOfSpeech,
    grammaticalFeatures: {
      tense: typeof features.tense === "string" ? features.tense : null,
      number: typeof features.number === "string" ? features.number : null,
      gender: typeof features.gender === "string" ? features.gender : null,
      person: typeof features.person === "string" ? features.person : null,
      mood: typeof features.mood === "string" ? features.mood : null,
    },
    senseKey: row.senseKey,
    alternatives: row.alternatives,
    explanation: row.explanation,
    isAmbiguous: false,
    ambiguityReason: null,
    confidence: row.confidence ?? 0.8,
    recommendedEscalation: "none",
  };
}

export async function storeTranslationCache(
  admin: SupabaseClient,
  input: {
    normalizedForm: string;
    sourceLanguage: string;
    targetLanguage: string;
    contextHash: string;
    promptVersion: string;
    result: TranslationResult;
    provider: string;
    model: string;
    expiresAt: string;
  },
) {
  const { error } = await admin.from("translation_cache").upsert({
    source_language: input.sourceLanguage,
    target_language: input.targetLanguage,
    normalized_form: input.normalizedForm,
    lemma: input.result.lemma,
    sense_key: input.result.senseKey,
    context_hash: input.contextHash,
    contextual_translation: input.result.translation,
    alternative_translations: input.result.alternatives,
    explanation: input.result.explanation,
    part_of_speech: input.result.partOfSpeech,
    grammatical_features: input.result.grammaticalFeatures,
    confidence: input.result.confidence,
    provider: input.provider,
    model: input.model,
    prompt_version: input.promptVersion,
    expires_at: input.expiresAt,
  }, { onConflict: "source_language,target_language,normalized_form,sense_key,context_hash,prompt_version" });
  if (error) throw new Error(`CACHE_WRITE_${error.code}`);
}

function isDifferentUtcDay(previous: string, now: Date): boolean {
  const prior = new Date(previous);
  return prior.getUTCFullYear() !== now.getUTCFullYear()
    || prior.getUTCMonth() !== now.getUTCMonth()
    || prior.getUTCDate() !== now.getUTCDate();
}

export async function persistVocabularyTranslation(
  admin: SupabaseClient,
  input: {
    userId: string;
    materialId: string;
    selectedText: string;
    normalizedForm: string;
    sourceLanguage: string;
    targetLanguage: string;
    sentence: string;
    paragraphIndex: number;
    tokenStart: number;
    tokenEnd: number;
    contextHash: string;
    result: TranslationResult;
  },
): Promise<StoredTranslation> {
  const now = new Date();
  const { data: priorOccurrence } = await admin
    .from("vocabulary_occurrences")
    .select("id,times_seen")
    .eq("user_id", input.userId)
    .eq("material_id", input.materialId)
    .eq("context_hash", input.contextHash)
    .eq("paragraph_index", input.paragraphIndex)
    .eq("token_start", input.tokenStart)
    .eq("token_end", input.tokenEnd)
    .maybeSingle();

  const { data: existing } = await admin
    .from("user_vocabulary")
    .select("id,contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,learning_state,mastery_score,times_seen,distinct_exposure_days,distinct_contexts,last_seen_at")
    .eq("user_id", input.userId)
    .eq("source_language", input.sourceLanguage)
    .eq("target_language", input.targetLanguage)
    .eq("entry_type", "word")
    .eq("normalized_form", input.normalizedForm)
    .eq("sense_key", input.result.senseKey)
    .maybeSingle();

  let vocabulary = existing as VocabularyRow | null;
  let created = false;
  if (!vocabulary) {
    const { data, error } = await admin.from("user_vocabulary").insert({
      user_id: input.userId,
      source_language: input.sourceLanguage,
      target_language: input.targetLanguage,
      entry_type: "word",
      surface_form: input.selectedText,
      normalized_form: input.normalizedForm,
      lemma: input.result.lemma,
      part_of_speech: input.result.partOfSpeech,
      grammatical_features: input.result.grammaticalFeatures,
      sense_key: input.result.senseKey,
      contextual_translation: input.result.translation,
      alternative_translations: input.result.alternatives,
      explanation: input.result.explanation,
      confidence: input.result.confidence,
      next_review_at: new Date(now.getTime() + 86_400_000).toISOString(),
    }).select("id,contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,learning_state,mastery_score,times_seen,distinct_exposure_days,distinct_contexts,last_seen_at").single();
    if (error || !data) {
      const { data: raced } = await admin
        .from("user_vocabulary")
        .select("id,contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,learning_state,mastery_score,times_seen,distinct_exposure_days,distinct_contexts,last_seen_at")
        .eq("user_id", input.userId)
        .eq("source_language", input.sourceLanguage)
        .eq("target_language", input.targetLanguage)
        .eq("entry_type", "word")
        .eq("normalized_form", input.normalizedForm)
        .eq("sense_key", input.result.senseKey)
        .single();
      if (!raced) throw new Error(`VOCABULARY_WRITE_${error?.code ?? "UNKNOWN"}`);
      vocabulary = raced as VocabularyRow;
    } else {
      vocabulary = data as VocabularyRow;
      created = true;
    }
  } else {
    const { data, error } = await admin.from("user_vocabulary").update({
      surface_form: input.selectedText,
      contextual_translation: input.result.translation,
      alternative_translations: input.result.alternatives,
      explanation: input.result.explanation,
      confidence: input.result.confidence,
      last_seen_at: now.toISOString(),
      times_seen: vocabulary.times_seen + 1,
      distinct_contexts: vocabulary.distinct_contexts + (priorOccurrence ? 0 : 1),
      distinct_exposure_days: vocabulary.distinct_exposure_days + (isDifferentUtcDay(vocabulary.last_seen_at, now) ? 1 : 0),
    }).eq("id", vocabulary.id).eq("user_id", input.userId)
      .select("id,contextual_translation,lemma,part_of_speech,grammatical_features,sense_key,alternative_translations,explanation,confidence,learning_state,mastery_score,times_seen,distinct_exposure_days,distinct_contexts,last_seen_at").single();
    if (error || !data) throw new Error(`VOCABULARY_UPDATE_${error?.code ?? "UNKNOWN"}`);
    vocabulary = data as VocabularyRow;
  }

  if (!vocabulary) throw new Error("VOCABULARY_MISSING");

  if (priorOccurrence) {
    await admin.from("vocabulary_occurrences").update({
      last_seen_at: now.toISOString(),
      times_seen: Number(priorOccurrence.times_seen ?? 1) + 1,
    }).eq("id", priorOccurrence.id).eq("user_id", input.userId);
  } else {
    const { error } = await admin.from("vocabulary_occurrences").insert({
      vocabulary_id: vocabulary.id,
      user_id: input.userId,
      material_id: input.materialId,
      sentence: input.sentence,
      paragraph_index: input.paragraphIndex,
      token_start: input.tokenStart,
      token_end: input.tokenEnd,
      context_hash: input.contextHash,
      document_position: { format: "txt", paragraphIndex: input.paragraphIndex },
    });
    if (error && error.code !== "23505") throw new Error(`OCCURRENCE_WRITE_${error.code}`);
  }

  if (created) {
    await admin.from("vocabulary_learning_events").insert({
      user_id: input.userId,
      vocabulary_id: vocabulary.id,
      signal_type: "first_translation",
      source_key: `initial:${vocabulary.id}`,
      context_hash: input.contextHash,
      score_delta: 5,
      previous_mastery: 0,
      new_mastery: 5,
    });
  }

  return asStored(vocabulary);
}
