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
  description: "Corso completo per imparare la programmazione partendo da zero. Introduce il pensiero computazionale e usa Python come primo linguaggio, per poi proseguire verso funzioni, dati, file, oggetti, algoritmi, Git, testing, database, API e web.",
  prerequisites: ["Uso elementare di un computer", "Saper creare e aprire file e cartelle", "Saper usare un browser", "Nessuna esperienza di programmazione", "Matematica elementare sufficiente per iniziare"],
  targetProfiles: ["Principiante assoluto", "Studente", "Autodidatta", "Persona interessata a cambiare settore", "Utente interessato a web, automazione, dati o software"],
  branches: [
    { id: "web", title: "Sviluppo web", description: "Interfacce, HTTP, API e applicazioni web." },
    { id: "backend", title: "Backend", description: "Servizi, API, database, autenticazione e test." },
    { id: "automation", title: "Automazione", description: "Script, file, dati e processi ripetibili." },
    { id: "data", title: "Dati", description: "Analisi, notebook, visualizzazione e basi statistiche." },
    { id: "ai-intro", title: "Intelligenza artificiale", description: "Dati, modelli, valutazione e uso responsabile." },
    { id: "computer-science", title: "Informatica teorica e algoritmi", description: "Correttezza, complessità e strutture dati." },
    { id: "desktop", title: "Applicazioni desktop", description: "Interfacce e integrazione con il sistema operativo." },
  ],
  entryStageByLevel: {
    no_experience: "programming-module-0", beginner: "programming-module-0", intermediate: "programming-module-0",
    advanced: "programming-module-0", professional: "programming-module-0", university: "programming-module-0",
  },
  stages: [{
    id: "programming-module-0", order: 0, title: "Modulo 0 · Introduzione all’informatica e alla programmazione",
    description: "Costruisce il lessico e il metodo necessari prima di scrivere codice. In questa versione è pubblicata integralmente la Lezione 0.1; le lezioni successive verranno aggiunte senza creare schede vuote.",
    prerequisites: [], estimatedMinutes: programmingLesson.estimatedMinutes,
    concepts: ["Programmazione", "Istruzioni", "Programmi e processi", "Algoritmi", "Input, elaborazione e output", "Stato", "Sintassi e semantica", "Decomposizione", "Astrazione", "Casi limite"],
    objectives: [...programmingLesson.objectives],
    lessons: ["0.1 · Che cosa significa programmare?"],
    activities: ["Esercizio guidato: distributore di bevande", "Cinque esercizi autonomi", "Quiz concettuale", "Progetto: assistente per lo studio"],
    exercises: programmingLesson.exercises.map((exercise) => exercise.title),
    projects: [programmingLesson.project.title],
    completionCriteria: ["Quiz almeno 70%", "Esercizi obbligatori completati", "Progetto consegnato", "Autovalutazione completata", "Competenze concettuali dimostrate"],
    googleQueries: queries("introduzione programmazione algoritmi pensiero computazionale", "introduction programming algorithms computational thinking"),
  }],
  recommendedMaterials: [
    { title: programmingLesson.title, provider: "Aula Studio Virtuale", url: PROGRAMMING_LESSON_SOURCE_URL, type: "interactive", language: "it", level: "no_experience", description: programmingLesson.description, stageIds: ["programming-module-0"], verified: true },
    { title: "Python for Everybody", provider: "University of Michigan", url: "https://www.py4e.com/", type: "course", language: "en", level: "beginner", description: "Corso aperto facoltativo con libro, video ed esercizi.", stageIds: ["programming-module-0"], verified: true },
    { title: "CS50’s Introduction to Programming with Python", provider: "Harvard CS50", url: "https://cs50.harvard.edu/python/", type: "course", language: "en", level: "beginner", description: "Corso universitario facoltativo con lezioni e problem set.", stageIds: ["programming-module-0"], verified: true },
    { title: "Python Programming MOOC", provider: "University of Helsinki", url: "https://programming-26.mooc.fi/", type: "course", language: "en", level: "beginner", description: "Corso interattivo universitario facoltativo.", stageIds: ["programming-module-0"], verified: true },
    { title: "The Python Tutorial", provider: "Python Software Foundation", url: "https://docs.python.org/3/tutorial/", type: "documentation", language: "en", level: "beginner", description: "Documentazione ufficiale Python da usare come riferimento.", stageIds: ["programming-module-0"], verified: true },
  ],
};
