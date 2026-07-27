# Eve AI Studio — Fondazione modulare

Servizio isolato di Eve sviluppato sul branch `eve-ai-studio`, senza modificare `main`, `demo-canonica`, l’HTML canonico o l’app pubblica.

## Stato

Versione del servizio: `1.1.0`

Checkpoint:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — modularità e importatore delle 36 sezioni e 1.197 schede;
- `0.3` — persistenza, versioni, confronto e rollback dei requisiti;
- `0.4` — prompt versionati e workflow di approvazione;
- `0.5` — valutazioni persistenti e gate reale;
- `0.6` — runner deterministico e artefatti redatti;
- `0.7` — provider, profili, retry, fallback, budget e telemetria;
- `0.8` — catalogo materiali, estrazione e chunk;
- `0.9` — retrieval lessicale locale e citazioni verificabili;
- `1.0` — chat RAG estrattiva con fonti autorizzate;
- `1.1` — apertura verificabile della fonte citata.

I Checkpoint `0.8`, `0.9` e `1.0` sono chiusi e approvati. Il Checkpoint `1.1` è implementato e verificato tecnicamente; resta da registrare l’approvazione conclusiva dell’utente.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # catalogo, profili, orchestrazione e telemetria
│   ├── requirements/         # piano, storage, versioni e rollback
│   ├── prompts/              # prompt, modalità, workflow e API
│   ├── evaluations/          # scenari, grader, runner, artefatti e gate
│   ├── materials/            # catalogo, importazioni, estrazione e chunk
│   ├── retrieval/            # ranking locale, integrità e citazioni
│   ├── rag/                  # chat RAG estrattiva e policy delle fonti
│   ├── sources/              # apertura, integrità e navigazione delle fonti
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

## Provider e sicurezza corrente

Provider registrati:

- `mock` — attivo, deterministico, senza rete e senza costo;
- `external-template` — disattivato e senza credenziali.

```text
EVE_EXTERNAL_PROVIDERS_ENABLED=false
```

I documenti sono sempre trattati come dati non fidati. Il contenuto documentale non può sostituire istruzioni di sistema, attivare strumenti o modificare permessi.

## Materiali — Checkpoint 0.8

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

- isolamento per `room_id`;
- SHA-256 sui byte originali;
- deduplicazione nella stessa aula;
- versioni immutabili;
- versione corrente aggiornata soltanto dopo successo;
- HTML senza script, stili, noscript e SVG;
- JSON deterministico;
- chunk con indice, offset e SHA-256;
- `embedding_status=not_requested`;
- nessuna rete.

Stato:

```text
text_extracted_and_chunked_no_embeddings
```

## Retrieval — Checkpoint 0.9

Algoritmo:

```text
eve-lexical-v1
```

Il retrieval usa soltanto materiali della stessa aula, versioni correnti `ready` e chunk con SHA-256 valido. Ogni risultato contiene score, estratto, identificatori, versione, chunk, offset, file, media type, hash, locator e flag di sicurezza.

Formato locator:

```text
material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}
```

Stato:

```text
lexical_ranked_citations_no_embeddings
```

## Chat RAG — Checkpoint 1.0

Identità tecnica:

```text
provider: local-rag
model: eve-grounded-extractive-v1
stage: grounded_extractive_chat_no_embeddings
scope: authorized_room_current_ready_materials_only
```

Flusso:

1. richiede un `room_id` autorizzato;
2. cerca nei chunk correnti `ready` della stessa aula;
3. verifica SHA-256;
4. esclude le fonti sospette;
5. costruisce una risposta estrattiva con marcatori `[n]`;
6. restituisce citazioni strutturate;
7. calcola SHA-256 della risposta;
8. non propone azioni.

Quando mancano fonti sufficienti, Eve restituisce `non trovato` e non aggiunge conoscenza generale.

## Apertura fonte — Checkpoint 1.1

Servizio:

```text
SourceOpeningService
stage: verified_source_opening_v1
```

L’apertura riceve un locator prodotto dal retrieval o dalla chat RAG e verifica:

- formato del locator;
- appartenenza alla stessa aula;
- materiale, versione e chunk;
- coordinate iniziali e finali;
- SHA-256 salvato del chunk;
- corrispondenza tra chunk e porzione del testo estratto;
- SHA-256 atteso, quando fornito dalla citazione.

Una versione storica `ready` può essere aperta ed è marcata `stale`. Con `require_current=true`, una citazione storica viene bloccata con `source_outdated`.

La risposta contiene:

- testo esatto del chunk;
- contesto precedente e successivo limitato;
- versione citata e versione corrente;
- stato corrente/storico;
- hash verificato;
- flag di sicurezza;
- resource path e anchor navigabile;
- numero pagina, quando presente nei metadati;
- `content_trust=untrusted_document_content`;
- `instructions_executable=false`.

Una fonte assente e una fonte appartenente a un’altra aula restituiscono lo stesso contratto:

```text
404 source_not_found
```

Errori:

```text
invalid_source_locator
source_not_found
source_integrity_failed
source_hash_mismatch
source_coordinates_mismatch
source_outdated
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

GET  /v1/rag/status
POST /v1/rag/chat

GET  /v1/sources/status
POST /v1/sources/open
```

La rotta storica `/v1/chat` resta separata e invariata.

## Configurazione recente

```text
EVE_RETRIEVAL_MAX_QUERY_CHARS=500
EVE_RETRIEVAL_MAX_RESULTS=10
EVE_RETRIEVAL_MAX_EXCERPT_CHARS=600
EVE_RETRIEVAL_MIN_SCORE=1
EVE_RAG_MAX_SOURCES=4
EVE_RAG_MAX_ANSWER_CHARS=4000
EVE_SOURCE_MAX_CONTEXT_CHARS=2000
```

## Test e verifica

GitHub Actions ha verificato il commit funzionale:

```text
19fcd0e4ac55df862eb0131e6546f37a69746959
```

Risultati:

```text
Checkpoint 0.8 specifico: 20 passed
Checkpoint 0.9 specifico: 14 passed
Checkpoint 1.0 specifico: 13 passed
Checkpoint 1.1 specifico: 13 passed
Suite cumulativa 0.1–1.1: 165 passed
```

Anteprima Chromium:

```text
5 scenari materiali
4 scenari retrieval
4 scenari chat RAG
5 scenari apertura fonte
18 scenari complessivi
Errori JavaScript: 0
```

Il warning `StarletteDeprecationWarning` di `fastapi.testclient` non è un fallimento del checkpoint.

## Avvio locale

```bash
cd eve-ai-studio
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Anteprima ufficiale

```text
reference/eve-ai-studio-preview/index.html
```

Moduli recenti:

```text
materials-workflow.js
retrieval-workflow.js
rag-chat-workflow.js
source-opening-workflow.js
```

Non creare anteprime ufficiali parallele senza una decisione esplicita.

## Escluso dallo stato corrente

- provider AI reale e chiavi API;
- embedding;
- indice o database vettoriale;
- retrieval semantico o ibrido;
- reranker AI;
- generazione libera con modello linguistico;
- PDF e Office;
- OCR e trascrizione;
- Supabase, autenticazione di produzione e object storage;
- memoria didattica persistente;
- strumenti che modificano l’app ufficiale;
- integrazione con l’app ufficiale o la demo canonica.

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
- embedding;
- collegamenti alla produzione.
