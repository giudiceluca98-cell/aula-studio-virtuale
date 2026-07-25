# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.7.0`

Checkpoint implementati:

- `0.1` — FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — moduli separati e importatore delle 36 sezioni e 1.197 schede;
- `0.3` — persistenza, cronologia, versioni, confronto e rollback dei requisiti;
- `0.4` — prompt versionati, modalità didattiche e workflow di approvazione;
- `0.5` — scenari persistenti, risultati per criterio e gate reale dei prompt;
- `0.6` — runner deterministico, grader automatici e artefatti redatti;
- `0.7` — registro provider e modelli, profili, timeout, retry, fallback, token, costi e telemetria.

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

Il Checkpoint 0.7 introduce un catalogo server-side.

Provider registrati:

- `mock` — attivo e deterministico;
- `external-template` — disattivato e privo di credenziali.

Modelli registrati:

- `eve-foundation-mock-v2` — primario;
- `eve-foundation-mock-fallback-v1` — fallback;
- `external-model-placeholder` — disattivato.

Configurazione di sicurezza:

```text
EVE_EXTERNAL_PROVIDERS_ENABLED=false
```

Il solo cambio di questa variabile non abilita il segnaposto esterno: il provider e il modello devono essere implementati, registrati e abilitati esplicitamente.

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

## Orchestrazione

Prima della chiamata il server verifica:

- profilo esistente e attivo;
- compatibilità dello scopo;
- provider e modello registrati;
- autorizzazione dei provider esterni;
- budget token input;
- budget giornaliero;
- budget costi.

Durante la chiamata applica:

- timeout;
- retry controllati;
- backoff;
- fallback ordinato.

Dopo la risposta calcola:

- token input stimati;
- token output stimati;
- token totali;
- costo stimato;
- durata;
- hash della richiesta;
- hash della risposta;
- numero di tentativi;
- uso del fallback.

La stima token iniziale usa una funzione deterministica basata sulla dimensione della rappresentazione JSON. Non sostituisce ancora il tokenizer ufficiale di un modello reale.

## Telemetria provider

Database:

```text
data/eve-provider-telemetry.sqlite3
```

Schema: `1`

Tabella:

```text
provider_execution_events
```

Vengono conservati:

- data;
- scopo;
- profilo;
- provider;
- modello;
- stato;
- tentativi;
- fallback;
- durata;
- token stimati;
- costo stimato;
- hash richiesta e risposta;
- classe dell'errore.

Non vengono conservati:

- messaggio dell'utente;
- testo selezionato;
- risposta completa;
- contenuto completo dell'eccezione;
- chiavi dei provider.

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
```

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

## Test del Checkpoint 0.7

Eseguiti localmente sul nuovo catalogo provider, profili, telemetria, orchestrazione e API:

```text
28 passed in 0.43s
```

Coprono:

- provider mock e segnaposto esterno;
- modello primario e fallback;
- profili e profilo esterno disattivato;
- schema SQLite della telemetria;
- persistenza e aggregazione giornaliera;
- stima token;
- esecuzione riuscita;
- ManagedEveProvider;
- blocchi di budget;
- scopo del profilo;
- retry;
- timeout;
- fallback;
- redazione degli errori;
- budget giornaliero;
- API di stato, catalogo, modelli, profili e telemetria.

La suite cumulativa completa dei checkpoint precedenti non è stata rilanciata; i conteggi non devono essere sommati automaticamente.

## Limiti attuali

- nessun provider AI esterno è implementato;
- nessuna chiave API è configurata;
- la stima token non usa ancora il tokenizer ufficiale del modello;
- i costi dei modelli mock sono zero;
- non esistono ancora circuit breaker o code distribuite;
- non sono presenti RAG, Supabase, autenticazione amministrativa, memoria didattica, voce o strumenti di scrittura nell'app ufficiale;
- l'avatar animato definitivo verrà integrato dopo la consegna e l'approvazione degli asset prodotti esternamente.

## Regola di sicurezza

Il modello può produrre una risposta. Identità, contesto, permessi, profili, budget, retry, fallback, transizioni, persistenza, valutazioni, redazione, memoria e azioni devono essere verificati da codice server indipendente dal modello.
