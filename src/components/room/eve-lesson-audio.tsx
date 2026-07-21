"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, RefreshCw, Square, Volume2, X } from "lucide-react";

type AudioSection = {
  id: string;
  title: string;
  blocks: ReadonlyArray<{ text?: string; rows?: readonly (readonly string[])[] }>;
};

type AudioScope = "current" | "selected" | "lesson";

const AUDIO_PREFERENCES_KEY = "aula:eve-audio-preferences";

function sectionText(section: AudioSection) {
  return [section.title, ...section.blocks.flatMap((block) => block.rows?.flat().filter(Boolean) ?? (block.text ? [block.text] : []))].join(". ");
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
  const [selected, setSelected] = useState<number[]>(() => sections.map((_, index) => index));
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [detached, setDetached] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [spokenCharIndex, setSpokenCharIndex] = useState(0);
  const queueRef = useRef<number[]>([]);
  const queuePositionRef = useRef(0);
  const cancelledRef = useRef(false);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const available = window.speechSynthesis.getVoices().slice().sort((a, b) => `${a.lang}-${a.name}`.localeCompare(`${b.lang}-${b.name}`));
    setVoices(available);
    setVoiceUri((current) => current && available.some((voice) => voice.voiceURI === current) ? current : (available.find((voice) => voice.lang.toLowerCase().startsWith("it")) ?? available[0])?.voiceURI ?? "");
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setSupported(false); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "{}") as { voiceUri?: string; rate?: number; scope?: AudioScope; selected?: number[]; collapsed?: boolean };
      if (typeof saved.voiceUri === "string") setVoiceUri(saved.voiceUri);
      if (typeof saved.rate === "number" && saved.rate >= 0.6 && saved.rate <= 1.8) setRate(saved.rate);
      if (["current", "selected", "lesson"].includes(saved.scope ?? "")) setScope(saved.scope!);
      if (Array.isArray(saved.selected)) setSelected(saved.selected.filter((index) => Number.isInteger(index) && index >= 0 && index < sections.length));
      setCollapsed(Boolean(saved.collapsed));
    } catch { /* Preferenze non valide: usiamo i valori iniziali. */ }
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => { cancelledRef.current = true; window.speechSynthesis.cancel(); window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices); };
  }, [refreshVoices, sections.length]);

  useEffect(() => {
    try { window.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ voiceUri, rate, scope, selected, collapsed })); } catch { /* La lettura resta disponibile senza persistenza. */ }
  }, [collapsed, rate, scope, selected, voiceUri]);

  const selectedLabel = useMemo(() => selected.length ? `${selected.length} pagine selezionate` : "Nessuna pagina selezionata", [selected.length]);

  function speakQueueIndex(position: number) {
    if (!("speechSynthesis" in window)) return;
    const index = queueRef.current[position];
    const section = sections[index];
    if (!section) { setPlaying(false); setPaused(false); return; }
    queuePositionRef.current = position;
    cancelledRef.current = false;
    onNavigate(index);
    const text = sectionText(section);
    setSpokenText(text);
    setSpokenCharIndex(0);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = "it-IT";
    utterance.voice = voices.find((voice) => voice.voiceURI === voiceUri) ?? null;
    utterance.onboundary = (event) => { if (event.name === "word" || !event.name) setSpokenCharIndex(event.charIndex); };
    utterance.onend = () => {
      if (cancelledRef.current) return;
      const next = position + 1;
      if (next < queueRef.current.length) speakQueueIndex(next);
      else { setPlaying(false); setPaused(false); }
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
    const queue = scope === "current" ? [currentIndex] : scope === "lesson" ? sections.map((_, index) => index) : [...selected].sort((a, b) => a - b);
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
  }

  function move(offset: number) {
    stop();
    const next = Math.max(0, Math.min(sections.length - 1, currentIndex + offset));
    onNavigate(next);
  }

  function toggleSelected(index: number) {
    setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index].sort((a, b) => a - b));
  }

  return <section data-testid="eve-audio-lesson" className={`eve-audio-panel${detached ? " is-detached" : ""}${collapsed ? " is-collapsed" : ""}`} aria-label="Audio-lezione di Eve">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-moss-700">Audio-lezione</p>{!collapsed && <p className="mt-0.5 truncate text-[9px] text-black/40">Eve legge il contenuto reale della lezione</p>}</div>
      <div className="flex gap-1"><button type="button" onClick={() => setDetached((value) => !value)} aria-label={detached ? "Riaggancia Eve" : "Sgancia Eve"} className="grid size-7 place-items-center rounded-lg bg-black/[0.04]">{detached ? <Minimize2 size={12} /> : <Maximize2 size={12} />}</button><button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Espandi Audio-lezione" : "Riduci Audio-lezione"} className="grid size-7 place-items-center rounded-lg bg-black/[0.04]">{collapsed ? <Volume2 size={12} /> : <X size={12} />}</button></div>
    </div>
    {!collapsed && <>
      {!supported && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-2 text-[9px] text-amber-900">La sintesi vocale non è disponibile in questo browser. Le lezioni restano utilizzabili normalmente.</p>}
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_64px] gap-2">
        <label className="text-[8px] font-bold text-black/45">Voce<select aria-label="Voce Audio-lezione" value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-6 text-[9px]"><option value="">Voce automatica</option>{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.lang} · {voice.name}</option>)}</select></label>
        <label className="text-[8px] font-bold text-black/45">Velocità<select aria-label="Velocità Audio-lezione" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-5 text-[9px]">{[0.65, 0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75].map((value) => <option key={value} value={value}>{value}×</option>)}</select></label>
      </div>
      <button type="button" onClick={refreshVoices} className="mt-2 inline-flex items-center gap-1 text-[8px] font-bold text-moss-800"><RefreshCw size={9} /> Aggiorna voci</button>
      <label className="mt-3 block text-[8px] font-bold text-black/45">Contenuto da leggere<select aria-label="Contenuto Audio-lezione" value={scope} onChange={(event) => setScope(event.target.value as AudioScope)} className="mt-1 w-full rounded-lg border-black/10 bg-white py-1.5 pl-2 pr-6 text-[9px]"><option value="current">Pagina corrente</option><option value="selected">Pagine scelte</option><option value="lesson">Lezione completa</option></select></label>
      {scope === "selected" && <div className="mt-2 rounded-xl border border-black/[0.06] p-2"><div className="flex items-center justify-between gap-2"><span className="truncate text-[8px] text-black/40">{selectedLabel}</span><span className="flex gap-1"><button type="button" onClick={() => setSelected(sections.map((_, index) => index).filter((index) => index >= currentIndex))} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Da qui</button><button type="button" onClick={() => setSelected(sections.map((_, index) => index))} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Tutte</button><button type="button" onClick={() => setSelected([])} className="rounded-md bg-black/[0.04] px-1.5 py-1 text-[7px] font-bold">Azzera</button></span></div><div className="mt-2 grid grid-cols-6 gap-1">{sections.map((section, index) => <button type="button" key={section.id} aria-label={`Pagina ${index + 1}: ${section.title}`} aria-pressed={selected.includes(index)} onClick={() => toggleSelected(index)} className={`grid h-7 place-items-center rounded-md text-[8px] font-black ${selected.includes(index) ? "bg-moss-700 text-white" : "bg-black/[0.04] text-black/45"}`}>{index + 1}</button>)}</div></div>}
      <div className={`eve-frequency mt-3${playing && !paused ? " is-speaking" : ""}`} aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <span key={index} style={{ animationDelay: `${index * -37}ms` }} />)}</div>
      <SpeechTranscript text={spokenText} charIndex={spokenCharIndex} />
      <div className="mt-3 grid grid-cols-5 gap-1"><button type="button" aria-label="Pagina precedente" onClick={() => move(-1)} disabled={currentIndex === 0} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><ChevronLeft size={13} /></button><button type="button" aria-label={paused || !playing ? "Avvia lettura" : "Pausa lettura"} onClick={playing && !paused ? pause : start} disabled={!supported} className="grid h-8 place-items-center rounded-lg bg-moss-700 text-white disabled:opacity-35">{playing && !paused ? <Pause size={13} /> : <Play size={13} />}</button><button type="button" aria-label="Ferma lettura" onClick={stop} disabled={!playing} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><Square size={12} /></button><button type="button" aria-label="Pagina successiva" onClick={() => move(1)} disabled={currentIndex >= sections.length - 1} className="grid h-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-25"><ChevronRight size={13} /></button><output aria-live="polite" className="grid h-8 place-items-center rounded-lg bg-black/[0.04] text-[8px] font-bold">{currentIndex + 1}/{sections.length}</output></div>
    </>}
  </section>;
}
