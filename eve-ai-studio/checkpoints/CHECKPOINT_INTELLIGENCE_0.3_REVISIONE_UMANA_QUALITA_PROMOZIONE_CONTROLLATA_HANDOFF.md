# INTELLIGENCE-0.3 — Handoff funzionale per Codex

## Stato

`FUNCTIONAL_TESTING`

Non indicare `READY_FOR_HANDOFF`, `RELEASE_READY` o `CLOSED` prima di avere:

- test reali verdi nell'ultima origin/eve-ai-studio;
- commit funzionale congelato;
- release desktop firmata;
- installazione e test dell'utente;
- approvazione esplicita.

## Baseline

- branch sorgente: `eve-ai-studio`;
- checkpoint precedente: INTELLIGENCE-0.2 chiuso;
- release installata dall'utente: `1.2.0-alpha.6`;
- release di prova proposta: `1.2.0-alpha.7`.

## Implementazione

Backend:

- nuovi modelli di revisione, punteggio, sicurezza, promozione e confronto versioni;
- nuovo scanner deterministico non decisionale;
- nuovo ledger SQLite di revisioni, eventi e promozioni;
- nuovi endpoint;
- adapter esplicito al servizio materiali CORE;
- disattivazione reversibile del materiale durante la revoca;
- feature flag distinti.

Preview:

- aggiornamento del modulo canonico `research-center-workflow.js`;
- modifica minima dell'etichetta loader nell'unico `index.html`;
- nessun fetch e nessuna persistenza simulata presentata come reale.

## File funzionali congelabili dopo i test

Vedere `MANIFEST_INTELLIGENCE_0.3.json` nel pacchetto.

## Attività consentite al Codex grafico/desktop dopo READY_FOR_HANDOFF

- rifinire layout, responsive, focus e accessibilità;
- preservare tutti gli ID e le transizioni funzionali;
- generare la release desktop firmata;
- verificare updater e installazione sopra alpha.6.

## Attività vietate

- approvazione automatica;
- rimozione della motivazione obbligatoria;
- promozione senza acquisition_id corrente;
- promozione attiva di default senza decisione esplicita;
- cancellazione della cronologia in revoca;
- modifica di main, demo-canonica, Aula Studio, produzione o Supabase;
- creazione di demo, standalone, copie HTML o nuove cartelle preview.

## Note desktop

La preview è una simulazione UI. La build desktop deve continuare a derivare
esclusivamente da `reference/eve-ai-studio-preview/` e usare il sistema updater già
installato. Non introdurre un secondo updater.
