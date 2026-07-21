import { PROGRAMMING_LESSON_SOURCE_URL, programmingCurriculumOutline, programmingLesson } from "./programming-zero-lesson";
import type { SubjectGoogleQueries, SubjectPackage } from "./types";

function queries(topicIt: string, topicEn: string): SubjectGoogleQueries {
  return {
    lessons: [`${topicIt} lezione principianti`, `${topicEn} beginner lesson`],
    exercises: [`${topicIt} esercizi con soluzioni`, `${topicEn} exercises with solutions`],
    videos: [`${topicIt} video corso`, `${topicEn} beginner video course`],
    pdfs: [`${topicIt} dispense filetype:pdf`, `${topicEn} lecture notes filetype:pdf`],
  };
}

export { programmingCurriculumOutline };

export const programmingSubjectPackage: SubjectPackage = {
  id: "programming",
  name: "Programmazione",
  pathTitle: "Programmazione da zero",
  aliases: [
    "programmazione", "programmazione da zero", "imparare a programmare", "corso di programmazione",
    "corso programmazione", "coding", "sviluppo software", "software development", "python da zero",
    "imparare python", "programmazione python", "diventare programmatore", "programmatore", "developer",
  ],
  description: programmingLesson.description,
  prerequisites: ["Capacità di leggere un testo argomentativo", "Curiosità", "Disponibilità a svolgere esempi su carta"],
  targetProfiles: ["Lettore senza conoscenze pregresse"],
  branches: [],
  entryStageByLevel: {
    no_experience: "programming-module-0", beginner: "programming-module-0", intermediate: "programming-module-0",
    advanced: "programming-module-0", professional: "programming-module-0", university: "programming-module-0",
  },
  stages: programmingLesson.modules.map((module, order) => {
    const lessonIds = module.lessons.map((lesson) => lesson.id);
    const sections = programmingLesson.sections.filter((section) => lessonIds.includes(section.lessonId));
    const exercises = [programmingLesson.guidedExercise, ...programmingLesson.exercises].filter((exercise) => lessonIds.includes(exercise.lessonId));
    const assessments = programmingLesson.project.assessments.filter((assessment) => lessonIds.includes(assessment.lessonId));
    return {
      id: module.id,
      order,
      title: module.title,
      description: module.lessons.flatMap((lesson) => lesson.summary).join(" "),
      prerequisites: order === 0 ? ["Capacità di leggere un testo argomentativo", "Curiosità", "Disponibilità a svolgere esempi su carta"] : [programmingLesson.modules[order - 1]?.title ?? "Modulo precedente"],
      estimatedMinutes: module.lessons.length * 90,
      concepts: sections.filter((section) => section.chapterNumber > 0).map((section) => section.title),
      objectives: module.lessons.flatMap((lesson) => lesson.objectives),
      lessons: module.lessons.map((lesson) => `Lezione ${lesson.id} · ${lesson.title}`),
      activities: ["Esercizio guidato", "Esercizi autonomi", "Quiz", "Prova finale di padronanza"],
      exercises: exercises.map((exercise) => exercise.title),
      projects: assessments.map((assessment) => assessment.title),
      completionCriteria: assessments.flatMap((assessment) => assessment.completionCriteria),
      googleQueries: queries(order === 0 ? "programmazione computer esecuzione programmi" : "ambiente sviluppo Python", order === 0 ? "programming computer program execution" : "Python development environment"),
    };
  }),
  recommendedMaterials: [{
    title: programmingLesson.title,
    provider: "Aula Studio Virtuale",
    url: PROGRAMMING_LESSON_SOURCE_URL,
    type: "interactive",
    language: "it",
    level: "no_experience",
    description: programmingLesson.description,
    stageIds: programmingLesson.modules.map((module) => module.id),
    verified: true,
  }],
};
