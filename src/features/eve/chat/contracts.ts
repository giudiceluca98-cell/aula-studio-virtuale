import type { EveContextBuildRequest } from "../context/contracts";

export type EveChatDepth = "brief" | "normal" | "deep";
export type EveKnowledgeBasis = "material" | "general";
export type EveChatUncertainty = "low" | "medium" | "high";

export interface EveGroundedChatRequest extends EveContextBuildRequest {
  message: string;
  depth?: EveChatDepth;
  allowGeneralKnowledge?: boolean;
}

export interface EveGroundedCitation {
  id: `S${number}`;
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

export interface EveGroundedStatement {
  text: string;
  basis: EveKnowledgeBasis;
  citationIds: readonly `S${number}`[];
  confidence: EveChatUncertainty;
}

export interface EveGroundedChatResponse {
  checkpoint: "CORE-2.0";
  turnId: string;
  conversationId: string;
  userMessageId: string;
  responseMessageId: string;
  answer: string;
  facts: readonly EveGroundedStatement[];
  hypotheses: readonly EveGroundedStatement[];
  suggestions: readonly EveGroundedStatement[];
  citations: readonly EveGroundedCitation[];
  provider: string;
  model: string;
  uncertainty: EveChatUncertainty;
  grounded: boolean;
  notFound: boolean;
  generalKnowledgeUsed: boolean;
  knowledgeScope: "materials_only" | "materials_plus_general_labeled";
  depth: EveChatDepth;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  contextDigest: string;
  memoryWritten: false;
  actionsExecuted: false;
  feedbackEnabled: boolean;
}

export interface EveGroundedChatSourceRequest {
  roomId: string;
  materialId: string;
  locator: string;
  expectedTextSha256?: string;
}

export interface EveGroundedChatSourceResponse {
  checkpoint: "CORE-2.0";
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

export interface EveGroundedChatStatus {
  checkpoint: "CORE-2.0";
  state: "disabled" | "misconfigured" | "ready";
  enabled: boolean;
  contextEnabled: boolean;
  integrationEnabled: boolean;
  externalProviderReady: boolean;
  requireCitations: boolean;
  allowGeneralKnowledge: boolean;
  deterministicFallback: boolean;
  defaultDepth: EveChatDepth;
  maxMessageChars: number;
  maxSources: number;
  privateOnly: true;
  memoryWrites: false;
  actionsExecuted: false;
}
