# Eve AI Studio — Stato delle roadmap

## Stato corrente

```text
Branch operativo: eve-ai-studio
Versione servizio CORE: 1.1.0
Linea CORE: in pausa dopo CORE-1.1
Linea INTELLIGENCE: pianificata, non ancora iniziata
```

Indice ufficiale e convenzione dei nomi:

```text
eve-ai-studio/CHECKPOINT_INDEX.md
```

## Regola fondamentale

Le due roadmap sono indipendenti:

- `CORE` continua la piattaforma tecnica esistente;
- `INTELLIGENCE` sviluppa ricerca online, memoria, apprendimento e capacità AI.

Non si usa più una numerazione generica come `Checkpoint 1.2`. Ogni checkpoint deve riportare linea e parole chiave.

## Roadmap CORE — piattaforma tecnica

### `CORE-0.1` — Fondazione FastAPI, sicurezza, permessi e audit

Stato: **completato**

FastAPI, provider mock, contesto, permessi, limiti, audit e feature flag.

### `CORE-0.2` — Modularità e importazione requisiti

Stato: **completato**

Moduli separati, parser delle 36 sezioni e 1.197 schede, validazione, checksum, routing, API, CLI e manifesto.

### `CORE-0.3` — Persistenza, versioni e rollback requisiti

Stato: **completato**

SQLite, cronologia, snapshot immutabili, versione attiva, confronto e rollback non distruttivo.

### `CORE-0.4` — Prompt versionati e approvazione

Stato: **completato**

Revisioni immutabili, modalità didattiche, parametri tipizzati, confronto, rollback e gate server-side.

### `CORE-0.5` — Valutazioni, grader e gate qualità

Stato: **completato**

Scenari versionati, severità, pesi, soglie, risultati per criterio, punteggio e invalidazione.

### `CORE-0.6` — Runner automatico e artefatti

Stato: **completato**

Richieste eseguibili, provider mock deterministico, grader, durata, artefatti redatti e SHA-256 dell’output.

### `CORE-0.7` — Provider, orchestrazione e telemetria

Stato: **completato**

Catalogo server-side, profili, timeout, retry, fallback, budget, stima costi e telemetria redatta.

### `CORE-0.8` — Materiali, estrazione e chunking

Stato: **chiuso e approvato**

- catalogo SQLite isolato per aula;
- importazione controllata;
- checksum, deduplicazione e versioni immutabili;
- estrazione TXT, Markdown, CSV, HTML, XHTML e JSON;
- chunk con offset e SHA-256;
- nessun embedding o servizio esterno.

### `CORE-0.9` — Retrieval locale e citazioni

Stato: **chiuso e approvato**

- ranking deterministico `eve-lexical-v1`;
- sole versioni correnti `ready`;
- isolamento per `room_id`;
- controllo SHA-256;
- locator e citazioni verificabili;
- esclusione dei contenuti sospetti.

### `CORE-1.0` — Chat RAG grounded e fonti

Stato: **chiuso e approvato**

- provider `local-rag`;
- modello `eve-grounded-extractive-v1`;
- risposta estrattiva con marcatori `[n]`;
- fonti autorizzate;
- risposta `non trovato` senza conoscenza generale aggiunta.

### `CORE-1.1` — Apertura fonti e verifica integrità

Stato: **tecnicamente completo; chiusura utente da registrare**

- parser rigido dei locator;
- risoluzione limitata alla stessa aula;
- verifica di coordinate e SHA-256;
- confronto con il testo estratto;
- gestione delle versioni storiche;
- contesto precedente e successivo limitato;
- contenuti sospetti mostrati come dati non fidati;
- `instructions_executable=false`.

## Stato di sospensione CORE

La linea CORE si ferma qui finché non viene presa una decisione esplicita.

Un eventuale prossimo checkpoint dovrà essere nominato:

```text
CORE-1.2_<PAROLE_CHIAVE_DA_DEFINIRE>
```

Attualmente non esiste un piano `CORE-1.2`.

## Roadmap INTELLIGENCE — nuova AI di Aula Studio

Questa linea è distinta dal CORE e non modifica la cronologia dei checkpoint esistenti.

### `INTELLIGENCE-0.1` — Centro ricerca e progetti di apprendimento

Stato: **pianificato**

Creazione di progetti di ricerca, obiettivi, query, avanzamento e catalogo delle fonti.

### `INTELLIGENCE-0.2` — Acquisizione web controllata e quarantena fonti

Stato: **pianificato**

Ricerca online, acquisizione tracciata, estrazione, metadati, hash e isolamento prima dell’apprendimento.

### `INTELLIGENCE-0.3` — Affidabilità fonti, conflitti e revisione

Stato: **pianificato**

Valutazione della qualità, confronto tra affermazioni, rilevamento dei conflitti e approvazione umana.

### `INTELLIGENCE-0.4` — Memoria semantica, embedding e retrieval ibrido

Stato: **pianificato**

Conoscenza persistente, collegamenti tra concetti, deduplicazione semantica e ricerca lessicale-semantica.

### `INTELLIGENCE-0.5` — Provider AI reale e generazione citata

Stato: **pianificato**

Collegamento a modelli reali, orchestrazione, limiti, budget e risposte con fonti obbligatorie.

### `INTELLIGENCE-0.6` — Apprendimento didattico, scrittura e personalizzazione

Stato: **pianificato**

Spiegazioni per livello, scrittura, esempi, esercizi, errori comuni e adattamento allo studente.

### `INTELLIGENCE-0.7` — Aggiornamento continuo e manutenzione conoscenza

Stato: **pianificato**

Ricontrollo periodico delle fonti, nuove versioni, ritiro delle informazioni superate e cronologia.

## Primo passaggio consentito della linea INTELLIGENCE

Prima di scrivere codice deve essere creato e approvato:

```text
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.1_CENTRO_RICERCA_PROGETTI_APPRENDIMENTO_PLAN.md
```

Il file dovrà definire:

- obiettivi;
- dati e contratti;
- interfaccia della nuova sezione;
- limiti di rete;
- sicurezza e quarantena;
- criteri di verifica;
- ciò che resta escluso.

## Verifiche correnti

Core:

```text
eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.1_APERTURA_FONTI_VERIFICA_INTEGRITA_CI_RESULT.json
```

Preview e animazioni:

```text
eve-ai-studio/checkpoints/EVE_HQ_FINAL_VERIFICATION.json
```

Risultati consolidati:

```text
Suite Python: 165 test superati
Sintassi JavaScript: superata
Preview modulare: superata
Standalone file://: superato
Animazioni originali HQ: 64/64
Galleria: 64/64
```

## Protezioni rispettate

Non modificati:

- `main`;
- `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- app ufficiale;
- `eve-canonical-integration-v2`;
- pacchetto master Eve Animation Library 1.2.2.

Non eseguiti:

- pull request;
- merge;
- integrazione nella produzione;
- ricerca web reale;
- provider AI reale;
- embedding.
