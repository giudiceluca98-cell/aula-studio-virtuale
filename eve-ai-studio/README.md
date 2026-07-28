# Eve AI Studio — Fondazione modulare

Servizio isolato di Eve sviluppato sul branch `eve-ai-studio`, senza modificare `main`, `demo-canonica`, l’HTML canonico o l’app pubblica.

## Due roadmap indipendenti

Eve AI Studio è organizzato in due linee che non devono essere confuse:

- **`CORE`** — piattaforma tecnica già sviluppata: sicurezza, requisiti, prompt, valutazioni, provider, materiali, retrieval, RAG e apertura delle fonti;
- **`INTELLIGENCE`** — nuova evoluzione: ricerca online, memoria, apprendimento, scrittura e capacità AI.

Indice ufficiale, convenzione dei nomi e stato di ogni checkpoint:

```text
eve-ai-studio/CHECKPOINT_INDEX.md
```

La linea `CORE` è attualmente **in pausa dopo CORE-1.1**. La linea `INTELLIGENCE` è **pianificata ma non ancora iniziata**.

## Stato del servizio

```text
Versione: 1.1.0
Branch: eve-ai-studio
Suite cumulativa: 165 test superati
Eve Animation Library: 1.2.2
Asset originali HQ: 64
```

## Checkpoint CORE

| ID | Parole chiave | Stato |
|---|---|---|
| `CORE-0.1` | Fondazione FastAPI, sicurezza, permessi, limiti, audit | completato |
| `CORE-0.2` | Modularità, importazione requisiti | completato |
| `CORE-0.3` | Persistenza, versioni, rollback requisiti | completato |
| `CORE-0.4` | Prompt versionati, approvazione | completato |
| `CORE-0.5` | Valutazioni, grader, gate qualità | completato |
| `CORE-0.6` | Runner automatico, artefatti | completato |
| `CORE-0.7` | Provider, orchestrazione, telemetria | completato |
| `CORE-0.8` | Materiali, estrazione, chunking | chiuso e approvato |
| `CORE-0.9` | Retrieval locale, citazioni | chiuso e approvato |
| `CORE-1.0` | Chat RAG grounded, fonti | chiuso e approvato |
| `CORE-1.1` | Apertura fonti, verifica integrità | tecnicamente completo; chiusura utente da registrare |

Un eventuale checkpoint successivo della piattaforma dovrà chiamarsi:

```text
CORE-1.2_<PAROLE_CHIAVE_DA_DEFINIRE>
```

Non esiste ancora un `CORE-1.2` approvato o avviato.

## Roadmap INTELLIGENCE

| ID | Parole chiave | Stato |
|---|---|---|
| `INTELLIGENCE-0.1` | Centro ricerca, progetti apprendimento | pianificato |
| `INTELLIGENCE-0.2` | Acquisizione web controllata, quarantena fonti | pianificato |
| `INTELLIGENCE-0.3` | Affidabilità fonti, conflitti, revisione | pianificato |
| `INTELLIGENCE-0.4` | Memoria semantica, embedding, retrieval ibrido | pianificato |
| `INTELLIGENCE-0.5` | Provider AI reale, generazione citata | pianificato |
| `INTELLIGENCE-0.6` | Apprendimento didattico, scrittura, personalizzazione | pianificato |
| `INTELLIGENCE-0.7` | Aggiornamento continuo, manutenzione conoscenza | pianificato |

Il primo file da creare prima di qualsiasi codice sarà:

```text
CHECKPOINT_INTELLIGENCE_0.1_CENTRO_RICERCA_PROGETTI_APPRENDIMENTO_PLAN.md
```

## Convenzione dei documenti

```text
CHECKPOINT_<LINEA>_<VERSIONE>_<PAROLE_CHIAVE>_<TIPO_FILE>.<estensione>
```

Tipi previsti:

- `PLAN` — obiettivo, perimetro e criteri prima dello sviluppo;
- `UPDATE` — riepilogo trasferibile del lavoro;
- `VERIFICATION` — verifiche tecniche e browser;
- `CI_RESULT` — risultato automatico;
- `CLOSURE` — approvazione e chiusura.

## Struttura del progetto

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # catalogo, profili, orchestrazione e telemetria
│   ├── requirements/         # importazione, versioni e rollback
│   ├── prompts/              # prompt, modalità e workflow
│   ├── evaluations/          # scenari, grader, runner, artefatti e gate
│   ├── materials/            # catalogo, estrazione e chunking
│   ├── retrieval/            # ranking locale, integrità e citazioni
│   ├── rag/                  # chat RAG grounded
│   ├── sources/              # apertura e verifica delle fonti
│   ├── main.py
│   └── models.py
├── checkpoints/              # documenti con nomi ricercabili
├── data/
├── tests/
├── CHECKPOINT_INDEX.md
├── PHASE_STATUS.md
└── pyproject.toml
```

## Capacità CORE disponibili

### Materiali — `CORE-0.8`

- isolamento per `room_id`;
- SHA-256 sui byte originali;
- deduplicazione per aula;
- versioni immutabili;
- estrazione TXT, Markdown, CSV, HTML, XHTML e JSON;
- chunk con indice, offset e hash;
- nessun embedding e nessuna rete.

### Retrieval — `CORE-0.9`

- algoritmo deterministico `eve-lexical-v1`;
- uso delle sole versioni correnti `ready`;
- controllo di integrità dei chunk;
- citazioni con materiale, versione, chunk, offset e SHA-256;
- esclusione delle fonti sospette.

### Chat RAG — `CORE-1.0`

```text
provider: local-rag
model: eve-grounded-extractive-v1
stage: grounded_extractive_chat_no_embeddings
```

La risposta usa esclusivamente fonti autorizzate e marcatori `[n]`. Quando non trova supporto sufficiente restituisce `non trovato` senza aggiungere conoscenza generale.

### Apertura fonti — `CORE-1.1`

Il servizio verifica:

- locator;
- aula autorizzata;
- materiale, versione e chunk;
- coordinate;
- SHA-256;
- corrispondenza con il testo estratto;
- versione corrente o storica;
- contenuto sospetto come dato non fidato.

## API principali

```http
GET  /health
POST /v1/chat

GET  /v1/requirements/status
POST /v1/requirements/import
GET  /v1/requirements/versions
POST /v1/requirements/rollback

GET  /v1/prompts/status
GET  /v1/prompts
POST /v1/prompts
POST /v1/prompts/{version_id}/transition

GET  /v1/evaluations/status
GET  /v1/evaluations/scenarios
POST /v1/evaluations/runs/execute

GET  /v1/providers/status
GET  /v1/providers/catalog
GET  /v1/providers/telemetry

GET  /v1/materials/status
POST /v1/materials/import
GET  /v1/materials

GET  /v1/retrieval/status
POST /v1/retrieval/search

GET  /v1/rag/status
POST /v1/rag/chat

GET  /v1/sources/status
POST /v1/sources/open
```

## Verifica automatica

Workflow core:

```text
.github/workflows/eve-ai-studio-checks.yml
```

Rapporto autorevole:

```text
eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.1_APERTURA_FONTI_VERIFICA_INTEGRITA_CI_RESULT.json
```

Risultato atteso:

```text
Installazione editable: success
Compilazione Python: success
Pytest: 165 passed
Sintassi JavaScript: success
```

Workflow preview e animazioni:

```text
.github/workflows/eve-hq-final-verification.yml
```

Rapporto autorevole:

```text
eve-ai-studio/checkpoints/EVE_HQ_FINAL_VERIFICATION.json
```

## Anteprima ufficiale

```text
reference/eve-ai-studio-preview/index.html
```

Standalone:

```text
reference/eve-ai-studio-preview/EVE_AI_STUDIO_STANDALONE.html
```

La preview usa 64 WebP originali HQ e non deve essere sostituita con demo parallele, miniature o payload ricompressi.

## Escluso dallo stato CORE corrente

Questi elementi appartengono alla futura linea `INTELLIGENCE` e non sono ancora implementati:

- ricerca online;
- acquisizione web;
- provider AI reale e chiavi API;
- embedding;
- database vettoriale;
- retrieval semantico o ibrido;
- generazione libera con modello linguistico;
- memoria didattica persistente;
- aggiornamento autonomo della conoscenza.

## Avvio locale

```bash
cd eve-ai-studio
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Protezioni

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
- collegamenti alla produzione.
