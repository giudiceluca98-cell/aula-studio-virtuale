"use client";

import { Check, Leaf, Orbit } from "lucide-react";
import { useUiTheme } from "./ui-theme-provider";
import type { UiTheme } from "@/lib/ui-theme";

const options: Array<{ id: UiTheme; name: string; description: string; preview: "classic" | "future" }> = [
  { id: "classic", name: "Classico", description: "Chiaro, naturale e tranquillo. È il design originale dell’aula.", preview: "classic" },
  { id: "futuristic-focus", name: "Futuristica Focus", description: "Esterno scuro, accenti ciano e area di lettura chiara ad alto contrasto.", preview: "future" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useUiTheme();

  return <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tema dell’interfaccia">
    {options.map((option) => {
      const selected = theme === option.id;
      return <button key={option.id} type="button" role="radio" aria-checked={selected} aria-pressed={selected} data-ui-theme-card onClick={() => setTheme(option.id)} className="group overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-moss-300">
        <span className={`relative block h-24 overflow-hidden rounded-xl border ${option.preview === "future" ? "border-cyan-200/20 bg-[#050b12]" : "border-black/[0.06] bg-[#f7f6f1]"}`}>
          <span className={`absolute inset-x-2 top-2 flex h-5 items-center gap-1.5 rounded-md px-2 ${option.preview === "future" ? "bg-[#102532]" : "bg-white"}`}><span className={`size-2 rounded-full ${option.preview === "future" ? "bg-cyan-300" : "bg-moss-600"}`} /><span className={`h-1.5 w-12 rounded-full ${option.preview === "future" ? "bg-cyan-100/45" : "bg-black/15"}`} /></span>
          <span className={`absolute bottom-2 left-2 top-9 w-10 rounded-md ${option.preview === "future" ? "bg-[#0b1c28]" : "bg-white"}`} />
          <span className={`absolute bottom-2 left-14 right-12 top-9 rounded-md ${option.preview === "future" ? "bg-[#f8faf9]" : "bg-white"}`}><span className={`mx-auto mt-3 block h-1.5 w-2/3 rounded-full ${option.preview === "future" ? "bg-black/20" : "bg-moss-200"}`} /><span className="mx-auto mt-2 block h-1.5 w-1/2 rounded-full bg-black/10" /></span>
          <span className={`absolute bottom-2 right-2 top-9 w-8 rounded-md ${option.preview === "future" ? "bg-[#0b1c28]" : "bg-[#e9efe8]"}`} />
        </span>
        <span className="mt-3 flex items-start gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${option.preview === "future" ? "bg-cyan-400/10 text-cyan-300" : "bg-moss-100 text-moss-700"}`}>{option.preview === "future" ? <Orbit size={17} /> : <Leaf size={17} />}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-xs font-bold"><span>{option.name}</span>{selected && <Check size={15} aria-label="Tema attivo" />}</span><span className="mt-1 block text-[10px] leading-4 text-black/45">{option.description}</span></span></span>
      </button>;
    })}
  </div>;
}
