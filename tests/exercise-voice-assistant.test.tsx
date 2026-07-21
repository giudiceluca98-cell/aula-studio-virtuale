import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExerciseVoiceAssistant } from "@/components/room/exercise-voice-assistant";

class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

describe("Eve negli esercizi", () => {
  const speak = vi.fn();
  beforeEach(() => {
    window.localStorage.clear();
    speak.mockClear();
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [], speak, cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() } });
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("legge la consegna e propone soltanto i suggerimenti ricevuti", () => {
    render(<ExerciseVoiceAssistant title="Analizza" prompt="Descrivi input e output." hints={["Parti dagli input."]} completed={false} comparison="Input, elaborazione e output." />);
    fireEvent.click(screen.getByRole("button", { name: "Leggi consegna" }));
    expect((speak.mock.calls[0][0] as MockUtterance).text).toBe("Analizza. Descrivi input e output.");
    fireEvent.click(screen.getByRole("button", { name: /Suggerimento/ }));
    expect(screen.getByText(/Parti dagli input/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leggi confronto" })).not.toBeInTheDocument();
  });

  it("sblocca i criteri di confronto solo quando l'esercizio è completato", () => {
    render(<ExerciseVoiceAssistant title="Analizza" prompt="Descrivi." hints={[]} completed comparison="Controlla i casi limite." />);
    fireEvent.click(screen.getByRole("button", { name: "Leggi confronto" }));
    expect((speak.mock.calls[0][0] as MockUtterance).text).toContain("Controlla i casi limite");
  });
});
