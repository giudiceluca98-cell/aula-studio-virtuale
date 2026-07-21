import { z } from "zod";
import { findQuizQuestion, programmingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";

const responseSchema = z.string().trim().min(20).max(8000);
const projectLessonIdSchema = z.enum(["0.1", "0.2", "0.3"]);
const projectCodeSchema = z.string().trim().min(20).max(2800);
const projectOutputSchema = z.string().max(1000);

export const lessonActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lesson_opened"), eventId: z.string().uuid() }),
  z.object({ type: z.literal("lesson_section_viewed"), eventId: z.string().uuid(), sectionId: z.string().max(80) }),
  z.object({ type: z.literal("lesson_section_completed"), eventId: z.string().uuid(), sectionId: z.string().max(80) }),
  z.object({ type: z.literal("guided_exercise_started"), eventId: z.string().uuid() }),
  z.object({ type: z.literal("guided_exercise_completed"), eventId: z.string().uuid(), response: responseSchema }),
  z.object({ type: z.literal("independent_exercise_completed"), eventId: z.string().uuid(), exerciseId: z.string().max(80), response: responseSchema }),
  z.object({ type: z.literal("quiz_started"), eventId: z.string().uuid() }),
  z.object({ type: z.literal("quiz_answer_submitted"), eventId: z.string().uuid(), questionId: z.string().max(80), choice: z.number().int().min(0).max(7), elapsedSeconds: z.number().int().min(0).max(7200) }),
  z.object({ type: z.literal("quiz_completed"), eventId: z.string().uuid() }),
  z.object({ type: z.literal("project_started"), eventId: z.string().uuid() }),
  z.object({ type: z.literal("project_draft_saved"), eventId: z.string().uuid(), projectLessonId: projectLessonIdSchema, code: projectCodeSchema, output: projectOutputSchema }),
  z.object({ type: z.literal("project_submitted"), eventId: z.string().uuid(), projectLessonId: projectLessonIdSchema, code: projectCodeSchema, output: projectOutputSchema }),
  z.object({ type: z.literal("self_assessment_completed"), eventId: z.string().uuid(), response: responseSchema }),
  z.object({ type: z.literal("review_requested"), eventId: z.string().uuid() }),
]);

export type LessonAction = z.infer<typeof lessonActionSchema>;

export interface LessonAnswerState {
  choice: number;
  correct: boolean;
  attempts: number;
  elapsedSeconds: number;
  concept: string;
  explanation: string;
  reviewSectionId: string;
  answeredAt: string;
}

export interface LessonProgressState {
  viewedSectionIds: string[];
  completedSectionIds: string[];
  currentSectionId: string | null;
  guidedExercise: "not_started" | "started" | "completed";
  independentExerciseIds: string[];
  quizStarted: boolean;
  quizAnswers: Record<string, LessonAnswerState>;
  quizScore: number | null;
  quizCompleted: boolean;
  project: "not_started" | "started" | "submitted";
  completedProjectLessonIds: string[];
  selfAssessmentCompleted: boolean;
  lessonCompleted: boolean;
  completionPercentage: number;
  updatedAt: string | null;
}

export const emptyLessonProgress: LessonProgressState = {
  viewedSectionIds: [], completedSectionIds: [], currentSectionId: null,
  guidedExercise: "not_started", independentExerciseIds: [], quizStarted: false, quizAnswers: {},
  quizScore: null, quizCompleted: false, project: "not_started", completedProjectLessonIds: [], selfAssessmentCompleted: false,
  lessonCompleted: false, completionPercentage: 0, updatedAt: null,
};

function strings(value: unknown, allowed: Set<string>) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.has(item)))] : [];
}

export function normalizeLessonProgress(value: unknown): LessonProgressState {
  if (!value || typeof value !== "object") return { ...emptyLessonProgress };
  const source = value as Partial<LessonProgressState>;
  const sectionIds = new Set(programmingLesson.sections.map((section) => section.id));
  const exerciseIds = new Set(programmingLesson.exercises.map((exercise) => exercise.id));
  const answers: Record<string, LessonAnswerState> = {};
  const projectLessonIds = new Set(programmingLesson.project.guidedProjects.map((project) => project.lessonId));
  if (source.quizAnswers && typeof source.quizAnswers === "object") for (const [id, answer] of Object.entries(source.quizAnswers)) {
    const question = findQuizQuestion(id);
    if (!question || !answer || typeof answer !== "object") continue;
    const candidate = answer as LessonAnswerState;
    if (!Number.isInteger(candidate.choice)) continue;
    answers[id] = { choice: candidate.choice, correct: candidate.choice === question.correctChoice, attempts: Math.max(1, Number(candidate.attempts) || 1), elapsedSeconds: Math.max(0, Number(candidate.elapsedSeconds) || 0), concept: question.concept, explanation: question.explanation, reviewSectionId: question.reviewSectionId, answeredAt: typeof candidate.answeredAt === "string" ? candidate.answeredAt : "" };
  }
  const completedProjectLessonIds = strings(source.completedProjectLessonIds, projectLessonIds);
  const normalizedProjectLessonIds = source.project === "submitted" && completedProjectLessonIds.length === 0 ? [...projectLessonIds] : completedProjectLessonIds;
  return {
    viewedSectionIds: strings(source.viewedSectionIds, sectionIds), completedSectionIds: strings(source.completedSectionIds, sectionIds),
    currentSectionId: typeof source.currentSectionId === "string" && sectionIds.has(source.currentSectionId) ? source.currentSectionId : null,
    guidedExercise: source.guidedExercise === "completed" ? "completed" : source.guidedExercise === "started" ? "started" : "not_started",
    independentExerciseIds: strings(source.independentExerciseIds, exerciseIds), quizStarted: Boolean(source.quizStarted), quizAnswers: answers,
    quizScore: typeof source.quizScore === "number" ? Math.min(100, Math.max(0, source.quizScore)) : null,
    quizCompleted: Boolean(source.quizCompleted), project: normalizedProjectLessonIds.length === projectLessonIds.size ? "submitted" : source.project === "submitted" || source.project === "started" || normalizedProjectLessonIds.length > 0 ? "started" : "not_started",
    completedProjectLessonIds: normalizedProjectLessonIds,
    selfAssessmentCompleted: Boolean(source.selfAssessmentCompleted), lessonCompleted: Boolean(source.lessonCompleted),
    completionPercentage: typeof source.completionPercentage === "number" ? Math.min(100, Math.max(0, source.completionPercentage)) : 0,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
  };
}

function derived(state: LessonProgressState): LessonProgressState {
  const quizScore = Object.keys(state.quizAnswers).length === programmingLesson.quiz.length
    ? Math.round((Object.values(state.quizAnswers).filter((answer) => answer.correct).length / programmingLesson.quiz.length) * 100)
    : state.quizScore;
  const completed = programmingLesson.sections.every((section) => state.completedSectionIds.includes(section.id))
    && state.guidedExercise === "completed"
    && programmingLesson.completion.requiredExerciseIds.every((id) => state.independentExerciseIds.includes(id))
    && state.quizCompleted && (quizScore ?? 0) >= programmingLesson.completion.minimumQuizScore
    && programmingLesson.project.guidedProjects.every((project) => state.completedProjectLessonIds.includes(project.lessonId));
  const sectionPart = (state.completedSectionIds.length / programmingLesson.sections.length) * 30;
  const requiredExercisesDone = programmingLesson.completion.requiredExerciseIds.filter((id) => state.independentExerciseIds.includes(id)).length;
  const exercisePart = (requiredExercisesDone / programmingLesson.completion.requiredExerciseIds.length) * 30;
  const projectPart = (state.completedProjectLessonIds.length / programmingLesson.project.guidedProjects.length) * 10;
  const percentage = Math.round(Math.min(100, sectionPart + (state.guidedExercise === "completed" ? 5 : 0) + exercisePart + (state.quizCompleted ? 25 : 0) + projectPart));
  return { ...state, project: state.completedProjectLessonIds.length === programmingLesson.project.guidedProjects.length ? "submitted" : state.project, quizScore, lessonCompleted: completed, completionPercentage: completed ? 100 : percentage };
}

export function applyLessonAction(current: unknown, action: LessonAction, serverTimestamp: string) {
  const state = normalizeLessonProgress(current);
  let next: LessonProgressState = { ...state, updatedAt: serverTimestamp };
  let feedback: { correct?: boolean; explanation?: string } | null = null;
  switch (action.type) {
    case "lesson_opened": break;
    case "lesson_section_viewed": next = { ...next, currentSectionId: action.sectionId, viewedSectionIds: [...new Set([...next.viewedSectionIds, action.sectionId])] }; break;
    case "lesson_section_completed": next = { ...next, currentSectionId: action.sectionId, viewedSectionIds: [...new Set([...next.viewedSectionIds, action.sectionId])], completedSectionIds: [...new Set([...next.completedSectionIds, action.sectionId])] }; break;
    case "guided_exercise_started": next = { ...next, guidedExercise: next.guidedExercise === "completed" ? "completed" : "started" }; break;
    case "guided_exercise_completed": next = { ...next, guidedExercise: "completed" }; break;
    case "independent_exercise_completed": next = { ...next, independentExerciseIds: [...new Set([...next.independentExerciseIds, action.exerciseId])] }; break;
    case "quiz_started": next = { ...next, quizStarted: true, quizCompleted: false }; break;
    case "quiz_answer_submitted": {
      const question = findQuizQuestion(action.questionId);
      if (!question) throw new Error("QUESTION_NOT_FOUND");
      const previous = next.quizAnswers[action.questionId];
      const answer: LessonAnswerState = { choice: action.choice, correct: action.choice === question.correctChoice, attempts: (previous?.attempts ?? 0) + 1, elapsedSeconds: (previous?.elapsedSeconds ?? 0) + action.elapsedSeconds, concept: question.concept, explanation: question.explanation, reviewSectionId: question.reviewSectionId, answeredAt: serverTimestamp };
      next = { ...next, quizStarted: true, quizAnswers: { ...next.quizAnswers, [action.questionId]: answer } };
      feedback = { correct: answer.correct, explanation: question.explanation };
      break;
    }
    case "quiz_completed": next = { ...next, quizCompleted: Object.keys(next.quizAnswers).length === programmingLesson.quiz.length }; break;
    case "project_started": next = { ...next, project: next.project === "submitted" ? "submitted" : "started" }; break;
    case "project_draft_saved": next = { ...next, project: next.project === "submitted" ? "submitted" : "started" }; break;
    case "project_submitted": {
      const completedProjectLessonIds = [...new Set([...next.completedProjectLessonIds, action.projectLessonId])];
      next = { ...next, completedProjectLessonIds, project: completedProjectLessonIds.length === programmingLesson.project.guidedProjects.length ? "submitted" : "started" };
      break;
    }
    case "self_assessment_completed": next = { ...next, selfAssessmentCompleted: true }; break;
    case "review_requested": break;
  }
  return { state: derived(next), feedback };
}

export function eveLessonAdvice(stateValue: unknown) {
  const state = normalizeLessonProgress(stateValue);
  const incorrect = Object.values(state.quizAnswers).filter((answer) => !answer.correct);
  if (state.lessonCompleted) return { title: "Lezione completata", message: "Hai soddisfatto tutti i criteri. Eve consiglia un breve ripasso domani prima di passare alla lezione successiva.", sectionIds: [] as string[] };
  if (state.quizCompleted && (state.quizScore ?? 0) < programmingLesson.completion.minimumQuizScore) return { title: "Ripasso mirato", message: `Il quiz è al ${state.quizScore ?? 0}%. Rivedi i capitoli associati alle risposte errate e riprova.`, sectionIds: [...new Set(incorrect.map((answer) => answer.reviewSectionId))] };
  const nextSection = programmingLesson.sections.find((section) => !state.completedSectionIds.includes(section.id));
  if (nextSection) return { title: "Prossimo passo", message: `Continua da “${nextSection.title}” e segnala la sezione come compresa quando sapresti rispiegarla.`, sectionIds: [nextSection.id] };
  if (state.guidedExercise !== "completed") return { title: "Metti in pratica", message: `Completa l’esercizio guidato del capitolo “${programmingLesson.guidedExercise.title}”.`, sectionIds: ["programming-0-1-chapter-1"] };
  const nextExercise = programmingLesson.exercises.find((exercise) => !state.independentExerciseIds.includes(exercise.id));
  if (nextExercise) return { title: "Esercizio consigliato", message: `Prosegui con “${nextExercise.title}”.`, sectionIds: [] as string[] };
  if (!state.quizCompleted) return { title: "Verifica i concetti", message: "Avvia o completa i quiz. Eve userà gli errori per indicarti i capitoli da ripassare.", sectionIds: [] as string[] };
  if (state.project !== "submitted") {
    const nextProject = programmingLesson.project.guidedProjects.find((project) => !state.completedProjectLessonIds.includes(project.lessonId));
    return { title: "Python Project", message: nextProject ? `Esegui e consegna “${nextProject.title}” della lezione ${nextProject.lessonId}.` : "Completa i tre Python Project guidati.", sectionIds: [] as string[] };
  }
  return { title: "Controlla i criteri", message: "Rivedi i criteri di completamento delle lezioni 0.1–1.2.", sectionIds: ["programming-0-1-chapter-10", "programming-0-2-chapter-10", "programming-0-3-chapter-10", "programming-0-4-chapter-10", "programming-0-5-chapter-10", "programming-0-6-chapter-12", "programming-0-7-chapter-12", "programming-0-8-chapter-12", "programming-0-9-chapter-10", "programming-1-1-chapter-10", "programming-1-2-chapter-10"] };
}

export function lessonSubmissionFor(action: LessonAction) {
  if (action.type === "project_draft_saved" || action.type === "project_submitted") {
    const project = programmingLesson.project.guidedProjects.find((item) => item.lessonId === action.projectLessonId);
    if (!project) return null;
    return { activityId: project.id, activityType: "project", response: JSON.stringify({ code: action.code, output: action.output }), status: action.type === "project_submitted" ? "submitted" : "draft" };
  }
  if (!("response" in action)) return null;
  const activityId = action.type === "guided_exercise_completed" ? programmingLesson.guidedExercise.id
    : action.type === "independent_exercise_completed" ? action.exerciseId
    : "self-assessment";
  const activityType = action.type === "guided_exercise_completed" ? "guided_exercise"
    : action.type === "independent_exercise_completed" ? "independent_exercise"
    : "self_assessment";
  return { activityId, activityType, response: action.response, status: "submitted" };
}

