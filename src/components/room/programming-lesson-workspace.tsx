"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Lightbulb, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import type { LessonProgressState } from "@/lib/programming-lesson-progress";

interface PublicLesson {
  id: string; title: string; level: string; estimatedMinutes: number; description: string; objectives: readonly string[]; lessonTitles: readonly string[];
  modules: ReadonlyArray<{ id: string; title: string; lessons: ReadonlyArray<{ id: string; title: string; description: string; sectionIds: readonly string[]; exerciseIds: readonly string[]; quizIds: readonly string[]; glossary: ReadonlyArray<readonly string[]>; summary: readonly string[] }> }>;
  sections: ReadonlyArray<{ id: string; lessonId: string; chapterNumber: number; title: string; blocks: ReadonlyArray<{ type: "paragraph" | "heading" | "list-item" | "callout" | "diagram" | "table"; text?: string; rows?: readonly (readonly string[])[] }> }>;
  glossary: ReadonlyArray<readonly string[]>;
  guidedExercise: { id: string; lessonId: string; kind: string; title: string; prompt: string; hints: readonly string[]; requiredCases: readonly string[] };
  exercises: ReadonlyArray<{ id: string; lessonId: string; kind: string; title: string; prompt: string; autoverification?: string }>;
  quiz: ReadonlyArray<{ id: string; concept: string; prompt: string; choices: readonly string[]; explanation: string; reviewSectionId: string }>;
  project: { id: string; title: string; prompt: string; deliverables: readonly string[]; criteria: readonly string[]; assessments: ReadonlyArray<{ lessonId: string; title: string; prompt: string; deliverables: readonly string[]; rubric: readonly (readonly string[])[]; completionCriteria: readonly string[] }> };
  completion: { minimumQuizScore: number };
  summary: readonly string[];
}

type EveAdvice = { title: string; message: string; sectionIds: string[] };
type Tab = "lesson" | "practice" | "quiz" | "project" | "glossary";
type LessonNavigationItem = PublicLesson["modules"][number]["lessons"][number];
type QuizQuestion = PublicLesson["quiz"][number];
type LessonSection = PublicLesson["sections"][number];

function eventId() { return crypto.randomUUID(); }

function splitSectionBlocksAroundQuiz(section: LessonSection) {
  const quizStart = section.blocks.findIndex((block) => block.type === "heading" && block.text?.trim().toLocaleLowerCase("it") === "quiz");
  if (quizStart < 0) return { beforeQuiz: section.blocks, afterQuiz: [] as LessonSection["blocks"][number][] };
  const nextContent = section.blocks.findIndex((block, index) => index > quizStart && block.type === "heading" && ["glossario del capitolo", "riepilogo", "criteri di completamento"].includes(block.text?.trim().toLocaleLowerCase("it") ?? ""));
  return {
    beforeQuiz: section.blocks.slice(0, quizStart),
    afterQuiz: nextContent >= 0 ? section.blocks.slice(nextContent) : [],
  };
}

export function ProgrammingLessonWorkspace({ roomId, materialId, lesson, initialState, initialEve }: {
  roomId: string; materialId: string; lesson: PublicLesson; initialState: LessonProgressState; initialEve: EveAdvice;
}) {
  const [progress, setProgress] = useState(initialState);
  const [eve, setEve] = useState(initialEve);
  const [tab, setTab] = useState<Tab>("lesson");
  const initialSectionIndex = Math.max(0, lesson.sections.findIndex((section) => section.id === initialState.currentSectionId));
  const [sectionIndex, setSectionIndex] = useState(initialSectionIndex);
  const [selectedLessonId, setSelectedLessonId] = useState(() => lesson.sections[initialSectionIndex]?.lessonId ?? lesson.modules[0]?.lessons[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openedId = useRef(eventId());
  const selectedModule = lesson.modules.find((module) => module.lessons.some((item) => item.id === selectedLessonId)) ?? lesson.modules[0];
  const selectedLesson = selectedModule?.lessons.find((item) => item.id === selectedLessonId) ?? selectedModule?.lessons[0];
  const lessonSections = selectedLesson ? selectedLesson.sectionIds.map((id) => lesson.sections.find((item) => item.id === id)).filter((item): item is PublicLesson["sections"][number] => Boolean(item)) : [];
  const section = lesson.sections[sectionIndex] ?? lessonSections[0] ?? lesson.sections[0];
  const sectionPosition = Math.max(0, lessonSections.findIndex((item) => item.id === section.id));
  const sectionBlocks = splitSectionBlocksAroundQuiz(section);
  const chapterQuestions = lesson.quiz.filter((question) => question.reviewSectionId === section.id);
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
    setSectionIndex(bounded); setSelectedLessonId(lesson.sections[bounded].lessonId); setTab("lesson");
    void act({ type: "lesson_section_viewed", eventId: eventId(), sectionId: lesson.sections[bounded].id });
  }

  function openLesson(lessonId: string) {
    const target = lesson.sections.findIndex((item) => item.lessonId === lessonId);
    if (target < 0) return;
    setSelectedLessonId(lessonId);
    openSection(target);
  }

  function moveInsideLesson(offset: number) {
    const target = lessonSections[sectionPosition + offset];
    if (!target) return;
    openSection(lesson.sections.findIndex((item) => item.id === target.id));
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
    { id: "lesson", label: "Lezione", icon: BookOpen }, { id: "practice", label: "Esercizi", icon: ClipboardCheck },
    { id: "quiz", label: "Quiz", icon: CircleHelp }, { id: "project", label: "Progetto modulo", icon: Lightbulb },
    { id: "glossary", label: "Glossario", icon: BookOpen },
  ];

  return <div className="min-h-[650px] bg-[#f4f1e8]" data-testid="programming-native-lesson">
    <header className="border-b border-black/[0.07] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">Programmazione da zero · {selectedModule?.title} · Lezione {selectedLesson?.id}</p><h2 className="mt-1 text-lg font-bold text-ink">{selectedLesson?.title ?? lesson.title}</h2><p className="mt-1 text-[11px] text-black/45">{lesson.level} · circa {lesson.estimatedMinutes} minuti per il corso · Italiano</p></div>
        <div className="min-w-40"><div className="mb-1 flex justify-between text-[10px] font-bold text-moss-800"><span>Avanzamento reale</span><span>{progress.completionPercentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-black/[0.07]"><div className="h-full rounded-full bg-moss-600 transition-all" style={{ width: `${progress.completionPercentage}%` }} /></div><p className="mt-1 text-right text-[9px] text-black/35">{saving ? "Salvataggio…" : "Salvato automaticamente"}</p></div>
      </div>
      <nav aria-label="Aree della lezione" className="mt-3 flex gap-1 overflow-x-auto pb-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold ${tab === id ? "bg-moss-700 text-white" : "bg-black/[0.04] text-black/55 hover:bg-black/[0.07]"}`}><Icon size={12} />{label}</button>)}</nav>
      <div className="mt-3 lg:hidden"><CourseLessonIndex lesson={lesson} selectedLessonId={selectedLessonId} sectionIndex={sectionIndex} tab={tab} progress={progress} openLesson={openLesson} openSection={openSection} compact /></div>
    </header>

    <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_260px]">
      <aside className="hidden max-h-[78vh] overflow-y-auto border-r border-black/[0.06] bg-white/65 p-3 lg:block"><CourseLessonIndex lesson={lesson} selectedLessonId={selectedLessonId} sectionIndex={sectionIndex} tab={tab} progress={progress} openLesson={openLesson} openSection={openSection} /></aside>

      <main className="min-w-0 p-4 sm:p-6">
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
        {tab === "lesson" && <section aria-labelledby={`section-${section.id}`} className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8">
          <p className="eyebrow">Lezione {selectedLesson?.id} · Sezione {sectionPosition + 1} di {lessonSections.length}</p><h3 id={`section-${section.id}`} className="mt-2 font-[family-name:var(--font-serif)] text-2xl font-bold text-ink">{section.title}</h3>
          <div className="mt-5 space-y-4 font-[family-name:var(--font-serif)] text-[1.02rem] leading-8 text-black/72">{sectionBlocks.beforeQuiz.map((block, index) => <LessonBlock key={index} block={block} />)}</div>
          {chapterQuestions.length > 0 && <InlineChapterQuiz questions={chapterQuestions} progress={progress} saving={saving} act={act} />}
          {sectionBlocks.afterQuiz.length > 0 && <div className="mt-6 space-y-4 font-[family-name:var(--font-serif)] text-[1.02rem] leading-8 text-black/72">{sectionBlocks.afterQuiz.map((block, index) => <LessonBlock key={index} block={block} />)}</div>}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-4"><button disabled={sectionPosition === 0} onClick={() => moveInsideLesson(-1)} className="button-secondary disabled:opacity-30"><ChevronLeft size={13} /> Indietro</button><button disabled={saving || progress.completedSectionIds.includes(section.id)} onClick={() => void act({ type: "lesson_section_completed", eventId: eventId(), sectionId: section.id })} className="button-secondary disabled:opacity-55"><Check size={13} />{progress.completedSectionIds.includes(section.id) ? "Segnata come compresa" : "Ho compreso questa sezione"}</button><button disabled={sectionPosition === lessonSections.length - 1} onClick={() => moveInsideLesson(1)} className="button-primary disabled:opacity-30">Avanti <ChevronRight size={13} /></button></div>
          <p className="mt-3 text-center text-[9px] text-black/35">Scorrere non completa la lezione: contano comprensione, esercizi, quiz, progetto e autovalutazione.</p>
        </section>}
        {tab === "practice" && selectedLesson && <PracticePanel lesson={lesson} selectedLesson={selectedLesson} progress={progress} saving={saving} act={act} />}
        {tab === "quiz" && selectedLesson && <QuizPanel lesson={lesson} selectedLesson={selectedLesson} progress={progress} saving={saving} act={act} />}
        {tab === "project" && <ProjectPanel lesson={lesson} progress={progress} saving={saving} act={act} />}
        {tab === "glossary" && selectedLesson && <section className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8"><p className="eyebrow">Lezione {selectedLesson.id} · {selectedLesson.glossary.length} voci</p><h3 className="mt-2 text-xl font-bold">Glossario della lezione</h3><dl className="mt-5 grid gap-3 sm:grid-cols-2">{selectedLesson.glossary.map(([term, definition], index) => <div key={`${term}-${index}`} className="rounded-xl bg-[#f7f5ee] p-4"><dt className="text-xs font-bold text-moss-900">{term}</dt><dd className="mt-1 text-xs leading-5 text-black/58">{definition}</dd></div>)}</dl><div className="mt-6 rounded-xl border border-moss-200 bg-moss-50 p-4"><p className="text-xs font-bold text-moss-900">Sintesi della lezione {selectedLesson.id}</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-black/60">{selectedLesson.summary.map((item, index) => <li key={index}>• {item}</li>)}</ul></div></section>}
      </main>

      <aside className="border-t border-black/[0.06] bg-[#e9efe8] p-4 lg:border-l lg:border-t-0"><div className="sticky top-4 rounded-2xl bg-white p-4 shadow-sm"><span className="grid size-9 place-items-center rounded-xl bg-moss-100 text-moss-800"><Sparkles size={17} /></span><p className="mt-3 text-[9px] font-black uppercase tracking-[0.16em] text-moss-700">Eve · tutor attivo</p><h3 className="mt-1 text-sm font-bold">{eve.title}</h3><p className="mt-2 text-xs leading-5 text-black/58">{eve.message}</p>{eve.sectionIds.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{eve.sectionIds.map((id) => { const index = lesson.sections.findIndex((item) => item.id === id); return index >= 0 ? <button key={id} onClick={() => openSection(index)} className="rounded-md bg-moss-50 px-2 py-1 text-[9px] font-bold text-moss-800">Ripassa {lesson.sections[index].title}</button> : null; })}</div>}<button onClick={() => void act({ type: "review_requested", eventId: eventId() })} className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-moss-800"><RotateCcw size={11} /> Aggiorna consiglio</button><div className="mt-4 border-t border-black/[0.06] pt-3 text-[9px] leading-4 text-black/38">Eve usa solo progressi, esercizi, quiz e progetto di questa lezione. Non legge chat, chiamate, note private o dati degli altri partecipanti.</div></div></aside>
    </div>
  </div>;
}

function CourseLessonIndex({ lesson, selectedLessonId, sectionIndex, tab, progress, openLesson, openSection, compact = false }: {
  lesson: PublicLesson;
  selectedLessonId: string;
  sectionIndex: number;
  tab: Tab;
  progress: LessonProgressState;
  openLesson: (lessonId: string) => void;
  openSection: (index: number) => void;
  compact?: boolean;
}) {
  return <nav aria-label="Moduli, lezioni e sezioni" data-testid={compact ? "course-module-index-mobile" : "course-module-index-desktop"}>
    <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.16em] text-black/35">Moduli e lezioni</p>
    {lesson.modules.map((module) => <section key={module.id} aria-label={module.title} className="mb-3 rounded-xl border border-black/[0.06] bg-white/70 p-2">
      <p className="px-1 py-1 text-[10px] font-black text-ink">{module.title}</p>
      <div className={compact ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1"}>{module.lessons.map((item) => {
        const selected = item.id === selectedLessonId;
        const completed = item.sectionIds.filter((id) => progress.completedSectionIds.includes(id)).length;
        return <button key={item.id} type="button" data-lesson-id={item.id} aria-pressed={selected} onClick={() => openLesson(item.id)} className={`rounded-lg px-2 py-2 text-left ${compact ? "min-w-44 shrink-0" : "w-full"} ${selected ? "bg-moss-100 text-moss-950" : "text-black/55 hover:bg-black/[0.035]"}`}>
          <span className="block text-[9px] font-black uppercase tracking-[0.12em]">Lezione {item.id}</span>
          <span className="mt-0.5 block text-[10px] font-bold leading-4">{item.title}</span>
          <span className="mt-1 block text-[8px] text-black/38">{completed}/{item.sectionIds.length} sezioni comprese</span>
        </button>;
      })}</div>
      {module.lessons.map((item) => item.id === selectedLessonId ? <div key={`${item.id}-sections`} className={`${compact ? "mt-2 flex gap-1 overflow-x-auto pb-1" : "mt-2 border-t border-black/[0.05] pt-2"}`}>
        {item.sectionIds.map((sectionId, localIndex) => {
          const globalIndex = lesson.sections.findIndex((section) => section.id === sectionId);
          const section = lesson.sections[globalIndex];
          if (!section) return null;
          const active = globalIndex === sectionIndex && tab === "lesson";
          const done = progress.completedSectionIds.includes(section.id);
          return <button key={section.id} type="button" data-section-id={section.id} onClick={() => openSection(globalIndex)} className={`flex items-start gap-2 rounded-lg px-2 py-2 text-left text-[10px] leading-4 ${compact ? "min-w-48 shrink-0 border border-black/[0.06]" : "mb-1 w-full"} ${active ? "bg-moss-700 font-bold text-white" : "text-black/55 hover:bg-white"}`}>
            <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[8px] ${active ? "bg-white/20 text-white" : done ? "bg-moss-600 text-white" : "bg-black/[0.06]"}`}>{done ? <Check size={9} /> : localIndex + 1}</span>
            <span>{section.title}</span>
          </button>;
        })}
      </div> : null)}
    </section>)}
  </nav>;
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

function PracticePanel({ lesson, selectedLesson, progress, saving, act }: { lesson: PublicLesson; selectedLesson: LessonNavigationItem; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const allExercises: Array<PublicLesson["guidedExercise"] | PublicLesson["exercises"][number]> = [lesson.guidedExercise, ...lesson.exercises];
  const exercises = allExercises.filter((exercise) => selectedLesson.exerciseIds.includes(exercise.id));
  return <section className="mx-auto max-w-3xl space-y-4">
    <div className="rounded-xl border border-moss-200 bg-moss-50 p-4"><p className="eyebrow">Lezione {selectedLesson.id}</p><h3 className="mt-1 text-base font-bold text-moss-950">Esercizi della lezione</h3><p className="mt-1 text-xs text-black/55">Qui compaiono soltanto i {exercises.length} esercizi collegati a “{selectedLesson.title}”.</p></div>
    {exercises.map((exercise, index) => {
      const primaryGuided = exercise.id === lesson.guidedExercise.id;
      const done = primaryGuided ? progress.guidedExercise === "completed" : progress.independentExerciseIds.includes(exercise.id);
      const verification = "autoverification" in exercise ? exercise.autoverification : lesson.guidedExercise.requiredCases.join(" ");
      return <article key={exercise.id} data-exercise-id={exercise.id} className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
        <p className="eyebrow">{exercise.kind === "guided" ? "Esercizio guidato" : "Esercizio autonomo"} {index + 1}</p>
        <h3 className="mt-2 text-base font-bold">{exercise.title}</h3>
        <p className="mt-2 whitespace-pre-line text-xs leading-6 text-black/60">{exercise.prompt}</p>
        {verification && <p className="mt-3 text-[10px] font-bold leading-5 text-black/55">{verification}</p>}
        {primaryGuided && progress.guidedExercise === "not_started" && <button onClick={() => void act({ type: "guided_exercise_started", eventId: eventId() })} className="button-secondary mt-4">Inizia esercizio</button>}
        <ResponseBox label={primaryGuided ? "La tua procedura" : "La tua risposta"} button={primaryGuided ? "Registra risposta" : "Completa esercizio"} done={done} saving={saving} onSubmit={(response) => primaryGuided ? act({ type: "guided_exercise_completed", eventId: eventId(), response }) : act({ type: "independent_exercise_completed", eventId: eventId(), exerciseId: exercise.id, response })} />
      </article>;
    })}
  </section>;
}

function QuizQuestionList({ questions, progress, saving, act, revealExplanation }: {
  questions: readonly QuizQuestion[];
  progress: LessonProgressState;
  saving: boolean;
  act: (payload: Record<string, unknown>) => Promise<unknown>;
  revealExplanation: boolean;
}) {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  return <div className="space-y-6">{questions.map((question, index) => {
    const answer = progress.quizAnswers[question.id];
    return <fieldset key={question.id} data-question-id={question.id} className="border-t border-black/[0.06] pt-5">
      <legend className="text-sm font-bold"><span className="mr-2 text-moss-700">{index + 1}.</span>{question.prompt}</legend>
      <div className="mt-3 grid gap-2">{question.choices.map((choice, choiceIndex) => <button key={choice} type="button" disabled={saving} aria-pressed={answer?.choice === choiceIndex} onClick={() => void act({ type: "quiz_answer_submitted", eventId: eventId(), questionId: question.id, choice: choiceIndex, elapsedSeconds: Math.round((Date.now() - startedAt) / 1000) }).then(() => setStartedAt(Date.now()))} className={`rounded-xl border p-3 text-left text-xs leading-5 ${answer?.choice === choiceIndex ? answer.correct ? "border-moss-400 bg-moss-50" : "border-red-300 bg-red-50" : "border-black/[0.08] hover:bg-black/[0.02]"}`}>{choice}</button>)}</div>
      {answer && <div role="status" className={`mt-3 rounded-lg p-3 text-[10px] leading-5 ${answer.correct ? "bg-moss-50 text-moss-900" : "bg-amber-50 text-amber-950"}`}><strong>{answer.correct ? "Corretto." : "Da ripassare."}</strong>{revealExplanation ? <> {answer.explanation}</> : <> La risposta è stata salvata; puoi riprovare senza vedere in anticipo la soluzione.</>}<span className="ml-2 opacity-60">Tentativi: {answer.attempts} · tempo: {answer.elapsedSeconds}s</span></div>}
    </fieldset>;
  })}</div>;
}

function InlineChapterQuiz({ questions, progress, saving, act }: {
  questions: readonly QuizQuestion[];
  progress: LessonProgressState;
  saving: boolean;
  act: (payload: Record<string, unknown>) => Promise<unknown>;
}) {
  const answered = questions.filter((question) => progress.quizAnswers[question.id]);
  const correct = answered.filter((question) => progress.quizAnswers[question.id]?.correct).length;
  return <section data-testid="inline-chapter-quiz" className="mt-8 rounded-2xl border border-moss-200 bg-[#f5f8f2] p-4 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Mini-verifica del capitolo</p><h4 className="mt-1 text-lg font-bold text-ink">Controlla ciò che hai appena imparato</h4><p className="mt-1 text-xs leading-5 text-black/50">Scegli una risposta: la soluzione non viene mostrata prima del tentativo.</p></div><p className="text-xs font-bold text-moss-800">{answered.length}/{questions.length} risposte · {correct} corrette</p></div>
    <div className="mt-5"><QuizQuestionList questions={questions} progress={progress} saving={saving} act={act} revealExplanation={false} /></div>
    {answered.length === questions.length && <p className="mt-5 rounded-xl bg-white p-3 text-xs font-bold text-moss-900">Mini-verifica completata. Potrai ripetere queste domande insieme a tutte le altre nella scheda “Quiz”.</p>}
  </section>;
}

function QuizPanel({ lesson, selectedLesson, progress, saving, act }: { lesson: PublicLesson; selectedLesson: LessonNavigationItem; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  useEffect(() => { if (!progress.quizStarted) void act({ type: "quiz_started", eventId: eventId() }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const questions = lesson.quiz.filter((question) => selectedLesson.quizIds.includes(question.id));
  const answered = questions.filter((question) => progress.quizAnswers[question.id]);
  const correct = answered.filter((question) => progress.quizAnswers[question.id]?.correct).length;
  const localScore = answered.length ? Math.round((correct / answered.length) * 100) : null;
  const allAnswered = questions.every((question) => progress.quizAnswers[question.id]);
  const allCourseAnswered = lesson.quiz.every((question) => progress.quizAnswers[question.id]);
  return <section className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Lezione {selectedLesson.id} · Verifica finale</p><h3 className="mt-2 text-xl font-bold">Quiz completo della lezione</h3><p className="mt-1 text-xs text-black/45">Tutte le {questions.length} domande dei capitoli sono riunite qui. Puoi ripetere anche quelle già affrontate durante la lettura.</p></div><div className="text-right"><p className="text-2xl font-bold text-moss-800">{localScore ?? "—"}%</p><p className="text-[9px] text-black/35">{answered.length}/{questions.length} risposte</p></div></div><div className="mt-6"><QuizQuestionList questions={questions} progress={progress} saving={saving} act={act} revealExplanation /></div>{allAnswered && !allCourseAnswered && <div className="mt-6 rounded-xl bg-moss-50 p-4 text-xs font-bold text-moss-900">Verifica finale della lezione {selectedLesson.id} completata e salvata. Puoi modificare le risposte oppure scegliere la lezione successiva.</div>}{allCourseAnswered && <button disabled={saving} onClick={() => void act({ type: "quiz_completed", eventId: eventId() })} className="button-primary mt-6 w-full justify-center disabled:opacity-40">Concludi il quiz del modulo e calcola il risultato</button>}{progress.quizCompleted && (progress.quizScore ?? 0) < lesson.completion.minimumQuizScore && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">Eve indica i capitoli associati alle risposte da ripassare; puoi cambiare le risposte e concludere nuovamente i quiz.</p>}</section>;
}

function ProjectPanel({ lesson, progress, saving, act }: { lesson: PublicLesson; progress: LessonProgressState; saving: boolean; act: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const projectDone = progress.project === "submitted";
  return <section className="mx-auto max-w-3xl space-y-4">{lesson.project.assessments.map((assessment) => <article key={assessment.lessonId} className="rounded-2xl bg-white p-5 shadow-sm sm:p-8"><p className="eyebrow">Lezione {assessment.lessonId}</p><h3 className="mt-2 text-xl font-bold">{assessment.title}</h3><p className="mt-2 whitespace-pre-line text-xs leading-6 text-black/60">{assessment.prompt}</p><h4 className="mt-5 text-xs font-bold">Elaborati richiesti</h4><ul className="mt-2 grid gap-2 text-xs text-black/58 sm:grid-cols-2">{assessment.deliverables.map((item, index) => <li key={index} className="rounded-lg bg-[#f7f5ee] p-3">• {item}</li>)}</ul><h4 className="mt-5 text-xs font-bold">Rubrica di valutazione</h4><div className="mt-2 overflow-x-auto rounded-xl border border-black/[0.08]"><table className="min-w-full text-left text-[10px]"><tbody>{assessment.rubric.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? "bg-moss-50 font-bold" : "border-t border-black/[0.06]"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="min-w-28 px-3 py-2 align-top leading-4">{cell}</td>)}</tr>)}</tbody></table></div><h4 className="mt-5 text-xs font-bold">Criteri di completamento della lezione</h4><ul className="mt-2 space-y-2 text-xs leading-5 text-black/58">{assessment.completionCriteria.map((criterion, index) => <li key={index}>• {criterion}</li>)}</ul></article>)}<article className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">{progress.project === "not_started" && <button onClick={() => void act({ type: "project_started", eventId: eventId() })} className="button-secondary mb-4">Inizia le prove finali</button>}<ResponseBox label="Consegna delle prove finali" button="Consegna prove finali" done={projectDone} saving={saving} onSubmit={(response) => act({ type: "project_submitted", eventId: eventId(), response })} /></article></section>;
}
