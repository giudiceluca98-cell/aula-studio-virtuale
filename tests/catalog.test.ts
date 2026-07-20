import { describe, expect, it } from "vitest";
import {
  createDeterministicPath,
  interpretCatalogQuery,
  normalizeCatalogText,
  rankCatalogMaterials,
  sanitizeEveInterpretation,
} from "@/lib/catalog/search";
import type { CatalogMaterial, CatalogTopic } from "@/lib/catalog/types";

const topics: CatalogTopic[] = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Programmazione", slug: "programmazione", description: null, parent_id: null, topic_type: "area", level: null, aliases: ["coding"], sort_order: 1 },
  { id: "11000000-0000-4000-8000-000000000001", name: "Python", slug: "python", description: null, parent_id: "10000000-0000-4000-8000-000000000001", topic_type: "skill", level: "beginner", aliases: ["python 3"], sort_order: 1 },
];

const python: CatalogMaterial = {
  id: "20000000-0000-4000-8000-000000000001",
  title: "The Python Tutorial", description: "Official Python tutorial", author: null,
  provider: "Python Software Foundation", source_url: "https://docs.python.org/3/tutorial/",
  material_type: "documentation", language: "en", level: "beginner",
  estimated_duration_minutes: null, price_type: "free", price: null, currency: null,
  certificate_available: false, prerequisites: [], license_type: null,
  verification_status: "official_source", source_origin: "verified", verified_at: null,
  last_checked_at: null, viewer_compatibility: "external", access_requirements: [],
  topicLinks: [{ topic_id: topics[1].id, relevance_score: 1, is_primary: true }],
};

describe("catalogo deterministico", () => {
  it("normalizza accenti e riconosce argomenti e obiettivi", () => {
    expect(normalizeCatalogText("  Programmazione È Python  ")).toBe("programmazione e python");
    const result = interpretCatalogQuery("Voglio imparare Python", topics);
    expect(result.detectedTopicSlugs).toContain("python");
    expect(result.objectiveType).toBe("goal");
  });

  it("non confonde biologia con l'alias breve IA", () => {
    const aiTopic: CatalogTopic = { ...topics[0], id: "10000000-0000-4000-8000-000000000099", name: "Intelligenza artificiale", slug: "intelligenza-artificiale", aliases: ["ai", "ia"] };
    expect(interpretCatalogQuery("biologia", [aiTopic]).detectedTopicSlugs).toEqual([]);
  });

  it("rimuove dalla risposta di Eve gli slug che non esistono", () => {
    const safe = sanitizeEveInterpretation({
      objectiveType: "goal", normalizedObjective: "Python", detectedTopicSlugs: ["python", "corso-inventato"],
      suggestedDirectionSlugs: ["programmazione", "fonte-falsa"], clarificationQuestions: [], summary: "Percorso Python",
    }, topics);
    expect(safe.detectedTopicSlugs).toEqual(["python"]);
    expect(safe.suggestedDirectionSlugs).toEqual(["programmazione"]);
  });

  it("applica filtri e restituisce soltanto righe del catalogo", () => {
    const interpretation = interpretCatalogQuery("Python", topics);
    expect(rankCatalogMaterials("Python", interpretation, topics, [python], { verifiedOnly: true })).toHaveLength(1);
    expect(rankCatalogMaterials("Python", interpretation, topics, [python], { language: "it" })).toHaveLength(0);
  });

  it("non mostra fonti ufficiali prive di relazione con la ricerca", () => {
    const unrelated = { ...python, id: "20000000-0000-4000-8000-000000000002", title: "Algebra", description: "Equazioni e funzioni", provider: "Khan Academy", source_url: "https://www.khanacademy.org/math/algebra", topicLinks: [] };
    const interpretation = interpretCatalogQuery("Python", topics);
    expect(rankCatalogMaterials("Python", interpretation, topics, [python, unrelated])).toEqual([
      expect.objectContaining({ id: python.id }),
    ]);
  });

  it("non usa le aree generiche come risultati per una materia sconosciuta", () => {
    const interpretation = interpretCatalogQuery("biologia", topics);
    expect(rankCatalogMaterials("biologia", interpretation, topics, [python])).toEqual([]);
  });

  it("costruisce il percorso usando soltanto gli ID dei materiali forniti", () => {
    const path = createDeterministicPath("Imparare Python", [python], "no_experience", "intermediate", 5);
    const materialIds = path.modules.flatMap((module) => module.items).filter((item) => item.itemType === "material").map((item) => item.catalogMaterialId);
    expect(materialIds).toEqual([python.id]);
    expect(path.modules.at(-1)?.items.some((item) => item.itemType === "checkpoint")).toBe(true);
  });
});
