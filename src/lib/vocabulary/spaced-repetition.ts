import { VOCABULARY_CONFIG } from "./vocabulary-config";
import type { VocabularyLearningState } from "./vocabulary-types";

const DAY_MS = 86_400_000;

export function reviewIntervalDays(state: VocabularyLearningState): number {
  return VOCABULARY_CONFIG.reviewIntervalsDays[state];
}

export function calculateNextReviewAt(
  state: VocabularyLearningState,
  from: Date = new Date(),
): string {
  const timestamp = from.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid review date.");
  }
  return new Date(timestamp + reviewIntervalDays(state) * DAY_MS).toISOString();
}

