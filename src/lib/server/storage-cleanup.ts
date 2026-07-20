import type { SupabaseClient } from "@supabase/supabase-js";

const LIST_PAGE_SIZE = 100;
const REMOVE_BATCH_SIZE = 100;

export class StorageCleanupError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "StorageCleanupError";
  }
}

function joinStoragePath(parent: string, name: string): string {
  return parent ? `${parent}/${name}` : name;
}

/** Lists every file below a prefix, including paginated and nested folders. */
export async function listStorageFiles(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const files: string[] = [];
  const pendingFolders = [prefix.replace(/^\/+|\/+$/g, "")];
  const visited = new Set<string>();

  while (pendingFolders.length) {
    const folder = pendingFolders.pop()!;
    if (visited.has(folder)) continue;
    visited.add(folder);

    let offset = 0;
    while (true) {
      const { data, error } = await client.storage.from(bucket).list(folder, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) {
        throw new StorageCleanupError(
          `Impossibile inventariare ${folder || "la radice"}.`,
          error.name,
        );
      }

      const entries = data ?? [];
      for (const entry of entries) {
        const path = joinStoragePath(folder, entry.name);
        if (entry.id) files.push(path);
        else pendingFolders.push(path);
      }
      if (entries.length < LIST_PAGE_SIZE) break;
      offset += entries.length;
    }
  }

  return [...new Set(files)];
}

/** Removes a complete inventory in bounded requests and fails on the first error. */
export async function removeStorageFiles(
  client: SupabaseClient,
  bucket: string,
  paths: readonly string[],
): Promise<void> {
  for (let index = 0; index < paths.length; index += REMOVE_BATCH_SIZE) {
    const batch = paths.slice(index, index + REMOVE_BATCH_SIZE);
    const { error } = await client.storage.from(bucket).remove(batch);
    if (error) {
      throw new StorageCleanupError(
        "La rimozione dei file non è stata completata.",
        error.name,
      );
    }
  }
}

export async function cleanupStoragePrefix(
  client: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<number> {
  const paths = await listStorageFiles(client, bucket, prefix);
  await removeStorageFiles(client, bucket, paths);
  return paths.length;
}
