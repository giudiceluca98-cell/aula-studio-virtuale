import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EveLessonAudio } from "@/components/room/eve-lesson-audio";

class MockUtterance {
  text: string;
  rate = 1;
  lang = "";
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

const sections = [
  { id: "one", title: "Prima pagina", blocks: [{ text: "Contenuto uno" }] },
  { id: "two", title: "Seconda pagina", blocks: [{ text: "Contenuto due" }] },
];

describe("Audio-lezione di Eve", () => {
  const speak = vi.fn();
  const cancel = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    speak.mockClear(); cancel.mockClear(); pause.mockClear(); resume.mockClear();
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [], speak, cancel, pause, resume,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } });
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("espone i tre ambiti e legge la sola pagina corrente per impostazione iniziale", async () => {
    const navigate = vi.fn();
    render(<EveLessonAudio sections={sections} currentIndex={1} onNavigate={navigate} />);
    expect(screen.getByRole("option", { name: "Pagina corrente" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pagine scelte" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Lezione completa" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Avvia lettura" }));
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith(1);
    expect((speak.mock.calls[0][0] as MockUtterance).text).toBe("Seconda pagina");
    await act(async () => { (speak.mock.calls[0][0] as MockUtterance).onend?.(); await Promise.resolve(); });
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(2));
    expect((speak.mock.calls[1][0] as MockUtterance).text).toBe("Contenuto due");
    expect(screen.getByText("Frequenza didattica di Eve")).toBeInTheDocument();
  });

  it("permette di selezionare le pagine in modo compatto", () => {
    render(<EveLessonAudio sections={sections} currentIndex={0} onNavigate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Contenuto Audio-lezione"), { target: { value: "selected" } });
    const second = screen.getByRole("button", { name: "Pagina 2: Seconda pagina" });
    expect(second).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(second);
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("1 pagina selezionata")).toBeInTheDocument();
  });

  it("espone spiegazione, anteprima voce e controlli completi della demo", () => {
    render(<EveLessonAudio sections={sections} currentIndex={0} onNavigate={vi.fn()} />);
    expect(screen.getByRole("option", { name: "Lettura fedele" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Spiegazione di Eve" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ascolta voce" }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect((speak.mock.calls[0][0] as MockUtterance).text).toContain("sono Eve");
    expect(screen.getByRole("button", { name: "Passaggio precedente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passaggio successivo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ferma lettura" })).toBeInTheDocument();
  });
});
