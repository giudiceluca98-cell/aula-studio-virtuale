import "server-only";
import type { EvePanelClientConfig, EvePanelVisibleMode } from "./contracts";

const enabledValue = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");

type EvePanelEnvironment = Readonly<Record<string, string | undefined>>;

export function readEvePanelConfig(env: EvePanelEnvironment = process.env): EvePanelClientConfig {
  const rawMode = env.EVE_PANEL_DEFAULT_MODE?.trim().toLowerCase();
  if (rawMode && rawMode !== "side" && rawMode !== "expanded") {
    throw new Error("EVE_PANEL_DEFAULT_MODE deve essere side oppure expanded");
  }
  const defaultMode: EvePanelVisibleMode = rawMode === "expanded" ? "expanded" : "side";
  const allowExpanded = env.EVE_PANEL_ALLOW_EXPANDED === undefined
    ? true
    : enabledValue(env.EVE_PANEL_ALLOW_EXPANDED);
  if (defaultMode === "expanded" && !allowExpanded) {
    throw new Error("La modalità predefinita expanded richiede EVE_PANEL_ALLOW_EXPANDED=true");
  }
  return {
    enabled: enabledValue(env.EVE_PANEL_ENABLED),
    defaultMode,
    allowExpanded,
    restorePreference: env.EVE_PANEL_RESTORE_PREFERENCE === undefined
      ? true
      : enabledValue(env.EVE_PANEL_RESTORE_PREFERENCE),
    animationRuntime: "eve-animation-library-1.2.6",
  };
}

export function readSafeEvePanelConfig(env: EvePanelEnvironment = process.env): EvePanelClientConfig {
  try {
    return readEvePanelConfig(env);
  } catch {
    return {
      enabled: false,
      defaultMode: "side",
      allowExpanded: false,
      restorePreference: false,
      animationRuntime: "eve-animation-library-1.2.6",
    };
  }
}
