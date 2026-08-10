import "server-only";
import type { EveChatDepth } from "./contracts";

export interface EveGroundedChatConfig {
  enabled: boolean;
  maxMessageChars: number;
  maxSources: number;
  requireCitations: boolean;
  allowGeneralKnowledge: boolean;
  defaultDepth: EveChatDepth;
  deterministicFallback: boolean;
  feedbackEnabled: boolean;
}

const bool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};
const integer = (value: string | undefined, fallback: number, min: number, max: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};
const depth = (value: string | undefined): EveChatDepth => {
  if (value === "brief" || value === "deep") return value;
  return "normal";
};

export function readEveGroundedChatConfig(env: NodeJS.ProcessEnv = process.env): EveGroundedChatConfig {
  return {
    enabled: bool(env.EVE_GROUNDED_CHAT_ENABLED),
    maxMessageChars: integer(env.EVE_GROUNDED_CHAT_MAX_MESSAGE_CHARS, 8_000, 100, 20_000),
    maxSources: integer(env.EVE_GROUNDED_CHAT_MAX_SOURCES, 6, 1, 10),
    requireCitations: bool(env.EVE_GROUNDED_CHAT_REQUIRE_CITATIONS, true),
    allowGeneralKnowledge: bool(env.EVE_GROUNDED_CHAT_ALLOW_GENERAL_KNOWLEDGE),
    defaultDepth: depth(env.EVE_GROUNDED_CHAT_DEFAULT_DEPTH),
    deterministicFallback: bool(env.EVE_GROUNDED_CHAT_DETERMINISTIC_FALLBACK, true),
    feedbackEnabled: bool(env.EVE_MVP_FEEDBACK_ENABLED, true),
  };
}
