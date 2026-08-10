import { describe, expect, it } from "vitest";
import { EveGroundedChatService } from "@/features/eve/chat/service";
import type { EveGroundedChatGateway } from "@/features/eve/chat/service";
import type { EveGroundedChatRepository } from "@/features/eve/chat/repository";
import type { EveContextBuilder } from "@/features/eve/context/builder";

const citation = {
  rank: 1, score: 4, excerpt: "La fotosintesi converte energia luminosa in energia chimica.", matched_terms: ["fotosintesi"], exact_phrase: true,
  suspicious_content: false, safety_flags: [], citation: { locator: "m1:0-67", material_id: "m1", version_id: 1, version_number: 1, chunk_id: 1, chunk_index: 0, title: "Biologia", filename: "bio.txt", media_type: "text/plain", start_char: 0, end_char: 67, text_sha256: "a".repeat(64) },
};
const contextBuilder = { build: async () => ({ context: { userId: "u1", roomId: "r1", roles: ["student"], scope: "private", authorizedMaterialIds: ["m1"], issuedAt: "x", expiresAt: "y", nonce: "n", version: "1.4", checkpoint: "CORE-1.4" }, digest: "b".repeat(64), token: "t", audit: { auditId: "a", createdAt: "x" } }) } as unknown as EveContextBuilder;
const repository = {
  startTurn: async () => ({ turnId: "t1", conversationId: "c1", userMessageId: "u-msg" }),
  completeTurn: async () => ({ responseMessageId: "a-msg" }),
  failTurn: async () => undefined,
} as EveGroundedChatRepository;
const config = { enabled: true, maxMessageChars: 8000, maxSources: 6, requireCitations: true, allowGeneralKnowledge: false, defaultDepth: "normal", deterministicFallback: true, feedbackEnabled: true } as const;

describe("CORE-2.0 grounded chat", () => {
  it("accetta output strutturato con citazione registrata", async () => {
    const gateway = {
      ragChat: async () => ({ message: "", provider: "local-rag", model: "r", uncertainty: "", grounded: true, knowledge_scope: "", retrieval_stage: "lexical", query_sha256: "c".repeat(64), answer_sha256: "d".repeat(64), total_candidates: 1, integrity_failures: 0, excluded_suspicious_hits: 0, sources: [citation], proposed_actions: [] }),
      modelChat: async () => ({ message: JSON.stringify({ answer: "La fotosintesi trasforma energia.", facts: [{ text: "Trasforma energia luminosa.", basis: "material", citations: ["S1"], confidence: "low" }], hypotheses: [], suggestions: [] }), provider: "external", model: "real", uncertainty: "low", sources: [], proposed_actions: [] }),
      openSource: async () => { throw new Error("not used"); },
    } as EveGroundedChatGateway;
    const result = await new EveGroundedChatService(contextBuilder, gateway, repository, config).run("u1", { roomId: "r1", message: "Cos'è?", authorizedMaterialIds: ["m1"] });
    expect(result.grounded).toBe(true);
    expect(result.citations[0].id).toBe("S1");
    expect(result.facts[0].basis).toBe("material");
    expect(result.memoryWritten).toBe(false);
  });

  it("sostituisce una fonte inventata con fallback deterministico", async () => {
    const gateway = {
      ragChat: async () => ({ message: "", provider: "local-rag", model: "r", uncertainty: "", grounded: true, knowledge_scope: "", retrieval_stage: "lexical", query_sha256: "c".repeat(64), answer_sha256: "d".repeat(64), total_candidates: 1, integrity_failures: 0, excluded_suspicious_hits: 0, sources: [citation], proposed_actions: [] }),
      modelChat: async () => ({ message: JSON.stringify({ answer: "x", facts: [{ text: "x", basis: "material", citations: ["S99"], confidence: "low" }], hypotheses: [], suggestions: [] }), provider: "external", model: "real", uncertainty: "low", sources: [], proposed_actions: [] }),
      openSource: async () => { throw new Error("not used"); },
    } as EveGroundedChatGateway;
    const result = await new EveGroundedChatService(contextBuilder, gateway, repository, config).run("u1", { roomId: "r1", message: "Cos'è?", authorizedMaterialIds: ["m1"] });
    expect(result.fallbackUsed).toBe(true);
    expect(result.citations.every((item) => item.id === "S1")).toBe(true);
  });
});
