import { describe, expect, it } from "vitest";
import { INITIAL_EVE_PANEL_STATE, reduceEvePanelState } from "@/features/eve/ui/state";

describe("CORE-1.5 stato pannello Eve", () => {
  it("apre dalla lezione in loading", () => {
    const state = reduceEvePanelState(INITIAL_EVE_PANEL_STATE, { type: "open", request: { entryPoint: "lesson", context: { roomId: "room-a", lessonId: "lesson-a" } }, defaultMode: "side" });
    expect(state.mode).toBe("side"); expect(state.entryPoint).toBe("lesson"); expect(state.viewState).toBe("loading");
  });
  it("chiude senza cancellare la pagina", () => {
    const opened = reduceEvePanelState(INITIAL_EVE_PANEL_STATE, { type: "open", request: { entryPoint: "room" }, defaultMode: "side" });
    expect(reduceEvePanelState(opened, { type: "close" }).mode).toBe("closed");
  });
  it("blocca expanded quando non autorizzato", () => {
    const opened = { ...INITIAL_EVE_PANEL_STATE, mode: "side" as const };
    expect(reduceEvePanelState(opened, { type: "set_mode", mode: "expanded", allowExpanded: false }).mode).toBe("side");
  });
  it("mantiene contesto copiato e non muta l'input", () => {
    const context = { roomId: "room-a" };
    const state = reduceEvePanelState(INITIAL_EVE_PANEL_STATE, { type: "open", request: { entryPoint: "room", context }, defaultMode: "side" });
    context.roomId = "room-b";
    expect(state.context.roomId).toBe("room-a");
  });
  it("supporta stati empty offline ed error", () => {
    let state = reduceEvePanelState(INITIAL_EVE_PANEL_STATE, { type: "set_view_state", viewState: "empty" });
    state = reduceEvePanelState(state, { type: "set_view_state", viewState: "offline", notice: "offline" });
    state = reduceEvePanelState(state, { type: "set_view_state", viewState: "error", notice: "redatto" });
    expect(state.viewState).toBe("error"); expect(state.notice).toBe("redatto");
  });
});
