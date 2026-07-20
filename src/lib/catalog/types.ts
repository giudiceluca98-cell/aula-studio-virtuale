export type CatalogLevel = "no_experience" | "beginner" | "intermediate" | "advanced" | "professional" | "university";
export type CatalogObjectiveType = "subject" | "topic" | "goal" | "profession" | "project" | "exam" | "exploration";

export interface CatalogTopic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  topic_type: "area" | "subject" | "skill" | "profession" | "project" | "exam";
  level: string | null;
  aliases: string[];
  sort_order: number;
}

export interface CatalogMaterialTopicLink {
  topic_id: string;
  relevance_score: number;
  is_primary: boolean;
}

export interface CatalogMaterial {
  id: string;
  title: string;
  description: string;
  author: string | null;
  provider: string;
  source_url: string;
  material_type: string;
  language: string;
  level: CatalogLevel;
  estimated_duration_minutes: number | null;
  price_type: "free" | "paid" | "freemium" | "unknown";
  price: number | null;
  currency: string | null;
  certificate_available: boolean | null;
  prerequisites: string[];
  license_type: string | null;
  verification_status: "verified" | "official_source" | "community" | "pending";
  source_origin: "verified" | "internal" | "community" | "external";
  verified_at: string | null;
  last_checked_at: string | null;
  viewer_compatibility: "internal" | "external" | "download";
  access_mode?: "internal" | "embedded" | "import-required" | "external-unmonitored" | "unsupported";
  monitoring_level?: "full" | "partial" | "opened-only" | "none";
  internal_viewer?: "pdf" | "text" | "document" | "presentation" | "video" | "web-article" | "exercise" | "lesson" | null;
  import_status?: "ready" | "pending" | "failed" | "not-required";
  internal_resource_id?: string | null;
  access_requirements: string[];
  topicLinks: CatalogMaterialTopicLink[];
}

export interface CatalogFilters {
  language?: string;
  level?: CatalogLevel;
  materialType?: string;
  priceType?: "free" | "paid" | "freemium" | "unknown";
  verifiedOnly?: boolean;
  certificateOnly?: boolean;
}

export interface CatalogInterpretation {
  objectiveType: CatalogObjectiveType;
  normalizedObjective: string;
  detectedTopicSlugs: string[];
  suggestedDirectionSlugs: string[];
  clarificationQuestions: string[];
  summary: string;
  source: "deterministic" | "eve";
}

export interface RankedCatalogMaterial extends CatalogMaterial {
  relevance: number;
  recommendationReasons: string[];
}

export type WebResourceType = "page" | "pdf" | "document" | "dataset" | "notebook" | "archive" | "file" | "video" | "course" | "book" | "podcast";

export interface WebSearchMaterial {
  title: string;
  url: string;
  domain: string;
  description: string;
  sourceType: "web";
  resourceType: WebResourceType;
  fileExtension: string | null;
}

export interface EveCurriculumItemDraft {
  itemType: "material" | "exercise" | "project" | "checkpoint";
  title: string;
  description: string;
  sourceUrl: string | null;
  resourceType: WebResourceType | null;
  isRequired: boolean;
  estimatedDurationMinutes: number | null;
}

export interface EveCurriculumDraft {
  title: string;
  objective: string;
  initialLevel: CatalogLevel;
  targetLevel: CatalogLevel;
  weeklyHours: number;
  rationale: string;
  modules: Array<{
    title: string;
    description: string;
    estimatedDurationMinutes: number | null;
    prerequisites: string[];
    completionCriteria: string[];
    items: EveCurriculumItemDraft[];
  }>;
}

export interface LearningPathItemDraft {
  catalogMaterialId: string | null;
  itemType: "material" | "exercise" | "project" | "checkpoint";
  title: string;
  description: string;
  isRequired: boolean;
  estimatedDurationMinutes: number | null;
  sourceUrl?: string | null;
  resourceType?: WebResourceType | null;
}

export interface LearningPathModuleDraft {
  stageId?: string;
  title: string;
  description: string;
  estimatedDurationMinutes: number | null;
  prerequisites: string[];
  completionCriteria: string[];
  items: LearningPathItemDraft[];
  concepts?: string[];
  objectives?: string[];
  activities?: string[];
  exercises?: string[];
  projects?: string[];
  googleQueries?: {
    lessons: string[];
    exercises: string[];
    videos: string[];
    pdfs: string[];
  };
}

export interface LearningPathDraft {
  title: string;
  objective: string;
  initialLevel: CatalogLevel;
  targetLevel: CatalogLevel;
  weeklyHours: number;
  rationale: string;
  modules: LearningPathModuleDraft[];
}
