# CORE-1.6 — VERIFICATION

Codex deve eseguire:

1. test specifici provider esterno;
2. suite Python cumulativa;
3. typecheck, Vitest, lint e build Next.js;
4. test con trasporto mock e sandbox del provider selezionato;
5. verifica che segreti non compaiano in API, log, errori o telemetria;
6. timeout, retry, fallback, budget, rate limit e circuit breaker;
7. provider disattivato e configurazione incompleta fail-closed;
8. preview browser e installer desktop alpha.15;
9. rollback completo.

Non usare chiavi di produzione nei test o nei log CI.
