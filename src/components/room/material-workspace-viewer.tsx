"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, FileUp, Loader2, RotateCcw } from "lucide-react";
import type { UiMaterial } from "./demo-data";
import { addWatchedInterval, isVideoCompleted, mergeWatchedRanges, shouldCountActiveTime, videoCompletionPercentage, watchedUniqueSeconds, type WatchedRange } from "@/lib/material-progress";
import { resolveMaterialAccess } from "@/lib/material-access";
import type { MaterialLearningEvent, MaterialLearningState } from "@/lib/material-learning-schema";
import { TxtDocumentReader } from "@/components/reader/txt-document-reader";
import { ProgrammingLessonWorkspace } from "@/components/room/programming-lesson-workspace";
import { normalizeLessonProgress, type LessonProgressState } from "@/lib/programming-lesson-progress";

interface ContentResponse {
  kind: "pdf" | "text" | "document" | "presentation" | "video" | "lesson" | "import-required" | "unsupported" | "unavailable";
  resourceUrl?: string;
  readerUrl?: string;
  embedUrl?: string;
  provider?: "youtube" | "vimeo" | "html5-video" | "internal" | "web" | "none";
  paragraphs?: string[];
  slides?: string[][];
  pageCount?: number | null;
  error?: string;
  access: ReturnType<typeof resolveMaterialAccess>;
  progress?: Record<string, unknown> | null;
  lesson?: Parameters<typeof ProgrammingLessonWorkspace>[0]["lesson"];
  eve?: Parameters<typeof ProgrammingLessonWorkspace>[0]["initialEve"];
  projectSubmissions?: Parameters<typeof ProgrammingLessonWorkspace>[0]["initialProjectSubmissions"];
}

const emptyState: MaterialLearningState = {
  viewer: null, state: "opened", paragraphIndex: 0, tokenIndex: 0, scrollRatio: 0,
  documentPosition: {}, pageNumber: null, pageCount: null, videoTimeSeconds: 0,
  videoDurationSeconds: 0, watchedRanges: [], watchedUniqueSeconds: 0,
  completionPercentage: 0, activeSeconds: 0, exerciseState: {},
};

function isTrackableContent(content: ContentResponse | null): content is ContentResponse {
  return Boolean(content && !["lesson", "import-required", "unsupported", "unavailable"].includes(content.kind));
}

function number(value: unknown, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }
function ranges(value: unknown): WatchedRange[] { return Array.isArray(value) ? mergeWatchedRanges(value.flatMap((item) => item && typeof item === "object" ? [{ start: number((item as Record<string, unknown>).start), end: number((item as Record<string, unknown>).end) }] : [])) : []; }

function restoreState(content: ContentResponse): MaterialLearningState {
  const progress = content.progress ?? {};
  return {
    ...emptyState,
    viewer: content.access.internalViewer,
    state: progress.learning_state === "completed" ? "completed" : "opened",
    paragraphIndex: number(progress.paragraph_index), tokenIndex: number(progress.token_index), scrollRatio: number(progress.scroll_ratio),
    documentPosition: progress.document_position && typeof progress.document_position === "object" ? progress.document_position as Record<string, unknown> : {},
    pageNumber: progress.page_number ? number(progress.page_number, 1) : 1,
    pageCount: progress.page_count ? number(progress.page_count, 1) : content.pageCount ?? content.slides?.length ?? null,
    videoTimeSeconds: number(progress.video_time_seconds), videoDurationSeconds: number(progress.video_duration_seconds),
    watchedRanges: ranges(progress.watched_ranges), watchedUniqueSeconds: number(progress.watched_unique_seconds),
    completionPercentage: number(progress.completion_percentage), activeSeconds: number(progress.active_seconds),
    exerciseState: progress.exercise_state && typeof progress.exercise_state === "object" ? progress.exercise_state as Record<string, unknown> : {},
  };
}

export function MaterialWorkspaceViewer({ roomId, material, onUploadRequested, onChooseAlternative }: {
  roomId: string;
  material: UiMaterial;
  onUploadRequested: () => void;
  onChooseAlternative: () => void;
}) {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [state, setState] = useState<MaterialLearningState>(emptyState);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const dirtyRef = useRef(false);
  const stateRef = useRef(state);
  const lastInteractionRef = useRef(Date.now());
  const playingRef = useRef(false);
  const previousVideoTimeRef = useRef(0);
  const previousPlayerStateRef = useRef<number | null>(null);
  const access = useMemo(() => resolveMaterialAccess(material), [material]);
  const endpoint = `/api/rooms/${roomId}/materials/${material.id}`;

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    let cancelled = false;
    setContent(null); setLoadError(null); setState({ ...emptyState, viewer: access.internalViewer }); dirtyRef.current = false;
    void fetch(`${endpoint}/content`, { credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json() as ContentResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "material_unavailable");
      if (!cancelled) { setContent(payload); const restored = restoreState(payload); setState(restored); stateRef.current = restored; }
    }).catch((error: unknown) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "material_unavailable"); });
    return () => { cancelled = true; };
  }, [access.internalViewer, endpoint]);

  const persist = useCallback(async (eventType: MaterialLearningEvent | null = null, keepalive = false) => {
    if (!isTrackableContent(content) || (!dirtyRef.current && !eventType)) return true;
    const snapshot = stateRef.current;
    dirtyRef.current = false; setSaving(true);
    try {
      const response = await fetch(`${endpoint}/progress`, { method: "POST", credentials: "same-origin", keepalive, headers: { "content-type": "application/json" }, body: JSON.stringify({ state: snapshot, eventType }) });
      if (!response.ok) throw new Error("save_failed");
      return true;
    } catch { dirtyRef.current = true; return false; } finally { setSaving(false); }
  }, [content, endpoint]);

  useEffect(() => {
    if (!isTrackableContent(content)) return;
    const resumed = Boolean(content.progress && Object.keys(content.progress).length);
    void persist(resumed ? "material_resumed" : "material_opened");
  }, [content, persist]);

  useEffect(() => {
    if (!isTrackableContent(content)) return;
    const markInteraction = () => { lastInteractionRef.current = Date.now(); };
    const element = containerRef.current;
    element?.addEventListener("pointerdown", markInteraction, { passive: true });
    element?.addEventListener("scroll", markInteraction, { passive: true });
    element?.addEventListener("keydown", markInteraction);
    const activeTimer = window.setInterval(() => {
      const visible = document.visibilityState === "visible";
      const countActiveSecond = content.kind === "video"
        ? visible && playingRef.current
        : shouldCountActiveTime(lastInteractionRef.current, Date.now(), visible, false);
      if (!countActiveSecond) return;
      setState((current) => { const next: MaterialLearningState = { ...current, activeSeconds: current.activeSeconds + 1, state: current.state === "completed" ? "completed" : "active" }; stateRef.current = next; return next; });
      dirtyRef.current = true;
    }, 1000);
    const saveTimer = window.setInterval(() => void persist(), 10_000);
    const hidden = () => { if (document.visibilityState === "hidden") { playingRef.current = false; void persist(content.kind === "video" ? "video_paused" : "reading_paused", true); } };
    const pageHide = () => {
      const payload = JSON.stringify({ state: { ...stateRef.current, state: "paused" }, eventType: "material_closed" });
      if (navigator.sendBeacon) navigator.sendBeacon(`${endpoint}/progress`, new Blob([payload], { type: "text/plain" }));
    };
    const online = async () => {
      const saved = await persist();
      if (!saved || dirtyRef.current) return;
      try {
        const response = await fetch(`${endpoint}/content`, { credentials: "same-origin" });
        if (!response.ok) return;
        const canonical = await response.json() as ContentResponse;
        const restored = restoreState(canonical);
        setContent(canonical); setState(restored); stateRef.current = restored;
      } catch { /* The periodic save will retry after the next connection event. */ }
    };
    document.addEventListener("visibilitychange", hidden); window.addEventListener("pagehide", pageHide); window.addEventListener("online", online);
    return () => { element?.removeEventListener("pointerdown", markInteraction); element?.removeEventListener("scroll", markInteraction); element?.removeEventListener("keydown", markInteraction); window.clearInterval(activeTimer); window.clearInterval(saveTimer); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("pagehide", pageHide); window.removeEventListener("online", online); void persist("material_closed", true); };
  }, [content, endpoint, persist]);

  useEffect(() => {
    if (content?.kind !== "video" || content.provider === "html5-video") return;
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current?.contentWindow || event.source !== frameRef.current.contentWindow) return;
      const allowedOrigin = content.embedUrl ? new URL(content.embedUrl).origin : null;
      if (!allowedOrigin || event.origin !== allowedOrigin) return;
      let message: Record<string, unknown>;
      try { message = typeof event.data === "string" ? JSON.parse(event.data) as Record<string, unknown> : event.data as Record<string, unknown>; } catch { return; }
      const info = message.info && typeof message.info === "object" ? message.info as Record<string, unknown> : message.data && typeof message.data === "object" ? message.data as Record<string, unknown> : message;
      const providerEvent = typeof message.event === "string" ? message.event : null;
      const method = typeof message.method === "string" ? message.method : null;
      const eventPlayerState = providerEvent === "play" ? 1 : providerEvent === "pause" ? 2 : providerEvent === "ended" ? 0 : null;
      const playerState = eventPlayerState ?? number(info.playerState, previousPlayerStateRef.current ?? -1);
      if (method === "getDuration" && typeof message.value === "number") {
        const next = { ...stateRef.current, videoDurationSeconds: message.value };
        stateRef.current = next; setState(next); dirtyRef.current = true;
      }
      if (playerState !== previousPlayerStateRef.current && playerState >= 0) {
        if (playerState === 1) { playingRef.current = true; lastInteractionRef.current = Date.now(); void persist(previousPlayerStateRef.current === null ? "video_started" : "material_resumed"); }
        else if (playerState === 0) { playingRef.current = false; void persist(isVideoCompleted(stateRef.current.watchedRanges, stateRef.current.videoDurationSeconds) ? "video_completed" : "video_paused"); }
        else if (playerState === 2) { playingRef.current = false; void persist("video_paused"); }
        previousPlayerStateRef.current = playerState;
      }
      const currentTime = number(info.currentTime ?? info.seconds ?? (method === "getCurrentTime" ? message.value : undefined), -1); const duration = number(info.duration, stateRef.current.videoDurationSeconds);
      if (currentTime < 0 || duration <= 0) return;
      const previous = previousVideoTimeRef.current; const seeked = Math.abs(currentTime - previous) > 15; let watched = stateRef.current.watchedRanges;
      if (playingRef.current && currentTime > previous) watched = addWatchedInterval(watched, previous, currentTime, duration);
      const completed = isVideoCompleted(watched, duration);
      const next = { ...stateRef.current, viewer: "video" as const, videoTimeSeconds: currentTime, videoDurationSeconds: duration, watchedRanges: watched, watchedUniqueSeconds: watchedUniqueSeconds(watched), completionPercentage: videoCompletionPercentage(watched, duration), state: completed ? "completed" as const : playerState === 1 ? "active" as const : "paused" as const };
      stateRef.current = next; setState(next); dirtyRef.current = true; previousVideoTimeRef.current = currentTime;
      if (seeked || providerEvent === "seeked") void persist("video_seeked");
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => {
      const target = frameRef.current?.contentWindow;
      if (!target) return;
      const targetOrigin = content.embedUrl ? new URL(content.embedUrl).origin : "";
      if (!targetOrigin) return;
      if (content.provider === "youtube") {
        for (const func of ["getCurrentTime", "getDuration", "getPlayerState"]) target.postMessage(JSON.stringify({ event: "command", func, args: [] }), targetOrigin);
      } else {
        target.postMessage({ method: "getCurrentTime" }, targetOrigin); target.postMessage({ method: "getDuration" }, targetOrigin);
      }
    }, 1000);
    return () => { window.removeEventListener("message", onMessage); window.clearInterval(poll); };
  }, [content, persist]);

  function initializeEmbeddedPlayer() {
    const target = frameRef.current?.contentWindow;
    if (!target || content?.kind !== "video") return;
    const targetOrigin = content.embedUrl ? new URL(content.embedUrl).origin : "";
    if (!targetOrigin) return;
    const resumeAt = stateRef.current.videoTimeSeconds;
    previousVideoTimeRef.current = resumeAt;
    if (content.provider === "youtube") {
      target.postMessage(JSON.stringify({ event: "listening", id: "eve-material-workspace" }), targetOrigin);
      if (resumeAt > 0) target.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [resumeAt, true] }), targetOrigin);
    } else if (content.provider === "vimeo") {
      for (const value of ["play", "pause", "ended", "timeupdate", "seeked"]) target.postMessage({ method: "addEventListener", value }, targetOrigin);
      if (resumeAt > 0) target.postMessage({ method: "setCurrentTime", value: resumeAt }, targetOrigin);
    }
  }

  const updateTextProgress = useCallback((position: { paragraphIndex: number; tokenIndex: number; scrollRatio: number }) => {
    const completion = Math.round(position.scrollRatio * 100);
    const next = { ...stateRef.current, ...position, completionPercentage: completion, state: completion >= 99 ? "completed" as const : "active" as const };
    stateRef.current = next; setState(next); dirtyRef.current = true; lastInteractionRef.current = Date.now();
  }, []);

  function updateDocumentProgress(requestedPage: number, pageCount = state.pageCount) {
    const page = pageCount ? Math.min(Math.max(1, requestedPage), pageCount) : Math.max(1, requestedPage);
    const completion = pageCount ? Math.min(100, Math.round((page / Math.max(pageCount, 1)) * 100)) : stateRef.current.completionPercentage;
    const next = { ...stateRef.current, pageNumber: page, pageCount, completionPercentage: completion, state: pageCount && completion >= 100 ? "completed" as const : "active" as const };
    stateRef.current = next; setState(next); dirtyRef.current = true; lastInteractionRef.current = Date.now();
  }

  if (loadError || content?.kind === "unavailable") return <Notice title="Materiale temporaneamente non disponibile" detail="Il file non è stato modificato. Riprova oppure carica una copia che sei autorizzato a utilizzare." actions={<><button onClick={() => location.reload()} className="button-secondary"><RotateCcw size={14} /> Riprova</button><button onClick={onUploadRequested} className="button-primary"><FileUp size={14} /> Carica file</button></>} />;
  if (!content) return <div className="grid min-h-[360px] place-items-center bg-[#eef1ea]"><div className="text-center"><Loader2 className="mx-auto animate-spin text-moss-700" /><p className="mt-3 text-xs font-semibold text-black/45">Preparo il materiale nel workspace…</p></div></div>;
  if (content.kind === "lesson" && content.lesson && content.eve) return <ProgrammingLessonWorkspace roomId={roomId} materialId={material.id} lesson={content.lesson} initialState={normalizeLessonProgress(content.progress?.exercise_state) as LessonProgressState} initialEve={content.eve} initialProjectSubmissions={content.projectSubmissions ?? []} />;
  if (content.kind === "import-required" || content.kind === "unsupported") return <Notice title="Questo materiale non può essere aperto e monitorato interamente dentro l’aula" detail="Puoi cercare una risorsa compatibile oppure importare un file che possiedi e sei autorizzato a utilizzare. Non aggiriamo CSP, autenticazione o DRM." actions={<><button onClick={onChooseAlternative} className="button-secondary">Cerca alternativa compatibile</button><button onClick={onUploadRequested} className="button-primary"><FileUp size={14} /> Carica un file</button>{access.sourceUrl && <a href={access.sourceUrl} target="_blank" rel="noopener noreferrer" className="button-secondary">Apri esternamente <ExternalLink size={13} /></a>}</>} />;

  return <div ref={containerRef} className="relative min-h-[430px] bg-[#eef1ea]" data-testid="internal-material-viewer">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-white px-4 py-2 text-[10px]"><span className="font-bold text-moss-800">{content.access.monitoringLevel === "full" ? "Monitoraggio completo" : "Monitoraggio parziale"} · {state.completionPercentage}%</span><span className="text-black/38">{Math.floor(state.activeSeconds / 60)} min attivi {saving ? "· salvataggio…" : "· progressi salvati"}</span></div>
    {content.kind === "text" && <TxtDocumentReader roomId={roomId} materialId={material.id} embedded onProgressChange={updateTextProgress} />}
    {content.kind === "pdf" && <><div className="flex items-center justify-center gap-2 border-b border-black/[0.06] bg-white p-2"><button aria-label="Pagina precedente" disabled={(state.pageNumber ?? 1) <= 1} onClick={() => updateDocumentProgress((state.pageNumber ?? 1) - 1)} className="grid size-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-30"><ChevronLeft size={14} /></button><label className="text-[10px] font-bold">Pagina <input aria-label="Pagina PDF" type="number" min="1" max={state.pageCount ?? undefined} value={state.pageNumber ?? 1} onChange={(event) => updateDocumentProgress(Number(event.target.value))} className="ml-1 w-16 rounded-lg border-black/10 py-1 text-center text-xs" />{state.pageCount ? ` di ${state.pageCount}` : ""}</label><button aria-label="Pagina successiva" disabled={Boolean(state.pageCount && (state.pageNumber ?? 1) >= state.pageCount)} onClick={() => updateDocumentProgress((state.pageNumber ?? 1) + 1)} className="grid size-8 place-items-center rounded-lg bg-black/[0.04] disabled:opacity-30"><ChevronRight size={14} /></button></div><iframe title={`PDF ${material.title}`} src={`${content.resourceUrl}#page=${state.pageNumber ?? 1}&view=FitH`} className="h-[70vh] min-h-[520px] w-full border-0 bg-white" /></>}
    {content.kind === "document" && <div onScroll={(event) => { const node=event.currentTarget; const ratio=node.scrollTop/Math.max(node.scrollHeight-node.clientHeight,1); const next={...stateRef.current,scrollRatio:ratio,completionPercentage:Math.round(ratio*100),state:ratio>.98?"completed" as const:"active" as const};stateRef.current=next;setState(next);dirtyRef.current=true; }} className="mx-auto h-[70vh] min-h-[520px] max-w-4xl overflow-y-auto bg-white p-7 sm:p-12">{content.paragraphs?.map((paragraph,index)=><p key={index} className="mb-5 font-[family-name:var(--font-serif)] text-[1.05rem] leading-8 text-ink">{paragraph}</p>)}</div>}
    {content.kind === "presentation" && <div className="grid min-h-[520px] place-items-center p-5"><article className="aspect-video w-full max-w-4xl rounded-2xl bg-white p-8 shadow-card sm:p-14"><p className="eyebrow">Slide {state.pageNumber ?? 1} di {content.slides?.length ?? 1}</p><div className="mt-6 space-y-4">{content.slides?.[(state.pageNumber ?? 1)-1]?.map((line,index)=><p key={index} className={index===0?"text-2xl font-bold":"text-base leading-7 text-black/65"}>{line}</p>)}</div></article><div className="mt-4 flex gap-2"><button disabled={(state.pageNumber??1)<=1} onClick={()=>updateDocumentProgress((state.pageNumber??1)-1,content.slides?.length??1)} className="button-secondary disabled:opacity-30"><ChevronLeft size={14}/> Indietro</button><button disabled={(state.pageNumber??1)>=(content.slides?.length??1)} onClick={()=>updateDocumentProgress((state.pageNumber??1)+1,content.slides?.length??1)} className="button-primary disabled:opacity-30">Avanti <ChevronRight size={14}/></button></div></div>}
    {content.kind === "video" && content.provider === "html5-video" && <video controls playsInline src={content.embedUrl} onLoadedMetadata={(event)=>{const video=event.currentTarget;video.currentTime=Math.min(stateRef.current.videoTimeSeconds,Math.max(0,video.duration-.25));previousVideoTimeRef.current=video.currentTime;}} onPlay={(event)=>{playingRef.current=true;previousVideoTimeRef.current=event.currentTarget.currentTime;void persist("video_started");}} onPause={()=>{playingRef.current=false;void persist("video_paused");}} onTimeUpdate={(event)=>{const video=event.currentTarget;const watched=addWatchedInterval(stateRef.current.watchedRanges,previousVideoTimeRef.current,video.currentTime,video.duration);previousVideoTimeRef.current=video.currentTime;const next={...stateRef.current,viewer:"video",videoTimeSeconds:video.currentTime,videoDurationSeconds:video.duration,watchedRanges:watched,watchedUniqueSeconds:watchedUniqueSeconds(watched),completionPercentage:videoCompletionPercentage(watched,video.duration),state:isVideoCompleted(watched,video.duration)?"completed":"active"} as MaterialLearningState;stateRef.current=next;setState(next);dirtyRef.current=true;}} className="mx-auto aspect-video max-h-[70vh] w-full bg-black" />}
    {content.kind === "video" && content.provider !== "html5-video" && <iframe ref={frameRef} onLoad={initializeEmbeddedPlayer} title={`Video ${material.title}`} src={content.embedUrl} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="aspect-video max-h-[70vh] min-h-[360px] w-full border-0 bg-black" />}
  </div>;
}

function Notice({ title, detail, actions }: { title: string; detail: string; actions: React.ReactNode }) {
  return <div className="grid min-h-[430px] place-items-center bg-[#fff8ee] p-7 text-center"><div className="max-w-xl"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-amber-700 shadow-card"><AlertTriangle size={22} /></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-xs leading-6 text-black/52">{detail}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div><p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-amber-800">Monitoraggio completo non disponibile</p></div></div>;
}
