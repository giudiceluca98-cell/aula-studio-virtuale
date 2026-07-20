import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSubjectRoadmap } from "@/lib/catalog/roadmap";
import { resolveLearningPath, resolveSubjectPackage } from "@/lib/catalog/subjects/registry";
import { programmingCurriculumOutline, programmingSubjectPackage } from "@/lib/catalog/subjects/programming";
import { PROGRAMMING_LESSON_SOURCE_URL, programmingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { applyLessonAction, emptyLessonProgress, eveLessonAdvice } from "@/lib/programming-lesson-progress";

const root = process.cwd();
const migration = readFileSync(join(root, "supabase/migrations/0016_programming_zero_native_lesson.sql"), "utf8").toLowerCase();
const searchRoute = readFileSync(join(root, "src/app/api/catalog/search/route.ts"), "utf8");
const pathRoute = readFileSync(join(root, "src/app/api/catalog/path/route.ts"), "utf8");
const config = readFileSync(join(root, "src/lib/catalog/config.ts"), "utf8");
const workspace = readFileSync(join(root, "src/components/room/material-workspace-viewer.tsx"), "utf8");
const tutor = readFileSync(join(root, "src/lib/programming-lesson-progress.ts"), "utf8");

describe("pacchetto editoriale Programmazione da zero", () => {
  it.each(["programmazione", "programmazione da zero", "imparare a programmare", "corso di programmazione", "coding", "sviluppo software", "Python da zero", "imparare Python", "diventare programmatore", "software development"])("riconosce %s senza fallback generico", (query) => {
    expect(resolveSubjectPackage(query)?.id).toBe("programming");
    expect(resolveLearningPath(query)?.id).toBe("programming-zero");
    expect(createSubjectRoadmap(query).title).toBe("Programmazione da zero");
  });

  it("dichiara tutti i 27 moduli ma pubblica soltanto il Modulo 0 realmente completo", () => {
    expect(programmingCurriculumOutline).toHaveLength(27);
    expect(programmingSubjectPackage.stages).toHaveLength(1);
    expect(programmingSubjectPackage.stages[0].id).toBe("programming-module-0");
    expect(programmingSubjectPackage.stages[0].lessons).toEqual(["0.1 · Che cosa significa programmare?"]);
  });

  it("contiene la Lezione 0.1 completa e deterministica", () => {
    expect(programmingLesson.id).toBe("programming-0-1");
    expect(programmingLesson.estimatedMinutes).toBe(120);
    expect(programmingLesson.sections).toHaveLength(22);
    expect(programmingLesson.glossary).toHaveLength(17);
    expect(programmingLesson.exercises).toHaveLength(5);
    expect(programmingLesson.quiz).toHaveLength(10);
    expect(programmingLesson.project.deliverables).toHaveLength(7);
    expect(new Set(programmingLesson.sections.map((section) => section.id)).size).toBe(22);
  });

  it("crea un percorso con lezione nativa, checklist e approfondimenti facoltativi", () => {
    const native = { id: "9f219d2a-d532-4af2-bd97-5df8fc863101", title: programmingLesson.title, description: programmingLesson.description, author: null, provider: "Aula Studio Virtuale", source_url: PROGRAMMING_LESSON_SOURCE_URL, material_type: "interactive", language: "it", level: "no_experience" as const, estimated_duration_minutes: 120, price_type: "free" as const, price: null, currency: null, certificate_available: false, prerequisites: [], license_type: null, verification_status: "verified" as const, source_origin: "internal" as const, verified_at: "2026-01-01", last_checked_at: "2026-01-01", viewer_compatibility: "internal" as const, access_requirements: [], topicLinks: [], internal_resource_id: "9f219d2a-d532-4af2-bd97-5df8fc863101", internal_viewer: "lesson" as const };
    const draft = createSubjectRoadmap("programmazione da zero", [native]);
    expect(draft.modules).toHaveLength(1);
    expect(draft.modules[0].stageId).toBe("programming-module-0");
    expect(draft.modules[0].items[0]).toMatchObject({ itemType: "material", catalogMaterialId: native.id, isRequired: true });
    expect(draft.modules[0].items.filter((item) => item.itemType === "exercise")).toHaveLength(6);
    expect(draft.modules[0].items.some((item) => item.itemType === "project")).toBe(true);
    expect(draft.modules[0].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(2);
  });

  it("non completa la lezione con il solo scorrimento o con le sole sezioni", () => {
    let state = emptyLessonProgress;
    for (const section of programmingLesson.sections) state = applyLessonAction(state, { type: "lesson_section_completed", eventId: crypto.randomUUID(), sectionId: section.id }, new Date().toISOString()).state;
    expect(state.completedSectionIds).toHaveLength(22);
    expect(state.lessonCompleted).toBe(false);
    expect(state.completionPercentage).toBe(30);
  });

  it("associa errori, tentativi, tempo e ripasso ai concetti del quiz", () => {
    const result = applyLessonAction(emptyLessonProgress, { type: "quiz_answer_submitted", eventId: crypto.randomUUID(), questionId: "algorithm-program", choice: 1, elapsedSeconds: 18 }, "2026-07-20T10:00:00.000Z");
    expect(result.state.quizAnswers["algorithm-program"]).toMatchObject({ correct: false, attempts: 1, elapsedSeconds: 18, concept: "algoritmo", reviewSectionId: "algorithm", answeredAt: "2026-07-20T10:00:00.000Z" });
    expect(result.feedback?.explanation).toContain("algoritmo");
  });

  it("Eve è attiva senza OpenAI e usa solo lo stato didattico consentito", () => {
    expect(eveLessonAdvice(emptyLessonProgress).title).toBe("Prossimo passo");
    expect(tutor).not.toContain("messages");
    expect(tutor).not.toContain("calls");
    expect(tutor).not.toContain("private_notes");
    expect(searchRoute).not.toContain("callEve");
    expect(pathRoute).not.toContain("callEve");
    expect(config).toContain("eveEnabled: false");
    expect(config).toContain("webSearchEnabled: false");
    expect(config).toContain("automaticCurriculumEnabled: false");
  });

  it("aggiunge il viewer senza modificare gli adattatori esistenti", () => {
    expect(workspace).toContain('content.kind === "lesson"');
    for (const kind of ["text", "pdf", "document", "presentation", "video"]) expect(workspace).toContain(`content.kind === "${kind}"`);
  });

  it("importa in modo sostitutivo e idempotente preservando i dati manuali", () => {
    expect(migration).toContain("create table public.native_lesson_submissions");
    expect(migration).toContain("public.is_room_member");
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("on conflict(room_id,client_event_id) do nothing");
    expect(migration).toContain("metadata ? 'catalog_material_id'");
    expect(migration).toContain("if found then return query select v_course,0,0; return; end if;");
    expect(migration).not.toContain("delete from public.materials");
    expect(migration).not.toContain("delete from public.material_reader_progress");
  });
});
