import type { SupabaseClient } from "@supabase/supabase-js";
import { removeStorageFiles } from "./storage-cleanup";
import type { StorageCleanupJob } from "../room-content-removal";

export async function processRoomContentCleanupJobs(
  admin: SupabaseClient,
  jobs: readonly StorageCleanupJob[],
): Promise<{ removed: number; pending: number }> {
  let removed = 0;
  let pending = 0;

  for (const job of jobs) {
    try {
      await removeStorageFiles(admin, "study-materials", [job.storagePath]);
      const { error } = await admin
        .from("room_content_cleanup_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString(), error_code: null })
        .eq("id", job.id)
        .eq("status", "pending");
      if (error) throw error;
      removed += 1;
    } catch (error) {
      pending += 1;
      await admin
        .from("room_content_cleanup_jobs")
        .update({
          attempts: 1,
          error_code: error instanceof Error ? error.name.slice(0, 80) : "unknown",
        })
        .eq("id", job.id)
        .eq("status", "pending");
    }
  }

  return { removed, pending };
}
