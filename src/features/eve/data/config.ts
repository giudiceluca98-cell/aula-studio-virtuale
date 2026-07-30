import "server-only";

export interface EveDatabaseConfig {
  enabled: boolean;
  importsEnabled: boolean;
  expectedSchemaVersion: "1.3.0";
}

const bool = (value: string | undefined): boolean => ["1", "true", "yes"].includes(value?.trim().toLowerCase() ?? "");

export function readEveDatabaseConfig(env: NodeJS.ProcessEnv = process.env): EveDatabaseConfig {
  const enabled = bool(env.EVE_PRODUCTION_DATABASE_ENABLED);
  return {
    enabled,
    importsEnabled: enabled && bool(env.EVE_SQLITE_IMPORT_ENABLED),
    expectedSchemaVersion: "1.3.0",
  };
}
