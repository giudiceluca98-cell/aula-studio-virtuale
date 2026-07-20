import { z } from "zod";

const watchedRangeSchema = z.object({ start: z.number().min(0).max(100_000_000), end: z.number().min(0).max(100_000_000) }).refine((range) => range.end > range.start);

export const materialLearningEventSchema = z.enum([
  "material_opened", "material_closed", "material_resumed",
  "reading_started", "reading_paused", "reading_completed",
  "video_started", "video_paused", "video_seeked", "video_completed",
  "exercise_started", "exercise_paused", "exercise_completed",
  "lesson_opened", "lesson_section_viewed", "lesson_section_completed",
  "guided_exercise_started", "guided_exercise_completed", "independent_exercise_completed",
  "quiz_started", "quiz_answer_submitted", "quiz_completed",
  "project_started", "project_submitted", "lesson_completed", "review_requested",
]);

export const materialLearningStateSchema = z.object({
  viewer: z.enum(["pdf", "text", "document", "presentation", "video", "web-article", "exercise", "lesson"]).nullable().optional(),
  state: z.enum(["opened", "active", "paused", "completed"]).default("active"),
  paragraphIndex: z.number().int().min(0).max(10_000_000).default(0),
  tokenIndex: z.number().int().min(0).max(100_000_000).default(0),
  scrollRatio: z.number().min(0).max(1).default(0),
  documentPosition: z.record(z.string(), z.unknown()).default({}),
  pageNumber: z.number().int().min(1).max(1_000_000).nullable().optional(),
  pageCount: z.number().int().min(1).max(1_000_000).nullable().optional(),
  videoTimeSeconds: z.number().min(0).max(100_000_000).default(0),
  videoDurationSeconds: z.number().min(0).max(100_000_000).default(0),
  watchedRanges: z.array(watchedRangeSchema).max(500).default([]),
  watchedUniqueSeconds: z.number().int().min(0).max(100_000_000).default(0),
  completionPercentage: z.number().min(0).max(100).default(0),
  activeSeconds: z.number().int().min(0).max(100_000_000).default(0),
  exerciseState: z.record(z.string(), z.unknown()).default({}),
}).strict();

export const materialProgressRequestSchema = z.object({
  state: materialLearningStateSchema,
  eventType: materialLearningEventSchema.nullable().optional(),
}).strict();

export type MaterialLearningState = z.infer<typeof materialLearningStateSchema>;
export type MaterialLearningEvent = z.infer<typeof materialLearningEventSchema>;
