import type { CatalogLevel } from "../types";

export type SubjectMaterialType =
  | "course" | "video" | "book" | "pdf" | "article" | "documentation"
  | "exercise" | "quiz" | "project" | "simulator" | "lecture" | "podcast" | "interactive";

export interface SubjectGoogleQueries {
  lessons: string[];
  exercises: string[];
  videos: string[];
  pdfs: string[];
}

export interface SubjectStage {
  id: string;
  order: number;
  title: string;
  description: string;
  prerequisites: string[];
  concepts: string[];
  objectives: string[];
  lessons: string[];
  activities: string[];
  exercises: string[];
  projects: string[];
  completionCriteria: string[];
  googleQueries: SubjectGoogleQueries;
  estimatedMinutes: number;
}

export interface SubjectRecommendedMaterial {
  title: string;
  provider: string;
  url: string;
  type: SubjectMaterialType;
  language: string;
  level: CatalogLevel;
  description: string;
  stageIds: string[];
  verified: true;
}

export interface SubjectPackage {
  id: string;
  name: string;
  pathTitle: string;
  aliases: string[];
  description: string;
  prerequisites: string[];
  targetProfiles: string[];
  branches: Array<{ id: string; title: string; description: string }>;
  entryStageByLevel: Record<CatalogLevel, string>;
  stages: SubjectStage[];
  recommendedMaterials: SubjectRecommendedMaterial[];
}
