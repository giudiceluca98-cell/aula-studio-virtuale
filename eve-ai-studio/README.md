# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sul branch `eve-ai-studio` senza modificare `main`, `demo-canonica`, l’HTML canonico o l’app pubblica.

## Stato

Versione del servizio: `1.0.0`

Checkpoint:

- `0.1` — FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — moduli separati e importatore delle 36 sezioni e 1.197 schede;
- `0.3` — persistenza, cronologia, versioni, confronto e rollback dei requisiti;
- `0.4` — prompt versionati, modalità didattiche e workflow di approvazione;
- `0.5` — scenari persistenti, risultati per criterio e gate reale dei prompt;
- `0.6` — runner deterministico, grader automatici e artefatti redatti;
- `0.7` — provider, modelli, profili, timeout, retry, fallback, token, costi e telemetria;
- `0.8` — catalogo materiali, estrazione testuale, versioni e chunk;
- `0.9` — retrieval lessicale locale, integrità e citazioni verificabili;
- `1.0` — chat RAG locale con risposta estrattiva e fonti autorizzate.

I Checkpoint `0.8` e `0.9` sono chiusi e approvati. Il Checkpoint `1.0` è implementato e verificato tecnicamente; resta da registrare l’approvazione conclusiva dell’utente.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # catalogo, profili, orchestrazione e telemetria
│   ├── requirements/         # piano, storage, versioni, confronto e rollback
│   ├── prompts/              # prompt, modalità, workflow, storage e API
│   ├── evaluations/          # scenari, grader, runner, artefatti e gate
│   ├── materials/            # catalogo, importazioni, estrazione e chunk
│   ├── retrieval/            # ranking locale, integrità e citazioni
│   ├── rag/                  # chat RAG estrattiva e policy delle fonti
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

## Prompt, valutazioni e provider

I prompt usano revisioni immutabili e il workflow:

```text
draft → in_review → publishable → published → archived
```

Il passaggio a `publishable` dipende dal gate persistente delle valutazioni.

Schema valutazioni: `2`

Il runner usa richieste tipizzate, provider mock deterministico, grader, risultati per criterio e artefatti redatti. Non salva il testo completo delle richieste o delle risposte.

Provider registrati:

- `mock` — attivo, deterministico, senza rete e senza costo;
- `external-template` — disattivato e senza credenziali.

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
- versione corrente aggiornata soltanto dopo successo;
- HTML senza script, stili, noscript e SVG;
- JSON deterministico;
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
- la versione corrente `ready`;
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

Ogni risultato contiene score, estratto, termini corrispondenti, identificatori del materiale e della versione, chunk, offset, filename, media type, SHA-256, locator e flag di sicurezza.

Formato locator:

```text
material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}
```

I documenti sono dati non fidati. I tentativi di ignorare istruzioni, richiamare system prompt, eseguire script o chiamare strumenti sono segnalati ma non eseguiti.

Stato retrieval:

```text
lexical_ranked_citations_no_embeddings
```

## Chat RAG — Checkpoint 1.0

Il servizio `RagChatService` usa il retrieval del Checkpoint `0.9` per costruire una risposta locale e deterministica.

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
3. verifica l’integrità SHA-256;
4. esclude le fonti sospette;
5. seleziona fino al limite configurato;
6. costruisce una risposta estrattiva con marcatori `[n]`;
7. restituisce citazioni strutturate;
8. calcola SHA-256 della risposta;
9. non propone azioni.

Policy delle fonti sospette:

```text
exclude_from_answer_and_citations
```

Quando non esistono passaggi sufficienti, Eve restituisce esplicitamente “non trovato” e non aggiunge conoscenza generale. Quando esistono soltanto fonti sospette o chunk alterati, produce un rifiuto sicuro senza citazioni.

La risposta del Checkpoint `1.0` non è ancora generata da un modello linguistico reale: combina estratti verificati in modo deterministico e dichiara questa limitazione nel campo `uncertainty`.

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
```

La rotta storica `/v1/chat` resta separata e invariata. Il RAG viene esposto soltanto sotto `/v1/rag`.

## Configurazione

```text
EVE_RETRIEVAL_MAX_QUERY_CHARS=500
EVE_RETRIEVAL_MAX_RESULTS=10
EVE_RETRIEVAL_MAX_EXCERPT_CHARS=600
EVE_RETRIEVAL_MIN_SCORE=1
EVE_RAG_MAX_SOURCES=4
EVE_RAG_MAX_ANSWER_CHARS=4000
```

## Test e verifica

GitHub Actions ha verificato il commit:

```text
a8ded290eef8983fce87a31a6ef67b02efa4728c
```

Risultati:

```text
Checkpoint 0.8 specifico: 20 passed
Checkpoint 0.9 specifico: 14 passed
Checkpoint 1.0 specifico: 13 passed
Suite cumulativa 0.1–1.0: 152 passed
```

Anteprima controllata in Chromium:

```text
5 scenari materiali
4 scenari retrieval
4 scenari chat RAG
13 scenari complessivi
Errori JavaScript: 0
Overflow orizzontale: assente
```

Il workflow `.github/workflows/eve-ai-studio-checks.yml` esegue installazione, compilazione, pytest, sintassi JavaScript e Chromium e registra i rapporti nel branch.

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
rag-chat-workflow.js
```

Non creare anteprime ufficiali parallele senza una decisione esplicita.

## Escluso dallo stato corrente

- provider AI reale e chiavi API;
- embedding;
- indice o database vettoriale;
- retrieval semantico o ibrido;
- reranker AI;
- generazione libera con modello linguistico;
- conoscenza generale aggiunta alla risposta RAG;
- PDF e Office;
- OCR e trascrizione;
- Supabase, autenticazione di produzione e object storage;
- memoria didattica persistente;
- strumenti di scrittura;
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
