"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Pause, Play, Square, Volume2 } from "lucide-react";

const AUDIO_PREFERENCES_KEY = "aula:eve-audio-preferences";

function selectedText() {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    if (end > start) return active.value.slice(start, end).trim();
  }
  return window.getSelection()?.toString().trim() ?? "";
}

function SpeechTranscript({ text, charIndex }: { text: string; charIndex: number }) {
  if (!text) return null;
  const start = Math.max(0, charIndex - 100);
  const excerpt = text.slice(start, Math.min(text.length, charIndex + 260));
  const parts = excerpt.split(/(\s+)/);
  return <p aria-live="off" className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-white/5 p-3 text-[9px] leading-5 text-white/48">{start > 0 && "…"}{parts.map((part, index) => { const from = start + parts.slice(0, index).reduce((length, previous) => length + previous.length, 0); const active = Boolean(part.trim()) && charIndex >= from && charIndex < from + part.length; return <span key={`${from}-${index}`} className={active ? "rounded bg-cyan-300 px-0.5 font-bold text-[#10201d]" : ""}>{part}</span>; })}{start + excerpt.length < text.length && "…"}</p>;
}

export function ExerciseVoiceAssistant({ title, prompt, hints, completed, comparison }: {
  title: string;
  prompt: string;
  hints: readonly string[];
  completed: boolean;
  comparison: string;
}) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [rate, setRate] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [status, setStatus] = useState("Eve è pronta a leggere la consegna.");
  const [spokenText, setSpokenText] = useState("");
  const [spokenCharIndex, setSpokenCharIndex] = useState(0);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) { setSupported(false); return; }
    const available = window.speechSynthesis.getVoices();
    setVoices(available);
    setVoiceUri((current) => current && available.some((voice) => voice.voiceURI === current) ? current : (available.find((voice) => voice.lang.toLowerCase().startsWith("it")) ?? available[0])?.voiceURI ?? "");
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setSupported(false); return; }
    try {
      const saved = JSON.parse(window.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "{}") as { voiceUri?: string; rate?: number };
      if (typeof saved.voiceUri === "string") setVoiceUri(saved.voiceUri);
      if (typeof saved.rate === "number") setRate(saved.rate);
    } catch { /* Usa le preferenze iniziali. */ }
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => { window.speechSynthesis.cancel(); window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices); };
  }, [refreshVoices]);

  useEffect(() => {
    try {
      const previous = JSON.parse(window.localStorage.getItem(AUDIO_PREFERENCES_KEY) ?? "{}") as Record<string, unknown>;
      window.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify({ ...previous, voiceUri, rate }));
    } catch { /* La voce resta disponibile nella sessione. */ }
  }, [rate, voiceUri]);

  function speak(text: string, label: string) {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "it-IT";
    utterance.rate = rate;
    utterance.voice = voices.find((voice) => voice.voiceURI === voiceUri) ?? null;
    utterance.onboundary = (event) => { if (event.name === "word" || !event.name) setSpokenCharIndex(event.charIndex); };
    utterance.onend = () => { setSpeaking(false); setPaused(false); setStatus(`Lettura completata: ${label}.`); };
    utterance.onerror = () => { setSpeaking(false); setPaused(false); setStatus("La lettura si è interrotta."); };
    window.speechSynthesis.speak(utterance);
    setSpokenText(text); setSpokenCharIndex(0);
    setSpeaking(true); setPaused(false); setStatus(`Eve sta leggendo ${label}.`);
  }

  function readSelection() {
    const selection = selectedText();
    if (!selection) { setStatus("Seleziona prima una frase nella consegna o nella risposta."); return; }
    speak(selection, "il testo selezionato");
  }

  function nextHint() {
    if (!hints.length) { setStatus("Per questo esercizio non è presente un suggerimento editoriale ufficiale."); return; }
    const next = Math.min(hints.length - 1, hintIndex + 1);
    setHintIndex(next);
    speak(`Suggerimento ${next + 1}. ${hints[next]}`, `il suggerimento ${next + 1}`);
  }

  function togglePause() {
    if (!speaking) { speak(`${title}. ${prompt}`, "la consegna"); return; }
    if (paused) { window.speechSynthesis.resume(); setPaused(false); setStatus("Lettura ripresa."); }
    else { window.speechSynthesis.pause(); setPaused(true); setStatus("Lettura in pausa."); }
  }

  function stop() {
    window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); setStatus("Lettura fermata.");
  }

  return <aside data-testid="exercise-voice-assistant" className="mt-5 rounded-2xl border border-cyan-200/60 bg-[#14201d] p-4 text-white">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[8px] font-black uppercase tracking-[0.16em] text-cyan-200">Eve · Assistente esercizi</p><p className="mt-1 text-[9px] text-white/45">Ascolta, prova, ricevi un aiuto e poi confronta.</p></div><div className="flex gap-1"><button type="button" onClick={() => speak(`${title}. ${prompt}`, "la consegna")} aria-label="Leggi consegna" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-300 px-2.5 text-[8px] font-bold text-[#10201d]"><Volume2 size={12} /> Consegna</button><button type="button" onClick={togglePause} aria-label={speaking && !paused ? "Pausa" : "Avvia o riprendi"} className="grid size-8 place-items-center rounded-lg bg-white/8">{speaking && !paused ? <Pause size={12} /> : <Play size={12} />}</button><button type="button" onClick={stop} disabled={!speaking} aria-label="Ferma lettura" className="grid size-8 place-items-center rounded-lg bg-white/8 disabled:opacity-30"><Square size={11} /></button></div></div>
    <div className={`eve-frequency mt-3${speaking && !paused ? " is-speaking" : ""}`} aria-hidden="true">{Array.from({ length: 25 }, (_, index) => <span key={index} style={{ animationDelay: `${index * -37}ms` }} />)}</div>
    <SpeechTranscript text={spokenText} charIndex={spokenCharIndex} />
    <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_70px]"><select aria-label="Voce Eve esercizi" value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)} className="rounded-lg border-white/10 bg-white/8 py-1.5 pl-2 pr-6 text-[9px] text-white"><option value="" className="text-black">Voce automatica</option>{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI} className="text-black">{voice.lang} · {voice.name}</option>)}</select><select aria-label="Velocità Eve esercizi" value={rate} onChange={(event) => setRate(Number(event.target.value))} className="rounded-lg border-white/10 bg-white/8 py-1.5 pl-2 pr-5 text-[9px] text-white">{[0.65,0.8,0.9,1,1.15,1.3,1.5,1.75].map((value) => <option key={value} value={value} className="text-black">{value}×</option>)}</select></div>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={readSelection} className="rounded-lg bg-white/8 px-2.5 py-2 text-[8px] font-bold">Leggi selezione</button><button type="button" onClick={nextHint} className="inline-flex items-center gap-1 rounded-lg bg-violet-400/15 px-2.5 py-2 text-[8px] font-bold text-violet-100"><Lightbulb size={11} /> Suggerimento{hints.length > 1 ? ` ${Math.min(hints.length, hintIndex + 2)}/${hints.length}` : ""}</button>{completed && comparison && <button type="button" onClick={() => speak(`Criteri di confronto. ${comparison}`, "i criteri di confronto")} className="rounded-lg bg-emerald-300/15 px-2.5 py-2 text-[8px] font-bold text-emerald-100">Leggi confronto</button>}</div>
    {hintIndex >= 0 && hints[hintIndex] && <p className="mt-3 rounded-lg bg-violet-400/10 p-2.5 text-[9px] leading-4 text-violet-50"><strong>Suggerimento {hintIndex + 1}.</strong> {hints[hintIndex]}</p>}
    <p role="status" className="mt-3 text-[8px] text-white/38">{supported ? status : "La sintesi vocale non è disponibile in questo browser."}</p>
    {!completed && <p className="mt-2 text-[8px] leading-4 text-white/28">I criteri di confronto si sbloccano dopo una risposta valida di almeno 20 caratteri. Eve non anticipa soluzioni non presenti nel corso.</p>}
  </aside>;
}
