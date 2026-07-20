import { describe, expect, it } from "vitest";
import { createSubjectRoadmap } from "@/lib/catalog/roadmap";
import type { CatalogMaterial } from "@/lib/catalog/types";

function material(id: string, title: string): CatalogMaterial {
  return {
    id,
    title,
    description: "Una risorsa verificata",
    author: null,
    provider: "Università di prova",
    source_url: `https://example.edu/${id}`,
    material_type: "course",
    language: "it",
    level: "beginner",
    estimated_duration_minutes: 120,
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

describe("percorsi gratuiti per materia", () => {
  it("crea un percorso completo di biologia senza materiali", () => {
    const path = createSubjectRoadmap("Voglio studiare biologia");
    expect(path.title).toBe("Percorso di biologia");
    expect(path.modules).toHaveLength(5);
    expect(path.modules.every((module) => module.items.length > 0)).toBe(true);
    expect(path.modules.at(-1)?.items.some((item) => item.itemType === "checkpoint")).toBe(true);
  });

  it.each([
    ["matematica", "Percorso di matematica"],
    ["ingegneria", "Percorso di ingegneria"],
    ["programmazione", "Programmazione da zero"],
  ])("riconosce %s", (query, title) => {
    expect(createSubjectRoadmap(query).title).toBe(title);
  });

  it("crea cinque tappe adattabili anche per una materia non prevista", () => {
    const path = createSubjectRoadmap("storia dell'arte medievale");
    expect(path.title).toBe("Percorso: storia dell'arte medievale");
    expect(path.modules).toHaveLength(5);
    expect(path.modules[0].title).toBe("Orientamento e obiettivi");
  });

  it("non confonde medicina con il percorso statico di biologia", () => {
    expect(createSubjectRoadmap("medicina").title).toBe("Percorso: medicina");
  });

  it("collega solo gli ID dei materiali realmente ricevuti", () => {
    const known = material("11111111-1111-4111-8111-111111111111", "Biologia di base");
    const path = createSubjectRoadmap("biologia", [known]);
    const linkedIds = path.modules.flatMap((module) => module.items)
      .filter((item) => item.itemType === "material")
      .map((item) => item.catalogMaterialId);
    expect(linkedIds).toEqual([known.id]);
  });
});
