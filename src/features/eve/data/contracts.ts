export const EVE_DATABASE_TABLES = Object.freeze([
  "eve_prompt_families", "eve_prompt_versions", "eve_material_assets", "eve_material_versions",
  "eve_material_chunks", "eve_research_projects", "eve_research_sources", "eve_source_reviews",
  "eve_source_promotions", "eve_conversations", "eve_messages", "eve_audit_events",
] as const);

export type EveDatabaseTable = (typeof EVE_DATABASE_TABLES)[number];
export type EveDatabaseState = "disabled" | "ready" | "unavailable" | "schema_mismatch";

export interface EveDatabaseStatus {
  checkpoint: "CORE-1.3";
  state: EveDatabaseState;
  enabled: boolean;
  importsEnabled: boolean;
  expectedSchemaVersion: "1.3.0";
  observedSchemaVersion: string | null;
  migration: string | null;
  tables: readonly EveDatabaseTable[];
  counts: Partial<Record<EveDatabaseTable, number>>;
  detail: string;
}

export type LegacyEntityKind =
  | "prompt_family" | "prompt_version" | "material" | "material_version" | "material_chunk"
  | "research_project" | "research_source" | "source_review" | "conversation" | "message" | "audit_event";

export interface LegacySqliteRecord {
  kind: LegacyEntityKind;
  legacyId: string;
  roomId: string;
  data: Record<string, unknown>;
}

export interface LegacySqliteExport {
  format: "eve-sqlite-export-v1";
  sourceFingerprint: string;
  exportedAt: string;
  records: readonly LegacySqliteRecord[];
}

export interface EveImportOperation {
  entityKind: LegacyEntityKind;
  legacyId: string;
  targetTable: EveDatabaseTable;
  targetId: string;
  onConflict: string;
  ignoreDuplicates: boolean;
  row: Record<string, unknown>;
}

export interface EveLegacyImportPlan {
  format: "eve-sqlite-export-v1";
  sourceFingerprint: string;
  batchKey: string;
  operations: readonly EveImportOperation[];
}
