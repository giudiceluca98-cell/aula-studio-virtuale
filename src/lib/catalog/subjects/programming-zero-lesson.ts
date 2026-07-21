import officialContent from "./programming-zero-official-content.json";
import lesson03Content from "./programming-zero-lesson-0-3-official-content.json";
import lesson04Content from "./programming-zero-lesson-0-4-official-content.json";
import lesson05Content from "./programming-zero-lesson-0-5-official-content.json";
import lesson06Content from "./programming-zero-lesson-0-6-official-content.json";
import lesson07Content from "./programming-zero-lesson-0-7-official-content.json";
import lesson08Content from "./programming-zero-lesson-0-8-official-content.json";
import lesson09Content from "./programming-zero-lesson-0-9-official-content.json";
import lesson11Content from "./programming-zero-lesson-1-1-official-content.json";
import lesson12Content from "./programming-zero-lesson-1-2-official-content.json";

export const PROGRAMMING_ZERO_PATH_ID = "programming-zero";
// The existing native material keeps its identifier so rooms and saved progress remain connected.
export const PROGRAMMING_LESSON_ID = "programming-0-1";
export const PROGRAMMING_LESSON_RESOURCE_ID = "9f219d2a-d532-4af2-bd97-5df8fc863101";
export const PROGRAMMING_LESSON_SOURCE_URL = "https://aula-studio-virtuale.vercel.app/internal/programming-0-1";

export interface LessonContentBlock {
  type: "paragraph" | "heading" | "list-item" | "callout" | "diagram" | "table";
  text?: string;
  rows?: string[][];
}

export interface LessonSection {
  id: string;
  lessonId: string;
  chapterNumber: number;
  title: string;
  blocks: LessonContentBlock[];
}

export interface LessonQuizQuestion {
  id: string;
  concept: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
  explanation: string;
  reviewSectionId: string;
}

interface OfficialExercise {
  id: string;
  kind: string;
  lessonId: string;
  chapterNumber: number;
  title: string;
  prompt: string;
  autoverification?: string;
}

const officialLessons = [...officialContent.lessons, lesson03Content, lesson04Content, lesson05Content, lesson06Content, lesson07Content, lesson08Content, lesson09Content, lesson11Content, lesson12Content];
const chapters = officialLessons.flatMap((lesson) => lesson.chapters);
const allExercises = chapters.flatMap((chapter) => [chapter.exercises.guided, ...chapter.exercises.autonomous]);
const [firstGuidedExercise, ...remainingExercises] = allExercises;
const finalAssessments = officialLessons.map((lesson) => lesson.finalAssessment);
const moduleNumbers = [...new Set(officialLessons.map((lesson) => lesson.id.split(".")[0] ?? "0"))];
const programmingModules = moduleNumbers.map((moduleNumber) => ({
  id: `programming-module-${moduleNumber}`,
  title: `Modulo ${moduleNumber}`,
  lessons: officialLessons
    .filter((lesson) => lesson.id.split(".")[0] === moduleNumber)
    .map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.summary[0],
      sectionIds: lesson.sections.map((section) => section.id),
      exerciseIds: lesson.chapters.flatMap((chapter) => [chapter.exercises.guided.id, ...chapter.exercises.autonomous.map((exercise) => exercise.id)]),
      quizIds: lesson.chapters.flatMap((chapter) => chapter.quiz.map((question) => question.id)),
      glossary: lesson.glossary,
      summary: lesson.summary,
      objectives: lesson.objectives,
    })),
}));

export const programmingPythonProjects = [
  {
    id: "programming-zero-python-project-0-1",
    lessonId: "0.1",
    title: "Il mio primo messaggio",
    difficulty: "Primi passi",
    goal: "Capire che un programma contiene dati e istruzioni che producono un risultato osservabile.",
    concepts: ["variabili", "testo", "numeri", "print"],
    instructions: [
      "Esegui una prima volta il codice già pronto.",
      "Sostituisci nome e obiettivo con informazioni tue.",
      "Cambia il numero di ore settimanali e aggiungi una quarta riga stampata dal programma.",
    ],
    starterCode: `nome = "Studente"
obiettivo = "imparare a programmare"
ore_settimanali = 3

print("Ciao, mi chiamo", nome)
print("Il mio obiettivo è", obiettivo)
print("Studierò", ore_settimanali, "ore alla settimana")`,
    expectedResult: "Il programma deve mostrare almeno tre righe personalizzate.",
  },
  {
    id: "programming-zero-python-project-0-2",
    lessonId: "0.2",
    title: "Carta d’identità del computer",
    difficulty: "Base",
    goal: "Rappresentare alcune caratteristiche di un computer e prendere una decisione semplice usando una condizione.",
    concepts: ["variabili", "numeri", "confronto", "if/else"],
    instructions: [
      "Personalizza i dati del dispositivo, della RAM e dello spazio libero.",
      "Esegui il programma e osserva quale messaggio sceglie la condizione.",
      "Prova uno spazio libero inferiore a 20 GB e verifica che il risultato cambi.",
    ],
    starterCode: `dispositivo = "computer portatile"
memoria_ram_gb = 8
spazio_libero_gb = 120

print("Dispositivo:", dispositivo)
print("RAM:", memoria_ram_gb, "GB")
print("Spazio libero:", spazio_libero_gb, "GB")

if spazio_libero_gb >= 20:
    print("Stato: spazio sufficiente")
else:
    print("Stato: serve liberare spazio")`,
    expectedResult: "Il programma deve descrivere il dispositivo e mostrare uno dei due possibili stati.",
  },
  {
    id: "programming-zero-python-project-0-3",
    lessonId: "0.3",
    title: "Quanto spazio occupano i miei dati?",
    difficulty: "Base con calcolo",
    goal: "Usare numeri e operazioni per stimare la dimensione di un insieme di contenuti digitali.",
    concepts: ["dati digitali", "moltiplicazione", "divisione", "round"],
    instructions: [
      "Scegli un numero realistico di fotografie e la dimensione media di ciascuna.",
      "Esegui il calcolo in megabyte e gigabyte.",
      "Aggiungi una stampa che spieghi con parole tue che cosa rappresenta il risultato.",
    ],
    starterCode: `numero_foto = 120
dimensione_foto_mb = 4

totale_mb = numero_foto * dimensione_foto_mb
totale_gb = totale_mb / 1024

print("Numero di fotografie:", numero_foto)
print("Spazio totale in MB:", totale_mb)
print("Spazio totale in GB:", round(totale_gb, 2))`,
    expectedResult: "Il programma deve mostrare quantità, megabyte totali e gigabyte arrotondati.",
  },
] as const;

if (!firstGuidedExercise) throw new Error("Le fonti ufficiali non contengono esercizi guidati");

export const programmingCurriculumOutline = officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`);

export const programmingLesson = {
  id: PROGRAMMING_LESSON_ID,
  pathId: PROGRAMMING_ZERO_PATH_ID,
  moduleId: "programming-module-0",
  title: "Programmazione da Zero · Lezioni 0.1–1.2",
  lessonTitles: officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`),
  level: "Lettore senza conoscenze pregresse",
  estimatedMinutes: 990,
  description: officialLessons.map((lesson) => lesson.summary[0]).join(" "),
  objectives: officialLessons.flatMap((lesson) => lesson.objectives),
  modules: programmingModules,
  sourceDocuments: officialLessons.map((lesson) => ({ lessonId: lesson.id, ...lesson.source, metrics: lesson.metrics })),
  sections: officialLessons.flatMap((lesson) => lesson.sections) as LessonSection[],
  glossary: officialLessons.flatMap((lesson) => lesson.glossary) as string[][],
  guidedExercise: {
    ...(firstGuidedExercise as OfficialExercise),
    hints: [] as string[],
    requiredCases: [(firstGuidedExercise as OfficialExercise).autoverification ?? ""],
  },
  exercises: remainingExercises.map((exercise) => ({ ...exercise })) as Array<OfficialExercise>,
  quiz: chapters.flatMap((chapter) => chapter.quiz) as LessonQuizQuestion[],
  project: {
    id: "programming-zero-final-assessments",
    title: "Prova finale di padronanza",
    prompt: finalAssessments.map((assessment) => `Lezione ${assessment.lessonId}\n${assessment.prompt}`).join("\n\n"),
    deliverables: finalAssessments.flatMap((assessment) => assessment.deliverables),
    criteria: finalAssessments.flatMap((assessment) => assessment.rubric.slice(1).map((row) => row.join(" · "))),
    assessments: finalAssessments,
    guidedProjects: programmingPythonProjects,
  },
  completion: {
    minimumQuizScore: 80,
    requiredExerciseIds: chapters.flatMap((chapter) => [
      ...(chapter.exercises.guided.id === firstGuidedExercise.id ? [] : [chapter.exercises.guided.id]),
      ...chapter.exercises.autonomous.slice(0, 2).map((exercise) => exercise.id),
    ]),
    requiresGuidedExercise: true,
    requiresProject: true,
    requiresSelfAssessment: false,
  },
  summary: officialLessons.flatMap((lesson) => lesson.summary),
} as const;

export type ProgrammingLesson = typeof programmingLesson;

export function publicProgrammingLesson() {
  return {
    ...programmingLesson,
    quiz: programmingLesson.quiz.map((question) => ({
      id: question.id,
      concept: question.concept,
      prompt: question.prompt,
      choices: question.choices,
      explanation: question.explanation,
      reviewSectionId: question.reviewSectionId,
    })),
  };
}

export function findQuizQuestion(questionId: string) {
  return programmingLesson.quiz.find((question) => question.id === questionId) ?? null;
}

