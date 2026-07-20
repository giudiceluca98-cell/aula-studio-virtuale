import { z } from "zod";

const uuid = z.string().uuid();
const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalId = uuid.optional();
const nonNegativeInt = z.number().int().nonnegative();
const httpUrl = z
  .string()
  .trim()
  .max(2_048)
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Only HTTP(S) URLs are accepted");

const baseFields = {
  eventId: uuid,
  roomId: uuid,
  userId: uuid,
  timestamp: z.string().datetime({ offset: true }),
};

const sessionStartedData = z
  .object({
    sessionId: optionalId,
    courseId: optionalId,
    mode: z
      .enum(["focus", "pomodoro", "short_break", "long_break", "custom"])
      .optional(),
    plannedMinutes: z.number().int().min(1).max(480).optional(),
  })
  .strict();

const sessionPausedData = z
  .object({
    sessionId: optionalId,
    elapsedSeconds: nonNegativeInt.max(86_400).optional(),
  })
  .strict();

const sessionCompletedData = z
  .object({
    sessionId: optionalId,
    durationSeconds: nonNegativeInt.max(86_400).optional(),
    lessonsCompleted: nonNegativeInt.max(10_000).optional(),
    exercisesCompleted: nonNegativeInt.max(100_000).optional(),
    notesAdded: nonNegativeInt.max(10_000).optional(),
  })
  .strict();

const progressUpdatedData = z
  .object({
    course: shortText(160).optional(),
    courseId: optionalId,
    chapter: z
      .union([nonNegativeInt.max(10_000), shortText(120)])
      .optional(),
    lesson: shortText(200).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
    studyMinutes: nonNegativeInt.max(1_000_000).optional(),
    exercisesCompleted: nonNegativeInt.max(100_000).optional(),
    score: z.number().finite().min(0).max(1_000_000).optional(),
    notes: z.string().trim().max(5_000).optional(),
    nextGoal: z.string().trim().max(500).optional(),
  })
  .strict();

const exerciseCompletedData = z
  .object({
    courseId: optionalId,
    exerciseId: optionalId,
    exercise: shortText(240).optional(),
    score: z.number().finite().min(0).max(1_000_000).optional(),
  })
  .strict();

const materialOpenedData = z
  .object({
    materialId: optionalId,
    title: shortText(240).optional(),
    url: httpUrl.optional(),
  })
  .strict();

const noteCreatedData = z
  .object({
    noteId: optionalId,
    content: z.string().trim().min(1).max(10_000).optional(),
    isPrivate: z.boolean().optional(),
  })
  .strict();

const userLeftRoomData = z
  .object({
    durationSeconds: nonNegativeInt.max(86_400),
    lessonsCompleted: z.union([
      nonNegativeInt.max(10_000),
      z.array(shortText(240)).max(500),
    ]),
    exercisesCompleted: nonNegativeInt.max(100_000),
    lastResourceOpened: z
      .union([z.string().trim().max(2_048), z.null()])
      .optional(),
    lastMaterialId: z.union([uuid, z.null()]).optional(),
    notesAdded: nonNegativeInt.max(10_000),
    finalTimerStatus: z.enum(["idle", "running", "paused", "completed"]),
  })
  .strict();

export const webhookPayloadSchema = z.discriminatedUnion("event", [
  z
    .object({
      ...baseFields,
      event: z.literal("session_started"),
      data: sessionStartedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("session_paused"),
      data: sessionPausedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("session_completed"),
      data: sessionCompletedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("progress_updated"),
      data: progressUpdatedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("exercise_completed"),
      data: exerciseCompletedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("material_opened"),
      data: materialOpenedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("note_created"),
      data: noteCreatedData,
    })
    .strict(),
  z
    .object({
      ...baseFields,
      event: z.literal("user_left_room"),
      data: userLeftRoomData,
    })
    .strict(),
]);

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type WebhookEventType = WebhookPayload["event"];
