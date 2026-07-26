# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sul branch `eve-ai-studio` senza modificare `main`, `demo-canonica`, l’HTML canonico o l’app pubblica.

## Stato

Versione del servizio: `0.9.0`

Checkpoint:

- `0.1` — FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — moduli separati e importatore delle 36 sezioni e 1.197 schede;
- `0.3` — persistenza, cronologia, versioni, confronto e rollback dei requisiti;
- `0.4` — prompt versionati, modalità didattiche e workflow di approvazione;
- `0.5` — scenari persistenti, risultati per criterio e gate reale dei prompt;
- `0.6` — runner deterministico, grader automatici e artefatti redatti;
- `0.7` — registro provider e modelli, profili, timeout, retry, fallback, token, costi e telemetria;
- `0.8` — catalogo materiali, importazione controllata, estrazione testuale, versioni e chunk senza embedding;
- `0.9` — retrieval lessicale locale, ranking deterministico, integrità e citazioni verificabili.

Il Checkpoint `0.8` è chiuso e approvato. Il Checkpoint `0.9` è implementato e verificato tecnicamente; l’approvazione conclusiva dell’utente deve ancora essere registrata.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # catalogo, profili, orchestrazione e telemetria
│   ├── requirements/         # piano, storage, versioni, confronto e rollback
│   ├── prompts/              # prompt, modalità, workflow, storage e API
│   ├── evaluations/          # scenari, grader, runner, risultati, artefatti e gate
│   ├── materials/            # catalogo, importazioni, estrazione, chunk e versioni
│   ├── retrieval/            # ranking locale, integrità, citazioni e API
│   ├── main.py               # applicazione FastAPI
│   └── models.py             # contratti chat condivisi
├── checkpoints/
├── data/
├── tests/
├── .env.example
├── PHASE_STATUS.md
└── pyproject.toml
```

## Database locali

```text
data/eve-requirements.sqlite3
data/eve-prompts.sqlite3
data/eve-evaluations.sqlite3
data/eve-provider-telemetry.sqlite3
data/eve-materials.sqlite3
```

I database SQLite e i file WAL/SHM sono esclusi dal repository.

## Requisiti e piano

Il registro conserva:

- 36 sezioni e 1.197 schede;
- importazioni riuscite, invariate e fallite;
- snapshot immutabili;
- versione attiva;
- confronto dettagliato;
- rollback non distruttivo;
- checksum della sorgente e del catalogo.

## Prompt e valutazioni

I prompt usano revisioni immutabili e il workflow:

```text
draft → in_review → publishable → published → archived
```

Il passaggio a `publishable` dipende dal gate delle valutazioni persistenti.

Schema valutazioni: `2`

Tabelle:

```text
evaluation_scenario_versions
evaluation_runs
evaluation_run_scenarios
evaluation_results
evaluation_run_artifacts
```

Il runner automatico usa richieste tipizzate, provider mock deterministico, grader, risultati per criterio e artefatti redatti. Non salva il testo completo delle richieste o delle risposte.

## Provider

Provider registrati:

- `mock` — attivo, deterministico, senza rete e senza costo;
- `external-template` — disattivato e senza credenziali.

Profili principali:

- `chat-development`;
- `evaluation-safe`;
- `external-review`, disattivato.

Configurazione obbligatoria corrente:

```text
EVE_EXTERNAL_PROVIDERS_ENABLED=false
```

## Materiali — Checkpoint 0.8

Il catalogo è isolato per `room_id` e conserva materiali, versioni, chunk e cronologia redatta.

Formati supportati:

```text
text/plain
text/markdown
text/csv
text/html
application/xhtml+xml
application/json
```

Regole principali:

- UTF-8 obbligatorio;
- SHA-256 sui byte originali;
- deduplicazione nella stessa aula;
- versioni immutabili;
- versione corrente aggiornata solo dopo successo;
- HTML senza script, stili, noscript e SVG;
- JSON validato e serializzato deterministicamente;
- chunk con indice, offset e SHA-256;
- `embedding_status=not_requested`;
- nessuna rete.

Stato pipeline:

```text
text_extracted_and_chunked_no_embeddings
```

## Retrieval — Checkpoint 0.9

Il retrieval usa esclusivamente:

- l’aula richiesta;
- i materiali della stessa aula;
- la versione corrente con stato `ready`;
- chunk con SHA-256 valido.

Algoritmo:

```text
eve-lexical-v1
```

Segnali del ranking:

- copertura dei termini;
- frequenza limitata;
- corrispondenze nel titolo e nel nome file;
- frase esatta;
- ordinamento stabile.

Ogni risultato contiene:

- score;
- estratto;
- termini corrispondenti;
- material_id e version_id;
- numero versione;
- chunk_id e chunk_index;
- offset iniziale e finale;
- filename e media type;
- SHA-256 del chunk;
- locator verificabile;
- eventuali flag di sicurezza.

Formato locator:

```text
material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}
```

I documenti sono trattati come dati non fidati. Frasi che tentano di ignorare istruzioni, richiamare system prompt, eseguire script o chiamare strumenti vengono segnalate ma non eseguite.

Stato retrieval:

```text
lexical_ranked_citations_no_embeddings
```

## API principali

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
GET  /v1/evaluations/runs
POST /v1/evaluations/runs
POST /v1/evaluations/runs/execute
GET  /v1/evaluations/runs/{run_id}
GET  /v1/evaluations/runs/{run_id}/artifacts

GET  /v1/providers/status
GET  /v1/providers/catalog
GET  /v1/providers/models
GET  /v1/providers/profiles
GET  /v1/providers/telemetry

GET  /v1/materials/status
GET  /v1/materials/imports
POST /v1/materials/import
GET  /v1/materials
GET  /v1/materials/{material_id}
GET  /v1/materials/{material_id}/versions
GET  /v1/materials/{material_id}/versions/{version_number}
GET  /v1/materials/{material_id}/versions/{version_number}/chunks

GET  /v1/retrieval/status
POST /v1/retrieval/search
```

## Configurazione retrieval

```text
EVE_RETRIEVAL_MAX_QUERY_CHARS=500
EVE_RETRIEVAL_MAX_RESULTS=10
EVE_RETRIEVAL_MAX_EXCERPT_CHARS=600
EVE_RETRIEVAL_MIN_SCORE=1
```

## Test

Risultati verificati nel banco locale ricostruito dal branch:

```text
Checkpoint 0.8 specifico: 20 passed
Checkpoint 0.1–0.8 cumulativo: 125 passed
Checkpoint 0.9 specifico: 14 passed
Checkpoint 0.1–0.9 cumulativo: 139 passed
```

Anteprima controllata in Chromium:

```text
Checkpoint 0.8: 5 scenari materiali
Checkpoint 0.9: 4 scenari retrieval
Errori JavaScript: 0
Overflow orizzontale: assente
```

Il workflow `.github/workflows/eve-ai-studio-checks.yml` esegue la suite cumulativa, i controlli sintattici e gli scenari browser e registra un rapporto nel branch.

## Avvio locale

```bash
cd eve-ai-studio
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Anteprima ufficiale

Percorso unico:

```text
reference/eve-ai-studio-preview/index.html
```

Moduli recenti:

```text
materials-workflow.js
retrieval-workflow.js
```

Non creare anteprime ufficiali parallele senza una decisione esplicita.

## Escluso dallo stato corrente

- provider AI reale;
- chiavi API;
- embedding;
- indice vettoriale;
- retrieval semantico;
- reranker AI;
- RAG collegato alla chat;
- PDF e Office;
- OCR e trascrizione;
- Supabase;
- autenticazione amministrativa di produzione;
- object storage;
- integrazione con l’app ufficiale.

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
- provider esterni;
- embedding esterni;
- collegamenti alla produzione.
