import { describe, expect, it } from "vitest";
import { readEvePanelConfig } from "@/features/eve/ui/config";

describe("CORE-1.5 configurazione pannello", () => {
  it("è disattivato per impostazione predefinita", () => expect(readEvePanelConfig({})).toMatchObject({ enabled: false, defaultMode: "side" }));
  it("accetta expanded soltanto quando autorizzato", () => expect(readEvePanelConfig({ EVE_PANEL_DEFAULT_MODE: "expanded", EVE_PANEL_ALLOW_EXPANDED: "true" }).defaultMode).toBe("expanded"));
  it("rifiuta modalità sconosciute", () => expect(() => readEvePanelConfig({ EVE_PANEL_DEFAULT_MODE: "floating" })).toThrow("side oppure expanded"));
  it("rifiuta expanded con allowExpanded OFF", () => expect(() => readEvePanelConfig({ EVE_PANEL_DEFAULT_MODE: "expanded", EVE_PANEL_ALLOW_EXPANDED: "false" })).toThrow("richiede"));
});
