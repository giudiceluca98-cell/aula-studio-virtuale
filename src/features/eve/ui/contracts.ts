export type EvePanelMode = "closed" | "side" | "expanded";
export type EvePanelVisibleMode = Exclude<EvePanelMode, "closed">;
export type EvePanelEntryPoint = "lesson" | "catalog" | "room" | "global";
export type EvePanelViewState = "idle" | "loading" | "ready" | "empty" | "offline" | "error";

export interface EvePanelContextReference {
  roomId?: string;
  courseId?: string;
  materialId?: string;
  lessonId?: string;
  sectionId?: string;
  query?: string;
  sourceLabel?: string;
}

export interface EvePanelOpenRequest {
  entryPoint: EvePanelEntryPoint;
  mode?: EvePanelVisibleMode;
  context?: EvePanelContextReference;
}

export interface EvePanelClientConfig {
  enabled: boolean;
  defaultMode: EvePanelVisibleMode;
  allowExpanded: boolean;
  restorePreference: boolean;
  animationRuntime: "eve-animation-library-1.2.6";
}

export interface EvePanelState {
  mode: EvePanelMode;
  entryPoint: EvePanelEntryPoint;
  context: EvePanelContextReference;
  viewState: EvePanelViewState;
  notice: string | null;
}

export type EvePanelAction =
  | { type: "open"; request: EvePanelOpenRequest; defaultMode: EvePanelVisibleMode }
  | { type: "close" }
  | { type: "set_mode"; mode: EvePanelVisibleMode; allowExpanded: boolean }
  | { type: "set_view_state"; viewState: EvePanelViewState; notice?: string | null }
  | { type: "update_context"; context: EvePanelContextReference };
