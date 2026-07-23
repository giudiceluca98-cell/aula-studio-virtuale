import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const referenceRoot = join(root, "reference");
const courseRoot = join(referenceRoot, "course-content");
const payloadPath = join(courseRoot, "programming-zero.json");
const adapterPath = join(courseRoot, "programming-zero-adapter.js");
const manifestPath = join(courseRoot, "manifest.json");
const canonicalPath = join(
  referenceRoot,
  "demo-aula-studio-virtuale-canonica.html"
);
const loaderPath = join(
  referenceRoot,
  "demo-aula-studio-virtuale-integrata.html"
);
const basePath = join(referenceRoot, "demo-aula-studio-virtuale-1.3.0-alpha.9.html");

const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");

const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const adapter = readFileSync(adapterPath, "utf8");
const loader = readFileSync(loaderPath, "utf8");

describe("contenuti ufficiali nella demo canonica", () => {
  it("pubblica in ordine soltanto le undici lezioni ufficiali approvate", () => {
    expect(payload.lessons.map((lesson: { id: string }) => lesson.id)).toEqual([
      "0.1",
      "0.2",
      "0.3",
      "0.4",
      "0.5",
      "0.6",
      "0.7",
      "0.8",
      "0.9",
      "1.1",
      "1.2",
    ]);
    expect(payload.totals).toEqual({
      lessons: 11,
      sections: 127,
      chapters: 116,
      exercises: 464,
      quizQuestions: 348,
      glossaryEntries: 580,
      pythonProjects: 11,
    });
  });

  it("lega ogni sorgente e ogni artefatto alla propria impronta", () => {
    for (const source of payload.sources) {
      const sourceBytes = readFileSync(join(root, source.file));
      expect(sha256(sourceBytes), source.file).toBe(source.sha256);
    }

    const payloadBytes = readFileSync(payloadPath);
    const adapterBytes = readFileSync(adapterPath);
    expect(manifest.payload).toMatchObject({
      file: "programming-zero.json",
      sha256: sha256(payloadBytes),
      bytes: payloadBytes.byteLength,
    });
    expect(manifest.adapter).toMatchObject({
      file: "programming-zero-adapter.js",
      sha256: sha256(adapterBytes),
      bytes: adapterBytes.byteLength,
    });
    const canonicalBytes = readFileSync(canonicalPath);
    const integratedBytes = readFileSync(loaderPath);
    expect(manifest.integratedDemo).toMatchObject({
      file: "../demo-aula-studio-virtuale-integrata.html",
      sourceCanonicalSha256: sha256(canonicalBytes),
      sha256: sha256(integratedBytes),
      bytes: integratedBytes.byteLength,
    });
    expect(manifest.totals).toEqual(payload.totals);
  });

  it("conserva per ogni lezione teoria, esercizi, quiz, glossario, verifica e Python Project", () => {
    for (const lesson of payload.lessons) {
      expect(lesson.sections.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.chapters.length, lesson.id).toBeGreaterThan(0);
      expect(
        lesson.chapters.every(
          (chapter: {
            exercises?: { guided?: unknown; autonomous?: unknown[] };
            quiz?: unknown[];
          }) =>
            chapter.exercises?.guided &&
            Array.isArray(chapter.exercises.autonomous) &&
            chapter.exercises.autonomous.length > 0 &&
            Array.isArray(chapter.quiz) &&
            chapter.quiz.length > 0
        ),
        lesson.id
      ).toBe(true);
      expect(lesson.glossary.length, lesson.id).toBeGreaterThan(0);
      expect(lesson.finalAssessment?.title, lesson.id).toBeTruthy();

      const project = payload.pythonProjects.find(
        (item: { lessonId: string }) => item.lessonId === lesson.id
      );
      expect(project?.starterCode, lesson.id).toContain("print(");
      expect(project?.instructions.length, lesson.id).toBeGreaterThan(0);
      expect(project?.expectedResult, lesson.id).toBeTruthy();
    }
  });

  it("compone il pacchetto sopra la demo canonica senza modificare i checkpoint", () => {
    const normalizedBase = readFileSync(basePath, "utf8").replaceAll("\r\n", "\n");
    expect(sha256(normalizedBase)).toBe(
      "957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318"
    );
    expect(loader).toContain(`PH="${manifest.payload.sha256}"`);
    expect(loader).toContain(`AH="${manifest.adapter.sha256}"`);
    expect(loader).toContain("window.AULA_OFFICIAL_COURSE_PAYLOAD");
    expect(loader).toContain('replaceAll("\\r\\n","\\n")');
    expect(readFileSync(canonicalPath)).toEqual(
      readFileSync(
        join(
          referenceRoot,
          "checkpoints/phase-4/demo-aula-studio-virtuale-1.4.0-alpha.1.html"
        )
      )
    );
  });

  it("adatta navigazione, progressi e attività interattive alla lezione selezionata", () => {
    expect(adapter).toContain("window.selectLesson = applyLesson");
    expect(adapter).toContain("function saveCurrentLessonProgress");
    expect(adapter).toContain("function restoreLessonProgress");
    expect(adapter).toContain("function quizMarkup");
    expect(adapter).toContain("aulaOfficialQuizSelect");
    expect(adapter).toContain("buildOfficialExercisesTemplate");
    expect(adapter).toContain("currentLessonProgress().quizAnswers");
    expect(adapter).not.toContain(
      "<strong>Risposta corretta</strong> ${escape(question.explanation)}"
    );
    expect(adapter).toContain("course.pythonProjects.find");
    expect(adapter).toContain("pythonProject.starterCode");
    expect(adapter).toContain("viewTemplates.glossary");
  });
});
