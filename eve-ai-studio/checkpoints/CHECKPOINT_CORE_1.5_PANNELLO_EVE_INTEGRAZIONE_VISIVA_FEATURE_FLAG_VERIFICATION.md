# CORE-1.5 — VERIFICATION

## Controlli locali del pacchetto

- hash e manifesto;
- sintassi degli strumenti Python;
- sintassi JavaScript preview;
- assenza di fetch nella preview e nel provider;
- nessun HTML alternativo;
- anti-drift e idempotenza;
- compilazione TypeScript isolata dei contratti e dello state reducer;
- smoke HTTP della preview canonica;
- rollback file.

## Controlli obbligatori Codex

- typecheck, lint, Vitest e build completi;
- browser reale desktop e mobile;
- test tastiera, focus e screen reader;
- app utilizzabile con EVE_PANEL_ENABLED=false;
- ingresso da lezione, catalogo e aula;
- runtime Animation Library 1.2.6 e fallback;
- build firmata e aggiornamento desktop alpha.12.
