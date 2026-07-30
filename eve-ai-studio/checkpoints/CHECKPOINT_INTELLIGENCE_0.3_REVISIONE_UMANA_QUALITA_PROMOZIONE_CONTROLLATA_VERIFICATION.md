# INTELLIGENCE-0.3 — Verifica locale del pacchetto funzionale

## Stato

`FUNCTIONAL_TESTING`

Questa verifica documenta esclusivamente i controlli eseguiti sulla copia locale.
Codex deve ripeterli nell'ultima `origin/eve-ai-studio` e sulla release desktop.

## Test specifici

Comando:

```bash
pytest -q tests/test_intelligence_review.py
```

Risultato locale:

```text
13 passed
```

Copertura verificata:

- status INTELLIGENCE-0.3;
- flag promozione OFF;
- scanner prompt injection;
- attribuzione del revisore;
- idempotenza dell'avvio revisione;
- obbligo dei punteggi per approvazione;
- presa d'atto dei rischi;
- divieto di approvazione automatica;
- rifiuto motivato;
- promozione esplicita e idempotente;
- blocco promozione tramite flag;
- metadati di provenienza;
- revoca e rimozione dal retrieval;
- conservazione della cronologia;
- scadenza della revisione dopo nuova acquisizione;
- confronto versioni;
- isolamento per aula;
- contratti API.

## Suite cumulativa Python

Comando:

```bash
pytest -q
```

Risultato locale:

```text
193 passed in 4.59s
```

## Sintassi Python

```bash
python -m compileall -q app tests
```

Risultato: superato.

## Preview canonica

```bash
node --check reference/eve-ai-studio-preview/research-center-workflow.js
```

Risultato: superato.

Controlli statici:

- contiene `INTELLIGENCE-0.3`;
- contiene approvazione, promozione e revoca;
- non contiene chiamate `fetch(`;
- usa l'unico modulo canonico esistente;
- nessun HTML o standalone aggiunto.

Smoke HTTP locale:

- `index.html` servito correttamente;
- modulo `research-center-workflow.js` raggiungibile;
- riferimenti INTELLIGENCE-0.3 presenti.

## Verifiche ancora obbligatorie per Codex

- applicazione del pacchetto sull'ultima origin/eve-ai-studio;
- `git diff --check`;
- controllo prenotazioni di `index.html` e modulo workflow;
- test Python specifici e cumulativi;
- node --check di tutti i JavaScript modificati;
- apertura browser reale della preview canonica;
- console JavaScript senza errori;
- navigazione desktop e mobile;
- build desktop;
- firma updater;
- installazione sopra alpha.6;
- aggiornamento dall'app;
- prova manuale approva/promuovi/revoca/nuova versione;
- approvazione esplicita dell'utente.
