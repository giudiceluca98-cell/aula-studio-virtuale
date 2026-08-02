import type { EvePanelAction, EvePanelState } from "./contracts";

export const INITIAL_EVE_PANEL_STATE: EvePanelState = Object.freeze({
  mode: "closed",
  entryPoint: "global",
  context: Object.freeze({}),
  viewState: "idle",
  notice: null,
});

export function reduceEvePanelState(state: EvePanelState, action: EvePanelAction): EvePanelState {
  switch (action.type) {
    case "open":
      return {
        mode: action.request.mode ?? action.defaultMode,
        entryPoint: action.request.entryPoint,
        context: { ...(action.request.context ?? {}) },
        viewState: "loading",
        notice: null,
      };
    case "close":
      return { ...state, mode: "closed", viewState: "idle", notice: null };
    case "set_mode":
      return {
        ...state,
        mode: action.mode === "expanded" && !action.allowExpanded ? "side" : action.mode,
      };
    case "set_view_state":
      return { ...state, viewState: action.viewState, notice: action.notice ?? null };
    case "update_context":
      return { ...state, context: { ...action.context } };
    default:
      return state;
  }
}
