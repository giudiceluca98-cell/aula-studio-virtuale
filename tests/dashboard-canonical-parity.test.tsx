import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomLauncher } from "@/components/dashboard/room-launcher";
import { UiThemeProvider } from "@/components/theme/ui-theme-provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/config", () => ({
  isSupabaseConfigured: () => false,
}));

describe("Dashboard allineata alla demo canonica", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_CATALOG_ENABLED", "1");
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("mantiene tutte le sezioni principali del checkpoint Dashboard", async () => {
    render(
      <UiThemeProvider>
        <RoomLauncher />
      </UiThemeProvider>,
    );

    await waitFor(() =>
      expect(
        screen.queryByLabelText("Caricamento delle stanze"),
      ).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("heading", { name: "Ciao, Studente." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cosa vuoi studiare?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Stanza di destinazione del Catalogo"),
    ).toBeDisabled();
    expect(
      screen.getByRole("heading", { name: "Le tue stanze" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Crea una stanza" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Entra con un invito" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Attività recente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Obiettivi della settimana" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Riprendi rapidamente")).toBeInTheDocument();
    expect(screen.getByText("Progressi personali")).toBeInTheDocument();
    expect(screen.getByText("Suggerimenti di Eve")).toBeInTheDocument();
  });
});
