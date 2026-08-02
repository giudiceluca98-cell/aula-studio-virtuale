import { describe, expect, it } from "vitest";
import { EveContextBuilder } from "@/features/eve/context/builder";
import type { EveContextRepository } from "@/features/eve/context/repository";
import type { EveContextAuditInput } from "@/features/eve/context/contracts";

const config = {
  enabled: true, maxSelectedChars: 100, maxAuthorizedMaterials: 3,
  tokenTtlSeconds: 300, sharedSelectionEnabled: false,
  signingSecret: "0123456789abcdef0123456789abcdef",
};

class FakeRepository implements EveContextRepository {
  audits: EveContextAuditInput[] = [];
  async getIdentity(userId: string, roomId: string) {
    return roomId === "room-a" ? { userId, roomId, memberRole: "member" as const, explicitRoles: [], joinedAt: "2026-01-01T00:00:00Z" } : null;
  }
  async getCourse(roomId: string, courseId: string) { return roomId === "room-a" && courseId === "course-a" ? { roomId, courseId, title: "Corso A" } : null; }
  async getMaterial(roomId: string, materialId: string) {
    return roomId === "room-a" && materialId === "material-a" ? {
      materialId, roomId, courseId: "course-a", title: "Lezione", sourceType: "upload", status: "active",
      currentVersionId: "version-a", checksumSha256: "a".repeat(64), metadata: { lesson_id: "lesson-a", section_id: "section-a" },
    } : null;
  }
  async getConversation(roomId: string, conversationId: string) { return roomId === "room-a" && conversationId === "conv-a" ? { roomId, conversationId, ownerId: "user-a", status: "active" } : null; }
  async recordAudit(input: EveContextAuditInput) { this.audits.push(input); return { auditId: "audit-a", createdAt: "2026-07-30T00:00:00Z" }; }
}

describe("CORE-1.4 Context Builder", () => {
  it("costruisce soltanto contesto verificato e audit senza testo", async () => {
    const repo = new FakeRepository();
    const builder = new EveContextBuilder(repo, config);
    const result = await builder.build("user-a", {
      roomId: "room-a", courseId: "course-a", conversationId: "conv-a",
      primaryMaterialId: "material-a", authorizedMaterialIds: ["material-a"],
      lessonId: "lesson-a", sectionId: "section-a", selectedText: "testo selezionato",
    }, new Date("2026-07-30T00:00:00Z"));
    expect(result.context.roles).toEqual(["student"]);
    expect(result.context.selectedText).toBe("testo selezionato");
    expect(result.context.authorizedMaterialIds).toEqual(["material-a"]);
    expect(repo.audits[0].selectedTextSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(repo.audits[0])).not.toContain("testo selezionato");
  });
  it("rifiuta aula, materiale e lezione non autorizzati", async () => {
    const builder = new EveContextBuilder(new FakeRepository(), config);
    await expect(builder.build("user-a", { roomId: "room-b" })).rejects.toThrow("appartenente");
    await expect(builder.build("user-a", { roomId: "room-a", primaryMaterialId: "material-b" })).rejects.toThrow("Materiale");
    await expect(builder.build("user-a", { roomId: "room-a", primaryMaterialId: "material-a", lessonId: "lesson-b" })).rejects.toThrow("Lezione");
  });
  it("mantiene private il contesto studente e blocca condivisione", async () => {
    const builder = new EveContextBuilder(new FakeRepository(), config);
    await expect(builder.build("user-a", { roomId: "room-a", scope: "room_shared" })).rejects.toThrow("ruolo");
  });
});
