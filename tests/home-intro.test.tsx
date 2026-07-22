import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { UiThemeProvider } from "@/components/theme/ui-theme-provider";

describe("intro completa della demo", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, media: "", onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }))));
  afterEach(() => vi.unstubAllGlobals());

  it("mantiene nella vecchia app tutte le sezioni e i collegamenti operativi", () => {
    render(<UiThemeProvider><HomePage /></UiThemeProvider>);
    expect(screen.getByRole("heading", { level: 1, name: /Studiare insieme/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tutto ciò che serve per studiare senza disperdersi." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dalla creazione della stanza alla prima sessione focus." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Una guida che resta accanto al materiale." })).toBeInTheDocument();
    expect(screen.getByText("Passaggio chiave")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Crea la tua aula/ })[0]).toHaveAttribute("href", "/register");
    expect(screen.getByRole("button", { name: "Usa tema Futuristica Focus" })).toBeInTheDocument();
  });
});
