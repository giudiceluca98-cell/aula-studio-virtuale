export type VocabularyEntryType = "word" | "phrase";

export type VocabularyLearningState =
  | "NEW"
  | "LEARNING"
  | "CONSOLIDATING"
  | "PROBABLY_KNOWN"
  | "MASTERED"
  | "NEEDS_REVIEW";

export type AnnotationMode = "adaptive" | "always" | "click" | "hidden";

export type VocabularyLearningSignal =
  | "first_translation"
  | "translation_revealed"
  | "remembered"
  | "not_remembered"
  | "ignored_new_day"
  | "sense_choice_correct"
  | "written_translation_correct"
  | "sentence_production_correct"
  | "long_interval_success"
  | "already_known";

export interface UserLanguagePreferences {
  user_id: string;
  native_language: string;
  learning_languages: string[];
  default_target_language: string;
  show_annotations: boolean;
  annotation_mode: AnnotationMode;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface VocabularyMasterySnapshot {
  masteryScore: number;
  learningState: VocabularyLearningState;
  timesSeen: number;
  timesRevealed: number;
  timesIgnored: number;
  correctAnswers: number;
  wrongAnswers: number;
  explicitKnownCount: number;
  explicitUnknownCount: number;
  distinctExposureDays: number;
  distinctContexts: number;
  productionSuccesses: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastRevealedAt: string | null;
  hasLongIntervalSuccess: boolean;
}

export interface MasteryUpdate {
  previousScore: number;
  scoreDelta: number;
  snapshot: VocabularyMasterySnapshot;
  nextReviewAt: string;
}

