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

  it("pubblica le lezioni ufficiali disponibili nei Moduli 0, 1, 2 e 3", () => {
    expect(programmingCurriculumOutline).toEqual([
      "Lezione 0.1 · Che cosa significa programmare?",
      "Lezione 0.2 · Che cos’è un computer e come esegue un programma?",
      "Lezione 0.3 · Come il computer rappresenta l’informazione?",
      "Lezione 0.4 · Logica, proposizioni e ragionamento booleano",
      "Lezione 0.5 · Pensiero computazionale, algoritmi e pseudocodice",
      "Lezione 0.6 · Come nasce il software",
      "Lezione 0.7 · Storia essenziale dell’informatica",
      "Lezione 0.8 · Impatto del software",
      "Lezione 0.9 · Laboratorio conclusivo e valutazione completa",
      "Lezione 1.1 · Che cos’è un ambiente di sviluppo?",
      "Lezione 1.2 · Installare Python",
      "Lezione 1.3 · Terminale e shell",
      "Lezione 1.4 · File system, cartelle e percorsi",
      "Lezione 1.5 · Editor di testo e IDE: configurazione consapevole dell’ambiente",
      "Lezione 1.6 · Ambienti virtuali, pacchetti e dipendenze",
      "Lezione 1.7 · Struttura di un progetto, configurazione e riproducibilità",
      "Lezione 1.8 · Eseguire e diagnosticare programmi nell'ambiente di sviluppo",
      "Lezione 1.9 · Laboratorio conclusivo e valutazione completa del Modulo 1",
      "Lezione 2.1 · Dal file .py al primo programma",
      "Lezione 2.2 · Come Python esegue un programma",
      "Lezione 2.3 · Sintassi di base, rientri, righe vuote e commenti",
      "Lezione 2.4 · Valori letterali e prime espressioni osservabili",
      "Lezione 2.5 · Produrre output con print",
      "Lezione 2.6 · Modalità interattiva e script",
      "Lezione 2.7 · Leggere errori e traceback",
      "Lezione 2.8 · Programmi sequenziali",
      "Lezione 2.9 · Laboratorio conclusivo",
      "Lezione 3.1 · Valori, oggetti, nomi e variabili",
      "Lezione 3.2 · Assegnazione, riassegnazione, aggiornamenti e stato",
      "Lezione 3.3 · Identificatori, convenzioni di denominazione e costanti",
      "Lezione 3.4 · Tipi di dato e tipizzazione dinamica",
      "Lezione 3.5 · Numeri interi",
      "Lezione 3.6 · Numeri in virgola mobile e complessi",
      "Lezione 3.7 · Stringhe, booleani e None",
    ]);
    expect(programmingSubjectPackage.stages).toHaveLength(4);
    expect(programmingSubjectPackage.stages[0].id).toBe("programming-module-0");
    expect(programmingSubjectPackage.stages[0].lessons).toEqual(programmingCurriculumOutline.slice(0, 9));
    expect(programmingSubjectPackage.stages[1].lessons).toEqual(programmingCurriculumOutline.slice(9, 18));
    expect(programmingSubjectPackage.stages[2].lessons).toEqual(programmingCurriculumOutline.slice(18, 27));
    expect(programmingSubjectPackage.stages[3].lessons).toEqual(programmingCurriculumOutline.slice(27));
    expect(programmingLesson.modules).toHaveLength(4);
    expect(programmingLesson.modules[0]).toMatchObject({ id: "programming-module-0", title: "Modulo 0" });
    expect(programmingLesson.modules[0].lessons.map((lesson) => lesson.id)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9"]);
    for (const lesson of programmingLesson.modules[0].lessons) {
      const extended = ["0.6", "0.7", "0.8"].includes(lesson.id);
      expect(lesson.sectionIds).toHaveLength(extended ? 13 : 11);
      expect(lesson.exerciseIds).toHaveLength(extended ? 48 : 40);
      expect(lesson.quizIds).toHaveLength(extended ? 36 : 30);
      expect(lesson.glossary).toHaveLength(extended ? 60 : 50);
      expect(lesson.summary.length).toBeGreaterThan(0);
    }
    expect(programmingLesson.modules[1]).toMatchObject({ id: "programming-module-1", title: "Modulo 1" });
    expect(programmingLesson.modules[1].lessons.map((lesson) => lesson.id)).toEqual(["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9"]);
    for (const lesson of programmingLesson.modules[1].lessons) {
      expect(lesson.sectionIds).toHaveLength(11);
      expect(lesson.exerciseIds).toHaveLength(["1.6", "1.7", "1.8", "1.9"].includes(lesson.id) ? 60 : 40);
      expect(lesson.quizIds).toHaveLength(30);
      expect(lesson.glossary).toHaveLength(["1.6", "1.7", "1.8", "1.9"].includes(lesson.id) ? 60 : 50);
      expect(lesson.objectives).toHaveLength(["1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9"].includes(lesson.id) ? 10 : 8);
    }
    expect(programmingLesson.modules[2]).toMatchObject({ id: "programming-module-2", title: "Modulo 2" });
    expect(programmingLesson.modules[2].lessons.map((lesson) => lesson.id)).toEqual(["2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9"]);
    for (const lesson of programmingLesson.modules[2].lessons) {
      expect(lesson.sectionIds).toHaveLength(11);
      expect(lesson.exerciseIds).toHaveLength(60);
      expect(lesson.quizIds).toHaveLength(30);
      expect(lesson.glossary).toHaveLength(60);
      expect(lesson.objectives).toHaveLength(10);
    }
    expect(programmingLesson.modules[3]).toMatchObject({ id: "programming-module-3", title: "Modulo 3" });
    expect(programmingLesson.modules[3].lessons.map((lesson) => lesson.id)).toEqual(["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"]);
    for (const lesson of programmingLesson.modules[3].lessons) {
      expect(lesson.sectionIds).toHaveLength(11);
      expect(lesson.exerciseIds).toHaveLength(60);
      expect(lesson.quizIds).toHaveLength(30);
      expect(lesson.glossary).toHaveLength(lesson.id === "3.7" ? 80 : ["3.3", "3.4", "3.5", "3.6"].includes(lesson.id) ? 70 : 60);
      expect(lesson.objectives).toHaveLength(10);
    }
  });

  it("estende i contenuti ufficiali fino alla lezione 3.7", () => {
    expect(programmingLesson.id).toBe("programming-0-1");
    expect(programmingLesson.lessonTitles).toEqual(programmingCurriculumOutline);
    expect(programmingLesson.objectives).toHaveLength(320);
    expect(programmingLesson.sections).toHaveLength(380);
    expect(programmingLesson.glossary).toHaveLength(1990);
    expect(programmingLesson.exercises).toHaveLength(1783);
    expect(programmingLesson.quiz).toHaveLength(1038);
    expect(programmingLesson.project.assessments).toHaveLength(34);
    expect(programmingLesson.project.guidedProjects.map((project) => project.lessonId)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.1", "1.2"]);
    expect(programmingLesson.project.guidedProjects.every((project) => project.starterCode.includes("print("))).toBe(true);
    expect(programmingLesson.project.guidedProjects.filter((project) => project.lessonId.startsWith("1.")).every((project) => !project.starterCode.includes("import "))).toBe(true);
    expect(programmingLesson.completion.minimumQuizScore).toBe(80);
    expect(programmingLesson.completion.requiredExerciseIds).toHaveLength(1037);
    expect(new Set(programmingLesson.sections.map((section) => section.id)).size).toBe(380);
    expect(new Set([programmingLesson.guidedExercise.id, ...programmingLesson.exercises.map((exercise) => exercise.id)]).size).toBe(1784);
    expect(new Set(programmingLesson.quiz.map((question) => question.id)).size).toBe(1038);
    expect(programmingLesson.sections[0].blocks.some((block) => block.text === "Che cosa significa programmare?")).toBe(true);
    expect(programmingLesson.sections[11].blocks.some((block) => block.text === "Che cos’è un computer e come esegue un programma?")).toBe(true);
    expect(programmingLesson.sections[22].blocks.some((block) => block.text === "Come il computer rappresenta l’informazione?")).toBe(true);
    expect(programmingLesson.sections[33].blocks.some((block) => block.text === "Logica, proposizioni e ragionamento booleano")).toBe(true);
    expect(programmingLesson.sections[44].blocks.some((block) => block.text === "Pensiero computazionale, algoritmi e pseudocodice")).toBe(true);
    expect(programmingLesson.sections[55].blocks.some((block) => block.text === "Come nasce il software")).toBe(true);
    expect(programmingLesson.sections[68].blocks.some((block) => block.text === "Storia essenziale dell’informatica")).toBe(true);
    expect(programmingLesson.sections[81].blocks.some((block) => block.text === "Impatto del software")).toBe(true);
    expect(programmingLesson.sections[94].blocks.some((block) => block.text === "Laboratorio conclusivo")).toBe(true);
    expect(programmingLesson.sections[105].blocks.some((block) => block.text === "Che cos’è un ambiente di sviluppo?")).toBe(true);
    expect(programmingLesson.sections[116].blocks.some((block) => block.text === "Installare Python")).toBe(true);
    expect(programmingLesson.sections[127].blocks.some((block) => block.text === "Terminale e shell")).toBe(true);
    expect(programmingLesson.sections[138].blocks.some((block) => block.text === "File system, cartelle e percorsi")).toBe(true);
    expect(programmingLesson.sections[149].blocks.some((block) => block.text === "Editor di testo e IDE")).toBe(true);
    expect(programmingLesson.sections[160].blocks.some((block) => block.text === "Ambienti virtuali, pacchetti e dipendenze")).toBe(true);
    expect(programmingLesson.sections[171].blocks.some((block) => block.text === "Struttura di un progetto, configurazione e riproducibilità")).toBe(true);
    expect(programmingLesson.sections[182].blocks.some((block) => block.text === "Eseguire e diagnosticare programmi")).toBe(true);
    expect(programmingLesson.sections[193].blocks.some((block) => block.text === "Laboratorio conclusivo e valutazione completa")).toBe(true);
    expect(programmingLesson.sections[204].blocks.some((block) => block.text === "Dal file .py al primo programma")).toBe(true);
    expect(programmingLesson.sections[215].blocks.some((block) => block.text === "Come Python esegue un programma")).toBe(true);
    expect(programmingLesson.sections[226].blocks.some((block) => block.text === "Sintassi di base, rientri, righe vuote e commenti")).toBe(true);
    expect(programmingLesson.sections[237].blocks.some((block) => block.text === "Valori letterali e prime espressioni osservabili")).toBe(true);
    expect(programmingLesson.sections[248].blocks.some((block) => block.text === "Produrre output con print")).toBe(true);
    expect(programmingLesson.sections[259].blocks.some((block) => block.text === "Modalità interattiva e script")).toBe(true);
    expect(programmingLesson.sections[270].blocks.some((block) => block.text === "Leggere errori e traceback")).toBe(true);
    expect(programmingLesson.sections[281].blocks.some((block) => block.text === "Programmi sequenziali")).toBe(true);
    expect(programmingLesson.sections[292].blocks.some((block) => block.text === "Laboratorio conclusivo")).toBe(true);
    expect(programmingLesson.sections[303].blocks.some((block) => block.text === "Valori, oggetti, nomi e variabili")).toBe(true);
    expect(programmingLesson.sections[314].blocks.some((block) => block.text === "Assegnazione, riassegnazione, aggiornamenti e stato")).toBe(true);
    expect(programmingLesson.sections[325].blocks.some((block) => block.text === "Identificatori, convenzioni di denominazione e costanti")).toBe(true);
    expect(programmingLesson.sections[336].blocks.some((block) => block.text === "Tipi di dato e tipizzazione dinamica")).toBe(true);
    expect(programmingLesson.sections[347].blocks.some((block) => block.text === "Numeri interi")).toBe(true);
    expect(programmingLesson.sections[358].blocks.some((block) => block.text === "Numeri in virgola mobile e complessi")).toBe(true);
    expect(programmingLesson.sections[369].blocks.some((block) => block.text === "Stringhe, booleani e None")).toBe(true);
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
          "0.9": "cac28baa626f64d6e79c10b47784704031cec4f4e8d27f26b04f25dd8773bb9b",
          "1.1": "adf2899abed24ff5b51ae9ec693cd24e73d40c8b0debfa25a60415cda3e8d755",
          "1.2": "3cc6e6166ef7e3ead6e11dd70a23aca68dc7bf4773bbf928eff4260cfdef952a",
          "1.3": "5dc43d5e590fcfa64f8dd169ef28b59f2399e495e0b58c689b59ed7a0f376b1a",
          "1.4": "58e92a5aeaea1f6b1622aa2432fa359ac64c61e957dbbcf25b5685fdc405e5f0",
          "1.5": "e8efc49c3afeab0c04b6326cc9086c76760e8c0cfe8ff5c7e5a40c2d2bee9377",
          "1.6": "0f7386291c9410bc54b59da3f86c970ffe9424495cdcdccdbc88b0f1d28d1c6f",
          "1.7": "c887c4eba65d169db7547489344150a8043f2dfc641dc4c2a6acc522f9bd7ab7",
          "1.8": "ad4a92c5766519d4e95c8df3365354af88e0dd939802cf78572e021baafa4219",
          "1.9": "208ebf5e21fb0828ce07ce0649899827f893217d400fccd857626d648b40a089",
          "2.1": "e2376f901858f41528ddaead1396d38a9f5d0c4b80db726911f0e6b3f593260a",
          "2.2": "00657c9f2fa9147c42c5585ac2c0ba0d66fdf6376e1efe8eb3a237b2d37c0e9f",
          "2.3": "d0f99a4174d942baf6404e8c4834006e5d2d5e43989ca36f454cc2ce9d08906e",
          "2.4": "285290f4529df08b155d7dde4c623f5c37f14c66dec5bfe593609be3f13a3611",
          "2.5": "ee0f232d89deb1ac50536e203a3121166f0743a6b43df38be2aaba37bd37f57a",
          "2.6": "b57992d8b2c37e386d3eb43a00ce11e3a31c873d6315ffc54fd9662c2dc14594",
          "2.7": "e22b440aa98c46696c17ec19f7410c8da43f461b598fcf22d927c372a9c8f3f5",
          "2.8": "726d7940392fb03e4e6061edc2031ac660de82d52b190b3a5325e2affecec0e2",
          "2.9": "c8cdfbcc889f605d31ada72b5f3146cdafbbaee20e9497441261f55549472978",
          "3.1": "8d6381855ff985eb103c7f76b07f198a859de58704bdd11b2f478c94eab57f53",
          "3.2": "d4e5a610eaf9a42ad3e72ec051b457fb5ead3af0bf3e8c8d59b28d5c481e383e",
          "3.3": "c5bbccb4665f3d5c38fb5370068e72484d799f5bd71311e37f56c5d4761f58fb",
          "3.4": "d15f273e201953deba26b9be6ff6c3c1617e1fd254731ee8da760f9f01ceb7c3",
          "3.5": "65163ae728859ab9ea7d506239af698544e1cb58a131e3ce5123d3948d0fb2b3",
          "3.6": "f9fa0d5f33dbe34f4a69ee2dcc4024e9a7c3883b617006a0d13a9f5dd8cabeb7",
          "3.7": "b347def95309c812088dfe86621a7851a1bc99639adb45d0625221e1efbc4e0a",
        }).toMatchObject({ [source.lessonId]: source.sha256 });
      }
      expect(source.metrics.paragraphs).toBeGreaterThan(700);
      expect(source.metrics.tables).toBeGreaterThanOrEqual(11);
      const importedBlocks = programmingLesson.sections
        .filter((section) => section.lessonId === source.lessonId)
        .reduce((total, section) => total + section.blocks.length, 0);
      expect(importedBlocks).toBe(source.metrics.paragraphs + source.metrics.tables);
    }
  });

  it("crea un percorso con lezione nativa, checklist e approfondimenti facoltativi", () => {
    const native = { id: "9f219d2a-d532-4af2-bd97-5df8fc863101", title: programmingLesson.title, description: programmingLesson.description, author: null, provider: "Aula Studio Virtuale", source_url: PROGRAMMING_LESSON_SOURCE_URL, material_type: "interactive", language: "it", level: "no_experience" as const, estimated_duration_minutes: 120, price_type: "free" as const, price: null, currency: null, certificate_available: false, prerequisites: [], license_type: null, verification_status: "verified" as const, source_origin: "internal" as const, verified_at: "2026-01-01", last_checked_at: "2026-01-01", viewer_compatibility: "internal" as const, access_requirements: [], topicLinks: [], internal_resource_id: "9f219d2a-d532-4af2-bd97-5df8fc863101", internal_viewer: "lesson" as const };
    const draft = createSubjectRoadmap("programmazione da zero", [native]);
    expect(draft.modules).toHaveLength(4);
    expect(draft.modules[0].stageId).toBe("programming-module-0");
    expect(draft.modules[0].items[0]).toMatchObject({ itemType: "material", catalogMaterialId: native.id, isRequired: true });
    expect(draft.modules[0].items.filter((item) => item.itemType === "exercise")).toHaveLength(9);
    expect(draft.modules[0].items.some((item) => item.itemType === "project")).toBe(true);
    expect(draft.modules[0].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(9);
    expect(draft.modules[1].stageId).toBe("programming-module-1");
    expect(draft.modules[1].items.filter((item) => item.itemType === "exercise")).toHaveLength(9);
    expect(draft.modules[1].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(9);
    expect(draft.modules[1].items.filter((item) => item.itemType === "project")).toHaveLength(2);
    expect(draft.modules[2].stageId).toBe("programming-module-2");
    expect(draft.modules[2].items.filter((item) => item.itemType === "exercise")).toHaveLength(9);
    expect(draft.modules[2].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(9);
    expect(draft.modules[2].items.filter((item) => item.itemType === "project")).toHaveLength(2);
    expect(draft.modules[3].stageId).toBe("programming-module-3");
    expect(draft.modules[3].items.filter((item) => item.itemType === "exercise")).toHaveLength(7);
    expect(draft.modules[3].items.filter((item) => item.itemType === "checkpoint")).toHaveLength(7);
    expect(draft.modules[3].items.filter((item) => item.itemType === "project")).toHaveLength(2);
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
    expect(state.completedProjectLessonIds).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.1", "1.2"]);
    expect(state.lessonCompleted).toBe(true);
    expect(state.completionPercentage).toBe(100);
  }, 20_000);

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
    expect(state.completedProjectLessonIds).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.1", "1.2"]);
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

