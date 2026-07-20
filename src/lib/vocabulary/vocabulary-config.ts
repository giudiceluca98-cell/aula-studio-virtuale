import type {
  VocabularyLearningSignal,
  VocabularyLearningState,
} from "./vocabulary-types";

export const VOCABULARY_CONFIG = {
  initialMasteryScore: 5,
  thresholds: {
    learning: 20,
    consolidating: 40,
    probablyKnown: 60,
    mastered: 80,
  },
  signalDeltas: {
    first_translation: 5,
    translation_revealed: -4,
    remembered: 2,
    not_remembered: -7,
    ignored_new_day: 1,
    sense_choice_correct: 5,
    written_translation_correct: 8,
    sentence_production_correct: 10,
    long_interval_success: 10,
    already_known: 8,
  } satisfies Record<VocabularyLearningSignal, number>,
  reviewIntervalsDays: {
    NEW: 1,
    LEARNING: 3,
    CONSOLIDATING: 7,
    PROBABLY_KNOWN: 14,
    MASTERED: 30,
    NEEDS_REVIEW: 1,
  } satisfies Record<VocabularyLearningState, number>,
  recentFailureWindowDays: 7,
  recentRevealWindowDays: 3,
} as const;

export function clampMastery(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

