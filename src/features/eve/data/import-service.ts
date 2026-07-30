import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readEveDatabaseConfig } from "./config";
import type { EveLegacyImportPlan } from "./contracts";

export interface EveImportResult { batchId: string; duplicate: boolean; imported: number; duplicates: number; }

export async function applyLegacyImportPlan(plan: EveLegacyImportPlan): Promise<EveImportResult> {
  const config = readEveDatabaseConfig();
  if (!config.enabled || !config.importsEnabled) throw new Error("Import SQLite Eve disattivato");
  const db = createAdminClient();
  const existing = await db.from("eve_import_batches").select("id,status,imported_count,duplicate_count").eq("batch_key", plan.batchKey).maybeSingle();
  if (existing.error) throw new Error("Verifica batch import non riuscita");
  if (existing.data?.status === "completed") return { batchId: existing.data.id, duplicate: true, imported: existing.data.imported_count, duplicates: existing.data.duplicate_count };

  const batchId = existing.data?.id ?? crypto.randomUUID();
  const start = await db.from("eve_import_batches").upsert({ id: batchId, batch_key: plan.batchKey, source_fingerprint: plan.sourceFingerprint, format_version: plan.format, status: "running", record_count: plan.operations.length, imported_count: 0, duplicate_count: 0, error_count: 0, error_code: null }, { onConflict: "batch_key" });
  if (start.error) throw new Error("Avvio batch import non riuscito");

  let imported = 0; const duplicates = 0;
  try {
    for (const operation of plan.operations) {
      const result = await db.from(operation.targetTable).upsert(operation.row, { onConflict: operation.onConflict, ignoreDuplicates: operation.ignoreDuplicates });
      if (result.error) throw new Error(`Import ${operation.entityKind} non riuscito`);
      const outcome = "imported";
      imported += 1;
      const item = await db.from("eve_import_items").upsert({ batch_id: batchId, entity_kind: operation.entityKind, legacy_id: operation.legacyId, target_table: operation.targetTable, target_id: operation.targetId, outcome }, { onConflict: "batch_id,entity_kind,legacy_id", ignoreDuplicates: true });
      if (item.error) throw new Error("Registrazione item import non riuscita");
    }
    const completed = await db.from("eve_import_batches").update({ status: "completed", imported_count: imported, duplicate_count: duplicates, completed_at: new Date().toISOString(), error_code: null }).eq("id", batchId);
    if (completed.error) throw new Error("Chiusura batch import non riuscita");
    return { batchId, duplicate: false, imported, duplicates };
  } catch (error) {
    await db.from("eve_import_batches").update({ status: "failed", imported_count: imported, duplicate_count: duplicates, error_count: 1, completed_at: new Date().toISOString(), error_code: "import_failed" }).eq("id", batchId);
    throw error;
  }
}
