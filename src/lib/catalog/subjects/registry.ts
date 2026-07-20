import { normalizeCatalogText } from "../search";
import type { SubjectPackage } from "./types";
import { programmingSubjectPackage } from "./programming";

export const subjectPackages: SubjectPackage[] = [programmingSubjectPackage];

export function resolveSubjectPackage(query: string): SubjectPackage | null {
  const normalized = normalizeCatalogText(query);
  return subjectPackages.find((subject) => subject.aliases.some((alias) => {
    const candidate = normalizeCatalogText(alias);
    return normalized === candidate || ` ${normalized} `.includes(` ${candidate} `);
  })) ?? null;
}

export function resolveLearningPath(query: string): { id: string; subjectId: string; title: string } | null {
  const subject = resolveSubjectPackage(query);
  if (!subject) return null;
  return {
    id: subject.id === "programming" ? "programming-zero" : `${subject.id}-path`,
    subjectId: subject.id,
    title: subject.pathTitle,
  };
}
