"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Lightbulb, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import type { LessonProgressState } from "@/lib/programming-lesson-progress";

interface PublicLesson {
  id: string; title: string; level: string; estimatedMinutes: number; description: string; objectives: readonly string[]; lessonTitles: readonly string[];
  sections: ReadonlyArray<{ id: string; lessonId: string; chapterNumber: number; title: string; blocks: ReadonlyArray<{ type: "paragraph" | "heading" | "list-item" | "callout" | "diagram" | "table"; text?: string; rows?: readonly (readonly string[])[] }> }>;
  glossary: ReadonlyArray<readonly [string, string]>;
  guidedExercise: { id: string; title: string; prompt: string; hints: readonly string[]; requiredCases: readonly string[] };
  exercises: ReadonlyArray<{ id: string; kind: "guided" | "autonomous"; title: string; prompt: string; autoverification?: string }>;
  quiz: ReadonlyArray<{ id: string; concept: string; prompt: string; choices: readonly string[]; explanation: string; reviewSectionId: string }>;
  project: { id: string; title: string; prompt: string; deliverables: readonly string[]; criteria: readonly string[]; assessments: ReadonlyArray<{ lessonId: string; title: string; prompt: string; deliverables: readonly string[]; rubric: readonly (readonly string[])[]; completionCriteria: readonly string[] }> };
  completion: { minimumQuizScore: number };
  summary: readonly string[];
}

type EveAdvice = { title: string; message: string; sectionIds: string[] };
type Tab = "lesson" | "practice" | "quiz" | "project" | "glossary";

function eventId() { return crypto.randomUUID(); }

export function ProgrammingLessonWorkspace({ roomId, materialId, lesson, initialState, initialEve }: {
  roomId: string; materialId: string; lesson: PublicLesson; initialState: LessonProgressState; initialEve: EveAdvice;
}) {
  const [progress, setProgress] = useState(initialState);
  const [eve, setEve] = useState(initialEve);
  const [tab, setTab] = useState<Tab>("lesson");
  const [sectionIndex, setSectionIndex] = useState(() => Math.max(0, lesson.sections.findIndex((section) => section.id === initialState.currentSectionId)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedId = useRef(eventId());
  const section = lesson.sections[sectionIndex];
  const endpoint = `/api/rooms/${roomId}/materials/${materialId}/lesson`;

  async function act(payload: Record<string, unknown>) {
    setSaving(true); setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { state?: LessonProgressState; eve?: EveAdvice; feedback?: { correct?: boolean; explanation?: string }; error?: string };
      if (!response.ok || !result.state || !result.eve) throw new Error(result.error ?? "save_failed");
      setProgress(result.state); setEve(result.eve);
      return result;
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "invalid_lesson_action" ? "La risposta deve contenere almeno 20 caratteri." : "Non sono riuscita a salvare. Riprova: il testo resta in questa pagina.");
      return null;
    } finally { setSaving(false); }
  }

  useEffect(() => { void act({ type: "lesson_opened", eventId: openedId.current }); /* only on mount */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openSection(index: number) {
    const bounded = Math.max(0, Math.min(lesson.sections.length - 1, index));
    setSectionIndex(bounded); setTab("lesson");
    void act({ type: "lesson_section_viewed", eventId: eventId(), sectionId: lesson.sections[bounded].id });
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: "lesson", label: "Lezione", icon: BookOpen }, { id: "practice", label: "Esercizi", icon: ClipboardCheck },
    { id: "quiz", label: "Quiz", icon: CircleHelp }, { id: "project", label: "Progetto", icon: Lightbulb },
    { id: "glossary", label: "Glossario", icon: BookOpen },
  ];

  return <div className="min-h-[650px] bg-[#f4f1e8]" data-testid="programming-native-lesson">
    <header className="border-b border-black/[0.07] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">Programmazione da zero · Modulo 0 · Lezioni 0.1 e 0.2</p><h2 className="mt-1 text-lg font-bold text-ink">{lesson.title}</h2><p className="mt-1 text-[11px] text-black/45">{lesson.level} · circa {lesson.estimatedMinutes} minuti · Italiano</p></div>
        <div className="min-w-40"><div className="mb-1 flex justify-between text-[10px] font-bold text-moss-800"><span>Avanzamento reale</span><span>{progress.completionPercentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-moss-600 transition-all" style={{ width: `${progress.completionPercentage}%` }} /></div><p className="mt-1 text-right text-[9px] text-black/35">{saving ? "Salvataggio…" : "Salvato automaticamente"}</p></div>
      </div>
      <nav aria-label="Aree della lezione" className="mt-3 flex gap-1 overflow-x-auto pb-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold ${tab === id ? "bg-moss-700 text-white" : "bg-black/[0.04] text-black/55 hover:bg-black/[0.07]"}`}><Icon size={12} />{label}</button>)}</nav>
    </header>

    <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_260px]">
      <aside className="hidden max-h-[78vh] overflow-y-auto border-r border-black/[0.06] bg-white/65 p-3 lg:block"><p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.16em] text-black/35">Indice della lezione</p>{lesson.sections.map((item, index) => <button key={item.id} onClick={() => openSection(index)} className={`mb-1 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[10px] leading-4 ${sectionIndex === index && tab === "lesson" ? "bg-moss-100 font-bold text-moss-900" : "text-black/55 hover:bg-white"}`}><span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[8px] ${progress.completedSectionIds.includes(item.id) ? "bg-moss-600 text-white" : "bg-black/[0.06]"}`}>{progress.completedSectionIds.includes(item.id) ? <Check size={9} /> : index + 1}</span>{item.title}</button>)}</aside>

      <main className="min-w-0 p-4 sm:p-6">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
        {tab === "lesson" && <section aria-labelledby={`section-${section.id}`} className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <p className="eyebrow">Sezione {sectionIndex + 1} di {lesson.sections.length}</p><h3 id={`section-${section.id}`} className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-bold text-ink">{section.title}</h3>
          <div className="mt-5 space-y-4 font-[family-name:var(--font-serif)] text-[1.02rem] leading-8 text-black/72">{section.blocks.map((block, index) => <LessonBlock key={index} block={block} />)}</div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-4"><button disabled={sectionIndex === 0} onClick={() => openSection(sectionIndex - 1)} className="button-secondary disabled:opacity-30"><ChevronLeft size={13} /> Indietro</button><button disabled={saving || progress.completedSectionIds.includes(section.id)} onClick={() => void act({ type: "lesson_section_completed", eventId: eventId(), sectionId: section.id })} className="button-secondary disabled:opacity-55"><Check size={13} />{progress.completedSectionIds.includes(section.id) ? "Segnata come compresa" : "Ho compreso questa sezione"}</button><button disabled={sectionIndex === lesson.sections.length - 1} onClick={() => openSection(sectionIndex + 1)} className="button-primary disabled:opacity-30">Avanti <ChevronRight size={13} /></button></div>
          <p className="mt-3 text-center text-[9px] text-black/35">Scorrere non completa la lezione: contano comprensione, esercizi, quiz, progetto e autovalutazione.</p>
        </section>}
        {tab === "practice" && <PracticePanel lesson={lesson} progress={progress} saving={saving} act={act} />}
        {tab === "quiz" && <QuizPanel lesson={lesson} progress={progress} saving={saving} act={act} />}
        {tab === "project" && <ProjectPanel lesson={lesson} progress={progress} saving={saving} act={act} />}
        {tab === "glossary" && <section className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8"><p className="eyebrow">{lesson.glossary.length} voci dai glossari ufficiali</p><h3 className="mt-2 text-xl font-bold">Glossario</h3><dl className="mt-5 grid gap-3 sm:grid-cols-2">{lesson.glossary.map(([term, definition], index) => <div key={`${term}-${index}`} className="rounded-xl bg-[#f7f5ee] p-4"><dt className="text-xs font-bold text-moss-900">{term}</dt><dd className="mt-1 text-xs leading-5 text-black/58">{definition}</dd></div>)}</dl><div className="mt-6 rounded-xl border border-moss-200 bg-moss-50 p-4"><p className="text-xs font-bold text-moss-900">Sintesi integrate</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-black/60">{lesson.summary.map((item, index) => <li key={index}>• {item}</li>)}</ul></div></section>}
      </main>

      <aside className="border-t border-black/[0.06] bg-[#e9efe8] p-4 lg:border-l lg:border-t-0"><div className="sticky top-4 rounded-2xl bg-white p-4 shadow-sm"><span className="grid size-9 place-items-center rounded-xl bg-moss-100 text-moss-800"><Sparkles size={17} /></span><p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-moss-700">Eve · tutor attivo</p><h3 className="mt-1 text-sm font-bold">{eve.title}</h3><p className="mt-2 text-xs leading-5 text-black/58">{eve.message}</p>{eve.sectionIds.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{eve.sectionIds.map((id) => { const index = lesson.sections.findIndex((item) => item.id === id); return index >= 0 ? <button key={id} onClick={() => openSection(index)} className="rounded-md bg-moss-50 px-2 py-1 text-[9px] font-bold text-moss-800">Ripassa {lesson.sections[index].title}</button> : null; })}</div>}<button onClick={() => void act({ type: "review_requested", eventId: eventId() })} className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-moss-800"><RotateCcw size={11} /> Aggiorna consiglio</button><div className="mt-4 border-t border-black/[0.06] pt-3 text-[9px] leading-4 text-black/38">Eve usa solo progressi, esercizi, quiz e progetto di questa lezione. Non legge chat, chiamate, note private o dati degli altri partecipanti.</div></div></aside>
    </div>
  </div>;
}

function LessonBlock({ block }: { block: PublicLesson["sections"][number]["blocks"][number] }) {
  if (block.type === "heading") return <h4 className="pt-3 text-lg font-bold text-ink">{block.text}</h4>;
  if (block.type === "list-item") return <div className="flex gap-3 rounded-lg bg-[#f7f5ee] px-4 py-2 text-sm leading-6"><span className="text-moss-600">•</span><span>{block.text}</span></div>;
  if (block.type === "callout") return <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><Lightbulb className="mt-1 shrink-0" size={15} /><p>{block.text}</p></div>;
  if (block.type === "diagram") return <pre className="overflow-x-auto whitespace-pre rounded-xl bg-[#17211d] p-4 font-mono text-xs leading-6 text-[#e6f0e6]">{block.text}</pre>;
  if (block.type === "table" && block.rows?.length) return <div className="overflow-x-auto rounded-xl border border-black/[0.08]"><table className="min-w-full border-collapse text-left text-xs"><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? "bg-moss-50 font-bold text-moss-900" : "border-t border-black/[0.06]"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="min-w-32 whitespace-pre-line px-3 py-2 align-top leading-5">{cell}</td>)}</tr>)}</tbody></table></div>;
  return <p className="whitespace-pre-line">{block.text}</p>;
}

function ResponseBox({ label, button, done, saving, onSubmit }: { label: string; button: string; done: boolean; saving: boolean; onSubmit: (response: string) => Promise<unknown> }) {
  const [value, setValue] = useState("");
  return <div className="mt-4"><label className="text-[10px] font-bold text-black/55">{label}<textarea value={value} onChange={(event) => setValue(event.target.value)} disabled={done} maxLength={8000} className="mt-2 min-h-32 w-full rounded-xl border-black/10 text-xs leading-5" placeholder="Scrivi una risposta completa (almeno 20 caratteri)…" /></label><div className="mt-2 flex items-center justify-between"><span className="text-[9px] text-black/30">{value.length}/8000</span><button disabled={saving || done || value.trim().length < 20} onClick={() => void onSubmit(value).then((result) => { if (result) setValue(""); })} className="button-primary disabled:opacity-40">{saving ? <Loader2 size={12} className="animate-spin" /> : done ? <Check size={12} /> : <Send size={12} />}{done ? "Completato" : button}</button></div></div>;
}

function PracticePanel({ lesson, progress, saving, act }: { lesson: PublicLesson; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  return <section className="mx-auto max-w-3xl space-y-4"><article className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><p className="eyebrow">Esercizio guidato</p><h3 className="mt-2 text-xl font-bold">{lesson.guidedExercise.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-6 text-black/60">{lesson.guidedExercise.prompt}</p><p className="mt-4 text-[10px] font-bold">{lesson.guidedExercise.requiredCases.join(" ")}</p>{progress.guidedExercise === "not_started" && <button onClick={() => void act({ type: "guided_exercise_started", eventId: eventId() })} className="button-secondary mt-4">Inizia esercizio</button>}<ResponseBox label="La tua procedura" button="Registra risposta" done={progress.guidedExercise === "completed"} saving={saving} onSubmit={(response) => act({ type: "guided_exercise_completed", eventId: eventId(), response })} /></article>{lesson.exercises.map((exercise, index) => { const done = progress.independentExerciseIds.includes(exercise.id); return <article key={exercise.id} className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"><p className="eyebrow">{exercise.kind === "guided" ? "Esercizio guidato" : "Esercizio autonomo"} {index + 2}</p><h3 className="mt-2 text-base font-bold">{exercise.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-6 text-black/60">{exercise.prompt}</p>{exercise.autoverification && <p className="mt-3 text-[10px] font-bold leading-5 text-black/55">{exercise.autoverification}</p>}<ResponseBox label="La tua risposta" button="Completa esercizio" done={done} saving={saving} onSubmit={(response) => act({ type: "independent_exercise_completed", eventId: eventId(), exerciseId: exercise.id, response })} /></article>; })}</section>;
}

function QuizPanel({ lesson, progress, saving, act }: { lesson: PublicLesson; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  useEffect(() => { if (!progress.quizStarted) void act({ type: "quiz_started", eventId: eventId() }); setStartedAt(Date.now()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const allAnswered = lesson.quiz.every((question) => progress.quizAnswers[question.id]);
  return <section className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Verifica concettuale</p><h3 className="mt-2 text-xl font-bold">Quiz delle lezioni 0.1 e 0.2</h3></div><div className="text-right"><p className="text-2xl font-bold text-moss-800">{progress.quizScore ?? "—"}%</p><p className="text-[9px] text-black/35">soglia {lesson.completion.minimumQuizScore}%</p></div></div><div className="mt-6 space-y-6">{lesson.quiz.map((question, index) => { const answer = progress.quizAnswers[question.id]; return <fieldset key={question.id} className="border-t border-black/[0.06] pt-5"><legend className="text-sm font-bold"><span className="mr-2 text-moss-700">{index + 1}.</span>{question.prompt}</legend><div className="mt-3 grid gap-2">{question.choices.map((choice, choiceIndex) => <button key={choice} disabled={saving} onClick={() => void act({ type: "quiz_answer_submitted", eventId: eventId(), questionId: question.id, choice: choiceIndex, elapsedSeconds: Math.round((Date.now() - startedAt) / 1000) }).then(() => setStartedAt(Date.now()))} className={`rounded-xl border p-3 text-left text-xs leading-5 ${answer?.choice === choiceIndex ? answer.correct ? "border-moss-400 bg-moss-50" : "border-red-300 bg-red-50" : "border-black/[0.08] hover:bg-black/[0.02]"}`}>{choice}</button>)}</div>{answer && <div className={`mt-3 rounded-lg p-3 text-[10px] leading-5 ${answer.correct ? "bg-moss-50 text-moss-900" : "bg-amber-50 text-amber-950"}`}><strong>{answer.correct ? "Corretto." : "Da ripassare."}</strong> {answer.explanation}<span className="ml-2 opacity-60">Tentativi: {answer.attempts} · tempo: {answer.elapsedSeconds}s</span></div>}</fieldset>; })}</div><button disabled={!allAnswered || saving} onClick={() => void act({ type: "quiz_completed", eventId: eventId() })} className="button-primary mt-6 w-full justify-center disabled:opacity-40">Concludi e calcola il risultato</button>{progress.quizCompleted && (progress.quizScore ?? 0) < lesson.completion.minimumQuizScore && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">Eve indica i capitoli associati alle risposte da ripassare; puoi cambiare le risposte e concludere nuovamente i quiz.</p>}</section>;
}

function ProjectPanel({ lesson, progress, saving, act }: { lesson: PublicLesson; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const projectDone = progress.project === "submitted";
  return <section className="mx-auto max-w-3xl space-y-4">{lesson.project.assessments.map((assessment) => <article key={assessment.lessonId} className="rounded-2xl bg-white p-5 shadow-sm sm:p-8"><p className="eyebrow">Lezione {assessment.lessonId}</p><h3 className="mt-2 text-xl font-bold">{assessment.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-6 text-black/60">{assessment.prompt}</p><h4 className="mt-5 text-xs font-bold">Elaborati richiesti</h4><ul className="mt-2 grid gap-2 text-xs text-black/58 sm:grid-cols-2">{assessment.deliverables.map((item, index) => <li key={index} className="rounded-lg bg-[#f7f5ee] p-3">• {item}</li>)}</ul><h4 className="mt-5 text-xs font-bold">Rubrica di valutazione</h4><div className="mt-2 overflow-x-auto rounded-xl border border-black/[0.08]"><table className="min-w-full text-left text-[10px]"><tbody>{assessment.rubric.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? "bg-moss-50 font-bold" : "border-t border-black/[0.06]"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="min-w-28 px-3 py-2 align-top leading-4">{cell}</td>)}</tr>)}</tbody></table></div><h4 className="mt-5 text-xs font-bold">Criteri di completamento della lezione</h4><ul className="mt-2 space-y-2 text-xs leading-5 text-black/58">{assessment.completionCriteria.map((criterion, index) => <li key={index}>• {criterion}</li>)}</ul></article>)}<article className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">{progress.project === "not_started" && <button onClick={() => void act({ type: "project_started", eventId: eventId() })} className="button-secondary mb-4">Inizia le prove finali</button>}<ResponseBox label="Consegna delle prove finali" button="Consegna prove finali" done={projectDone} saving={saving} onSubmit={(response) => act({ type: "project_submitted", eventId: eventId(), response })} /></article></section>;
}
