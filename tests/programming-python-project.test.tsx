import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgrammingLessonWorkspace } from "@/components/room/programming-lesson-workspace";
import { publicProgrammingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { applyLessonAction, emptyLessonProgress, lessonActionSchema, type LessonProgressState } from "@/lib/programming-lesson-progress";

const initialEve = { title: "Prossimo passo", message: "Continua il corso.", sectionIds: [] as string[] };

class MockPythonWorker {
  private listeners = new Map<string, Set<EventListener>>();

  constructor() {
    queueMicrotask(() => this.emit("message", new MessageEvent("message", { data: { type: "ready" } })));
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const callback: EventListener = typeof listener === "function" ? listener : (event) => listener.handleEvent(event);
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(callback);
    this.listeners.set(type, listeners);
  }

  postMessage(message: { type: string; id: string }) {
    if (message.type !== "run") return;
    queueMicrotask(() => this.emit("message", new MessageEvent("message", { data: { type: "result", id: message.id, output: "Ciao dal progetto Python\n" } })));
  }

  terminate() {}

  private emit(type: string, event: Event) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

describe("Python Project guidati", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", MockPythonWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("esegue, salva una bozza e consegna separatamente il progetto della lezione", async () => {
    let progress: LessonProgressState = { ...emptyLessonProgress };
    const actions: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const action = lessonActionSchema.parse(JSON.parse(String(init?.body)));
      actions.push(action.type);
      progress = applyLessonAction(progress, action, "2026-07-21T12:00:00.000Z").state;
      return { ok: true, json: async () => ({ state: progress, eve: initialEve }) };
    }));

    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={progress} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });

    expect(screen.getByRole("heading", { name: "Impara costruendo, un passo alla volta" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("print(");
    await waitFor(() => expect(screen.getByRole("button", { name: "Esegui codice" })).toBeEnabled());

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Esegui codice" })); });
    await waitFor(() => expect(screen.getByTestId("python-output")).toHaveTextContent("Ciao dal progetto Python"));
    expect(actions).toContain("project_draft_saved");
    await waitFor(() => expect(screen.getByRole("button", { name: "Consegna progetto" })).toBeEnabled());

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Consegna progetto" })); });
    await waitFor(() => expect(actions).toContain("project_submitted"));
    expect(progress.completedProjectLessonIds).toEqual(["0.1"]);
    expect(progress.project).toBe("started");
    expect(screen.getByText("1/11")).toBeInTheDocument();
  });

  it("collega ed esegue il Python Project della lezione 0.4", async () => {
    let progress: LessonProgressState = { ...emptyLessonProgress, project: "started", completedProjectLessonIds: ["0.1", "0.2", "0.3"] };
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const action = lessonActionSchema.parse(JSON.parse(String(init?.body)));
      progress = applyLessonAction(progress, action, "2026-07-21T12:00:00.000Z").state;
      return { ok: true, json: async () => ({ state: progress, eve: initialEve }) };
    }));

    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={progress} initialEve={initialEve} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });

    expect(screen.getByRole("heading", { name: "Una regola di accesso verificabile" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("account_attivo and autorizzato");
    await waitFor(() => expect(screen.getByRole("button", { name: "Esegui codice" })).toBeEnabled());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Esegui codice" })); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Consegna progetto" })).toBeEnabled());
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Consegna progetto" })); });

    await waitFor(() => expect(progress.completedProjectLessonIds).toContain("0.4"));
    expect(screen.getByText("4/11")).toBeInTheDocument();
  });

  it("espone il Python Project della lezione 0.5 con input, algoritmo e output", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.5"]')!); });
    expect(screen.getByRole("heading", { name: "Dall’algoritmo al primo programma" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("minuti_per_lezione");
  });

  it("espone il Python Project della lezione 0.6 con requisiti, stati e casi di test", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.6"]')!); });
    expect(screen.getByRole("heading", { name: "Dal requisito al comportamento verificabile" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("puo_annullare");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain('stato_finale = "annullata"');
  });

  it("espone il Python Project della lezione 0.7 con attribuzioni di primato qualificate", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.7"]')!); });
    expect(screen.getByRole("heading", { name: "Un primato con criteri espliciti" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("ordine_idea_a");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("il primato dipende dal criterio dichiarato");
  });

  it("espone il Python Project della lezione 0.8 con risultati globali e per gruppo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.8"]')!); });
    expect(screen.getByRole("heading", { name: "La media non racconta tutto" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("tasso_globale");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("falsi_positivi_a");
  });

  it("espone ed esegue il Python Project della lezione 0.9 con soglie per dimensione", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.9"]')!); });
    expect(screen.getByRole("heading", { name: "Profilo di padronanza, non solo media" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("totale_superato");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("sistema_superato");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Esegui codice" })); });
    await waitFor(() => expect(screen.getByTestId("python-output")).toHaveTextContent("Ciao dal progetto Python"));
  });

  it("espone i Python Project del Modulo 1 senza usare funzioni escluse dal runner", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: emptyLessonProgress, eve: initialEve }) })));
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={emptyLessonProgress} initialEve={initialEve} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });

    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="1.1"]')!); });
    expect(screen.getByRole("heading", { name: "Mappa dell’ambiente in esecuzione" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("file_sorgente");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).not.toContain("import ");

    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="1.2"]')!); });
    expect(screen.getByRole("heading", { name: "Dossier dell’installazione Python" })).toBeInTheDocument();
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).toContain("prova_funzionale_riuscita");
    expect((screen.getByTestId("python-code-editor") as HTMLTextAreaElement).value).not.toContain("import ");
  });

  it("ripristina codice e risultato di una consegna già salvata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ state: { ...emptyLessonProgress, project: "started", completedProjectLessonIds: ["0.1"] }, eve: initialEve }) })));
    const saved = { activity_id: "programming-zero-python-project-0-1", response: JSON.stringify({ code: "nome = 'Ada'\nprint(nome)", output: "Ada\n" }), status: "submitted" as const };
    render(<ProgrammingLessonWorkspace roomId="room-test" materialId="material-test" lesson={publicProgrammingLesson()} initialState={{ ...emptyLessonProgress, project: "started", completedProjectLessonIds: ["0.1"] }} initialEve={initialEve} initialProjectSubmissions={[saved]} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Python Project" })); });
    await act(async () => { fireEvent.click(document.querySelector<HTMLButtonElement>('[data-project-lesson-id="0.1"]')!); });
    expect(screen.getByTestId("python-code-editor")).toHaveValue("nome = 'Ada'\nprint(nome)");
    expect(screen.getByTestId("python-output")).toHaveTextContent("Ada");
    await waitFor(() => expect(screen.getByRole("button", { name: "Aggiorna consegna" })).toBeEnabled());
  });
});
