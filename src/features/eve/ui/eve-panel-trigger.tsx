"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEvePanel } from "./eve-panel-provider";
import type { EvePanelContextReference, EvePanelEntryPoint, EvePanelVisibleMode } from "./contracts";
import styles from "./eve-panel.module.css";

interface EvePanelTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  entryPoint: EvePanelEntryPoint;
  context?: EvePanelContextReference;
  mode?: EvePanelVisibleMode;
  children: ReactNode;
}

export function EvePanelTrigger({ entryPoint, context, mode, children, className = "", ...props }: EvePanelTriggerProps) {
  const panel = useEvePanel();
  if (!panel.enabled) return null;
  return (
    <button
      type="button"
      {...props}
      className={`${styles.trigger} ${className}`.trim()}
      onClick={() => panel.open({ entryPoint, context, mode })}
      aria-haspopup="dialog"
      aria-controls="eve-global-panel"
    >
      {children}
    </button>
  );
}
