# Eve AI Studio — Stato delle roadmap

## Stato corrente

```text
Branch operativo: eve-ai-studio
Versione servizio: 1.2.0
Release desktop di partenza: 1.2.0-alpha.6
Linea CORE: chiusa e in pausa dopo CORE-1.1
Linea INTELLIGENCE: INTELLIGENCE-0.2 chiuso e approvato; INTELLIGENCE-0.3 in FUNCTIONAL_TESTING
```

Indice ufficiale:

```text
eve-ai-studio/CHECKPOINT_INDEX.md
```

## Regola fondamentale

- `CORE` continua la piattaforma tecnica esistente;
- `INTELLIGENCE` sviluppa ricerca online, memoria, apprendimento e capacità AI;
- le due numerazioni sono indipendenti;
- ogni checkpoint usa linea, versione e parole chiave.

## Roadmap CORE

| ID | Parole chiave | Stato |
|---|---|---|
| `CORE-0.1` | Fondazione FastAPI, sicurezza, permessi e audit | completato |
| `CORE-0.2` | Modularità e importazione requisiti | completato |
| `CORE-0.3` | Persistenza, versioni e rollback requisiti | completato |
| `CORE-0.4` | Prompt versionati e approvazione | completato |
| `CORE-0.5` | Valutazioni, grader e gate qualità | completato |
| `CORE-0.6` | Runner automatico e artefatti | completato |
| `CORE-0.7` | Provider, orchestrazione e telemetria | completato |
| `CORE-0.8` | Materiali, estrazione e chunking | chiuso e approvato |
| `CORE-0.9` | Retrieval locale e citazioni | chiuso e approvato |
| `CORE-1.0` | Chat RAG grounded e fonti | chiuso e approvato |
| `CORE-1.1` | Apertura fonti e verifica integrità | chiuso e approvato |

Il prossimo checkpoint coordinato della linea CORE è `CORE-1.2`, ma non viene avviato o chiuso prima del Gate C previsto dal piano coordinato.

## Roadmap INTELLIGENCE

### `INTELLIGENCE-0.1` — Centro ricerca e progetti di apprendimento

Stato: **chiuso e approvato**

Verificato:

- package `app/intelligence`;
- database SQLite separato;
- progetti isolati per aula;
- obiettivi, domini, lingue, livelli e argomenti;
- stati `draft`, `active`, `paused`, `completed`, `archived`;
- cronologia delle transizioni;
- query pianificate;
- fonti candidate in quarantena;
- URL limitati a HTTP/HTTPS senza credenziali incorporate;
- limiti per progetto, query e fonti;
- API dedicate;
- sezione della preview ufficiale;
- 15 test specifici, zero fallimenti ed errori.

### `INTELLIGENCE-0.2` — Acquisizione web controllata e quarantena fonti

Stato: **chiuso, approvato, pubblicato e installato come `1.2.0-alpha.6`**

Funzioni verificate:

- acquisizione HTTP/HTTPS controllata tramite URL esplicito;
- protezione SSRF e blocco delle reti private;
- limiti di dimensione, tempo, redirect e MIME;
- metadati, checksum e cronologia delle acquisizioni;
- controllo `robots.txt` della destinazione iniziale e dei redirect;
- contenuti sempre in quarantena dopo il download;
- nessun apprendimento o approvazione automatica;
- nessuna promozione automatica nei materiali CORE.

### `INTELLIGENCE-0.3` — Revisione umana, qualità e promozione controllata

Stato: **FUNCTIONAL_TESTING — pacchetto locale preparato, non chiuso**

Release desktop di prova proposta: `1.2.0-alpha.7`.

Funzioni candidate al collaudo:

- coda di revisione attribuibile e isolata per aula;
- stati `under_review`, `approved`, `rejected`, `expired`, `superseded`;
- analisi deterministica di contenuti sospetti e indicatori di prompt injection;
- motivazione obbligatoria e punteggi qualità non decisionali;
- confronto tra acquisizioni della stessa fonte;
- promozione esplicita e idempotente verso i materiali CORE;
- provenienza completa tra fonte, acquisizione, revisione, promozione e materiale;
- revoca che disattiva il materiale dal retrieval senza eliminare la cronologia;
- promozione disattivata per impostazione predefinita.

La chiusura richiede applicazione sull'ultima `origin/eve-ai-studio`, test Codex, release firmata, installazione desktop sopra `alpha.6`, collaudo dell'utente e approvazione esplicita.

### `INTELLIGENCE-0.4` — Ricerca web e pianificazione delle query

Stato: **pianificato; bloccato fino alla chiusura di INTELLIGENCE-0.3**

### `INTELLIGENCE-0.5` — Ingestione documentale avanzata e crawling limitato

Stato: **pianificato**

### `INTELLIGENCE-0.6` — Embedding, indice vettoriale e retrieval ibrido

Stato: **pianificato**

### `INTELLIGENCE-0.7` — Freschezza, contraddizioni e salute delle fonti

Stato: **pianificato**

## Protezioni rispettate dal pacchetto INTELLIGENCE-0.3

Non modificati:

- `main`;
- `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- Aula Studio e produzione;
- Supabase;
- repository delle release;
- Eve Animation Library 1.2.6.

Il workflow desktop accetta temporaneamente anche il branch esatto
`codex/eve-ai-studio-intelligence-0-3`, così la release firmata di prova
`1.2.0-alpha.7` può essere collaudata prima del merge. Versione e anteprima
dell'updater desktop sono state aggiornate in modo coerente alla release di prova.

Non introdotti:

- approvazione automatica;
- provider AI reale;
- embedding;
- addestramento del modello;
- demo alternative;
- copie di `index.html`;
- standalone o nuove cartelle preview.
