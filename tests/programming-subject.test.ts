import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSubjectRoadmap } from "@/lib/catalog/roadmap";
import { resolveLearningPath, resolveSubjectPackage } from "@/lib/catalog/subjects/registry";
import { programmingCurriculumOutline, programmingSubjectPackage } from "@/lib/catalog/subjects/programming";
import { PROGRAMMING_LESSON_SOURCE_URL, programmingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { applyLessonAction, emptyLessonProgress, eveLessonAdvice, lessonSubmissionFor } from "@/lib/programming-lesson-progress";

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

  it("pubblica le otto lezioni ufficiali disponibili nel Modulo 0", () => {
    expect(programmingCurriculumOutline).toEqual([
      "Lezione 0.1 · Che cosa significa programmare?",
      "Lezione 0.2 · Che cos’è un computer e come esegue un programma?",
      "Lezione 0.3 · Come il computer rappresenta l’informazione?",
      "Lezione 0.4 · Logica, proposizioni e ragionamento booleano",
      "Lezione 0.5 · Pensiero computazionale, algoritmi e pseudocodice",
      "Lezione 0.6 · Come nasce il software",
      "Lezione 0.7 · Storia essenziale dell’informatica",
      "Lezione 0.8 · Impatto del software",
    ]);
    expect(programmingSubjectPackage.stages).toHaveLength(1);
    expect(programmingSubjectPackage.stages[0].id).toBe("programming-module-0");
    expect(programmingSubjectPackage.stages[0].lessons).toEqual(programmingCurriculumOutline);
    expect(programmingLesson.modules).toHaveLength(1);
    expect(programmingLesson.modules[0]).toMatchObject({ id: "programming-module-0", title: "Modulo 0" });
    expect(programmingLesson.modules[0].lessons.map((lesson) => lesson.id)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8"]);
    for (const lesson of programmingLesson.modules[0].lessons) {
      const extended = ["0.6", "0.7", "0.8"].includes(lesson.id);
      expect(lesson.sectionIds).toHaveLength(extended ? 13 : 11);
      expect(lesson.exerciseIds).toHaveLength(extended ? 48 : 40);
      expect(lesson.quizIds).toHaveLength(extended ? 36 : 30);
      expect(lesson.glossary).toHaveLength(extended ? 60 : 50);
      expect(lesson.summary.length).toBeGreaterThan(0);
    }
  });

  it("estende i contenuti ufficiali con le lezioni locali 0.3–0.8", () => {
    expect(programmingLesson.id).toBe("programming-0-1");
    expect(programmingLesson.lessonTitles).toEqual(programmingCurriculumOutline);
    expect(programmingLesson.objectives).toHaveLength(65);
    expect(programmingLesson.sections).toHaveLength(94);
    expect(programmingLesson.glossary).toHaveLength(430);
    expect(programmingLesson.exercises).toHaveLength(343);
    expect(programmingLesson.quiz).toHaveLength(258);
    expect(programmingLesson.project.assessments).toHaveLength(8);
    expect(programmingLesson.project.guidedProjects.map((project) => project.lessonId)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]);
    expect(programmingLesson.project.guidedProjects.every((project) => project.starterCode.includes("print("))).toBe(true);
    expect(programmingLesson.completion.minimumQuizScore).toBe(80);
    expect(programmingLesson.completion.requiredExerciseIds).toHaveLength(257);
    expect(new Set(programmingLesson.sections.map((section) => section.id)).size).toBe(94);
    expect(new Set([programmingLesson.guidedExercise.id, ...programmingLesson.exercises.map((exercise) => exercise.id)]).size).toBe(344);
    expect(new Set(programmingLesson.quiz.map((question) => question.id)).size).toBe(258);
    expect(programmingLesson.sections[0].blocks.some((block) => block.text === "Che cosa significa programmare?")).toBe(true);
    expect(programmingLesson.sections[11].blocks.some((block) => block.text === "Che cos’è un computer e come esegue un programma?")).toBe(true);
    expect(programmingLesson.sections[22].blocks.some((block) => block.text === "Come il computer rappresenta l’informazione?")).toBe(true);
    expect(programmingLesson.sections[33].blocks.some((block) => block.text === "Logica, proposizioni e ragionamento booleano")).toBe(true);
    expect(programmingLesson.sections[44].blocks.some((block) => block.text === "Pensiero computazionale, algoritmi e pseudocodice")).toBe(true);
    expect(programmingLesson.sections[55].blocks.some((block) => block.text === "Come nasce il software")).toBe(true);
    expect(programmingLesson.sections[68].blocks.some((block) => block.text === "Storia essenziale dell’informatica")).toBe(true);
    expect(programmingLesson.sections[81].blocks.some((block) => block.text === "Impatto del software")).toBe(true);
  });

  it("lega gli artefatti alle impronte delle fonti senza richiedere i DOCX locali nel repository", () => {
    const sourceDirectory = join(root, "docs/courses/programming-zero/source");
    for (const source of programmingLesson.sourceDocuments) {
      if (!("storedInRepository" in source) || source.storedInRepository !== false) {
        const bytes = readFileSync(join(sourceDirectory, source.filename));
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(source.sha256);
      } else {
        expect({
          "0.3": "91a3a14aa8f38b0e6d6b9a9f3d2a2e16aee37f6d8714c18e05304a1ca8164f89",
          "0.4": "8508d2e700c8ddbc07e38dce1344b54da037764189dee40abbfbfd153d2c18fa",
          "0.5": "1faa694e1279feb929c9c145ba0a253cfc1b4281a3e7fde2155ca69bf05ac5ca",
          "0.6": "e4508786bb492e2b22d2a930bf55068e0a22a6631711ce1cc4fd65c22deeb58e",
          "0.7": "e66df7f6d2469614a86f66274fe36078dcae5e27dfc24ad690d133c4f94dfaff",
          "0.8": "441b9e1af37992314cd0ded71a8196929786f3741a4bb2d90d371da4a24af017",
        }).toMatchObject({ [source.lessonId]: source.sha256 });
      }
      expect(source.metrics.paragraphs).toBeGreaterThan(780);
      expect(source.metrics.tables).toBeGreaterThanOrEqual(12);
      const importedBlocks = programmingLesson.sections
        .filter((section) => section.lessonId === source.lessonId)
        .reduce((total, section) => total + section.blocks.length, 0);
      expect(importedBlocks).toBe(source.metrics.paragraphs + source.metrics.tables);
    }
  });

  it("crea un percorso con lezione nativa, checklist e approfondimenti facoltativi", () => {
    const native = { id: "9f219d2a-d532-4af2-bd97-5df8fc863101", title: programmingLesson.title, description: programmingLesson.description, author: null, provider: "Aula Studio Virtuale", source_url: PROGRAMMING_LESSON_SOURCE_URL, material_type: "interactive", language: "it", level: "no_experience" as const, estimated_duration_minutes: 120, price_type: "free" as const, price: null, currency: null, certificate_available: false, prerequisites: [], license_type: null, verification_status: "verified" as const, source_origin: "internal" as const, verified_at: "2026-01-01", last_checked_at: "2026-01-01", viewer_compatibility: "internal" as const, access_requirements: [], topicLinks: [], internal_resource_id: "9f219d2a-d532-4af2-bd97-5df8fc863101", internal_viewer: "lesson" as const };
    const draft = createSubjectRoadmap("programmazione da zero", [native]);
    expect(draft.modules).toHaveLength(1);
    expect(draft.modules[0].stageId).toBe("programming-module-0");
    expect(draft.modules[0].items[0]).toMatchObject({ itemType: "material", catalogMaterialId: native.id, isRequired: true });
    expect(draft.modules[0].items.filter((item) => item.itemType === "exercise")).toHaveLength(8);
    expect(draft.modules[0].items.some((item) => item.itemType === "project")).toBe(true);
    expect(draft.modules[0].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(8);
  });

  it("non completa la lezione con il solo scorrimento o con le sole sezioni", () => {
    let state = emptyLessonProgress;
    for (const section of programmingLesson.sections) state = applyLessonAction(state, { type: "lesson_section_completed", eventId: crypto.randomUUID(), sectionId: section.id }, new Date().toISOString()).state;
    expect(state.completedSectionIds).toHaveLength(programmingLesson.sections.length);
    expect(state.lessonCompleted).toBe(false);
    expect(state.completionPercentage).toBe(30);
  });

  it("completa il percorso soltanto con capitoli, esercizi, quiz e prove finali richiesti dalle fonti", () => {
    const timestamp = "2026-07-21T10:00:00.000Z";
    let state = emptyLessonProgress;
    for (const section of programmingLesson.sections) state = applyLessonAction(state, { type: "lesson_section_completed", eventId: crypto.randomUUID(), sectionId: section.id }, timestamp).state;
    state = applyLessonAction(state, { type: "guided_exercise_completed", eventId: crypto.randomUUID(), response: "Risposta completa all’esercizio guidato." }, timestamp).state;
    for (const exerciseId of programmingLesson.completion.requiredExerciseIds) state = applyLessonAction(state, { type: "independent_exercise_completed", eventId: crypto.randomUUID(), exerciseId, response: "Risposta completa all’esercizio richiesto." }, timestamp).state;
    for (const question of programmingLesson.quiz) state = applyLessonAction(state, { type: "quiz_answer_submitted", eventId: crypto.randomUUID(), questionId: question.id, choice: question.correctChoice, elapsedSeconds: 10 }, timestamp).state;
    state = applyLessonAction(state, { type: "quiz_completed", eventId: crypto.randomUUID() }, timestamp).state;
    for (const project of programmingLesson.project.guidedProjects) {
      state = applyLessonAction(state, { type: "project_submitted", eventId: crypto.randomUUID(), projectLessonId: project.lessonId, code: project.starterCode, output: "Programma eseguito correttamente." }, timestamp).state;
    }
    expect(state.quizScore).toBe(100);
    expect(state.completedProjectLessonIds).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]);
    expect(state.lessonCompleted).toBe(true);
    expect(state.completionPercentage).toBe(100);
  });

  it("associa errori, tentativi, tempo e ripasso ai concetti del quiz", () => {
    const question = programmingLesson.quiz[0];
    const wrongChoice = question.correctChoice === 0 ? 1 : 0;
    const result = applyLessonAction(emptyLessonProgress, { type: "quiz_answer_submitted", eventId: crypto.randomUUID(), questionId: question.id, choice: wrongChoice, elapsedSeconds: 18 }, "2026-07-20T10:00:00.000Z");
    expect(result.state.quizAnswers[question.id]).toMatchObject({ correct: false, attempts: 1, elapsedSeconds: 18, concept: question.concept, reviewSectionId: question.reviewSectionId, answeredAt: "2026-07-20T10:00:00.000Z" });
    expect(result.feedback?.explanation).toBe(question.explanation);
  });

  it("salva bozze e consegne Python separatamente senza completare in anticipo il modulo", () => {
    const project = programmingLesson.project.guidedProjects[0];
    const draftAction = { type: "project_draft_saved" as const, eventId: crypto.randomUUID(), projectLessonId: project.lessonId, code: project.starterCode, output: "Output della bozza Python." };
    const draftState = applyLessonAction(emptyLessonProgress, draftAction, "2026-07-21T10:00:00.000Z").state;
    expect(draftState.project).toBe("started");
    expect(draftState.completedProjectLessonIds).toEqual([]);
    expect(lessonSubmissionFor(draftAction)).toMatchObject({ activityId: project.id, activityType: "project", status: "draft" });

    let state = draftState;
    for (const item of programmingLesson.project.guidedProjects) {
      const action = { type: "project_submitted" as const, eventId: crypto.randomUUID(), projectLessonId: item.lessonId, code: item.starterCode, output: "Output del progetto Python." };
      expect(lessonSubmissionFor(action)).toMatchObject({ activityId: item.id, status: "submitted" });
      state = applyLessonAction(state, action, "2026-07-21T10:00:00.000Z").state;
    }
    expect(state.project).toBe("submitted");
    expect(state.completedProjectLessonIds).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]);
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

