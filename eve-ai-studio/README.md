# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.6.0`

Checkpoint implementati:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — separazione dei moduli e importatore strutturato del piano approfondito;
- `0.3` — persistenza SQLite, cronologia importazioni, versioni, confronto e rollback;
- `0.4` — prompt versionati, modalità didattiche e ciclo bozza–revisione–pubblicazione;
- `0.5` — scenari di valutazione persistenti, risultati per criterio e gate reale dei prompt;
- `0.6` — runner deterministico, input eseguibili, grader automatici e artefatti redatti.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # astrazione e provider mock
│   ├── requirements/         # piano, storage, versioni, confronto e rollback
│   ├── prompts/              # prompt, modalità, workflow, storage e API
│   ├── evaluations/          # scenari, grader, runner, risultati, artefatti e gate
│   ├── main.py               # API FastAPI
│   └── models.py             # contratti chat condivisi
├── data/
├── tests/
├── checkpoints/
├── .env.example
├── PHASE_STATUS.md
└── pyproject.toml
```

## Catalogo requisiti

Il Checkpoint 0.3 mantiene in SQLite:

- cronologia delle importazioni;
- snapshot immutabili;
- versione attiva;
- confronto tra versioni;
- rollback non distruttivo;
- checksum della sorgente e del catalogo.

Database predefinito:

```text
data/eve-requirements.sqlite3
```

Configurazione:

```text
EVE_REQUIREMENTS_DB_PATH
```

## Configurazioni prompt

Il Checkpoint 0.4 usa un archivio SQLite separato:

```text
data/eve-prompts.sqlite3
```

Ogni configurazione dispone di versione, checksum, stato, modalità didattica, parametri tipizzati, storico delle transizioni e collegamento alla versione attiva.

Workflow:

```text
draft → in_review → publishable → published → archived
```

Il passaggio a `publishable` usa il gate persistente delle valutazioni e non può essere forzato dal modello.

## Valutazioni persistenti

Database:

```text
data/eve-evaluations.sqlite3
```

Configurazione:

```text
EVE_EVALUATIONS_DB_PATH
EVE_EVALUATION_PUBLISH_SCORE
EVE_EVALUATION_EVIDENCE_MAX_CHARS
EVE_EVALUATION_LATENCY_BUDGET_MS
```

Valori predefiniti:

```text
Soglia pubblicazione: 85/100
Evidenza massima: 500 caratteri
Budget di latenza: 750 ms
```

Schema corrente:

```text
2
```

Tabelle:

- `evaluation_scenario_versions`;
- `evaluation_runs`;
- `evaluation_run_scenarios`;
- `evaluation_results`;
- `evaluation_run_artifacts`.

## Suite iniziale

Sono presenti otto scenari versionati:

1. contesto didattico corretto;
2. fonti verificabili;
3. isolamento tra aule;
4. permessi delle azioni;
5. gestione dell'incertezza;
6. qualità didattica;
7. coerenza della lingua;
8. budget di latenza.

Ogni scenario conserva severità, peso, soglia minima, obbligatorietà, input strutturato e comportamenti attesi.

## Runner automatico del Checkpoint 0.6

Il runner usa il contratto comune `EveProvider` e, in questa fase, il provider deterministico `mock`.

Flusso:

```text
scenario versionato
    ↓
ChatRequest tipizzata
    ↓
provider mock
    ↓
grader specifico
    ↓
risultato per criterio
    ↓
artefatto redatto
    ↓
completamento del run
    ↓
ricalcolo del gate
```

Grader disponibili:

- correttezza degli identificativi di contesto;
- presenza e coerenza delle fonti;
- assenza di dati vietati di altre aule;
- assenza di azioni oltre i permessi;
- dichiarazione dell'incertezza;
- struttura didattica minima;
- coerenza della lingua italiana;
- rispetto del budget di latenza;
- fallback generico per scenari aggiuntivi.

## Protezione dei contenuti

Il runner non salva il testo completo della risposta del provider.

Per ogni scenario conserva soltanto:

- provider;
- modello;
- durata in millisecondi;
- SHA-256 dell'output strutturato;
- numero di caratteri;
- numero di fonti;
- numero di azioni proposte;
- indicazione di redazione;
- eventuale classe dell'errore.

In caso di errore non viene conservato il messaggio completo dell'eccezione.

Le evidenze dei grader sono limitate dalla configurazione server-side.

## Gate di pubblicazione

Una versione prompt può diventare `publishable` soltanto quando l'ultima esecuzione completata:

- usa le versioni attualmente attive degli scenari;
- risulta `passed`;
- non contiene errori critici;
- non contiene fallimenti obbligatori;
- raggiunge la soglia ponderata configurata.

Quando uno scenario viene revisionato, i run precedenti restano nello storico ma non rendono più pubblicabile il prompt finché non viene eseguita la nuova suite.

## API

```http
GET  /health
POST /v1/chat

GET  /v1/requirements/status
POST /v1/requirements/import
GET  /v1/requirements/imports
GET  /v1/requirements/versions
GET  /v1/requirements/versions/{version_id}
GET  /v1/requirements/compare
POST /v1/requirements/rollback
GET  /v1/requirements/sections
GET  /v1/requirements
GET  /v1/requirements/{requirement_id}

GET  /v1/prompts/status
GET  /v1/prompts/modes
GET  /v1/prompts/compare
POST /v1/prompts/rollback
GET  /v1/prompts
POST /v1/prompts
GET  /v1/prompts/{version_id}
POST /v1/prompts/{version_id}/revisions
POST /v1/prompts/{version_id}/transition

GET  /v1/evaluations/status
GET  /v1/evaluations/gate/{prompt_version_id}
GET  /v1/evaluations/scenarios
POST /v1/evaluations/scenarios
GET  /v1/evaluations/scenarios/{scenario_version_id}
POST /v1/evaluations/scenarios/{scenario_version_id}/revisions
GET  /v1/evaluations/runs
POST /v1/evaluations/runs
GET  /v1/evaluations/runs/{run_id}
POST /v1/evaluations/runs/{run_id}/complete

GET  /v1/evaluations/runner/status
POST /v1/evaluations/runs/execute
GET  /v1/evaluations/runs/{run_id}/artifacts
```

L'endpoint manuale `/complete` resta disponibile per compatibilità e per importare risultati prodotti da runner esterni controllati.

## Avvio locale

```bash
cd eve-ai-studio
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8100
```

## Test del Checkpoint 0.6

Eseguiti localmente sul runner, sui grader, sulla migrazione degli artefatti, sull'orchestrazione e sulle API:

```text
29 passed
```

Coprono:

- stato deterministico del runner;
- costruzione degli input tipizzati;
- override del payload scenario;
- otto grader iniziali;
- rilevazione di perdita tra aule;
- rilevazione di azioni non autorizzate;
- fallimento del budget di latenza;
- grader generico;
- redazione degli errori del provider;
- limite delle evidenze;
- assenza dell'output completo negli artefatti;
- migrazione SQLite allo schema `2`;
- persistenza degli artefatti;
- copertura esatta dello snapshot;
- migrazione idempotente degli input vuoti;
- esecuzione automatica completa;
- disponibilità degli artefatti;
- API di stato, esecuzione e consultazione.

La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata in questo passaggio; il numero `29` non deve essere sommato automaticamente ai risultati precedenti.

## Limiti attuali

- il runner usa soltanto il provider deterministico mock;
- i grader sono iniziali e basati su controlli testuali o strutturali;
- non sono ancora presenti grader semantici basati su un modello indipendente;
- non vengono ancora misurati token e costi;
- non sono implementati retry, timeout distribuiti o fallback tra provider;
- non sono presenti modello AI reale, RAG, Supabase, autenticazione, memoria didattica, voce o strumenti di scrittura nell'app ufficiale.

L'avatar animato definitivo verrà integrato dopo la consegna e l'approvazione degli asset prodotti esternamente.

## Regola di sicurezza

Il modello può produrre una risposta. Identità, contesto, permessi, transizioni, persistenza, valutazioni, redazione, memoria e azioni devono essere verificate da codice server indipendente dal modello.
