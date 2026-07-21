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
    expect(screen.getByRole("button", { name: "Avanti" })).toBeDisabled();

    await clickAndSettle(screen.getByRole("button", { name: "Esercizi" }));
    expect(document.querySelectorAll('[data-exercise-id^="programming-0-3-"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-exercise-id^="programming-0-1-"]')).toHaveLength(0);

    await clickAndSettle(screen.getByRole("button", { name: "Quiz" }));
    expect(document.querySelectorAll('[data-question-id^="programming-0-3-"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-question-id^="programming-0-2-"]')).toHaveLength(0);

    await clickAndSettle(screen.getByRole("button", { name: "Glossario" }));
    expect(screen.getByText("Lezione 0.3 · 2 voci")).toBeInTheDocument();
  });
});
