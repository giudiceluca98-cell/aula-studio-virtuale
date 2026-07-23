import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const subjectRoot = join(root, "src", "lib", "catalog", "subjects");
const outputRoot = join(root, "reference", "course-content");

const officialFiles = [
  "programming-zero-official-content.json",
  "programming-zero-lesson-0-3-official-content.json",
  "programming-zero-lesson-0-4-official-content.json",
  "programming-zero-lesson-0-5-official-content.json",
  "programming-zero-lesson-0-6-official-content.json",
  "programming-zero-lesson-0-7-official-content.json",
  "programming-zero-lesson-0-8-official-content.json",
  "programming-zero-lesson-0-9-official-content.json",
  "programming-zero-lesson-1-1-official-content.json",
  "programming-zero-lesson-1-2-official-content.json",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const lessonOrder = (left, right) =>
  left.id.localeCompare(right.id, "it", { numeric: true, sensitivity: "base" });

function extractPythonProjects(source) {
  const startMarker = "export const programmingPythonProjects = ";
  const endMarker = "\n] as const;";
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) {
    throw new Error("Impossibile individuare programmingPythonProjects");
  }

  const expression = source
    .slice(start + startMarker.length, end + 2)
    .trim()
    .replace(/\s+as const;?$/, "")
    .replace(/;$/, "");
  const projects = Function(`"use strict"; return (${expression});`)();
  if (!Array.isArray(projects)) {
    throw new Error("programmingPythonProjects non è un array");
  }
  return projects;
}

const sources = [];
const lessons = [];

for (const file of officialFiles) {
  const path = join(subjectRoot, file);
  const raw = await readFile(path);
  const parsed = JSON.parse(raw.toString("utf8"));
  const fileLessons = Array.isArray(parsed.lessons) ? parsed.lessons : [parsed];
  lessons.push(...fileLessons);
  sources.push({
    file: relative(root, path).replaceAll("\\", "/"),
    sha256: sha256(raw),
    lessonIds: fileLessons.map((lesson) => lesson.id),
  });
}

lessons.sort(lessonOrder);

const duplicateIds = lessons
  .map((lesson) => lesson.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
if (duplicateIds.length) {
  throw new Error(`Lezioni duplicate: ${duplicateIds.join(", ")}`);
}

const aggregatorPath = join(subjectRoot, "programming-zero-lesson.ts");
const aggregatorRaw = await readFile(aggregatorPath);
const pythonProjects = extractPythonProjects(aggregatorRaw.toString("utf8"))
  .filter((project) => lessons.some((lesson) => lesson.id === project.lessonId))
  .sort((left, right) =>
    left.lessonId.localeCompare(right.lessonId, "it", { numeric: true })
  );

sources.push({
  file: relative(root, aggregatorPath).replaceAll("\\", "/"),
  sha256: sha256(aggregatorRaw),
  lessonIds: pythonProjects.map((project) => project.lessonId),
});

const totals = lessons.reduce(
  (result, lesson) => {
    result.lessons += 1;
    result.sections += lesson.sections.length;
    result.chapters += lesson.chapters.length;
    result.exercises += lesson.chapters.reduce(
      (count, chapter) =>
        count + 1 + (Array.isArray(chapter.exercises?.autonomous)
          ? chapter.exercises.autonomous.length
          : 0),
      0
    );
    result.quizQuestions += lesson.chapters.reduce(
      (count, chapter) => count + chapter.quiz.length,
      0
    );
    result.glossaryEntries += lesson.glossary.length;
    return result;
  },
  {
    lessons: 0,
    sections: 0,
    chapters: 0,
    exercises: 0,
    quizQuestions: 0,
    glossaryEntries: 0,
    pythonProjects: pythonProjects.length,
  }
);

const payload = {
  schemaVersion: 1,
  courseId: "programming-zero",
  courseTitle: "Programmazione da Zero",
  sources,
  totals,
  lessons,
  pythonProjects,
};

await mkdir(outputRoot, { recursive: true });
const outputPath = join(outputRoot, "programming-zero.json");
const output = `${JSON.stringify(payload)}\n`;
await writeFile(outputPath, output, "utf8");

const adapterPath = join(outputRoot, "programming-zero-adapter.js");
const adapter = await readFile(adapterPath);
const manifest = {
  schemaVersion: 1,
  payload: {
    file: "programming-zero.json",
    sha256: sha256(output),
    bytes: Buffer.byteLength(output),
  },
  adapter: {
    file: "programming-zero-adapter.js",
    sha256: sha256(adapter),
    bytes: adapter.byteLength,
  },
  totals,
};
await writeFile(
  join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(JSON.stringify(manifest, null, 2));
