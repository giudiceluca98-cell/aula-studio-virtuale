import { z } from "zod";

export const courseRemovalRequestSchema = z.object({
  mode: z.enum(["course_only", "course_and_contents"]),
}).strict();

export const roomContentIdSchema = z.string().uuid();

export interface StorageCleanupJob {
  id: string;
  storagePath: string;
}

export interface CourseRemovalImpact {
  id: string;
  title: string;
  materialCount: number;
  taskCount: number;
  progressCount: number;
  importedFromCatalog: boolean;
  alreadyRemoved: boolean;
}

export interface MaterialRemovalImpact {
  id: string;
  title: string;
  type: string;
  courseTitle: string | null;
  readerProgressCount: number;
  noteCount: number;
  checklistCount: number;
  importedFromCatalog: boolean;
  uploadedFile: boolean;
  alreadyRemoved: boolean;
}

export function isAuthorizedRoomContentRole(
  role: "owner" | "admin" | "member",
  createdBy: string | null | undefined,
  userId: string,
): boolean {
  return role === "owner" || role === "admin" || createdBy === userId;
}

export function parseCleanupJobs(value: unknown): StorageCleanupJob[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.storage_path !== "string") return [];
    return [{ id: record.id, storagePath: record.storage_path }];
  });
}
