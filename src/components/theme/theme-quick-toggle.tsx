"use client";

import { Moon, Sun } from "lucide-react";
import { useUiTheme } from "./ui-theme-provider";

export function ThemeQuickToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useUiTheme();
  const futuristic = theme === "futuristic-focus";
  return <button type="button" aria-label={futuristic ? "Usa tema classico" : "Usa tema Futuristica Focus"} aria-pressed={futuristic} onClick={() => setTheme(futuristic ? "classic" : "futuristic-focus")} className={className}>{futuristic ? <Sun size={14} /> : <Moon size={14} />}<span>Tema</span></button>;
}
