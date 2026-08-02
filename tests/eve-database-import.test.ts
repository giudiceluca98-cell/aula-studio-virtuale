import { describe, expect, it } from "vitest";
import { buildLegacyImportPlan } from "@/features/eve/data/import-plan";
const fingerprint = "a".repeat(64);
const sample = { format: "eve-sqlite-export-v1" as const, sourceFingerprint: fingerprint, exportedAt: "2026-07-29T20:00:00Z", records: [
  { kind: "material" as const, legacyId: "m1", roomId: "11111111-1111-1111-1111-111111111111", data: { title: "Manuale", sourceType: "upload" } },
  { kind: "material_version" as const, legacyId: "v1", roomId: "11111111-1111-1111-1111-111111111111", data: { materialLegacyId: "m1", versionNumber: 1, filename: "manuale.txt", mediaType: "text/plain", checksumSha256: "b".repeat(64), sizeBytes: 7, extractedText: "Manuale", extractedChars: 7, chunkCount: 0 } },
] };

describe("CORE-1.3 piano import SQLite", () => {
  it("produce ID e batch deterministici", () => { const first = buildLegacyImportPlan(sample); const second = buildLegacyImportPlan(sample); expect(first).toEqual(second); expect(first.operations).toHaveLength(2); expect(first.batchKey).toMatch(/^eve-legacy-v1:/); });
  it("mappa dipendenze legacy verso UUID deterministici", () => { const plan = buildLegacyImportPlan(sample); expect(plan.operations[1].row.material_id).toBe(plan.operations[0].targetId); });
  it("blocca fingerprint e record duplicati", () => { expect(() => buildLegacyImportPlan({ ...sample, sourceFingerprint: "no" })).toThrow(/sourceFingerprint/); expect(() => buildLegacyImportPlan({ ...sample, records: [sample.records[0], sample.records[0]] })).toThrow(/duplicato/); });
  it("non autorizza implicitamente import o approvazioni", () => { const plan = buildLegacyImportPlan(sample); expect(JSON.stringify(plan)).not.toContain("service_role"); expect(JSON.stringify(plan)).not.toContain("approved_web"); });
});
