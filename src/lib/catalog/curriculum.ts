import type {
  CatalogMaterial, EveCurriculumDraft, LearningPathDraft, WebResourceType, WebSearchMaterial,
} from "./types";

export const CURRICULUM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    objective: { type: "string" },
    initialLevel: { type: "string", enum: ["no_experience", "beginner", "intermediate", "advanced", "professional", "university"] },
    targetLevel: { type: "string", enum: ["no_experience", "beginner", "intermediate", "advanced", "professional", "university"] },
    weeklyHours: { type: "number", minimum: 0.5, maximum: 168 },
    rationale: { type: "string" },
    modules: {
      type: "array", minItems: 2, maxItems: 12,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          title: { type: "string" }, description: { type: "string" }, estimatedDurationMinutes: { type: ["integer", "null"] },
          prerequisites: { type: "array", items: { type: "string" }, maxItems: 15 },
          completionCriteria: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 15 },
          items: {
            type: "array", minItems: 1, maxItems: 30,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                itemType: { type: "string", enum: ["material", "exercise", "project", "checkpoint"] },
                title: { type: "string" }, description: { type: "string" },
                sourceUrl: { type: ["string", "null"] },
                resourceType: { type: ["string", "null"], enum: ["page", "pdf", "document", "dataset", "notebook", "archive", "file", "video", "course", "book", "podcast", null] },
                isRequired: { type: "boolean" }, estimatedDurationMinutes: { type: ["integer", "null"] },
              },
              required: ["itemType", "title", "description", "sourceUrl", "resourceType", "isRequired", "estimatedDurationMinutes"],
            },
          },
        },
        required: ["title", "description", "estimatedDurationMinutes", "prerequisites", "completionCriteria", "items"],
      },
    },
  },
  required: ["title", "objective", "initialLevel", "targetLevel", "weeklyHours", "rationale", "modules"],
} as const;

export type IngestedDiscovery = { source_url: string; material_id: string; created: boolean };

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return "";
  }
}

export function catalogTypeForResource(type: WebResourceType) {
  if (type === "pdf") return "pdf";
  if (type === "notebook") return "exercise";
  if (type === "video") return "video";
  if (type === "course") return "course";
  if (type === "book") return "book";
  if (type === "podcast") return "podcast";
  if (type === "page") return "article";
  return "documentation";
}

export function enrichWebSources(curriculum: EveCurriculumDraft, sources: WebSearchMaterial[]) {
  const declared = new Map<string, EveCurriculumDraft["modules"][number]["items"][number]>();
  for (const learningModule of curriculum.modules) for (const item of learningModule.items) {
    if (item.itemType === "material" && item.sourceUrl) declared.set(canonicalUrl(item.sourceUrl), item);
  }
  return sources.map((source) => {
    const item = declared.get(canonicalUrl(source.url));
    return item?.resourceType ? { ...source, resourceType: item.resourceType } : source;
  });
}

export function discoveryPayload(sources: WebSearchMaterial[]) {
  return sources.map((source) => ({
    sourceUrl: source.url,
    title: source.title,
    description: source.description,
    provider: source.domain,
    language: "und",
    materialType: catalogTypeForResource(source.resourceType),
  }));
}

export function assembleCurriculum(
  curriculum: EveCurriculumDraft,
  webSources: WebSearchMaterial[],
  existingMaterials: CatalogMaterial[],
  ingested: IngestedDiscovery[],
): LearningPathDraft {
  const allowedUrls = new Set(webSources.map((source) => canonicalUrl(source.url)));
  const materialIds = new Map<string, string>();
  const sourceDetails = new Map<string, WebSearchMaterial>();
  for (const source of webSources) sourceDetails.set(canonicalUrl(source.url), source);
  for (const material of existingMaterials) {
    const key = canonicalUrl(material.source_url);
    allowedUrls.add(key);
    materialIds.set(key, material.id);
  }
  for (const row of ingested) materialIds.set(canonicalUrl(row.source_url), row.material_id);
  const availableFallbacks = webSources.filter((source) => materialIds.has(canonicalUrl(source.url)));

  const modules = curriculum.modules.map((module, moduleIndex) => {
    const items: LearningPathDraft["modules"][number]["items"] = [];
    for (const item of module.items) {
      if (item.itemType === "material") {
        const key = item.sourceUrl ? canonicalUrl(item.sourceUrl) : "";
        const catalogMaterialId = key && allowedUrls.has(key) ? materialIds.get(key) : null;
        if (!catalogMaterialId) continue;
        const source = sourceDetails.get(key);
        items.push({
          catalogMaterialId,
          itemType: "material",
          title: source?.title ?? item.title,
          description: item.description,
          isRequired: item.isRequired,
          estimatedDurationMinutes: item.estimatedDurationMinutes,
          sourceUrl: item.sourceUrl,
          resourceType: item.resourceType,
        });
      } else {
        items.push({
          catalogMaterialId: null,
          itemType: item.itemType,
          title: item.title,
          description: item.description,
          isRequired: item.isRequired,
          estimatedDurationMinutes: item.estimatedDurationMinutes,
          sourceUrl: null,
          resourceType: null,
        });
      }
    }
    if (!items.some((item) => item.itemType === "material") && availableFallbacks.length > 0) {
      const source = availableFallbacks[moduleIndex % availableFallbacks.length];
      const catalogMaterialId = materialIds.get(canonicalUrl(source.url));
      if (catalogMaterialId) {
        items.unshift({
          catalogMaterialId,
          itemType: "material",
          title: source.title,
          description: source.description,
          isRequired: false,
          estimatedDurationMinutes: null,
          sourceUrl: source.url,
          resourceType: source.resourceType,
        });
      }
    }
    if (!items.some((item) => item.itemType !== "material")) {
      items.push({
        catalogMaterialId: null,
        itemType: moduleIndex === curriculum.modules.length - 1 ? "checkpoint" : "exercise",
        title: moduleIndex === curriculum.modules.length - 1 ? "Verifica finale" : "Esercizio della tappa",
        description: `Dimostra di aver raggiunto: ${module.completionCriteria.join("; ")}`,
        isRequired: true,
        estimatedDurationMinutes: 60,
        sourceUrl: null,
        resourceType: null,
      });
    }
    return { ...module, items };
  });
  return { ...curriculum, modules };
}
