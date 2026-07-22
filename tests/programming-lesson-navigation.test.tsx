import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgrammingLessonWorkspace } from "@/components/room/programming-lesson-workspace";
import { publicProgrammingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { emptyLessonProgress } from "@/lib/programming-lesson-progress";

const initialEve = { title: "Prossimo passo", message: "Continua dalla prima sezione.", sectionIds: [] as string[] };

async function clickAndSettle(element: Element) {
  await act(async () => {
    fireEvent.click(element);
    await Promise.resolve();
    await Promise.resolve();
  });
}

function lightweightLessonFixture() {
  const lesson = publicProgrammingLesson();
  return {
    ...lesson,
    exercises: lesson.exercises.filter((exercise) => exercise.lessonId === "0.3").slice(0, 2),
    quiz: lesson.quiz.filter((question) => question.reviewSectionId.startsWith("programming-0-3-")).slice(0, 2),
    modules: lesson.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((item) => item.id === "0.3" ? { ...item, glossary: item.glossary.slice(0, 2), summary: item.summary.slice(0, 1) } : item),
    })),
  };
}

describe("navigazione separata di moduli e lezioni", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ state: { ...emptyLessonProgress }, eve: initialEve }),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mostra il modulo, seleziona una lezione e limita l’indice alle sue sezioni", async () => {
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={lightweightLessonFixture()} initialState={{ ...emptyLessonProgress }} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const index = screen.getByTestId("course-module-index-desktop");
    expect(index).toHaveTextContent("Modulo 0");
    expect(index.querySelectorAll('[data-lesson-id="0.1"], [data-lesson-id="0.2"], [data-lesson-id="0.3"]')).toHaveLength(3);
    expect(index.querySelectorAll('[data-section-id^="programming-0-1-"]')).toHaveLength(11);
    expect(index.querySelectorAll('[data-section-id^="programming-0-2-"]')).toHaveLength(0);

    const lesson02 = index.querySelector<HTMLButtonElement>('[data-lesson-id="0.2"]');
    expect(lesson02).not.toBeNull();
    await clickAndSettle(lesson02!);

    expect(screen.getByRole("heading", { level: 2, name: "Che cos’è un computer e come esegue un programma?" })).toBeInTheDocument();
    expect(index.querySelectorAll('[data-section-id^="programming-0-1-"]')).toHaveLength(0);
    expect(index.querySelectorAll('[data-section-id^="programming-0-2-"]')).toHaveLength(11);
  });

  it("mantiene sezioni, esercizi, quiz e glossario dentro la lezione scelta", async () => {
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={lightweightLessonFixture()} initialState={{ ...emptyLessonProgress }} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const index = screen.getByTestId("course-module-index-desktop");
    await clickAndSettle(index.querySelector<HTMLButtonElement>('[data-lesson-id="0.3"]')!);
    await clickAndSettle(index.querySelector<HTMLButtonElement>('[data-section-id="programming-0-3-chapter-10"]')!);
    expect(screen.getByRole("button", { name: /Sezione successiva/ })).toBeDisabled();

    await clickAndSettle(screen.getByRole("button", { name: "Esercizi" }));
    expect(document.querySelectorAll('[data-exercise-id^="programming-0-3-"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-exercise-id^="programming-0-1-"]')).toHaveLength(0);

    await clickAndSettle(screen.getByRole("button", { name: "Quiz" }));
    expect(document.querySelectorAll('[data-question-id^="programming-0-3-"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-question-id^="programming-0-2-"]')).toHaveLength(0);

    await clickAndSettle(screen.getByRole("button", { name: "Glossario" }));
    expect(screen.getByText("Lezione 0.3 · 2 voci")).toBeInTheDocument();
  });

  it("ridimensiona soltanto il testo e torna rapidamente all’inizio dell’aula", async () => {
    const shell = document.createElement("div");
    shell.id = "room-scroll-shell";
    const scrollTo = vi.fn();
    const scrollIntoView = vi.fn();
    Object.defineProperty(shell, "scrollTo", { value: scrollTo });
    Object.defineProperty(shell, "scrollIntoView", { value: scrollIntoView });
    document.body.appendChild(shell);

    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={lightweightLessonFixture()} initialState={{ ...emptyLessonProgress }} initialEve={initialEve} />, { container: shell });
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const content = screen.getByTestId("lesson-reading-content");
    expect(content).toHaveAttribute("data-reading-zoom", "100");
    fireEvent.click(screen.getByRole("button", { name: "Aumenta dimensione testo" }));
    expect(content).toHaveAttribute("data-reading-zoom", "110");
    expect(screen.getByLabelText("Dimensione testo")).toHaveTextContent("110%");

    fireEvent.click(screen.getByRole("button", { name: "Torna all’inizio dell’aula" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("minimizza l’intero pannello Eve lasciando la mascotte per riaprirlo", async () => {
    window.localStorage.removeItem("aula:eve-panel-collapsed");
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={lightweightLessonFixture()} initialState={{ ...emptyLessonProgress }} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const workspace = screen.getByTestId("programming-native-lesson");
    fireEvent.click(screen.getByRole("button", { name: "Minimizza il pannello di Eve" }));
    expect(workspace.querySelector(".learning-layout")).toHaveClass("eve-panel-collapsed");
    expect(screen.queryByRole("region", { name: "Audio-lezione di Eve" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apri il pannello di Eve" }));
    expect(workspace.querySelector(".learning-layout")).not.toHaveClass("eve-panel-collapsed");
    expect(screen.getByRole("region", { name: "Audio-lezione di Eve" })).toBeInTheDocument();
  });
});
