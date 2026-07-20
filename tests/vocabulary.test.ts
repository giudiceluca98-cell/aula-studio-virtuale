import { describe, expect, it } from "vitest";

import {
  applyLearningSignal,
  classifyLearningState,
  createInitialMastery,
} from "@/lib/vocabulary/mastery";
import {
  calculateNextReviewAt,
  reviewIntervalDays,
} from "@/lib/vocabulary/spaced-repetition";
import { clampMastery } from "@/lib/vocabulary/vocabulary-config";

const NOW = new Date("2026-07-20T12:00:00.000Z");

describe("adaptive vocabulary mastery", () => {
  it("starts a translated word at five points without marking it learned", () => {
    expect(createInitialMastery(NOW)).toMatchObject({
      masteryScore: 5,
      learningState: "NEW",
      distinctExposureDays: 1,
      distinctContexts: 1,
    });
  });

  it("applies centralized weights and clamps scores", () => {
    const initial = createInitialMastery(NOW);
    const remembered = applyLearningSignal(initial, "remembered", NOW);
    expect(remembered.scoreDelta).toBe(2);
    expect(remembered.snapshot.masteryScore).toBe(7);
    expect(remembered.snapshot.explicitKnownCount).toBe(1);
    expect(clampMastery(120)).toBe(100);
    expect(clampMastery(-4)).toBe(0);
  });

  it("does not infer knowledge from score alone", () => {
    const state = classifyLearningState({
      ...createInitialMastery(NOW),
      masteryScore: 82,
      distinctExposureDays: 1,
      distinctContexts: 1,
      correctAnswers: 0,
    }, NOW);
    expect(state).toBe("CONSOLIDATING");
  });

  it("requires distributed evidence for probably known and mastered", () => {
    const probablyKnown = {
      ...createInitialMastery(NOW),
      masteryScore: 65,
      distinctExposureDays: 3,
      distinctContexts: 2,
      correctAnswers: 1,
    };
    expect(classifyLearningState(probablyKnown, NOW)).toBe("PROBABLY_KNOWN");

    expect(classifyLearningState({
      ...probablyKnown,
      masteryScore: 85,
      distinctExposureDays: 5,
      distinctContexts: 3,
      correctAnswers: 2,
      productionSuccesses: 1,
      hasLongIntervalSuccess: true,
    }, NOW)).toBe("MASTERED");
  });

  it("returns a mastered word to review after a failure", () => {
    const mastered = {
      ...createInitialMastery(NOW),
      masteryScore: 90,
      learningState: "MASTERED" as const,
      distinctExposureDays: 8,
      distinctContexts: 5,
      correctAnswers: 4,
      productionSuccesses: 2,
      hasLongIntervalSuccess: true,
    };
    const result = applyLearningSignal(mastered, "not_remembered", NOW);
    expect(result.scoreDelta).toBe(-15);
    expect(result.snapshot.learningState).toBe("NEEDS_REVIEW");
    expect(result.snapshot.wrongAnswers).toBe(1);
  });
});

describe("spaced repetition", () => {
  it("uses the configured intervals and server-compatible ISO timestamps", () => {
    expect(reviewIntervalDays("NEW")).toBe(1);
    expect(reviewIntervalDays("CONSOLIDATING")).toBe(7);
    expect(reviewIntervalDays("MASTERED")).toBe(30);
    expect(calculateNextReviewAt("LEARNING", NOW)).toBe("2026-07-23T12:00:00.000Z");
  });
});

