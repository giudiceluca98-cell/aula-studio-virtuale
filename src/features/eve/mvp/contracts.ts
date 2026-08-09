import type { EveContextBuildRequest } from "../context/contracts";

export type EveMvpFeedbackRating = "helpful" | "not_helpful" | "incorrect" | "unsafe";

export interface EveMvpRunRequest extends EveContextBuildRequest {
  question: string;
  mode?: string;
}

export interface EveMvpCitation {
  rank: number;
  score: number;
  excerpt: string;
  locator: string;
  materialId: string;
  versionId: number;
  versionNumber: number;
  chunkId: number;
  chunkIndex: number;
  title: string;
  filename: string;
  mediaType: string;
  startChar: number;
  endChar: number;
  textSha256: string;
}

export interface EveMvpRunResponse {
  checkpoint: "CORE-1.7";
  runId: string;
  conversationId: string;
  userMessageId: string;
  responseMessageId: string;
  answer: string;
  provider: string;
  model: string;
  uncertainty: "low" | "medium" | "high";
  grounded: boolean;
  retrievalStage: string;
  citations: readonly EveMvpCitation[];
  contextDigest: string;
  memoryWritten: false;
  actionsExecuted: false;
  feedbackEnabled: boolean;
}

export interface EveMvpSourceOpenRequest {
  roomId: string;
  materialId: string;
  locator: string;
  expectedTextSha256?: string;
}

export interface EveMvpSourceOpenResponse {
  checkpoint: "CORE-1.7";
  materialId: string;
  title: string;
  locator: string;
  text: string;
  contextText: string;
  integrityVerified: boolean;
  expectedHashVerified: boolean | null;
  stale: boolean;
  suspiciousContent: boolean;
  safetyFlags: readonly string[];
  instructionsExecutable: false;
}

export interface EveMvpFeedbackRequest {
  roomId: string;
  conversationId: string;
  responseMessageId: string;
  rating: EveMvpFeedbackRating;
  note?: string;
}

export interface EveMvpFeedbackReceipt {
  feedbackId: string;
  updatedAt: string;
}

export interface EveMvpStatus {
  checkpoint: "CORE-1.7";
  state: "disabled" | "misconfigured" | "ready";
  enabled: boolean;
  contextEnabled: boolean;
  integrationEnabled: boolean;
  panelEnabled: boolean;
  externalProviderEnabled: boolean;
  feedbackEnabled: boolean;
  requireCitations: boolean;
  maxQuestionChars: number;
  maxSources: number;
  memoryWrites: false;
  actionsExecuted: false;
}
