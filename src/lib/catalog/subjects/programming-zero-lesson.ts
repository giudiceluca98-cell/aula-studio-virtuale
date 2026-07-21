import officialContent from "./programming-zero-official-content.json";

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

const officialLessons = officialContent.lessons;
const chapters = officialLessons.flatMap((lesson) => lesson.chapters);
const allExercises = chapters.flatMap((chapter) => [chapter.exercises.guided, ...chapter.exercises.autonomous]);
const [firstGuidedExercise, ...remainingExercises] = allExercises;
const finalAssessments = officialLessons.map((lesson) => lesson.finalAssessment);

if (!firstGuidedExercise) throw new Error("Le fonti ufficiali non contengono esercizi guidati");

export const programmingCurriculumOutline = officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`);

export const programmingLesson = {
  id: PROGRAMMING_LESSON_ID,
  pathId: PROGRAMMING_ZERO_PATH_ID,
  moduleId: "programming-module-0",
  title: "Programmazione da Zero · Lezioni 0.1 e 0.2",
  lessonTitles: officialLessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`),
  level: "Lettore senza conoscenze pregresse",
  estimatedMinutes: 180,
  description: officialLessons.map((lesson) => lesson.summary[0]).join(" "),
  objectives: officialLessons.flatMap((lesson) => lesson.objectives),
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
