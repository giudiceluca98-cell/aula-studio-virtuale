import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  cleanupStoragePrefix,
  listStorageFiles,
  StorageCleanupError,
} from "@/lib/server/storage-cleanup";

function storageClient(
  list: ReturnType<typeof vi.fn>,
  remove: ReturnType<typeof vi.fn> = vi.fn(async (paths: string[]) => ({ error: paths.length ? null : null })),
): SupabaseClient {
  return {
    storage: {
      from: vi.fn(() => ({ list, remove })),
    },
  } as unknown as SupabaseClient;
}

describe("pulizia ricorsiva Storage", () => {
  it("pagina la radice, visita le cartelle e rimuove in batch", async () => {
    const firstPage = [
      ...Array.from({ length: 99 }, (_, index) => ({
        id: `file-${index}`,
        name: `file-${index}.pdf`,
      })),
      { id: null, name: "utente" },
    ];
    const list = vi.fn(async (folder: string, options: { offset: number }) => {
      if (folder === "stanza" && options.offset === 0) return { data: firstPage, error: null };
      if (folder === "stanza" && options.offset === 100) return { data: [{ id: "last", name: "ultimo.txt" }], error: null };
      if (folder === "stanza/utente") return { data: [{ id: "nested", name: "appunti.pdf" }], error: null };
      return { data: [], error: null };
    });
    const remove = vi.fn(async (paths: string[]) => ({ error: paths.length ? null : null }));
    const client = storageClient(list, remove);

    const count = await cleanupStoragePrefix(client, "study-materials", "stanza");

    expect(count).toBe(101);
    expect(list).toHaveBeenCalledWith("stanza", expect.objectContaining({ offset: 100 }));
    expect(list).toHaveBeenCalledWith("stanza/utente", expect.any(Object));
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls.flatMap((call) => call[0])).toContain("stanza/utente/appunti.pdf");
  });

  it("interrompe la cancellazione se l'inventario non è completo", async () => {
    const client = storageClient(
      vi.fn(async () => ({ data: null, error: { name: "StorageUnknownError" } })),
    );

    await expect(listStorageFiles(client, "study-materials", "stanza"))
      .rejects.toBeInstanceOf(StorageCleanupError);
  });
});
