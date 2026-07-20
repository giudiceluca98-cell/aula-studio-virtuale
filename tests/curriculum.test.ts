import { describe, expect, it } from "vitest";
import { assembleCurriculum, discoveryPayload, enrichWebSources } from "@/lib/catalog/curriculum";
import type { CatalogMaterial, EveCurriculumDraft, WebSearchMaterial } from "@/lib/catalog/types";

const pdfUrl = "https://example.edu/manuale.pdf";
const videoUrl = "https://video.example.edu/lezione";

const curriculum: EveCurriculumDraft = {
  title: "Percorso di fisica",
  objective: "Imparare la fisica dalle basi",
  initialLevel: "no_experience",
  targetLevel: "intermediate",
  weeklyHours: 5,
  rationale: "Prima i fondamenti, poi gli esperimenti.",
  modules: [
    {
      title: "Meccanica",
      description: "Moto e forze",
      estimatedDurationMinutes: 300,
      prerequisites: [],
      completionCriteria: ["Risolvere problemi sul moto"],
      items: [
        { itemType: "material", title: "Manuale", description: "Dispensa", sourceUrl: pdfUrl, resourceType: "pdf", isRequired: true, estimatedDurationMinutes: 120 },
        { itemType: "material", title: "Fonte inventata", description: "Da scartare", sourceUrl: "https://hallucinated.invalid/file", resourceType: "document", isRequired: false, estimatedDurationMinutes: 30 },
        { itemType: "exercise", title: "Problemi", description: "Dieci esercizi", sourceUrl: null, resourceType: null, isRequired: true, estimatedDurationMinutes: 60 },
      ],
    },
    {
      title: "Onde",
      description: "Onde e suono",
      estimatedDurationMinutes: 240,
      prerequisites: ["Meccanica"],
      completionCriteria: ["Descrivere frequenza e ampiezza"],
      items: [
        { itemType: "material", title: "Videolezione", description: "Lezione guidata", sourceUrl: videoUrl, resourceType: "video", isRequired: true, estimatedDurationMinutes: 45 },
      ],
    },
  ],
};

const sources: WebSearchMaterial[] = [
  { title: "Manuale ufficiale", url: pdfUrl, domain: "example.edu", description: "Manuale completo", sourceType: "web", resourceType: "page", fileExtension: "pdf" },
  { title: "Videolezione", url: videoUrl, domain: "video.example.edu", description: "Lezione sulle onde", sourceType: "web", resourceType: "page", fileExtension: null },
];

function existingMaterial(): CatalogMaterial {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Fonte esistente",
    description: "Catalogo",
    author: null,
    provider: "Example",
    source_url: "https://example.edu/esistente",
    material_type: "course",
    language: "it",
    level: "beginner",
    estimated_duration_minutes: 60,
    price_type: "free",
    price: null,
    currency: null,
    certificate_available: null,
    prerequisites: [],
    license_type: null,
    verification_status: "official_source",
    source_origin: "verified",
    verified_at: null,
    last_checked_at: null,
    viewer_compatibility: "external",
    access_requirements: [],
    topicLinks: [],
  };
}

describe("percorso Eve e crescita del catalogo", () => {
  it("attribuisce alle fonti verificate il tipo dichiarato nel percorso", () => {
    expect(enrichWebSources(curriculum, sources).map((source) => source.resourceType)).toEqual(["pdf", "video"]);
  });

  it("prepara tutte le fonti trovate per il salvataggio batch", () => {
    const payload = discoveryPayload(enrichWebSources(curriculum, sources));
    expect(payload).toHaveLength(2);
    expect(payload.map((item) => item.materialType)).toEqual(["pdf", "video"]);
  });

  it("collega soltanto URL realmente restituiti dalla ricerca e ID persistiti", () => {
    const path = assembleCurriculum(curriculum, enrichWebSources(curriculum, sources), [existingMaterial()], [
      { source_url: pdfUrl, material_id: "11111111-1111-4111-8111-111111111111", created: true },
      { source_url: videoUrl, material_id: "22222222-2222-4222-8222-222222222222", created: false },
    ]);
    const materials = path.modules.flatMap((module) => module.items).filter((item) => item.itemType === "material");
    expect(materials.map((item) => item.catalogMaterialId)).toEqual([
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(materials.some((item) => item.sourceUrl?.includes("hallucinated.invalid"))).toBe(false);
    expect(path.modules.every((module) => module.items.some((item) => item.itemType !== "material"))).toBe(true);
  });
});
