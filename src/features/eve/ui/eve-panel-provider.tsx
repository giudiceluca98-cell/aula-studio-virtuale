"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Expand, Minimize2, X } from "lucide-react";
import type { EveMvpRunResponse, EveMvpSourceOpenResponse } from "../mvp/contracts";
import type {
  EvePanelClientConfig,
  EvePanelContextReference,
  EvePanelOpenRequest,
  EvePanelVisibleMode,
} from "./contracts";
import { EVE_PANEL_CLOSE_EVENT, EVE_PANEL_OPEN_EVENT, EVE_PANEL_TOGGLE_EVENT } from "./events";
import { INITIAL_EVE_PANEL_STATE, reduceEvePanelState } from "./state";
import { openEveMvpSource, runEveMvp, sendEveMvpFeedback } from "./mvp-client";
import { EvePanelAvatar } from "./eve-panel-avatar";
import styles from "./eve-panel.module.css";

interface EvePanelContextValue {
  enabled: boolean;
  open: (request: EvePanelOpenRequest) => void;
  close: () => void;
  toggle: () => void;
}

const EvePanelContext = createContext<EvePanelContextValue>({
  enabled: false,
  open: () => undefined,
  close: () => undefined,
  toggle: () => undefined,
});

export function useEvePanel(): EvePanelContextValue {
  return useContext(EvePanelContext);
}

function contextLabel(entryPoint: EvePanelOpenRequest["entryPoint"]): string {
  return ({ lesson: "Lezione", catalog: "Catalogo", room: "Aula", global: "Apertura globale" })[entryPoint];
}

function visibleContext(context: EvePanelContextReference): Array<[string, string]> {
  return Object.entries(context)
    .filter((item): item is [string, string] => Boolean(item[1]))
    .map(([key, value]) => key === "selectedText" ? [key, `${value.length} caratteri selezionati`] : [key, value]);
}

export function EvePanelProvider({ config, children }: { config: EvePanelClientConfig; children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceEvePanelState, INITIAL_EVE_PANEL_STATE);
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState<EveMvpRunResponse | null>(null);
  const [openedSource, setOpenedSource] = useState<EveMvpSourceOpenResponse | null>(null);
  const [feedbackState, setFeedbackState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const panelNode = useRef<HTMLElement | null>(null);

  const preferredMode = useCallback((): EvePanelVisibleMode => {
    if (!config.restorePreference) return config.defaultMode;
    try {
      const stored = window.localStorage.getItem("aula:eve-panel-mode");
      if (stored === "expanded" && config.allowExpanded) return "expanded";
      if (stored === "side") return "side";
    } catch { /* preferenza facoltativa */ }
    return config.defaultMode;
  }, [config]);

  const open = useCallback((request: EvePanelOpenRequest) => {
    if (!config.enabled) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAnswer(null);
    setOpenedSource(null);
    setFeedbackState(null);
    dispatch({ type: "open", request: { ...request, mode: request.mode ?? preferredMode() }, defaultMode: preferredMode() });
  }, [config.enabled, preferredMode]);

  const close = useCallback(() => {
    dispatch({ type: "close" });
    window.setTimeout(() => previousFocus.current?.focus(), 0);
  }, []);

  const toggle = useCallback(() => {
    if (state.mode === "closed") open({ entryPoint: "global" });
    else close();
  }, [close, open, state.mode]);

  useEffect(() => {
    if (!config.enabled) return;
    const onOpen = (event: Event) => open((event as CustomEvent<EvePanelOpenRequest>).detail ?? { entryPoint: "global" });
    const onClose = () => close();
    const onToggle = () => toggle();
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "Escape" && state.mode !== "closed") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener(EVE_PANEL_OPEN_EVENT, onOpen);
    window.addEventListener(EVE_PANEL_CLOSE_EVENT, onClose);
    window.addEventListener(EVE_PANEL_TOGGLE_EVENT, onToggle);
    document.addEventListener("keydown", onShortcut);
    return () => {
      window.removeEventListener(EVE_PANEL_OPEN_EVENT, onOpen);
      window.removeEventListener(EVE_PANEL_CLOSE_EVENT, onClose);
      window.removeEventListener(EVE_PANEL_TOGGLE_EVENT, onToggle);
      document.removeEventListener("keydown", onShortcut);
    };
  }, [close, config.enabled, open, state.mode, toggle]);

  useEffect(() => {
    if (state.mode === "closed") return;
    const timer = window.setTimeout(() => {
      if (!navigator.onLine) {
        dispatch({ type: "set_view_state", viewState: "offline", notice: "Connessione assente: nessun dato viene inviato." });
      } else if (!state.context.roomId && state.entryPoint !== "global") {
        dispatch({ type: "set_view_state", viewState: "empty", notice: "Aula non verificabile dalla pagina corrente." });
      } else {
        dispatch({ type: "set_view_state", viewState: "ready" });
      }
      closeButton.current?.focus();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state.context, state.entryPoint, state.mode]);

  useEffect(() => {
    if (state.mode !== "expanded") return;
    const node = panelNode.current;
    if (!node) return;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>('button:not([disabled]),textarea:not([disabled]),[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    node.addEventListener("keydown", trap);
    return () => node.removeEventListener("keydown", trap);
  }, [state.mode]);

  const setMode = useCallback((mode: EvePanelVisibleMode) => {
    dispatch({ type: "set_mode", mode, allowExpanded: config.allowExpanded });
    try { window.localStorage.setItem("aula:eve-panel-mode", mode); } catch { /* preferenza facoltativa */ }
  }, [config.allowExpanded]);

  const submitDraft = useCallback(async () => {
    const question = draft.trim();
    if (!question || !state.context.roomId || submitting) return;
    setSubmitting(true);
    setAnswer(null);
    setOpenedSource(null);
    setFeedbackState(null);
    dispatch({ type: "set_view_state", viewState: "loading", notice: "Verifico contesto, fonti e provider…" });
    try {
      const result = await runEveMvp({
        question,
        roomId: state.context.roomId,
        courseId: state.context.courseId,
        primaryMaterialId: state.context.materialId,
        authorizedMaterialIds: state.context.materialId ? [state.context.materialId] : [],
        lessonId: state.context.lessonId,
        sectionId: state.context.sectionId,
        selectedText: state.context.selectedText,
        selectionLocator: state.context.selectionLocator,
      });
      setAnswer(result);
      setDraft("");
      dispatch({ type: "set_view_state", viewState: "ready", notice: result.grounded ? "Risposta verificata con fonti autorizzate." : "Nessuna fonte sufficiente: Eve ha dichiarato il limite." });
    } catch (error) {
      dispatch({ type: "set_view_state", viewState: "error", notice: error instanceof Error ? error.message : "Gate MVP non disponibile" });
    } finally {
      setSubmitting(false);
    }
  }, [draft, state.context, submitting]);

  const openCitation = useCallback(async (citation: EveMvpRunResponse["citations"][number]) => {
    if (!state.context.roomId) return;
    try {
      const source = await openEveMvpSource({
        roomId: state.context.roomId,
        materialId: citation.materialId,
        locator: citation.locator,
        expectedTextSha256: citation.textSha256,
      });
      setOpenedSource(source);
    } catch (error) {
      dispatch({ type: "set_view_state", viewState: "error", notice: error instanceof Error ? error.message : "Fonte non apribile" });
    }
  }, [state.context.roomId]);

  const sendFeedback = useCallback(async (rating: "helpful" | "not_helpful") => {
    if (!answer || !state.context.roomId) return;
    try {
      await sendEveMvpFeedback({
        roomId: state.context.roomId,
        conversationId: answer.conversationId,
        responseMessageId: answer.responseMessageId,
        rating,
      });
      setFeedbackState(rating === "helpful" ? "Feedback positivo salvato" : "Feedback critico salvato");
    } catch (error) {
      setFeedbackState(error instanceof Error ? error.message : "Feedback non salvato");
    }
  }, [answer, state.context.roomId]);

  const value = useMemo<EvePanelContextValue>(() => ({ enabled: config.enabled, open, close, toggle }), [close, config.enabled, open, toggle]);
  const contextEntries = visibleContext(state.context);

  return (
    <EvePanelContext.Provider value={value}>
      {children}
      {config.enabled && state.mode !== "closed" && <>
        <div className={styles.backdrop} aria-hidden="true" onMouseDown={close} />
        <aside
          ref={panelNode}
          id="eve-global-panel"
          role="dialog"
          aria-modal={state.mode === "expanded" ? "true" : undefined}
          aria-labelledby="eve-global-panel-title"
          className={`${styles.panel} ${state.mode === "expanded" ? styles.expanded : styles.side}`}
          data-eve-panel-mode={state.mode}
          data-eve-entry-point={state.entryPoint}
        >
          <header className={styles.header}>
            <div className={styles.identity}>
              <EvePanelAvatar state={state.viewState} />
              <div><strong id="eve-global-panel-title">Eve</strong><small>{contextLabel(state.entryPoint)} · Gate MVP CORE-1.7</small></div>
            </div>
            <div className={styles.actions}>
              {state.mode === "expanded"
                ? <button className={styles.iconButton} onClick={() => setMode("side")} aria-label="Riduci a pannello laterale"><Minimize2 size={16} /></button>
                : config.allowExpanded && <button className={styles.iconButton} onClick={() => setMode("expanded")} aria-label="Espandi Eve a schermo"><Expand size={16} /></button>}
              <button ref={closeButton} className={styles.iconButton} onClick={close} aria-label="Chiudi Eve"><X size={17} /></button>
            </div>
          </header>
          <div className={styles.body}>
            <div className={styles.status}><span>Ctrl/⌘ + Maiusc + E</span><span className={styles.badge}>{state.viewState}</span></div>
            <div className={styles.content} aria-live="polite">
              {state.viewState === "loading" && <div className={styles.stateBox}><div><strong>Elaborazione controllata…</strong><p>{state.notice}</p></div></div>}
              {state.viewState === "offline" && <div className={styles.stateBox}><div><strong>Modalità offline</strong><p>{state.notice}</p></div></div>}
              {state.viewState === "empty" && <div className={styles.stateBox}><div><strong>Contesto non disponibile</strong><p>{state.notice}</p></div></div>}
              {state.viewState === "error" && <div className={styles.stateBox}><div><strong>Non posso completare la richiesta</strong><p>{state.notice ?? "Errore redatto."}</p></div></div>}
              {state.viewState === "ready" && <>
                {!answer && <section className={styles.card}><h3>Gate MVP pronto</h3><p>Identità, aula, materiali, retrieval, provider, citazioni e feedback vengono verificati. Nessuna memoria o azione permanente nasce automaticamente.</p></section>}
                <section className={styles.card}><h3>Contesto proposto dalla pagina</h3>{contextEntries.length ? <div className={styles.contextGrid}>{contextEntries.map(([key, item]) => <div className={styles.contextRow} key={key}><span>{key}</span><code>{item}</code></div>)}</div> : <p>Nessun identificativo fornito.</p>}</section>
                {answer && <section className={styles.card}>
                  <h3>Risposta di Eve</h3>
                  <p className={styles.answer}>{answer.answer}</p>
                  <div className={styles.answerMeta}><span>{answer.grounded ? "Grounded" : "Fonte insufficiente"}</span><span>Incertezza: {answer.uncertainty}</span><span>{answer.provider} / {answer.model}</span></div>
                  {answer.citations.length > 0 && <div className={styles.citationList}>{answer.citations.map((citation) => <button key={`${citation.materialId}-${citation.chunkId}`} className={styles.citationButton} onClick={() => openCitation(citation)}><strong>[{citation.rank}] {citation.title}</strong><small>{citation.locator} · SHA {citation.textSha256.slice(0, 10)}…</small></button>)}</div>}
                  {answer.feedbackEnabled && <div className={styles.feedbackRow}><button onClick={() => sendFeedback("helpful")}>Utile</button><button onClick={() => sendFeedback("not_helpful")}>Da migliorare</button><small>{feedbackState}</small></div>}
                </section>}
                {openedSource && <section className={styles.card}><h3>Fonte verificata</h3><p>{openedSource.contextText}</p><div className={styles.answerMeta}><span>{openedSource.locator}</span><span>Integrità: {openedSource.integrityVerified ? "OK" : "KO"}</span><span>Istruzioni eseguibili: no</span></div></section>}
                {state.notice && <section className={styles.card}><h3>Stato</h3><p>{state.notice}</p></section>}
              </>}
            </div>
            <div className={styles.composer}>
              <textarea value={draft} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)} maxLength={8000} placeholder="Fai una domanda sul materiale autorizzato…" aria-label="Domanda per Eve" />
              <div className={styles.composerFooter}><small>Nessuna memoria o azione automatica</small><button className={styles.primary} onClick={submitDraft} disabled={!draft.trim() || !state.context.roomId || submitting}>{submitting ? "Verifico…" : "Chiedi a Eve"}</button></div>
            </div>
          </div>
        </aside>
      </>}
    </EvePanelContext.Provider>
  );
}
