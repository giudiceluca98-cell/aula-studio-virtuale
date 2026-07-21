import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { UiThemeProvider } from "@/components/theme/ui-theme-provider";
import { isUiTheme, readStoredUiTheme, UI_THEME_STORAGE_KEY } from "@/lib/ui-theme";

describe("temi dell’interfaccia", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.uiTheme = "classic";
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      media: "(hover: hover) and (pointer: fine)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.dataset.uiTheme = "classic";
  });

  it("accetta soltanto i due temi previsti e ripiega su Classico", () => {
    expect(isUiTheme("classic")).toBe(true);
    expect(isUiTheme("futuristic-focus")).toBe(true);
    expect(isUiTheme("dark")).toBe(false);
    expect(readStoredUiTheme({ getItem: () => "non-valido" })).toBe("classic");
  });

  it("mostra entrambi i design, applica la scelta e la conserva", async () => {
    render(<UiThemeProvider><ThemeSelector /></UiThemeProvider>);
    await waitFor(() => expect(screen.getByRole("radio", { name: /Classico/ })).toHaveAttribute("aria-checked", "true"));

    fireEvent.click(screen.getByRole("radio", { name: /Futuristica Focus/ }));

    expect(document.documentElement.dataset.uiTheme).toBe("futuristic-focus");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(window.localStorage.getItem(UI_THEME_STORAGE_KEY)).toBe("futuristic-focus");
    expect(screen.getByRole("radio", { name: /Futuristica Focus/ })).toHaveAttribute("aria-checked", "true");
  });
});
