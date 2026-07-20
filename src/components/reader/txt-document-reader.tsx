"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  Check,
  Languages,
  Loader2,
  MousePointer2,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { parseTextDocument } from "@/lib/reader/tokenize";
import type { ReaderParagraph, ReaderToken } from "@/lib/reader/reader-types";

const MAX_INTERNAL_TEXT_BYTES = 2 * 1024 * 1024;

interface ReaderMaterial {
  id: string;
  room_id: string;
  title: string;
  description: string | null;
  storage_path: string | null;
  type: string;
}

interface ReaderPosition {
  paragraphIndex: number;
  tokenIndex: number;
  scrollRatio: number;
}

type TranslationOperation = "quick_translate" | "accurate_translate" | "explain_context";

interface TokenAnnotation {
  translation: string;
  vocabularyId: string;
  learningState: string;
  masteryScore: number;
  explanation: string | null;
  alternatives: string[];
  source: string;
}

function isTxtMaterial(material: ReaderMaterial) {
  return material.title.toLocaleLowerCase().endsWith(".txt")
    || material.storage_path?.toLocaleLowerCase().endsWith(".txt") === true;
}

export function TxtDocumentReader({ roomId, materialId, embedded = false, onProgressChange }: { roomId: string; materialId: string; embedded?: boolean; onProgressChange?: (position: ReaderPosition) => void }) {
  const router = useRouter();
  const [material, setMaterial] = useState<ReaderMaterial | null>(null);
  const [paragraphs, setParagraphs] = useState<ReaderParagraph[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<ReaderToken | null>(null);
  const [annotations, setAnnotations] = useState<Record<string, TokenAnnotation>>({});
  const [translationBusy, setTranslationBusy] = useState<TranslationOperation | null>(null);
  const [translationNotice, setTranslationNotice] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("it");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [visibleProgress, setVisibleProgress] = useState(0);
  const paragraphRefs = useRef<Array<HTMLElement | null>>([]);
  const dirtyRef = useRef(false);
  const restoredRef = useRef(false);
  const positionRef = useRef<ReaderPosition>({ paragraphIndex: 0, tokenIndex: 0, scrollRatio: 0 });
  const progressChangeRef = useRef(onProgressChange);

  useEffect(() => { progressChangeRef.current = onProgressChange; }, [onProgressChange]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase non è configurato: il lettore privato non può caricare il file.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !auth.user) {
        router.replace(`/login?next=${encodeURIComponent(`/room/${roomId}/material/${materialId}`)}`);
        return;
      }
      setCurrentUserId(auth.user.id);

      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("id,room_id,title,description,storage_path,type")
        .eq("id", materialId)
        .eq("room_id", roomId)
        .single();

      if (cancelled) return;
      const nextMaterial = materialData as ReaderMaterial | null;
      if (materialError || !nextMaterial) {
        setError("Materiale non trovato oppure non hai accesso a questa stanza.");
        setLoading(false);
        return;
      }
      if (!nextMaterial.storage_path || !isTxtMaterial(nextMaterial)) {
        setError("Il lettore interno supporta per ora soltanto file TXT.");
        setLoading(false);
        return;
      }

      const [{ data: fileData, error: fileError }, { data: progressData }, { data: languagePreferences }] = await Promise.all([
        supabase.storage.from("study-materials").download(nextMaterial.storage_path),
        supabase
          .from("material_reader_progress")
          .select("paragraph_index,token_index,scroll_ratio")
          .eq("user_id", auth.user.id)
          .eq("material_id", materialId)
          .maybeSingle(),
        supabase
          .from("user_language_preferences")
          .select("learning_languages,default_target_language")
          .eq("user_id", auth.user.id)
          .maybeSingle(),
      ]);

      if (cancelled) return;
      if (fileError || !fileData) {
        setError(fileError?.message ?? "Non è stato possibile scaricare il file.");
        setLoading(false);
        return;
      }
      if (fileData.size > MAX_INTERNAL_TEXT_BYTES) {
        setError("Questo TXT supera 2 MB. Per mantenere il lettore fluido, dividilo in file più piccoli.");
        setLoading(false);
        return;
      }

      const text = await fileData.text();
      if (cancelled) return;
      const parsed = parseTextDocument(text);
      if (!parsed.length) {
        setError("Il file TXT è vuoto.");
        setLoading(false);
        return;
      }

      const restoredParagraph = Math.min(
        Math.max(Number(progressData?.paragraph_index ?? 0), 0),
        parsed.length - 1,
      );
      const restoredRatio = Math.min(Math.max(Number(progressData?.scroll_ratio ?? 0), 0), 1);
      positionRef.current = {
        paragraphIndex: restoredParagraph,
        tokenIndex: Math.max(Number(progressData?.token_index ?? 0), 0),
        scrollRatio: restoredRatio,
      };
      progressChangeRef.current?.(positionRef.current);
      const learningLanguages = Array.isArray(languagePreferences?.learning_languages)
        ? languagePreferences.learning_languages.filter((value): value is string => typeof value === "string")
        : [];
      setSourceLanguage(learningLanguages[0] ?? "en");
      setTargetLanguage(languagePreferences?.default_target_language ?? "it");
      setVisibleProgress(Math.round(restoredRatio * 100));
      setMaterial(nextMaterial);
      setParagraphs(parsed);
      setLoading(false);
    })().catch((reason: unknown) => {
      if (!cancelled) {
        setError(reason instanceof Error ? reason.message : "Errore durante l'apertura del materiale.");
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [materialId, roomId, router]);

  useEffect(() => {
    if (!paragraphs.length || restoredRef.current) return;
    restoredRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      paragraphRefs.current[positionRef.current.paragraphIndex]?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [paragraphs]);

  const saveProgress = useCallback(async () => {
    if (!dirtyRef.current || !currentUserId || !material) return;
    dirtyRef.current = false;
    setSaveState("saving");
    const position = positionRef.current;
    const { error: saveError } = await createClient().from("material_reader_progress").upsert({
      user_id: currentUserId,
      material_id: material.id,
      room_id: roomId,
      paragraph_index: position.paragraphIndex,
      token_index: position.tokenIndex,
      scroll_ratio: position.scrollRatio,
      document_position: { version: 1, format: "txt" },
      last_opened_at: new Date().toISOString(),
    }, { onConflict: "user_id,material_id" });
    if (saveError) {
      dirtyRef.current = true;
      setSaveState("idle");
      return;
    }
    setSaveState("saved");
  }, [currentUserId, material, roomId]);

  useEffect(() => {
    if (!paragraphs.length) return;
    let ticking = false;
    const updatePosition = () => {
      ticking = false;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const ratio = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
      let nearestIndex = positionRef.current.paragraphIndex;
      let nearestDistance = Number.POSITIVE_INFINITY;
      paragraphRefs.current.forEach((element, index) => {
        if (!element) return;
        const distance = Math.abs(element.getBoundingClientRect().top - 150);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      positionRef.current = { ...positionRef.current, paragraphIndex: nearestIndex, scrollRatio: ratio };
      progressChangeRef.current?.(positionRef.current);
      dirtyRef.current = true;
      setSaveState("idle");
      setVisibleProgress(Math.round(ratio * 100));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updatePosition);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [paragraphs]);

  useEffect(() => {
    const interval = window.setInterval(() => void saveProgress(), 8_000);
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") void saveProgress();
    };
    const persistOnPageHide = () => void saveProgress();
    document.addEventListener("visibilitychange", persistWhenHidden);
    window.addEventListener("pagehide", persistOnPageHide);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", persistWhenHidden);
      window.removeEventListener("pagehide", persistOnPageHide);
      void saveProgress();
    };
  }, [saveProgress]);

  function chooseToken(token: ReaderToken) {
    if (token.kind !== "word") return;
    positionRef.current = {
      ...positionRef.current,
      paragraphIndex: token.paragraphIndex,
      tokenIndex: token.tokenIndex,
    };
    progressChangeRef.current?.(positionRef.current);
    dirtyRef.current = true;
    setTranslationNotice(null);
    setSelectedToken(token);
  }

  async function translateSelected(operation: TranslationOperation) {
    if (!selectedToken) return;
    const sentence = paragraphs[selectedToken.paragraphIndex]?.sentences[selectedToken.sentenceIndex];
    if (!sentence) {
      setTranslationNotice("Non riesco a ricostruire la frase di questa parola.");
      return;
    }
    setTranslationBusy(operation);
    setTranslationNotice(null);
    try {
      const response = await fetch("/api/translation/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          selectedText: selectedToken.text,
          sentence: sentence.text,
          sourceLanguage,
          targetLanguage,
          paragraphIndex: selectedToken.paragraphIndex,
          tokenStart: selectedToken.charStart,
          tokenEnd: selectedToken.charEnd,
          operation,
          routingMode: operation === "quick_translate" ? "economic" : "accurate",
        }),
      });
      const body = await response.json().catch(() => null) as ({
        status?: string;
        error?: string;
        translation?: string;
        vocabularyId?: string;
        learningState?: string;
        masteryScore?: number;
        explanation?: string | null;
        alternatives?: string[];
        source?: string;
        reasonText?: string;
      } | null);
      if (response.status === 409 && body?.status === "confirmation_required") {
        setTranslationNotice(`${body.reasonText ?? "Servirebbe un’analisi avanzata."} Puoi continuare con la modalità accurata; il modello avanzato non viene chiamato automaticamente.`);
        return;
      }
      if (!response.ok || !body?.translation || !body.vocabularyId) {
        const messages: Record<string, string> = {
          translation_not_configured: "La traduzione AI non è ancora configurata dall’amministratore.",
          daily_limit_reached: "Hai raggiunto il limite giornaliero di nuove traduzioni.",
          request_in_progress: "Questa traduzione è già in elaborazione.",
          context_not_in_material: "Il contesto selezionato non corrisponde al materiale.",
          rate_limit_exceeded: "Troppe richieste ravvicinate. Attendi un momento.",
        };
        setTranslationNotice(messages[body?.error ?? ""] ?? "Traduzione non disponibile. Riprova tra poco.");
        return;
      }
      setAnnotations((current) => ({
        ...current,
        [selectedToken.id]: {
          translation: body.translation ?? "",
          vocabularyId: body.vocabularyId ?? "",
          learningState: body.learningState ?? "NEW",
          masteryScore: body.masteryScore ?? 5,
          explanation: body.explanation ?? null,
          alternatives: body.alternatives ?? [],
          source: body.source ?? "server",
        },
      }));
      setTranslationNotice("Traduzione salvata nel tuo vocabolario privato.");
    } catch {
      setTranslationNotice("Connessione non disponibile. La parola non è stata addebitata né salvata.");
    } finally {
      setTranslationBusy(null);
    }
  }

  if (loading) {
    return <main className={`grid place-items-center ${embedded ? "min-h-[520px]" : "min-h-screen"}`}><div className="text-center"><Loader2 className="mx-auto animate-spin text-moss-700" /><p className="mt-3 text-sm text-black/45">Apro il materiale…</p></div></main>;
  }

  if (error || !material) {
    return <main className={`grid place-items-center px-5 ${embedded ? "min-h-[520px]" : "min-h-screen"}`}><section className="panel max-w-lg p-7 text-center"><BookOpenText className="mx-auto text-moss-700" /><h1 className="mt-4 text-xl font-bold">Impossibile aprire il lettore</h1><p className="mt-2 text-sm leading-6 text-black/50">{error}</p>{!embedded && <Link className="button-secondary mt-5" href={`/room/${roomId}`}><ArrowLeft size={14} /> Torna alla stanza</Link>}</section></main>;
  }

  return (
    <main className={embedded ? "min-h-[520px] pb-32" : "min-h-screen pb-32"}>
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-paper/90 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {!embedded && <Link href={`/room/${roomId}`} aria-label="Torna alla stanza" className="grid size-10 shrink-0 place-items-center rounded-xl border border-black/10 bg-white hover:bg-moss-50"><ArrowLeft size={17} /></Link>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{material.title}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-black/35">Lettore privato · TXT</p></div>
          <div className="hidden items-center gap-2 text-[11px] font-semibold text-black/40 sm:flex">{saveState === "saving" ? <Loader2 size={13} className="animate-spin" /> : saveState === "saved" ? <Check size={13} className="text-moss-600" /> : null}{saveState === "saving" ? "Salvataggio" : saveState === "saved" ? "Posizione salvata" : "Salvataggio automatico"}</div>
          <div className="rounded-full bg-moss-100 px-3 py-1.5 text-xs font-bold text-moss-800">{visibleProgress}%</div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/[0.04]"><div className="h-full bg-moss-500 transition-[width]" style={{ width: `${visibleProgress}%` }} /></div>
      </header>

      <article className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:px-10 sm:pt-16">
        <div className="mb-12 border-b border-black/[0.07] pb-8">
          <p className="eyebrow">Materiale di studio</p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-4xl font-medium tracking-tight sm:text-5xl">{material.title.replace(/\.txt$/i, "")}</h1>
          {material.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-black/48">{material.description}</p>}
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-moss-50 p-3 text-xs leading-5 text-moss-900"><MousePointer2 size={15} className="mt-0.5 shrink-0" /><span>Il testo è selezionabile. Premi una singola parola per prepararla alla traduzione e al vocabolario adattivo.</span></div>
        </div>

        <div className="space-y-7 font-[family-name:var(--font-serif)] text-[1.18rem] leading-[1.9] text-ink sm:text-[1.3rem]">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.paragraphIndex} ref={(element) => { paragraphRefs.current[paragraph.paragraphIndex] = element; }} className="scroll-mt-28">
              {paragraph.sentences.flatMap((sentence) => sentence.tokens).map((token) => token.kind === "word" ? (
                <ruby
                  key={token.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => chooseToken(token)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") chooseToken(token); }}
                  aria-label={annotations[token.id] ? `${token.text}, traduzione ${annotations[token.id].translation}` : `Seleziona ${token.text}`}
                  className="cursor-pointer rounded-[0.2em] decoration-moss-400 decoration-1 underline-offset-4 hover:bg-moss-100 hover:underline focus:bg-moss-100 focus:outline-none"
                >{token.text}{annotations[token.id] && <rt className="select-none font-[family-name:var(--font-sans)] text-[0.62rem] font-bold leading-none text-moss-700">{annotations[token.id].translation}</rt>}</ruby>
              ) : <span key={token.id}>{token.text}</span>)}
            </p>
          ))}
        </div>
      </article>

      {selectedToken && (
        <aside className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-black/10 bg-white p-4 shadow-soft sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]">
          <div className="flex items-start gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss-100 text-moss-700"><Languages size={18} /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">Parola selezionata</p><p className="mt-1 truncate font-[family-name:var(--font-serif)] text-2xl font-semibold">{selectedToken.text}</p></div><button onClick={() => setSelectedToken(null)} aria-label="Chiudi" className="grid size-8 place-items-center rounded-lg hover:bg-black/[0.04]"><X size={15} /></button></div>
          {annotations[selectedToken.id] ? (
            <div className="mt-3 rounded-xl bg-moss-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-moss-700">Traduzione contestuale</p><p className="mt-1 font-[family-name:var(--font-serif)] text-xl font-semibold text-moss-900">{annotations[selectedToken.id].translation}</p>{annotations[selectedToken.id].explanation && <p className="mt-2 text-xs leading-5 text-moss-900/65">{annotations[selectedToken.id].explanation}</p>}<p className="mt-2 text-[10px] font-semibold text-moss-700">Vocabolario salvato · {annotations[selectedToken.id].learningState} · {annotations[selectedToken.id].masteryScore}/100</p></div>
          ) : <p className="mt-3 text-xs leading-5 text-black/48">Invieremo al provider soltanto questa parola e la frase circostante. Il documento completo non lascia l’app.</p>}
          {translationNotice && <p role="status" className="mt-3 rounded-xl bg-[#f5efe5] px-3 py-2.5 text-xs leading-5 text-[#725632]">{translationNotice}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button disabled={Boolean(translationBusy)} onClick={() => void translateSelected("quick_translate")} className="button-primary col-span-2">{translationBusy === "quick_translate" ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />} Traduci rapidamente</button>
            <button disabled={Boolean(translationBusy)} onClick={() => void translateSelected("accurate_translate")} className="button-secondary px-2 text-xs">{translationBusy === "accurate_translate" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Accurata</button>
            <button disabled={Boolean(translationBusy)} onClick={() => void translateSelected("explain_context")} className="button-secondary px-2 text-xs">{translationBusy === "explain_context" ? <Loader2 size={13} className="animate-spin" /> : <BookOpenText size={13} />} Spiega</button>
          </div>
          <p className="mt-3 text-center text-[9px] leading-4 text-black/35">Il modello avanzato non può essere avviato senza un consenso specifico.</p>
        </aside>
      )}
    </main>
  );
}
