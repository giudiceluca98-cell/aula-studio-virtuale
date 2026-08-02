import { createHash } from "node:crypto";
import type { EveDatabaseTable, EveImportOperation, EveLegacyImportPlan, LegacyEntityKind, LegacySqliteExport, LegacySqliteRecord } from "./contracts";

const TABLES: Record<LegacyEntityKind, { table: EveDatabaseTable; conflict: string; ignoreDuplicates?: boolean }> = {
  prompt_family: { table: "eve_prompt_families", conflict: "room_id,legacy_source_key" },
  prompt_version: { table: "eve_prompt_versions", conflict: "room_id,legacy_source_key" },
  material: { table: "eve_material_assets", conflict: "room_id,legacy_source_key" },
  material_version: { table: "eve_material_versions", conflict: "room_id,legacy_source_key" },
  material_chunk: { table: "eve_material_chunks", conflict: "room_id,legacy_source_key" },
  research_project: { table: "eve_research_projects", conflict: "room_id,legacy_source_key" },
  research_source: { table: "eve_research_sources", conflict: "room_id,legacy_source_key" },
  source_review: { table: "eve_source_reviews", conflict: "room_id,legacy_source_key" },
  conversation: { table: "eve_conversations", conflict: "room_id,legacy_source_key" },
  message: { table: "eve_messages", conflict: "conversation_id,legacy_source_key" },
  audit_event: { table: "eve_audit_events", conflict: "room_id,legacy_source_key", ignoreDuplicates: true },
};

const requiredText = (value: unknown, name: string, maximum = 4000): string => {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) throw new Error(`Campo legacy non valido: ${name}`);
  return value.trim();
};
const optionalText = (value: unknown, maximum = 4000): string | null => value == null ? null : requiredText(value, "optional", maximum);
const numberValue = (value: unknown, name: string, minimum = 0): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) throw new Error(`Numero legacy non valido: ${name}`);
  return value;
};
const fingerprint = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) throw new Error("sourceFingerprint deve essere SHA-256 esadecimale");
  return normalized;
};
const deterministicUuid = (seed: string): string => {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  hex[12] = "5"; hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  const value = hex.join("");
  return `${value.slice(0,8)}-${value.slice(8,12)}-${value.slice(12,16)}-${value.slice(16,20)}-${value.slice(20)}`;
};
const legacyKey = (record: LegacySqliteRecord): string => `${record.kind}:${record.legacyId}`;
const idFor = (source: string, kind: LegacyEntityKind, legacyId: string): string => deterministicUuid(`${source}|${kind}|${legacyId}`);
const refId = (source: string, kind: LegacyEntityKind, value: unknown, name: string): string => idFor(source, kind, requiredText(value, name, 240));

function mapRow(source: string, record: LegacySqliteRecord): Record<string, unknown> {
  const d = record.data;
  const base = { id: idFor(source, record.kind, record.legacyId), room_id: requiredText(record.roomId, "roomId", 120), legacy_source_key: legacyKey(record) };
  switch (record.kind) {
    case "prompt_family": return { ...base, prompt_key: requiredText(d.promptKey, "promptKey", 160), title: requiredText(d.title, "title", 240), course_id: optionalText(d.courseId, 120) };
    case "prompt_version": return { ...base, prompt_family_id: refId(source, "prompt_family", d.familyLegacyId, "familyLegacyId"), version_number: numberValue(d.versionNumber, "versionNumber", 1), body: requiredText(d.body, "body", 200000), status: d.status ?? "draft", checksum_sha256: requiredText(d.checksumSha256, "checksumSha256", 64), approved_by: d.approvedBy ?? null, approved_at: d.approvedAt ?? null };
    case "material": return { ...base, title: requiredText(d.title, "title", 240), course_id: optionalText(d.courseId, 120), source_type: d.sourceType ?? "upload", source_label: optionalText(d.sourceLabel, 500), status: d.status ?? "active" };
    case "material_version": return { ...base, material_id: refId(source, "material", d.materialLegacyId, "materialLegacyId"), version_number: numberValue(d.versionNumber, "versionNumber", 1), filename: requiredText(d.filename, "filename", 255), media_type: requiredText(d.mediaType, "mediaType", 160), checksum_sha256: requiredText(d.checksumSha256, "checksumSha256", 64), size_bytes: numberValue(d.sizeBytes, "sizeBytes"), extracted_text: d.extractedText ?? null, extracted_chars: numberValue(d.extractedChars ?? 0, "extractedChars"), chunk_count: numberValue(d.chunkCount ?? 0, "chunkCount"), metadata: d.metadata ?? {}, status: d.status ?? "active" };
    case "material_chunk": return { ...base, version_id: refId(source, "material_version", d.versionLegacyId, "versionLegacyId"), chunk_index: numberValue(d.chunkIndex, "chunkIndex"), start_char: numberValue(d.startChar, "startChar"), end_char: numberValue(d.endChar, "endChar"), text_content: requiredText(d.text, "text", 200000), text_sha256: requiredText(d.textSha256, "textSha256", 64), embedding_status: d.embeddingStatus ?? "not_requested" };
    case "research_project": return { ...base, title: requiredText(d.title, "title", 240), objective: requiredText(d.objective, "objective", 4000), domain: requiredText(d.domain, "domain", 160), language: requiredText(d.language ?? "it", "language", 16), status: d.status ?? "active", human_review_required: d.humanReviewRequired !== false };
    case "research_source": return { ...base, project_id: refId(source, "research_project", d.projectLegacyId, "projectLegacyId"), url: requiredText(d.url, "url", 4096), title: optionalText(d.title, 500), publisher: optionalText(d.publisher, 300), language: optionalText(d.language, 16), license: optionalText(d.license, 240), trust_level: d.trustLevel ?? "unreviewed", review_status: d.reviewStatus ?? "quarantined", content_sha256: d.contentSha256 ?? null, metadata: d.metadata ?? {} };
    case "source_review": return { ...base, source_id: refId(source, "research_source", d.sourceLegacyId, "sourceLegacyId"), reviewer_id: requiredText(d.reviewerId, "reviewerId", 120), status: d.status ?? "under_review", decision_reason: requiredText(d.decisionReason, "decisionReason", 4000), quality: numberValue(d.quality, "quality"), authority: numberValue(d.authority, "authority"), freshness: numberValue(d.freshness, "freshness"), relevance: numberValue(d.relevance, "relevance"), completeness: numberValue(d.completeness, "completeness"), suspicious_content: Boolean(d.suspiciousContent), prompt_injection_detected: Boolean(d.promptInjectionDetected), risk_acknowledged: Boolean(d.riskAcknowledged) };
    case "conversation": return { ...base, owner_id: requiredText(d.ownerId, "ownerId", 120), course_id: optionalText(d.courseId, 120), title: requiredText(d.title, "title", 240), status: d.status ?? "active" };
    case "message": return { ...base, conversation_id: refId(source, "conversation", d.conversationLegacyId, "conversationLegacyId"), author_id: d.authorId ?? null, role: d.role ?? "assistant", content: requiredText(d.content, "content", 100000), citations: d.citations ?? [], model_metadata: d.modelMetadata ?? {} };
    case "audit_event": return { ...base, actor_id: d.actorId ?? null, event_type: requiredText(d.eventType, "eventType", 160), entity_type: requiredText(d.entityType, "entityType", 120), entity_id: optionalText(d.entityId, 240), outcome: d.outcome ?? "success", metadata: d.metadata ?? {} };
  }
}

export function buildLegacyImportPlan(input: LegacySqliteExport): EveLegacyImportPlan {
  if (input.format !== "eve-sqlite-export-v1") throw new Error("Formato export SQLite non supportato");
  const source = fingerprint(input.sourceFingerprint);
  if (!Number.isFinite(Date.parse(input.exportedAt))) throw new Error("exportedAt non valido");
  const seen = new Set<string>();
  const operations: EveImportOperation[] = input.records.map((record) => {
    const key = legacyKey(record);
    if (seen.has(key)) throw new Error(`Record legacy duplicato: ${key}`);
    seen.add(key);
    const mapping = TABLES[record.kind];
    const row = mapRow(source, record);
    return { entityKind: record.kind, legacyId: record.legacyId, targetTable: mapping.table, targetId: String(row.id), onConflict: mapping.conflict, ignoreDuplicates: mapping.ignoreDuplicates ?? false, row };
  });
  const digest = createHash("sha256").update(JSON.stringify(operations)).digest("hex");
  return { format: input.format, sourceFingerprint: source, batchKey: `eve-legacy-v1:${source}:${digest.slice(0,32)}`, operations };
}
