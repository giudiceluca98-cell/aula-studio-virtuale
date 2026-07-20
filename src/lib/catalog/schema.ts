import { z } from "zod";

export const catalogLevelSchema = z.enum(["no_experience", "beginner", "intermediate", "advanced", "professional", "university"]);
const webResourceTypeSchema = z.enum(["page", "pdf", "document", "dataset", "notebook", "archive", "file", "video", "course", "book", "podcast"]);

export const catalogFiltersSchema = z.object({
  language: z.string().trim().min(2).max(35).optional(),
  level: catalogLevelSchema.optional(),
  materialType: z.string().trim().min(2).max(40).optional(),
  priceType: z.enum(["free", "paid", "freemium", "unknown"]).optional(),
  verifiedOnly: z.boolean().optional(),
  certificateOnly: z.boolean().optional(),
}).strict();

export const catalogSearchRequestSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  filters: catalogFiltersSchema.default({}),
  generalPath: z.boolean().default(false),
  includeWeb: z.boolean().default(false),
}).strict();

export const webSearchMaterialSchema = z.object({
  title: z.string().min(1).max(240),
  url: z.string().url().max(4096).refine((value) => value.startsWith("https://")),
  domain: z.string().min(1).max(160),
  description: z.string().min(1).max(4000),
  sourceType: z.literal("web"),
  resourceType: webResourceTypeSchema,
  fileExtension: z.string().min(1).max(8).nullable(),
}).strict();

export const eveInterpretationSchema = z.object({
  objectiveType: z.enum(["subject", "topic", "goal", "profession", "project", "exam", "exploration"]),
  normalizedObjective: z.string().min(1).max(1000),
  detectedTopicSlugs: z.array(z.string().min(1).max(120)).max(12),
  suggestedDirectionSlugs: z.array(z.string().min(1).max(120)).max(12),
  clarificationQuestions: z.array(z.string().min(1).max(240)).max(6),
  summary: z.string().min(1).max(1200),
}).strict();

export const pathItemSchema = z.object({
  catalogMaterialId: z.string().uuid().nullable(),
  itemType: z.enum(["material", "exercise", "project", "checkpoint"]),
  title: z.string().min(1).max(240),
  description: z.string().max(2000),
  isRequired: z.boolean(),
  estimatedDurationMinutes: z.number().int().min(1).max(100000).nullable(),
  sourceUrl: z.string().url().max(4096).refine((value) => value.startsWith("https://")).nullable().optional(),
  resourceType: webResourceTypeSchema.nullable().optional(),
}).strict().refine((value) => value.itemType !== "material" || value.catalogMaterialId !== null);

export const pathModuleSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().max(2000),
  estimatedDurationMinutes: z.number().int().min(1).max(100000).nullable(),
  prerequisites: z.array(z.string().min(1).max(240)).max(15),
  completionCriteria: z.array(z.string().min(1).max(240)).max(15),
  items: z.array(pathItemSchema).min(1).max(30),
}).strict();

export const eveLearningPathSchema = z.object({
  title: z.string().min(1).max(240),
  objective: z.string().min(1).max(2000),
  initialLevel: catalogLevelSchema,
  targetLevel: catalogLevelSchema,
  weeklyHours: z.number().min(0.5).max(168),
  rationale: z.string().min(1).max(2000),
  modules: z.array(pathModuleSchema).min(1).max(12),
}).strict();

export const eveCurriculumSchema = z.object({
  title: z.string().min(1).max(240),
  objective: z.string().min(1).max(2000),
  initialLevel: catalogLevelSchema,
  targetLevel: catalogLevelSchema,
  weeklyHours: z.number().min(0.5).max(168),
  rationale: z.string().min(1).max(2000),
  modules: z.array(z.object({
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(2000),
    estimatedDurationMinutes: z.number().int().min(1).max(100000).nullable(),
    prerequisites: z.array(z.string().min(1).max(240)).max(15),
    completionCriteria: z.array(z.string().min(1).max(240)).min(1).max(15),
    items: z.array(z.object({
      itemType: z.enum(["material", "exercise", "project", "checkpoint"]),
      title: z.string().min(1).max(240),
      description: z.string().min(1).max(2000),
      sourceUrl: z.string().url().max(4096).refine((value) => value.startsWith("https://")).nullable(),
      resourceType: webResourceTypeSchema.nullable(),
      isRequired: z.boolean(),
      estimatedDurationMinutes: z.number().int().min(1).max(100000).nullable(),
    }).strict().superRefine((value, context) => {
      if (value.itemType === "material" && (!value.sourceUrl || !value.resourceType)) {
        context.addIssue({ code: "custom", message: "material_requires_source" });
      }
      if (value.itemType !== "material" && (value.sourceUrl !== null || value.resourceType !== null)) {
        context.addIssue({ code: "custom", message: "activity_cannot_have_source" });
      }
    })).min(1).max(30),
  }).strict()).min(2).max(12),
}).strict();

export const catalogPathRequestSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  topicSlugs: z.array(z.string().min(1).max(120)).max(12).default([]),
  materialIds: z.array(z.string().uuid()).max(30).default([]),
  initialLevel: catalogLevelSchema.default("no_experience"),
  targetLevel: catalogLevelSchema.default("intermediate"),
  weeklyHours: z.number().min(0.5).max(168).default(5),
  curriculumId: z.string().uuid().nullable().default(null),
}).strict();

export const catalogActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save_material"), materialId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("unsave_material"), materialId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("import_material"), materialId: z.string().uuid(), roomId: z.string().uuid(), courseId: z.string().uuid().nullable().default(null) }).strict(),
  z.object({ action: z.literal("import_path"), pathId: z.string().uuid(), roomId: z.string().uuid() }).strict(),
  z.object({ action: z.literal("update_personalization"), allowProgressPersonalization: z.boolean() }).strict(),
  z.object({
    action: z.literal("save_web_material"),
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().min(1).max(4000),
    provider: z.string().trim().min(1).max(160),
    url: z.string().url().max(4096).refine((value) => value.startsWith("https://")),
    language: z.string().trim().min(2).max(35).default("und"),
    resourceType: webResourceTypeSchema.default("page"),
    fileExtension: z.string().trim().min(1).max(8).nullable().default(null),
  }).strict(),
]);
