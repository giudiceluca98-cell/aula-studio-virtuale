import { describe, expect, it } from "vitest";
import { EveMvpService } from "@/features/eve/mvp/service";
import type { EveMvpRepository } from "@/features/eve/mvp/repository";
import type { EveMvpGateway } from "@/features/eve/mvp/service";

const config = { enabled: true, maxQuestionChars: 8000, maxSources: 4, requireCitations: true, feedbackEnabled: true };
const contextBuilder = {
  async build(userId: string, request: { roomId: string; primaryMaterialId?: string }) {
    if (request.roomId !== "room-a") throw new Error("cross-room");
    return {
      context: {
        version: "1.4" as const, checkpoint: "CORE-1.4" as const, userId, roomId: request.roomId,
        roles: ["student" as const], scope: "private" as const,
        primaryMaterialId: request.primaryMaterialId,
        authorizedMaterialIds: request.primaryMaterialId ? [request.primaryMaterialId] : [],
        issuedAt: "2026-07-30T00:00:00Z", expiresAt: "2026-07-30T00:05:00Z", nonce: "nonce",
      },
      token: "signed-token", digest: "a".repeat(64), audit: { auditId: "audit-1", createdAt: "2026-07-30T00:00:00Z" },
    };
  },
} as never;

class FakeRepository implements EveMvpRepository {
  failures: string[] = [];
  completed = 0;
  async startRun() { return { runId: "run-1", conversationId: "conv-1", userMessageId: "msg-user" }; }
  async completeRun() { this.completed += 1; return { responseMessageId: "msg-assistant" }; }
  async failRun(_runId: string, _roomId: string, errorCode: string) { this.failures.push(errorCode); }
  async recordFeedback() { return { feedbackId: "feedback-1", updatedAt: "2026-07-30T00:00:00Z" }; }
}

const citation = {
  rank: 1, score: 9, excerpt: "Una fonte autorizzata", matched_terms: ["fonte"], exact_phrase: false,
  suspicious_content: false, safety_flags: [],
  citation: {
    locator: "char:0-24", material_id: "material-a", version_id: 1, version_number: 1,
    chunk_id: 1, chunk_index: 0, title: "Materiale A", filename: "a.txt", media_type: "text/plain",
    start_char: 0, end_char: 24, text_sha256: "b".repeat(64),
  },
};

function gateway(overrides: Partial<Awaited<ReturnType<EveMvpGateway["ragChat"]>>> = {}): EveMvpGateway {
  return {
    async ragChat() {
      return {
        message: "Risposta verificata", provider: "mock", model: "grounded-v1", uncertainty: "low",
        grounded: true, knowledge_scope: "authorized", retrieval_stage: "hybrid", query_sha256: "c".repeat(64),
        answer_sha256: "d".repeat(64), total_candidates: 1, integrity_failures: 0,
        excluded_suspicious_hits: 0, sources: [citation], proposed_actions: [], ...overrides,
      };
    },
    async openSource(request) {
      return {
        opened: true, room_id: request.room_id, locator: request.locator, material_id: "material-a", title: "Materiale A",
        version_id: 1, version_number: 1, current_version_number: 1, is_current: true, stale: false,
        filename: "a.txt", media_type: "text/plain", source_type: "upload", chunk_id: 1, chunk_index: 0,
        start_char: 0, end_char: 24, text: "Una fonte autorizzata", text_sha256: "b".repeat(64),
        integrity_verified: true, expected_hash_verified: true, context_start_char: 0, context_end_char: 24,
        context_text: "Una fonte autorizzata", suspicious_content: false, safety_flags: [],
        content_trust: "untrusted_document_content", instructions_executable: false, navigation: {},
      };
    },
  };
}

describe("CORE-1.7 Gate MVP", () => {
  it("completa contesto, risposta citata e persistenza senza memoria o azioni", async () => {
    const repository = new FakeRepository();
    const service = new EveMvpService(contextBuilder, gateway(), repository, config);
    const result = await service.run("user-a", { question: "Spiega la fonte", roomId: "room-a", primaryMaterialId: "material-a" });
    expect(result.grounded).toBe(true);
    expect(result.citations).toHaveLength(1);
    expect(result.memoryWritten).toBe(false);
    expect(result.actionsExecuted).toBe(false);
    expect(repository.completed).toBe(1);
  });

  it("rifiuta citazioni cross-room o materiali non autorizzati", async () => {
    const repository = new FakeRepository();
    const bad = { ...citation, citation: { ...citation.citation, material_id: "material-b" } };
    const service = new EveMvpService(contextBuilder, gateway({ sources: [bad] }), repository, config);
    await expect(service.run("user-a", { question: "Domanda", roomId: "room-a", primaryMaterialId: "material-a" })).rejects.toThrow("non autorizzato");
    expect(repository.failures).toHaveLength(1);
  });

  it("ammette risposta non trovata soltanto senza citazioni e con grounded false", async () => {
    const service = new EveMvpService(contextBuilder, gateway({ grounded: false, uncertainty: "high", sources: [], message: "Non trovo una fonte sufficiente" }), new FakeRepository(), config);
    const result = await service.run("user-a", { question: "Domanda assente", roomId: "room-a" });
    expect(result.grounded).toBe(false);
    expect(result.uncertainty).toBe("high");
    expect(result.citations).toEqual([]);
  });

  it("blocca output con azioni proposte", async () => {
    const repository = new FakeRepository();
    const service = new EveMvpService(contextBuilder, gateway({ proposed_actions: [{ type: "write_memory" }] }), repository, config);
    await expect(service.run("user-a", { question: "Ricordalo", roomId: "room-a", primaryMaterialId: "material-a" })).rejects.toThrow("azioni");
    expect(repository.failures).toHaveLength(1);
  });

  it("apre soltanto una fonte verificata del materiale autorizzato", async () => {
    const service = new EveMvpService(contextBuilder, gateway(), new FakeRepository(), config);
    const result = await service.openSource("user-a", { roomId: "room-a", materialId: "material-a", locator: "char:0-24", expectedTextSha256: "b".repeat(64) });
    expect(result.integrityVerified).toBe(true);
    expect(result.instructionsExecutable).toBe(false);
  });
});
