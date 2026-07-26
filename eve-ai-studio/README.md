# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sul branch `eve-ai-studio` senza modificare `main`, `demo-canonica`, l'HTML canonico o l'app pubblica.

## Stato

Versione del servizio: `0.8.0`

Checkpoint implementati:

- `0.1` — FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — moduli separati e importatore delle 36 sezioni e 1.197 schede;
- `0.3` — persistenza, cronologia, versioni, confronto e rollback dei requisiti;
- `0.4` — prompt versionati, modalità didattiche e workflow di approvazione;
- `0.5` — scenari persistenti, risultati per criterio e gate reale dei prompt;
- `0.6` — runner deterministico, grader automatici e artefatti redatti;
- `0.7` — registro provider e modelli, profili, timeout, retry, fallback, token, costi e telemetria;
- `0.8` — catalogo materiali, importazione controllata, estrazione testuale, versioni e preparazione RAG senza embedding esterni.

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
│   ├── main.py               # API FastAPI
│   └── models.py             # contratti chat condivisi
├── data/
├── tests/
├── checkpoints/
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

I database SQLite, i file WAL e SHM sono esclusi dal repository.

## Catalogo requisiti

Il catalogo conserva:

- 36 sezioni e 1.197 schede;
- importazioni riuscite, invariate e fallite;
- snapshot immutabili;
- versione attiva;
- confronto dettagliato;
- rollback non distruttivo;
- checksum della sorgente e del catalogo.

## Configurazioni prompt

Ogni configurazione conserva:

- chiave stabile;
- numero versione;
- prompt di sistema;
- modalità didattica;
- parametri tipizzati;
- checksum;
- versione genitore;
- stato;
- cronologia;
- versione pubblicata attiva.

Workflow:

```text
draft → in_review → publishable → published → archived
```

Il passaggio a `publishable` dipende dal gate delle valutazioni persistenti.

## Valutazioni e runner

Schema valutazioni: `2`

Tabelle:

- `evaluation_scenario_versions`;
- `evaluation_runs`;
- `evaluation_run_scenarios`;
- `evaluation_results`;
- `evaluation_run_artifacts`.

Sono presenti otto scenari iniziali:

1. contesto didattico corretto;
2. fonti verificabili;
3. isolamento tra aule;
4. permessi delle azioni;
5. gestione dell'incertezza;
6. qualità didattica;
7. coerenza della lingua;
8. budget di latenza.

Il runner automatico:

1. legge lo scenario versionato;
2. costruisce una `ChatRequest` tipizzata;
3. esegue il provider tramite il profilo `evaluation-safe`;
4. applica i grader;
5. salva risultati per criterio;
6. conserva artefatti redatti;
7. completa il run;
8. ricalcola il gate.

Non vengono salvati testo completo della richiesta, testo selezionato, risposta completa o corpo completo delle eccezioni.

## Provider e modelli

Provider registrati:

- `mock` — attivo, deterministico, senza rete e senza costo;
- `external-template` — disattivato e privo di credenziali.

Modelli registrati:

- `eve-foundation-mock-v2` — primario;
- `eve-foundation-mock-fallback-v1` — fallback;
- `external-model-placeholder` — disattivato.

Configurazione di sicurezza:

```text
EVE_EXTERNAL_PROVIDERS_ENABLED=false
```

Il solo cambio di questa variabile non abilita il segnaposto esterno: provider, modello e factory devono essere implementati, registrati e abilitati esplicitamente.

## Profili di esecuzione

### chat-development

- scopo: chat;
- provider: mock v2;
- timeout: 2.000 ms;
- massimo 2 tentativi;
- provider esterni vietati;
- massimo 12.000 token per esecuzione;
- costo massimo: 0 USD.

### evaluation-safe

- scopo: valutazione;
- primario: mock v2;
- fallback: mock fallback v1;
- timeout: 1.500 ms;
- massimo 2 tentativi per target;
- provider esterni vietati;
- massimo 16.000 token per esecuzione;
- costo massimo: 0 USD.

### external-review

- disattivato;
- provider esterno richiesto;
- non utilizzabile finché non viene implementato e approvato.

## Catalogo materiali — Checkpoint 0.8

Il catalogo dei materiali è isolato per `room_id` e usa SQLite schema `1`.

Tabelle:

```text
material_schema_metadata
materials
material_versions
material_chunks
material_import_events
```

Ogni importazione controllata conserva:

- aula;
- identificatore stabile del materiale;
- versione immutabile;
- titolo e nome file;
- media type normalizzato;
- tipo di sorgente;
- metadati JSON limitati;
- byte originali nel database locale;
- dimensione;
- checksum SHA-256;
- stato `processing`, `ready` o `failed`;
- testo estratto quando disponibile;
- numero di caratteri;
- numero di chunk;
- codice e classe dell'eventuale errore.

Il contenuto originale, il testo estratto e il corpo delle eccezioni non vengono restituiti nella cronologia delle importazioni.

### Formati supportati nel 0.8

```text
text/plain
text/markdown
text/csv
text/html
application/xhtml+xml
application/json
```

Regole:

- testo UTF-8;
- BOM UTF-8 accettato;
- HTML convertito in testo senza `script`, `style`, `noscript` e `svg`;
- JSON validato e serializzato in modo deterministico;
- PDF, Office, immagini, audio e video non sono ancora estratti;
- nessun OCR;
- nessun parser documentale esterno;
- nessuna rete.

### Checksum e deduplicazione

Il checksum è calcolato sui byte originali con SHA-256.

La deduplicazione è applicata alle versioni `ready` all'interno della stessa aula:

- stesso checksum e stessa aula → evento `duplicate`, nessuna nuova versione;
- stesso checksum in aule diverse → materiali distinti;
- una versione fallita non blocca un nuovo tentativo.

### Versioni

- ogni revisione crea una riga immutabile;
- il numero versione cresce per materiale;
- la versione corrente cambia soltanto dopo un'elaborazione riuscita;
- un errore in una nuova versione non sostituisce la precedente versione pronta;
- limite predefinito: 50 versioni per materiale.

### Preparazione RAG

Il checkpoint prepara segmenti testuali deterministici:

- dimensione predefinita: 1.200 caratteri;
- sovrapposizione predefinita: 150 caratteri;
- preferenza per confini di paragrafo, riga e frase;
- indice progressivo;
- offset iniziale e finale;
- SHA-256 del testo del chunk;
- `embedding_status=not_requested`.

Stato della pipeline:

```text
text_extracted_and_chunked_no_embeddings
```

Gli embedding sono esplicitamente disattivati:

```text
embeddings_enabled=false
embedding_provider=null
```

Non esistono ancora ricerca semantica, indice vettoriale o generazione RAG collegata alla chat.

## Limiti predefiniti dei materiali

```text
EVE_MATERIAL_MAX_BYTES=2000000
EVE_MATERIAL_MAX_TEXT_CHARS=2000000
EVE_MATERIAL_MAX_METADATA_CHARS=16000
EVE_MATERIAL_CHUNK_CHARS=1200
EVE_MATERIAL_CHUNK_OVERLAP_CHARS=150
EVE_MATERIAL_MAX_VERSIONS=50
```

Database:

```text
EVE_MATERIALS_DB_PATH=data/eve-materials.sqlite3
```

## Errori redatti

Il catalogo usa codici stabili, tra cui:

- `invalid_payload`;
- `material_too_large`;
- `extracted_text_too_large`;
- `unsupported_media_type`;
- `text_decoding_failed`;
- `material_not_found`;
- `material_version_not_found`;
- `material_room_mismatch`;
- `material_version_limit`;
- `material_processing_failed`;
- `duplicate_checksum`.

Le API non espongono il contenuto del documento, il percorso interno o il corpo completo dell'eccezione. Un accesso da un'aula diversa restituisce `404 Materiale non trovato`.

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
```

## Anteprima ufficiale

Percorso:

```text
reference/eve-ai-studio-preview/index.html
```

La vista `Materiali e RAG` mostra:

- catalogo per aula;
- importazione valida;
- duplicato checksum;
- nuova versione;
- formato non supportato;
- limite superato;
- pipeline RAG preparatoria;
- chunk con offset e hash;
- cronologia redatta;
- embedding disattivati.

La simulazione richiama gli stati della Eve Animation Library 1.2.2 senza sostituire la galleria da 64 asset.

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

## Test del Checkpoint 0.8

Eseguiti nel banco di prova locale sul nuovo modulo materiali:

```text
20 passed in 0.95s
```

Coprono:

- schema e stato vuoto;
- importazione plaintext;
- checksum;
- chunk e hash;
- deduplicazione per aula;
- versioni e versione corrente;
- fallimento senza sostituzione della versione pronta;
- isolamento tra aule;
- base64 non valido;
- limiti di byte e metadati;
- limite versioni;
- estrazione HTML;
- JSON deterministico;
- UTF-8;
- chunking deterministico e sovrapposto;
- ricerca, filtro e paginazione;
- persistenza dopo riapertura;
- API e redazione degli errori;
- cronologia importazioni redatta;
- precedenza dell'isolamento dell'aula sul limite versioni.

La suite cumulativa completa dei checkpoint precedenti non è stata rilanciata. GitHub Actions non è stato eseguito. Il JavaScript della nuova vista è stato verificato sintatticamente con Node, ma la verifica visuale completa nel browser resta da eseguire.

## Limiti attuali

- nessun provider AI esterno;
- nessuna chiave API;
- tokenizer ufficiale assente;
- nessun circuit breaker o coda distribuita;
- nessun PDF parser;
- nessun parser Office;
- nessun OCR;
- nessuna trascrizione audio o video;
- nessun embedding;
- nessun indice vettoriale;
- nessuna ricerca semantica;
- nessuna generazione RAG collegata alla chat;
- nessun Supabase;
- nessuna autenticazione amministrativa;
- nessuna memoria didattica persistente;
- nessuna scrittura nell'app ufficiale.

## Regola di sicurezza

Il modello può produrre una risposta. Identità, contesto, permessi, profili, budget, retry, fallback, transizioni, persistenza, valutazioni, materiali, checksum, deduplicazione, limiti, redazione, memoria e azioni devono essere verificati da codice server indipendente dal modello.
