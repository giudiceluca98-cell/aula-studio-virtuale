import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppLogo } from "@/components/brand/app-logo";
import manifest from "@/app/manifest";

describe("logo ufficiale di Aula", () => {
  it("mostra il simbolo in un ritaglio circolare con testo opzionale", () => {
    render(<AppLogo size="sm" showName label="Aula" />);

    const image = screen.getByRole("img", { name: "Logo Aula Studio Virtuale" });
    expect(image.getAttribute("src")).toContain("aula-app-icon.png");
    expect(screen.getByTestId("app-logo-mark")).toHaveClass("rounded-full", "overflow-hidden");
    expect(screen.getByText("Aula")).toBeInTheDocument();
  });

  it("usa lo stesso simbolo nel manifesto installabile", () => {
    const appManifest = manifest();

    expect(appManifest.name).toBe("Aula Studio Virtuale");
    expect(appManifest.icons).toEqual([
      expect.objectContaining({ src: "/aula-app-icon.png", sizes: "1254x1254", type: "image/png" }),
    ]);
  });
});
