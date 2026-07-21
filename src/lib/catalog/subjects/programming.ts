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
  stages: [{
    id: "programming-module-0",
    order: 0,
    title: "Modulo 0",
    description: programmingLesson.description,
    prerequisites: ["Capacità di leggere un testo argomentativo", "Curiosità", "Disponibilità a svolgere esempi su carta"],
    estimatedMinutes: programmingLesson.estimatedMinutes,
    concepts: programmingLesson.sections.filter((section) => section.chapterNumber > 0).map((section) => section.title),
    objectives: [...programmingLesson.objectives],
    lessons: [...programmingLesson.lessonTitles],
    activities: ["Esercizio guidato", "Esercizi autonomi", "Quiz", "Prova finale di padronanza"],
    exercises: [programmingLesson.guidedExercise.title, ...programmingLesson.exercises.map((exercise) => exercise.title)],
    projects: [programmingLesson.project.title],
    completionCriteria: programmingLesson.project.assessments.flatMap((assessment) => assessment.completionCriteria),
    googleQueries: queries("programmazione computer esecuzione programmi", "programming computer program execution"),
  }],
  recommendedMaterials: [{
    title: programmingLesson.title,
    provider: "Aula Studio Virtuale",
    url: PROGRAMMING_LESSON_SOURCE_URL,
    type: "interactive",
    language: "it",
    level: "no_experience",
    description: programmingLesson.description,
    stageIds: ["programming-module-0"],
    verified: true,
  }],
};
