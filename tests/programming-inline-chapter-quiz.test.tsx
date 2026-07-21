import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgrammingLessonWorkspace } from "@/components/room/programming-lesson-workspace";
import { programmingLesson, publicProgrammingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { applyLessonAction, emptyLessonProgress, lessonActionSchema, type LessonProgressState } from "@/lib/programming-lesson-progress";

const initialEve = { title: "Prossimo passo", message: "Continua dal capitolo.", sectionIds: [] as string[] };
const sectionId = "programming-0-1-chapter-1";

function chapterFixture() {
  const lesson = publicProgrammingLesson();
  const quiz = lesson.quiz.filter((question) => question.reviewSectionId === sectionId);
  return {
    ...lesson,
    quiz,
    modules: lesson.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((item) => item.id === "0.1" ? { ...item, quizIds: quiz.map((question) => question.id) } : item),
    })),
  };
}

describe("quiz interattivi dentro i capitoli", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sostituisce quiz e soluzioni testuali e sincronizza la risposta con la verifica finale", async () => {
    let progress: LessonProgressState = { ...emptyLessonProgress, currentSectionId: sectionId };
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const action = lessonActionSchema.parse(JSON.parse(String(init?.body)));
      progress = applyLessonAction(progress, action, "2026-07-21T10:00:00.000Z").state;
      return { ok: true, json: async () => ({ state: progress, eve: initialEve }) };
    }));

    const lesson = chapterFixture();
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={lesson} initialState={progress} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const inlineQuiz = screen.getByTestId("inline-chapter-quiz");
    expect(inlineQuiz).toHaveTextContent("Mini-verifica del capitolo");
    expect(inlineQuiz.querySelectorAll("[data-question-id]")).toHaveLength(3);
    expect(screen.queryByText(/^SOLUZIONI/i)).not.toBeInTheDocument();

    const publicQuestion = lesson.quiz[0];
    const officialQuestion = programmingLesson.quiz.find((question) => question.id === publicQuestion.id)!;
    await act(async () => {
      fireEvent.click(within(inlineQuiz).getByRole("button", { name: publicQuestion.choices[officialQuestion.correctChoice] }));
    });
    await waitFor(() => expect(within(inlineQuiz).getByRole("status")).toHaveTextContent("Corretto"));
    expect(within(inlineQuiz).getByRole("status")).not.toHaveTextContent("SOLUZIONI");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Quiz" }));
    });
    expect(screen.getByRole("heading", { name: "Quiz completo della lezione" })).toBeInTheDocument();
    const finalQuestion = document.querySelector<HTMLElement>(`[data-question-id="${publicQuestion.id}"]`)!;
    expect(within(finalQuestion).getByRole("button", { name: publicQuestion.choices[officialQuestion.correctChoice] })).toHaveAttribute("aria-pressed", "true");
  });
});
