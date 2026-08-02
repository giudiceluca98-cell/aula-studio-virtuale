import "server-only";
import type { EveCompositionUiSummary } from "../contracts";
import { readEvePanelConfig } from "./config";

export function readEvePanelStatus(): EveCompositionUiSummary {
  try {
    const config = readEvePanelConfig();
    return {
      state: config.enabled ? "ready" : "disabled",
      defaultMode: config.defaultMode,
      allowExpanded: config.allowExpanded,
      restorePreference: config.restorePreference,
      animationRuntime: config.animationRuntime,
      entryPoints: ["lesson", "catalog", "room"],
    };
  } catch {
    return {
      state: "misconfigured",
      defaultMode: "side",
      allowExpanded: false,
      restorePreference: false,
      animationRuntime: "eve-animation-library-1.2.6",
      entryPoints: ["lesson", "catalog", "room"],
    };
  }
}
