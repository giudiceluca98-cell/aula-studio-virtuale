import {
  VOCABULARY_CONFIG,
  clampMastery,
} from "./vocabulary-config";
import { calculateNextReviewAt } from "./spaced-repetition";
import type {
  MasteryUpdate,
  VocabularyLearningSignal,
  VocabularyLearningState,
  VocabularyMasterySnapshot,
} from "./vocabulary-types";

const DAY_MS = 86_400_000;

function isRecent(value: string | null, now: Date, days: number): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && now.getTime() - timestamp < days * DAY_MS;
}

export function createInitialMastery(_now: Date = new Date()): VocabularyMasterySnapshot {
  return {
    masteryScore: VOCABULARY_CONFIG.initialMasteryScore,
    learningState: "NEW",
    timesSeen: 1,
    timesRevealed: 0,
    timesIgnored: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    explicitKnownCount: 0,
    explicitUnknownCount: 0,
    distinctExposureDays: 1,
    distinctContexts: 1,
    productionSuccesses: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastRevealedAt: null,
    hasLongIntervalSuccess: false,
  } satisfies VocabularyMasterySnapshot;
}

export function classifyLearningState(
  snapshot: VocabularyMasterySnapshot,
  now: Date = new Date(),
): VocabularyLearningState {
  const score = clampMastery(snapshot.masteryScore);
  const recentFailure = isRecent(
    snapshot.lastFailureAt,
    now,
    VOCABULARY_CONFIG.recentFailureWindowDays,
  );
  const recentReveal = isRecent(
    snapshot.lastRevealedAt,
    now,
    VOCABULARY_CONFIG.recentRevealWindowDays,
  );

  if (snapshot.learningState === "MASTERED" && (recentFailure || recentReveal)) {
    return "NEEDS_REVIEW";
  }

  const mastered =
    score >= VOCABULARY_CONFIG.thresholds.mastered &&
    snapshot.distinctExposureDays >= 5 &&
    snapshot.distinctContexts >= 3 &&
    snapshot.correctAnswers >= 2 &&
    snapshot.productionSuccesses >= 1 &&
    snapshot.hasLongIntervalSuccess &&
    !recentFailure;
  if (mastered) return "MASTERED";

  const probablyKnown =
    score >= VOCABULARY_CONFIG.thresholds.probablyKnown &&
    snapshot.distinctExposureDays >= 3 &&
    snapshot.distinctContexts >= 2 &&
    snapshot.correctAnswers >= 1 &&
    !recentReveal &&
    !recentFailure;
  if (probablyKnown) return "PROBABLY_KNOWN";

  if (score >= VOCABULARY_CONFIG.thresholds.consolidating) return "CONSOLIDATING";
  if (score >= VOCABULARY_CONFIG.thresholds.learning) return "LEARNING";
  return "NEW";
}

function signalDelta(
  snapshot: VocabularyMasterySnapshot,
  signal: VocabularyLearningSignal,
): number {
  if (signal === "not_remembered" && snapshot.learningState === "MASTERED") return -15;
  if (signal === "not_remembered" && snapshot.learningState === "PROBABLY_KNOWN") return -10;
  return VOCABULARY_CONFIG.signalDeltas[signal];
}

export function applyLearningSignal(
  current: VocabularyMasterySnapshot,
  signal: Exclude<VocabularyLearningSignal, "first_translation">,
  now: Date = new Date(),
): MasteryUpdate {
  const timestamp = now.toISOString();
  const delta = signalDelta(current, signal);
  const positive = delta > 0;
  const failure = signal === "not_remembered" || signal === "translation_revealed";

  const snapshot: VocabularyMasterySnapshot = {
    ...current,
    masteryScore: clampMastery(current.masteryScore + delta),
    timesSeen: current.timesSeen + (signal === "ignored_new_day" ? 1 : 0),
    timesRevealed: current.timesRevealed + (signal === "translation_revealed" ? 1 : 0),
    timesIgnored: current.timesIgnored + (signal === "ignored_new_day" ? 1 : 0),
    correctAnswers: current.correctAnswers + (
      ["sense_choice_correct", "written_translation_correct", "sentence_production_correct", "long_interval_success"].includes(signal) ? 1 : 0
    ),
    wrongAnswers: current.wrongAnswers + (failure ? 1 : 0),
    explicitKnownCount: current.explicitKnownCount + (
      signal === "remembered" || signal === "already_known" ? 1 : 0
    ),
    explicitUnknownCount: current.explicitUnknownCount + (
      signal === "not_remembered" ? 1 : 0
    ),
    productionSuccesses: current.productionSuccesses + (
      signal === "sentence_production_correct" ? 1 : 0
    ),
    lastSuccessAt: positive ? timestamp : current.lastSuccessAt,
    lastFailureAt: failure ? timestamp : current.lastFailureAt,
    lastRevealedAt: signal === "translation_revealed" ? timestamp : current.lastRevealedAt,
    hasLongIntervalSuccess: current.hasLongIntervalSuccess || signal === "long_interval_success",
  };

  snapshot.learningState = classifyLearningState(snapshot, now);

  return {
    previousScore: current.masteryScore,
    scoreDelta: snapshot.masteryScore - current.masteryScore,
    snapshot,
    nextReviewAt: calculateNextReviewAt(snapshot.learningState, now),
  };
}
