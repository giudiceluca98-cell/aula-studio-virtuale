"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, GripHorizontal, Maximize2, Minimize2, Pause, Play, RefreshCw, Square, Volume2, X } from "lucide-react";

type AudioSection = {
  id: string;
  title: string;
  blocks: ReadonlyArray<{ type?: string; text?: string; rows?: readonly (readonly string[])[] }>;
};

type AudioScope = "current" | "selected" | "lesson";
type AudioMode = "faithful" | "lesson";
type Focus = "standard" | "key" | "critical" | "example" | "code";
type SpeechItem = { sectionIndex: number; blockIndex: number; text: string; focus: Focus; importance: number; label: string; color: string };

const AUDIO_PREFERENCES_KEY = "aula:eve-audio-preferences";

function classifyBlock(block: AudioSection["blocks"][number], text: string): Pick<SpeechItem, "focus" | "importance" | "label" | "color"> {
  const normalized = text.toLocaleLowerCase("it");
  const critical = ["fondamentale", "attenzione", "errore", "caso limite", "controesempio", "non significa", "differenza", "ricorda", "importante", "deve"];
  const examples = ["esempio", "applicazione", "immagina", "prova", "calcolare", "procedura"];
  const definitions = ["significa", "è un", "è una", "definisce", "rappresenta", "si chiama"];
  if (block.type === "diagram" || block.type === "table") return { focus: "code", importance: 3, label: "Applicazione pratica", color: "Azzurro-violetto" };
  if (block.type === "callout") return critical.some((word) => normalized.includes(word)) ? { focus: "critical", importance: 4, label: "Massima attenzione", color: "Plasma" } : { focus: "key", importance: 3, label: "Concetto chiave", color: "Violetto" };
  if (block.type === "heading") return { focus: "key", importance: 3, label: "Concetto chiave", color: "Violetto" };
  if (critical.some((word) => normalized.includes(word))) return { focus: "critical", importance: 4, label: "Massima attenzione", color: "Plasma" };
  if (examples.some((word) => normalized.includes(word))) return { focus: "example", importance: 2, label: "Esempio o applicazione", color: "Verde-ciano" };
  if (definitions.some((word) => normalized.includes(word))) return { focus: "key", importance: 3, label: "Definizione importante", color: "Violetto" };
  return { focus: "standard", importance: 1, label: "Spiegazione", color: "Ciano" };
}

function buildSpeechItems(sections: readonly AudioSection[], indexes: number[], mode: AudioMode): SpeechItem[] {
  return indexes.flatMap((sectionIndex) => {
    const section = sections[sectionIndex];
    if (!section) return [];
    const title: SpeechItem = { sectionIndex, blockIndex: -1, text: mode === "lesson" ? `Iniziamo questa parte della lezione: ${section.title}.` : section.title, focus: "critical", importance: 4, label: "Tema centrale", color: "Plasma" };
    return [title, ...section.blocks.flatMap((block, blockIndex) => {
      const source = block.rows?.flat().filter(Boolean).join(". ") ?? block.text?.trim() ?? "";
      if (!source) return [];
      const attention = classifyBlock(block, source);
      let text = source;
      if (mode === "lesson" && block.type === "heading") text = `Ora approfondiamo: ${source}.`;
      else if (mode === "lesson" && block.type === "callout") text = `Concetto importante. ${source}`;
      else if (block.type === "diagram") text = `Codice o schema. ${source}`;
      return [{ sectionIndex, blockIndex, text, ...attention }];
    })];
  });
}

function SpeechTranscript({ text, charIndex }: { text: string; charIndex: number }) {
  if (!text) return null;
  const start = Math.max(0, charIndex - 100);
  const excerpt = text.slice(start, Math.min(text.length, charIndex + 260));
  const parts = excerpt.split(/(\s+)/);
  return <p aria-live="off" className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-black/[0.035] p-3 text-[9px] leading-5 text-black/48">{start > 0 && "…"}{parts.map((part, index) => { const from = start + parts.slice(0, index).reduce((length, previous) => length + previous.length, 0); const active = Boolean(part.trim()) && charIndex >= from && charIndex < from + part.length; return <span key={`${from}-${index}`} className={active ? "rounded bg-cyan-200 px-0.5 font-bold text-cyan-950" : ""}>{part}</span>; })}{start + excerpt.length < text.length && "…"}</p>;
}

export function EveLessonAudio({ sections, currentIndex, onNavigate }: { sections: readonly AudioSection[]; currentIndex: number; onNavigate: (index: number) => void }) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [scope, setScope] = useState<AudioScope>("current");
  const [mode, setMode] = useState<AudioMode>("faithful");
  const [selected, setSelected] = useState<number[]>(() => sections.map((_, index) => index));
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [detached, setDetached] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [spokenCharIndex, setSpokenCharIndex] = useState(0);
  const [activeFocus, setActiveFocus] = useState<SpeechItem>({ sectionIndex: 0, blockIndex: -1, text: "", focus: "standard", importance: 1, label: "Pronta", color: "Ciano" });
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const queueRef = useRef<SpeechItem[]>([]);
  const queuePositionRef = useRef(0);
  const cancelledRef = useRef(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const available = window.speechSynthesis.getVoices().slice().sort((a, b) => `${a.lang}-${a.name}`.localeCompare(`${b.lang}-${b.name}`));
    setVoices(available);
    setVoiceUri((current) => current && available.some((voice) => voice.voiceURI === current) ? current : (available.find((voice) => voice.lang.toLowerCase().startsWith("it")) ?? available[0])?.voiceURI ?? "");
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setSupported(false); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "{}") as { voiceUri?: string; rate?: number; scope?: AudioScope; mode?: AudioMode; selected?: number[]; collapsed?: boolean; position?: { x: number; y: number } };
      if (typeof saved.voiceUri === "string") setVoiceUri(saved.voiceUri);
      if (typeof saved.rate === "number" && saved.rate >= 0.6 && saved.rate <= 1.8) setRate(saved.rate);
      if (["current", "selected", "lesson"].includes(saved.scope ?? "")) setScope(saved.scope!);
      if (["faithful", "lesson"].includes(saved.mode ?? "")) setMode(saved.mode!);
      if (Array.isArray(saved.selected)) setSelected(saved.selected.filter((index) => Number.isInteger(index) && index >= 0 && index < sections.length));
      setCollapsed(Boolean(saved.collapsed));
      if (saved.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)) setPosition(saved.position);
    } catch { /* Preferenze non valide: usiamo i valori iniziali. */ }
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => { cancelledRef.current = true; window.speechSynthesis.cancel(); window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices); };
  }, [refreshVoices, sections.length]);

  useEffect(() => {
    try { window.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ voiceUri, rate, scope, mode, selected, collapsed, position })); } catch { /* La lettura resta disponibile senza persistenza. */ }
  }, [collapsed, mode, position, rate, scope, selected, voiceUri]);

  useEffect(() => {
    function movePanel(event: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      setPosition({ x: drag.startX + event.clientX - drag.x, y: drag.startY + event.clientY - drag.y });
    }
    function endDrag(event?: PointerEvent) {
      if (event && dragRef.current?.pointerId !== event.pointerId) return;
      dragRef.current = null;
    }
    function endDragOnBlur() { dragRef.current = null; }
    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDragOnBlur);
    return () => { window.removeEventListener("pointermove", movePanel); window.removeEventListener("pointerup", endDrag); window.removeEventListener("pointercancel", endDrag); window.removeEventListener("blur", endDragOnBlur); };
  }, []);

  const selectedLabel = useMemo(() => selected.length ? `${selected.length} pagine selezionate` : "Nessuna pagina selezionata", [selected.length]);

  function speakQueueIndex(position: number) {
    if (!("speechSynthesis" in window)) return;
    const item = queueRef.current[position];
    if (!item) { setPlaying(false); setPaused(false); setProgress(100); return; }
    queuePositionRef.current = position;
    cancelledRef.current = false;
    onNavigate(item.sectionIndex);
    setSpokenText(item.text);
    setSpokenCharIndex(0);
    setActiveFocus(item);
    setProgress(Math.round((position / Math.max(1, queueRef.current.length)) * 100));
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = rate;
    utterance.lang = "it-IT";
    utterance.voice = voices.find((voice) => voice.voiceURI === voiceUri) ?? null;
    utterance.onboundary = (event) => { if (event.name === "word" || !event.name) setSpokenCharIndex(event.charIndex); };
    utterance.onend = () => {
      if (cancelledRef.current) return;
      const next = position + 1;
      if (next < queueRef.current.length) speakQueueIndex(next);
      else { setPlaying(false); setPaused(false); setProgress(100); setActiveFocus((current) => ({ ...current, label: "Completata", color: "Violetto" })); }
    };
    utterance.onerror = () => { setPlaying(false); setPaused(false); };
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPaused(false);
  }

  function start() {
    if (!supported) return;
    if (playing && paused) { window.speechSynthesis.resume(); setPaused(false); return; }
    window.speechSynthesis.cancel();
    const indexes = scope === "current" ? [currentIndex] : scope === "lesson" ? sections.map((_, index) => index) : [...selected].sort((a, b) => a - b);
    const queue = buildSpeechItems(sections, indexes, mode);
    if (!queue.length) return;
    queueRef.current = queue;
    speakQueueIndex(0);
  }

  function pause() {
    if (!playing) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }

  function stop() {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setActiveFocus({ sectionIndex: currentIndex, blockIndex: -1, text: "", focus: "standard", importance: 1, label: "Pronta", color: "Ciano" });
  }

  function move(offset: number) {
    if (queueRef.current.length && playing) {
      cancelledRef.current = true;
      window.speechSynthesis.cancel();
      const nextPosition = Math.max(0, Math.min(queueRef.current.length - 1, queuePositionRef.current + offset));
      speakQueueIndex(nextPosition);
      return;
    }
    stop();
    onNavigate(Math.max(0, Math.min(sections.length - 1, currentIndex + offset)));
  }

  function previewVoice() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Ciao, sono Eve. Questa è la voce che userò per accompagnarti e spiegarti la lezione.");
    const voice = voices.find((item) => item.voiceURI === voiceUri);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang || "it-IT"; }
    else utterance.lang = "it-IT";
    utterance.rate = rate;
    setActiveFocus({ sectionIndex: currentIndex, blockIndex: -1, text: "Anteprima della voce selezionata", focus: "standard", importance: 1, label: "Anteprima voce", color: "Ciano" });
    window.speechSynthesis.speak(utterance);
  }

  function toggleSelected(index: number) {
    setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort((a, b) => a - b));
  }

  const italianVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith("it"));
  const mainVoices = voices.filter((voice) => !italianVoices.includes(voice) && /^(en|fr|es|de|pt)/i.test(voice.lang));
  const otherVoices = voices.filter((voice) => !italianVoices.includes(voice) && !mainVoices.includes(voice));
  const panelStyle = detached ? { transform: `translate3d(${position.x}px, ${position.y}px, 0)` } : undefined;

  return <section data-focus={activeFocus.focus} data-testid="eve-audio-lesson" style={panelStyle} className={`eve-audio-panel${detached ? " is-detached" : ""}${collapsed ? " is-collapsed" : ""}`} aria-label="Audio-lezione di Eve">
    <div className={`flex items-center justify-between gap-2${detached ? " cursor-grab touch-none" : ""}`} onPointerDown={detached ? (event) => { if ((event.target as HTMLElement).closest("button,select,input")) return; dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: position.x, startY: position.y }; } : undefined}>
      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-moss-700">Audio-lezione</p>{!collapsed && <p className="mt-0.5 truncate text-[9px] text-black/40">Eve legge il contenuto reale della lezione</p>}</div>
      <div className="flex items-center gap-1">{detached && <GripHorizontal size={13} className="text-black/30" />}<button type="button" onClick={() => setDetached((value) => !value)} aria-label={detached ? "Riaggancia Eve" : "Sgancia Eve durante audio"} className="grid size-7 place-items-center rounded-lg bg-black/[0.04]">{detached ? <Minimize2 size={12} /> : <Maximize2 size={12} />}</button><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Espandi Audio-lezione" : "Riduci Audio-lezione"} className="grid size-7 place-items-center rounded-lg bg-black/[0.04]">{collapsed ? <Volume2 size={12} /> : <X size={12} />}</button></div>
    </div>
    {!collapsed && <>
      {!supported && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-2 text-[9px] text-amber-900">La sintesi vocale non è disponibile in questo browser. Le lezioni restano utilizzabili normalmente.</p>}
      <div className="eve-attention-visualizer mt-3 rounded-xl border border-black/[0.06] p-3" data-focus={activeFocus.focus}>
        <div className="flex items-start justify-between gap-2"><div><p className="text-[7px] font-black uppercase tracking-[0.15em] text-black/30">Guida visiva dell&apos;attenzione</p><p className="mt-0.5 text-[10px] font-bold">Frequenza didattica di Eve</p></div><span className="eve-frequency-level rounded-full bg-black/[0.04] px-2 py-1 text-[7px] font-black">{paused ? "In pausa" : activeFocus.label}</span></div>
        <div className={`eve-frequency mt-3${playing && !paused ? " is-speaking" : ""}`} aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <span key={index} style={{ animationDelay: `${index * -37}ms`, animationDuration: `${Math.max(420, 920 - activeFocus.importance * 100 + (index % 5) * 30)}ms` }} />)}</div>
        <p className="mt-2 text-[8px] leading-4 text-black/45"><strong>{activeFocus.color}</strong> · {activeFocus.text ? (activeFocus.text.length > 110 ? `${activeFocus.text.slice(0, 107)}…` : activeFocus.text) : "Eve mostrerà qui il livello di attenzione suggerito durante la lettura."}</p>
        <div className="eve-frequency-legend mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[7px] text-black/35"><span>● Spiegazione</span><span>● Concetto chiave</span><span>● Massima attenzione</span><span>● Esempio o pratica</span></div>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_64px] gap-2">
        <label className="text-[8px] font-bold text-black/45">Voce<select aria-label="Voce Audio-lezione" value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-6 text-[9px]"><option value="">Eve · voce italiana automatica</option>{italianVoices.length > 0 && <optgroup label="Voci italiane">{italianVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang} · {voice.localService ? "locale" : "online"}</option>)}</optgroup>}{mainVoices.length > 0 && <optgroup label="Voci internazionali principali">{mainVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}{otherVoices.length > 0 && <optgroup label="Altre voci installate">{otherVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}</select><span className="mt-1 block font-normal text-black/30">{italianVoices.length} italiane · {voices.length} totali</span></label>
        <label className="text-[8px] font-bold text-black/45">Velocità<select aria-label="Velocità Audio-lezione" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-5 text-[9px]">{[0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
      </div>
      <div className="mt-2 flex gap-2"><button type="button" onClick={previewVoice} className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-1.5 text-[8px] font-bold"><Volume2 size={9} /> Ascolta voce</button><button type="button" onClick={refreshVoices} className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-1.5 text-[8px] font-bold"><RefreshCw size={9} /> Aggiorna voci</button></div>
      <label className="mt-3 block text-[8px] font-bold text-black/45">Contenuto da leggere<select aria-label="Contenuto Audio-lezione" value={scope} onChange={(event) => setScope(event.target.value as AudioScope)} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-6 text-[9px]"><option value="current">Pagina corrente</option><option value="selected">Pagine scelte</option><option value="lesson">Lezione completa</option></select></label>
      <label className="mt-2 block text-[8px] font-bold text-black/45">Modalità<select aria-label="Modalità Audio-lezione" value={mode} onChange={(event) => setMode(event.target.value as AudioMode)} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-6 text-[9px]"><option value="faithful">Lettura fedele</option><option value="lesson">Spiegazione di Eve</option></select></label>
      {scope === "selected" && <div className="mt-2 rounded-xl border border-black/[0.06] p-2"><div className="flex items-center justify-between gap-2"><span className="truncate text-[8px] text-black/40">{selectedLabel}</span><span className="flex gap-1"><button type="button" onClick={() => setSelected(sections.map((_, index) => index).filter((index) => index >= currentIndex))} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Da qui</button><button type="button" onClick={() => setSelected(sections.map((_, index) => index))} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Tutte</button><button type="button" onClick={() => setSelected([])} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Azzera</button></span></div><div className="mt-2 grid grid-cols-6 gap-1">{sections.map((section, index) => <button type="button" key={section.id} aria-label={`Pagina ${index + 1}: ${section.title}`} aria-pressed={selected.includes(index)} onClick={() => toggleSelected(index)} className={`grid h-7 place-items-center rounded-md text-[8px] font-black ${selected.includes(index) ? "bg-moss-700 text-white" : "bg-black/[0.04] text-black/45"}`}>{index + 1}</button>)}</div></div>}
      <SpeechTranscript text={spokenText} charIndex={spokenCharIndex} />
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-cyan-500 transition-[width]" style={{ width: `${progress}%` }} /></div>
      <div className="mt-3 grid grid-cols-5 gap-1"><button type="button" aria-label="Passaggio precedente" onClick={() => move(-1)} disabled={!playing && currentIndex === 0} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><ChevronLeft size={13} /></button><button type="button" aria-label={paused || !playing ? "Avvia lettura" : "Pausa lettura"} onClick={playing && !paused ? pause : start} disabled={!supported} className="grid h-8 place-items-center rounded-lg bg-moss-700 text-white disabled:opacity-35">{playing && !paused ? <Pause size={13} /> : <Play size={13} />}</button><button type="button" aria-label="Ferma lettura" onClick={stop} disabled={!playing} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><Square size={12} /></button><button type="button" aria-label="Passaggio successivo" onClick={() => move(1)} disabled={!playing && currentIndex >= sections.length - 1} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><ChevronRight size={13} /></button><output aria-live="polite" className="grid h-8 place-items-center rounded-lg bg-black/[0.04] text-[8px] font-bold">{playing ? `${queuePositionRef.current + 1}/${queueRef.current.length}` : `${currentIndex + 1}/${sections.length}`}</output></div>
    </>}
  </section>;
}
