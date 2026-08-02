"use client";

import { useEffect } from "react";
import type { EvePanelViewState } from "./contracts";
import styles from "./eve-panel.module.css";

declare global {
  interface Window {
    EveAnimationLibrary?: { setState?: (state: string) => void | Promise<void> };
  }
}

const animationState: Record<EvePanelViewState, string> = {
  idle: "eve-idle",
  loading: "eve-thinking",
  ready: "eve-success",
  empty: "eve-question",
  offline: "eve-offline",
  error: "eve-error",
};

export function EvePanelAvatar({ state }: { state: EvePanelViewState }) {
  useEffect(() => {
    const result = window.EveAnimationLibrary?.setState?.(animationState[state]);
    if (result) void Promise.resolve(result).catch(() => undefined);
  }, [state]);
  return <span className={styles.avatar} data-eve-animation-state={animationState[state]} aria-hidden="true" />;
}
