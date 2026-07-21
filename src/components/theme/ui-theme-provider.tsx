"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isUiTheme, readStoredUiTheme, UI_THEME_STORAGE_KEY, type UiTheme } from "@/lib/ui-theme";

type UiThemeContextValue = {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
};

const UiThemeContext = createContext<UiThemeContextValue | null>(null);

function applyTheme(theme: UiTheme) {
  document.documentElement.dataset.uiTheme = theme;
  document.documentElement.style.colorScheme = theme === "futuristic-focus" ? "dark" : "light";
}

export function UiThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<UiTheme>("classic");

  const setTheme = useCallback((nextTheme: UiTheme) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // La preferenza resta attiva per la sessione quando lo storage non è disponibile.
    }
  }, []);

  useEffect(() => {
    const stored = readStoredUiTheme(window.localStorage);
    setThemeState(stored);
    applyTheme(stored);

    function syncTheme(event: StorageEvent) {
      if (event.key !== UI_THEME_STORAGE_KEY || !isUiTheme(event.newValue)) return;
      setThemeState(event.newValue);
      applyTheme(event.newValue);
    }

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return <UiThemeContext.Provider value={value}>{children}<FuturisticCursor active={theme === "futuristic-focus"} /></UiThemeContext.Provider>;
}

export function useUiTheme() {
  const context = useContext(UiThemeContext);
  if (!context) throw new Error("useUiTheme deve essere usato dentro UiThemeProvider");
  return context;
}

function FuturisticCursor({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [burst, setBurst] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(active && query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [active]);

  useEffect(() => {
    if (!enabled) return;
    let burstTimer: number | undefined;
    const move = (event: PointerEvent) => {
      setPosition({ x: event.clientX - 11, y: event.clientY - 11 });
      setVisible(true);
    };
    const down = (event: PointerEvent) => { if (event.pointerType !== "touch") setPressed(true); };
    const up = () => {
      setPressed(false);
      setBurst(false);
      window.clearTimeout(burstTimer);
      requestAnimationFrame(() => {
        setBurst(true);
        burstTimer = window.setTimeout(() => setBurst(false), 380);
      });
    };
    const hide = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide, { passive: true });
    return () => {
      window.clearTimeout(burstTimer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <span aria-hidden="true" className={`theme-cursor${visible ? " is-visible" : ""}${pressed ? " is-pressed" : ""}${burst ? " is-burst" : ""}`} style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}><span className="theme-cursor-ring" /><span className="theme-cursor-core" /><span className="theme-cursor-burst" /></span>;
}
