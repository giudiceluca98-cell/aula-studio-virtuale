"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RunnerStatus = "loading" | "ready" | "running" | "error";
type RunResult = { output?: string; error?: string };

export function usePythonRunner() {
  const [status, setStatus] = useState<RunnerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [generation, setGeneration] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<{ id: string; resolve: (result: RunResult) => void; timeout: number } | null>(null);

  useEffect(() => {
    const worker = new Worker("/python-runner.worker.mjs", { type: "module", name: "python-project-runner" });
    workerRef.current = worker;
    setStatus("loading"); setErrorMessage("");
    worker.addEventListener("message", (event: MessageEvent) => {
      if (event.data?.type === "ready") { setStatus("ready"); return; }
      if (event.data?.type === "init-error") { setErrorMessage(String(event.data.error ?? "Impossibile preparare Python.")); setStatus("error"); return; }
      const pending = pendingRef.current;
      if (event.data?.type !== "result" || !pending || event.data.id !== pending.id) return;
      window.clearTimeout(pending.timeout);
      pendingRef.current = null;
      setStatus("ready");
      pending.resolve({ output: event.data.output, error: event.data.error });
    });
    worker.addEventListener("error", (event) => { setErrorMessage(event.message || "Impossibile caricare il motore Python."); setStatus("error"); });
    return () => {
      const pending = pendingRef.current;
      if (pending) { window.clearTimeout(pending.timeout); pending.resolve({ error: "Esecuzione interrotta." }); pendingRef.current = null; }
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [generation]);

  const run = useCallback((code: string): Promise<RunResult> => {
    if (status !== "ready" || !workerRef.current) return Promise.resolve({ error: status === "loading" ? "Python si sta ancora preparando." : "Il motore Python non è disponibile." });
    if (!code.trim() || code.length > 2800) return Promise.resolve({ error: "Il codice deve contenere da 1 a 2800 caratteri." });
    setStatus("running");
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const timeout = window.setTimeout(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        pendingRef.current = null;
        resolve({ error: "Il programma ha impiegato troppo tempo ed è stato fermato. Controlla i calcoli e riprova." });
        setGeneration((value) => value + 1);
      }, 6000);
      pendingRef.current = { id, resolve, timeout };
      workerRef.current!.postMessage({ type: "run", id, code });
    });
  }, [status]);

  return { status, errorMessage, run };
}
