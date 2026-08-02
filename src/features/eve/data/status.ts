import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { readEveDatabaseConfig } from "./config";
import { EVE_DATABASE_TABLES, type EveDatabaseStatus } from "./contracts";

export async function readEveDatabaseStatus(): Promise<EveDatabaseStatus> {
  const config = readEveDatabaseConfig();
  const base = { checkpoint: "CORE-1.3" as const, enabled: config.enabled, importsEnabled: config.importsEnabled, expectedSchemaVersion: config.expectedSchemaVersion, tables: EVE_DATABASE_TABLES };
  if (!config.enabled) return { ...base, state: "disabled", observedSchemaVersion: null, migration: null, counts: {}, detail: "Database Eve disattivato dal feature flag" };
  try {
    const db = createAdminClient();
    const metadata = await db.from("eve_schema_metadata").select("key,value").in("key", ["schema_version", "migration"]);
    if (metadata.error) throw new Error("metadata_unavailable");
    const values = Object.fromEntries((metadata.data ?? []).map((item) => [item.key, item.value]));
    const observed = typeof values.schema_version === "string" ? values.schema_version : null;
    const migration = typeof values.migration === "string" ? values.migration : null;
    const countEntries = await Promise.all(EVE_DATABASE_TABLES.map(async (table) => {
      const result = await db.from(table).select("*", { count: "exact", head: true });
      if (result.error) throw new Error(`table_unavailable:${table}`);
      return [table, result.count ?? 0] as const;
    }));
    const state = observed === config.expectedSchemaVersion ? "ready" : "schema_mismatch";
    return { ...base, state, observedSchemaVersion: observed, migration, counts: Object.fromEntries(countEntries), detail: state === "ready" ? "Schema Eve disponibile e isolato" : "Versione schema Eve non allineata" };
  } catch {
    return { ...base, state: "unavailable", observedSchemaVersion: null, migration: null, counts: {}, detail: "Database Eve non disponibile" };
  }
}
