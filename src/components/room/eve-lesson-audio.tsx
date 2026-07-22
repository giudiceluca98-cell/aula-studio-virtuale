"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RefreshCw, Square, Volume2 } from "lucide-react";

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

export function EveLessonAudio({ sections, currentIndex, onNavigate, detached: controlledDetached, onDetachedChange }: { sections: readonly AudioSection[]; currentIndex: number; onNavigate: (index: number) => void; detached?: boolean; onDetachedChange?: (detached: boolean) => void }) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [scope, setScope] = useState<AudioScope>("current");
  const [mode, setMode] = useState<AudioMode>("faithful");
  const [selected, setSelected] = useState<number[]>(() => sections.map((_, index) => index));
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [localDetached, setLocalDetached] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [spokenCharIndex, setSpokenCharIndex] = useState(0);
  const [activeFocus, setActiveFocus] = useState<SpeechItem>({ sectionIndex: 0, blockIndex: -1, text: "", focus: "standard", importance: 1, label: "Pronta", color: "Ciano" });
  const [progress, setProgress] = useState(0);
  const queueRef = useRef<SpeechItem[]>([]);
  const queuePositionRef = useRef(0);
  const cancelledRef = useRef(false);
  const detached = controlledDetached ?? localDetached;

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const available = window.speechSynthesis.getVoices().slice().sort((a, b) => `${a.lang}-${a.name}`.localeCompare(`${b.lang}-${b.name}`));
    setVoices(available);
    setVoiceUri((current) => current && available.some((voice) => voice.voiceURI === current) ? current : (available.find((voice) => voice.lang.toLowerCase().startsWith("it")) ?? available[0])?.voiceURI ?? "");
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setSupported(false); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "{}") as { voiceUri?: string; rate?: number; scope?: AudioScope; mode?: AudioMode; selected?: number[]; detached?: boolean };
      if (typeof saved.voiceUri === "string") setVoiceUri(saved.voiceUri);
      if (typeof saved.rate === "number" && saved.rate >= 0.6 && saved.rate <= 1.8) setRate(saved.rate);
      if (["current", "selected", "lesson"].includes(saved.scope ?? "")) setScope(saved.scope!);
      if (["faithful", "lesson"].includes(saved.mode ?? "")) setMode(saved.mode!);
      if (Array.isArray(saved.selected)) setSelected(saved.selected.filter((index) => Number.isInteger(index) && index >= 0 && index < sections.length));
      if (typeof saved.detached === "boolean") {
        if (onDetachedChange) onDetachedChange(saved.detached);
        else setLocalDetached(saved.detached);
      }
    } catch { /* Preferenze non valide: usiamo i valori iniziali. */ }
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => { cancelledRef.current = true; window.speechSynthesis.cancel(); window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices); };
  }, [onDetachedChange, refreshVoices, sections.length]);

  useEffect(() => {
    try { window.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ voiceUri, rate, scope, mode, selected, detached })); } catch { /* La lettura resta disponibile senza persistenza. */ }
  }, [detached, mode, rate, scope, selected, voiceUri]);

  const selectedLabel = useMemo(
    () => selected.length === 1 ? "1 pagina selezionata" : selected.length > 1 ? `${selected.length} pagine selezionate` : "Nessuna pagina selezionata",
    [selected.length],
  );

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
  const scopeNote = scope === "current"
    ? "Legge soltanto la pagina aperta nell'area di lavoro."
    : scope === "selected"
      ? "Legge le pagine che selezioni qui sotto, nell'ordine della lezione."
      : "Legge tutte le pagine della lezione dall'inizio alla fine.";

  return <section data-focus={activeFocus.focus} data-testid="eve-audio-lesson" className={`eve-audio-panel eve-voice-console${detached ? " is-detached" : ""}`} aria-label="Audio-lezione di Eve">
    <header className="eve-voice-heading">
      <div>
        <p className="eve-voice-eyebrow">Voce di Eve</p>
        <h3>Audio-lezione</h3>
      </div>
      <span className="eve-audio-badge">AI VOICE</span>
    </header>

    <p className="eve-voice-status" role="status">
      <span aria-hidden="true" />
      {!supported ? "Sintesi vocale non disponibile" : playing ? (paused ? "Lettura in pausa" : "Eve sta leggendo") : "Pronta per iniziare"}
    </p>

    {!supported && <p className="eve-audio-warning">La sintesi vocale non è disponibile in questo browser. Le lezioni restano utilizzabili normalmente.</p>}

    <div className="eve-attention-visualizer" data-focus={activeFocus.focus}>
      <div className="eve-visualizer-heading">
        <div>
          <p>Guida visiva dell&apos;attenzione</p>
          <strong>Frequenza didattica di Eve</strong>
        </div>
        <span className="eve-frequency-level">{paused ? "In pausa" : activeFocus.label}</span>
      </div>
      <div className={`eve-frequency${playing && !paused ? " is-speaking" : ""}`} aria-hidden="true">
        {Array.from({ length: 25 }, (_, index) => <span key={index} style={{ animationDelay: `${index * -37}ms`, animationDuration: `${Math.max(420, 920 - activeFocus.importance * 100 + (index % 5) * 30)}ms` }} />)}
      </div>
      <p className="eve-focus-copy"><strong>{activeFocus.color}</strong> · {activeFocus.text ? (activeFocus.text.length > 110 ? `${activeFocus.text.slice(0, 107)}…` : activeFocus.text) : "Eve mostrerà qui il livello di attenzione suggerito durante la lettura."}</p>
      <div className="eve-frequency-legend"><span>● Spiegazione</span><span>● Concetto chiave</span><span>● Massima attenzione</span><span>● Esempio o pratica</span></div>
    </div>

    <label className="eve-audio-field eve-scope-field">Contenuto
      <select aria-label="Contenuto Audio-lezione" value={scope} onChange={(event) => setScope(event.target.value as AudioScope)}>
        <option value="current">Pagina corrente</option><option value="selected">Pagine scelte</option><option value="lesson">Lezione completa</option>
      </select>
    </label>
    <p className="eve-scope-note">{scopeNote}</p>

    {scope === "selected" && <div className="eve-page-selector">
      <div className="eve-page-selector-heading">
        <span>{selectedLabel}</span>
        <span className="eve-page-actions">
          <button type="button" onClick={() => setSelected(sections.map((_, index) => index).filter((index) => index >= currentIndex))}>Da qui</button>
          <button type="button" onClick={() => setSelected(sections.map((_, index) => index))}>Tutte</button>
          <button type="button" onClick={() => setSelected([])}>Azzera</button>
        </span>
      </div>
      <div className="eve-page-grid">{sections.map((section, index) => <button type="button" key={section.id} aria-label={`Pagina ${index + 1}: ${section.title}`} aria-pressed={selected.includes(index)} onClick={() => toggleSelected(index)}>{index + 1}</button>)}</div>
    </div>}

    <div className="eve-audio-pair">
      <label className="eve-audio-field">Modalità
        <select aria-label="Modalità Audio-lezione" value={mode} onChange={(event) => setMode(event.target.value as AudioMode)}><option value="faithful">Lettura fedele</option><option value="lesson">Spiegazione di Eve</option></select>
      </label>
      <label className="eve-audio-field">Velocità
        <select aria-label="Velocità Audio-lezione" value={rate} onChange={(event) => setRate(Number(event.target.value))}>{[0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2].map((value) => <option key={value} value={value}>{value}×</option>)}</select>
      </label>
    </div>

    <label className="eve-audio-field eve-voice-field">Voce
      <select aria-label="Voce Audio-lezione" value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)}>
        <option value="">Eve · voce italiana automatica</option>
        {italianVoices.length > 0 && <optgroup label="Voci italiane">{italianVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang} · {voice.localService ? "locale" : "online"}</option>)}</optgroup>}
        {mainVoices.length > 0 && <optgroup label="Voci internazionali principali">{mainVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}
        {otherVoices.length > 0 && <optgroup label="Altre voci installate">{otherVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</optgroup>}
      </select>
      <span>{italianVoices.length} italiane · {voices.length} totali</span>
    </label>

    <div className="eve-voice-tools">
      <button type="button" onClick={previewVoice}><Volume2 size={13} /> Ascolta voce</button>
      <button type="button" onClick={refreshVoices}><RefreshCw size={13} /> Aggiorna voci</button>
    </div>

    <SpeechTranscript text={spokenText} charIndex={spokenCharIndex} />

    <div className="eve-transport">
      <button type="button" aria-label="Passaggio precedente" onClick={() => move(-1)} disabled={!playing && currentIndex === 0}><ChevronLeft size={17} /></button>
      <button type="button" className="eve-transport-primary" aria-label={paused || !playing ? "Avvia lettura" : "Pausa lettura"} onClick={playing && !paused ? pause : start} disabled={!supported}>{playing && !paused ? <Pause size={19} /> : <Play size={19} />}</button>
      <button type="button" aria-label="Ferma lettura" onClick={stop} disabled={!playing}><Square size={15} /></button>
      <button type="button" aria-label="Passaggio successivo" onClick={() => move(1)} disabled={!playing && currentIndex >= sections.length - 1}><ChevronRight size={17} /></button>
    </div>
    <div className="eve-audio-progress" aria-label={`Avanzamento audio ${progress}%`}><span style={{ width: `${progress}%` }} /></div>
    <output aria-live="polite" className="eve-audio-position">{playing ? `${queuePositionRef.current + 1}/${queueRef.current.length}` : `${currentIndex + 1}/${sections.length}`}</output>
  </section>;
}
