import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(path, "utf8");

describe("CORE-1.5 confini integrazione UI", () => {
  it("la configurazione è server-only", () => expect(read("src/features/eve/ui/config.ts")).toContain('import "server-only"'));
  it("non usa NEXT_PUBLIC per autorizzare il pannello", () => expect(read(".env.example")).not.toContain("NEXT_PUBLIC_EVE_PANEL_ENABLED"));
  it("il provider non contiene chiavi o provider esterni", () => {
    const source = read("src/features/eve/ui/eve-panel-provider.tsx");
    expect(source).not.toContain("OPENAI_API_KEY"); expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY"); expect(source).not.toContain("fetch(");
  });
  it("espone ingressi lezione catalogo e aula", () => {
    expect(read("src/components/room/programming-lesson-workspace.tsx")).toContain('entryPoint="lesson"');
    expect(read("src/components/catalog/catalog-explorer.tsx")).toContain('entryPoint="catalog"');
    expect(read("src/components/room/study-room.tsx")).toContain('entryPoint="room"');
  });
  it("supporta Escape, scorciatoia e focus trap", () => {
    const source = read("src/features/eve/ui/eve-panel-provider.tsx");
    expect(source).toContain('event.key === "Escape"'); expect(source).toContain('event.key.toLowerCase() === "e"'); expect(source).toContain('event.key !== "Tab"');
  });
  it("rispetta reduced motion e mobile", () => {
    const css = read("src/features/eve/ui/eve-panel.module.css");
    expect(css).toContain("prefers-reduced-motion"); expect(css).toContain("max-width: 767px");
  });
  it("riusa il contratto Animation Library 1.2.6", () => {
    expect(read("src/features/eve/ui/eve-panel-avatar.tsx")).toContain("EveAnimationLibrary");
    expect(read("src/features/eve/ui/config.ts")).toContain("eve-animation-library-1.2.6");
  });
});
