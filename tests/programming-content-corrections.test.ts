import { describe, expect, it } from "vitest";
import { programmingLesson, programmingPythonProjects } from "@/lib/catalog/subjects/programming-zero-lesson";

function projectFor(lessonId: string) {
  const project = programmingPythonProjects.find((item) => item.lessonId === lessonId);
  if (!project) throw new Error(`Python Project mancante per la lezione ${lessonId}`);
  return project;
}

function quizWithPrompt(prompt: string) {
  const question = programmingLesson.quiz.find((item) => item.prompt === prompt);
  if (!question) throw new Error(`Quiz mancante: ${prompt}`);
  return question;
}

describe("coerenza editoriale di Programmazione da zero", () => {
  it("usa unità decimali coerenti nel Python Project 0.3", () => {
    const project = projectFor("0.3");
    expect(project.instructions.join(" ")).toContain("1 GB corrisponde a 1000 MB");
    expect(project.starterCode).toContain("totale_gb = totale_mb / 1000");
    expect(project.starterCode).not.toContain("/ 1024");
  });

  it("gestisce esplicitamente la parità nei Python Project 0.7 e 0.8", () => {
    const historyProject = projectFor("0.7");
    expect(historyProject.starterCode).toContain("elif ordine_idea_b < ordine_idea_a:");
    expect(historyProject.starterCode).toContain("Parità secondo l'idea");
    expect(historyProject.starterCode).toContain("Parità secondo la diffusione");

    const impactProject = projectFor("0.8");
    expect(impactProject.starterCode).toContain("elif tasso_errori_b > tasso_errori_a:");
    expect(impactProject.starterCode).toContain("stesso tasso complessivo di errore");
  });

  it("rende non ambigua la proposizione del quiz 0.4", () => {
    const question = quizWithPrompt("Quale frase è una proposizione?");
    expect(question.choices[question.correctChoice]).toBe("A. ‘5 è maggiore di zero’");
  });

  it("descrive con precisione UTF-8 e una release", () => {
    const utf8Question = quizWithPrompt("UTF-8 codifica che cosa?");
    expect(utf8Question.choices[utf8Question.correctChoice]).toBe("A. Valori scalari Unicode in byte");

    const releaseQuestion = quizWithPrompt("Che cos’è una release?");
    expect(releaseQuestion.choices[releaseQuestion.correctChoice]).toContain("versione identificata e approvata");
    expect(releaseQuestion.choices[releaseQuestion.correctChoice]).toContain("resa disponibile per l’uso");
  });

  it("distingue il dossier teorico 0.9 dai Python Project guidati", () => {
    const lessonText = JSON.stringify(programmingLesson.sections.filter((section) => section.lessonId === "0.9"));
    expect(lessonText).toContain("La verifica teorica non richiede di scrivere codice Python");
    expect(lessonText).toContain("I Python Project dell’app sono esercitazioni pratiche guidate distinte dal dossier");
    expect(lessonText).toContain("l’approfondimento di installazione, terminale, editor e interprete Python");
  });

  it("qualifica i termini di glossario che avevano significati differenti", () => {
    const terms = new Set(programmingLesson.glossary.map(([term]) => term));
    for (const term of [
      "Validazione dell’input",
      "Validazione del sistema",
      "Dominio degli input",
      "Dominio dei valori",
      "Dominio applicativo",
      "Ciclo di vita del processo",
      "Ciclo di vita del software",
      "Artefatto di rappresentazione",
      "Artefatto di lavoro",
      "Tolleranza numerica",
      "Tolleranza meccanica",
      "Valore di confine",
      "Confine del sistema",
      "Criterio di successo WCAG",
    ]) {
      expect(terms.has(term), term).toBe(true);
    }
  });
});
