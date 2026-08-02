"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Expand, Minimize2, X } from "lucide-react";
import type { EvePanelClientConfig, EvePanelContextReference, EvePanelOpenRequest, EvePanelVisibleMode } from "./contracts";
import { EVE_PANEL_CLOSE_EVENT, EVE_PANEL_OPEN_EVENT, EVE_PANEL_TOGGLE_EVENT } from "./events";
import { INITIAL_EVE_PANEL_STATE, reduceEvePanelState } from "./state";
import { EvePanelAvatar } from "./eve-panel-avatar";
import styles from "./eve-panel.module.css";

interface EvePanelContextValue {
  enabled: boolean;
  open: (request: EvePanelOpenRequest) => void;
  close: () => void;
  toggle: () => void;
}

const EvePanelContext = createContext<EvePanelContextValue>({ enabled: false, open: () => undefined, close: () => undefined, toggle: () => undefined });

export function useEvePanel(): EvePanelContextValue {
  return useContext(EvePanelContext);
}

function contextLabel(entryPoint: EvePanelOpenRequest["entryPoint"]): string {
  return ({ lesson: "Lezione", catalog: "Catalogo", room: "Aula", global: "Apertura globale" })[entryPoint];
}

function visibleContext(context: EvePanelContextReference): Array<[string, string]> {
  return Object.entries(context).filter((item): item is [string, string] => Boolean(item[1]));
}

export function EvePanelProvider({ config, children }: { config: EvePanelClientConfig; children: ReactNode }) {
  const [state, dispatch] = useReducer(reduceEvePanelState, INITIAL_EVE_PANEL_STATE);
  const [draft, setDraft] = useState("");
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
      if (!navigator.onLine) dispatch({ type: "set_view_state", viewState: "offline", notice: "Connessione assente: il pannello resta disponibile senza inviare dati." });
      else if (visibleContext(state.context).length === 0 && state.entryPoint !== "global") dispatch({ type: "set_view_state", viewState: "empty", notice: "Nessun riferimento didattico verificato è stato fornito da questa pagina." });
      else dispatch({ type: "set_view_state", viewState: "ready" });
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
      const first = focusable[0]; const last = focusable[focusable.length - 1];
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

  const submitDraft = useCallback(() => {
    const value = draft.trim();
    if (!value) return;
    setDraft("");
    dispatch({ type: "set_view_state", viewState: "ready", notice: "Bozza preparata localmente. Il provider AI reale verrà collegato in CORE-1.6." });
  }, [draft]);

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
              <div><strong id="eve-global-panel-title">Eve</strong><small>{contextLabel(state.entryPoint)} · UI controllata CORE-1.5</small></div>
            </div>
            <div className={styles.actions}>
              {state.mode === "expanded" ? <button className={styles.iconButton} onClick={() => setMode("side")} aria-label="Riduci a pannello laterale"><Minimize2 size={16} /></button> : config.allowExpanded && <button className={styles.iconButton} onClick={() => setMode("expanded")} aria-label="Espandi Eve a schermo"><Expand size={16} /></button>}
              <button ref={closeButton} className={styles.iconButton} onClick={close} aria-label="Chiudi Eve"><X size={17} /></button>
            </div>
          </header>
          <div className={styles.body}>
            <div className={styles.status}><span>Scorciatoia: Ctrl/⌘ + Maiusc + E</span><span className={styles.badge}>{state.viewState}</span></div>
            <div className={styles.content} aria-live="polite">
              {state.viewState === "loading" && <div className={styles.stateBox}><div><strong>Verifico il contesto…</strong><p>Identità, aula e riferimenti vengono controllati dal server prima dell’uso.</p></div></div>}
              {state.viewState === "offline" && <div className={styles.stateBox}><div><strong>Modalità offline</strong><p>{state.notice}</p></div></div>}
              {state.viewState === "empty" && <div className={styles.stateBox}><div><strong>Contesto non disponibile</strong><p>{state.notice}</p></div></div>}
              {state.viewState === "error" && <div className={styles.stateBox}><div><strong>Non posso aprire Eve</strong><p>{state.notice ?? "Errore redatto. Riprova dalla pagina corrente."}</p></div></div>}
              {state.viewState === "ready" && <>
                <section className={styles.card}><h3>Pannello pronto</h3><p>Questa fase integra interfaccia, focus e modalità responsive. Non attiva ancora un provider AI reale né crea memoria.</p></section>
                <section className={styles.card}><h3>Contesto proposto dalla pagina</h3>{contextEntries.length ? <div className={styles.contextGrid}>{contextEntries.map(([key, item]) => <div className={styles.contextRow} key={key}><span>{key}</span><code>{item}</code></div>)}</div> : <p>Nessun identificativo è stato fornito. Eve può restare aperta, ma non assume un contesto.</p>}</section>
                <section className={styles.card}><h3>Privacy e controllo</h3><p>Il client non assegna ruoli, non legge note private e non rende permanente alcun dato. La chiusura del pannello non compromette il resto dell’app.</p></section>
                {state.notice && <section className={styles.card}><h3>Stato</h3><p>{state.notice}</p></section>}
              </>}
            </div>
            <div className={styles.composer}>
              <textarea value={draft} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)} maxLength={2000} placeholder="Prepara una domanda per Eve…" aria-label="Bozza domanda per Eve" />
              <div className={styles.composerFooter}><small>Nessun invio a provider esterni in CORE-1.5</small><button className={styles.primary} onClick={submitDraft} disabled={!draft.trim()}>Prepara bozza</button></div>
            </div>
          </div>
        </aside>
      </>}
    </EvePanelContext.Provider>
  );
}
