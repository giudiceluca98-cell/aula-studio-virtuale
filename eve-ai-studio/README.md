# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.5.0`

Checkpoint implementati:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — separazione dei moduli e importatore strutturato del piano approfondito;
- `0.3` — persistenza SQLite, cronologia importazioni, versioni, confronto e rollback;
- `0.4` — prompt versionati, modalità didattiche e ciclo bozza–revisione–pubblicazione;
- `0.5` — scenari di valutazione persistenti, esecuzioni, risultati per criterio e gate reale dei prompt.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # astrazione e provider mock
│   ├── requirements/         # piano, storage, versioni, confronto e rollback
│   ├── prompts/              # prompt, modalità, workflow, storage e API
│   ├── evaluations/          # scenari, run, risultati, punteggi e gate
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

Configurazione:

```text
EVE_PROMPTS_DB_PATH
```

Ogni configurazione dispone di:

- chiave stabile;
- numero progressivo di versione;
- prompt di sistema;
- modalità didattica;
- parametri tipizzati;
- checksum;
- versione genitore;
- stato;
- indicazione della versione attiva;
- data di pubblicazione;
- storico delle transizioni.

Le revisioni sono immutabili: una modifica crea una nuova versione e non sovrascrive la precedente.

## Stati dei prompt

```text
draft → in_review → publishable → published → archived
```

Ritorni consentiti:

```text
in_review → draft
publishable → draft
```

Regole:

- una bozza non può essere pubblicata direttamente;
- una sola versione pubblicata può essere attiva per configurazione;
- pubblicando una nuova versione, la precedente attiva viene archiviata;
- il rollback copia una versione storica in una nuova bozza;
- il rollback non elimina né riscrive lo storico;
- il passaggio a `publishable` usa il gate persistente del Checkpoint 0.5.

## Modalità didattiche

- `adaptive_explanation` — spiegazione adattiva;
- `socratic` — metodo socratico;
- `quiz` — quiz e interrogazione;
- `correction` — correzione guidata;
- `planning` — pianificazione dello studio.

Parametri tipizzati:

- tono;
- profondità da 1 a 4;
- politica delle fonti;
- politica della soluzione;
- domanda di controllo;
- politica della memoria;
- politica degli strumenti.

## Valutazioni persistenti

Il Checkpoint 0.5 introduce un terzo archivio SQLite:

```text
data/eve-evaluations.sqlite3
```

Configurazione:

```text
EVE_EVALUATIONS_DB_PATH
EVE_EVALUATION_PUBLISH_SCORE
```

Soglia predefinita:

```text
85/100
```

Il modulo mantiene:

- scenari di valutazione versionati;
- versione attiva di ogni scenario;
- severità `critical`, `major` e `minor`;
- peso e soglia minima;
- scenari obbligatori e opzionali;
- snapshot della suite usata da ogni esecuzione;
- esecuzioni collegate a una versione prompt;
- risultati separati per criterio;
- punteggio ponderato;
- numero di errori critici;
- numero di scenari obbligatori falliti;
- cronologia dei run;
- gate calcolato dal server.

## Suite iniziale

Sono creati otto scenari iniziali:

1. contesto didattico corretto;
2. fonti verificabili;
3. isolamento tra aule;
4. permessi delle azioni;
5. gestione dell'incertezza;
6. qualità didattica;
7. coerenza della lingua;
8. budget di latenza.

Il budget di latenza è opzionale. Un suo fallimento può non bloccare il gate quando punteggio, scenari obbligatori ed errori critici rispettano le regole.

## Gate di pubblicazione

Una versione prompt può diventare `publishable` soltanto quando l'ultima esecuzione completata:

- usa le versioni attualmente attive degli scenari;
- non contiene errori critici;
- non contiene fallimenti di scenari obbligatori;
- raggiunge la soglia ponderata configurata;
- risulta `passed`.

Il vecchio campo `review_tests_passed` non può forzare la pubblicabilità quando il gate persistente è collegato.

Quando uno scenario viene revisionato:

- la versione precedente resta nello storico;
- la nuova versione diventa attiva;
- le esecuzioni basate sulla suite precedente diventano obsolete;
- serve una nuova esecuzione.

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

## Test del Checkpoint 0.5

Eseguiti localmente sul nuovo modulo di valutazione, sulle API e sul collegamento con il gate prompt:

```text
18 passed
```

Coprono:

- schema SQLite;
- otto scenari iniziali;
- revisione versionata degli scenari;
- conflitti sulle chiavi;
- snapshot della suite;
- risultati per criterio;
- punteggio ponderato;
- errori critici;
- scenari obbligatori;
- fallimento opzionale non bloccante;
- copertura completa dei risultati;
- invalidazione quando cambia la suite;
- persistenza dopo riapertura;
- versione prompt inesistente;
- baseline idempotente;
- API di stato, scenari, run e gate;
- blocco o autorizzazione del passaggio a `publishable` tramite risultati persistiti.

La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata in questo passaggio; il numero `18` non deve essere sommato automaticamente ai risultati precedenti.

## Limiti attuali

Non sono ancora implementati:

- modello AI reale;
- esecuzione automatica dei test contro un provider AI;
- RAG e indicizzazione dei materiali;
- Supabase;
- autenticazione amministrativa;
- memoria didattica;
- voce;
- strumenti che modificano l'app;
- pubblicazione nell'app ufficiale.

L'avatar animato definitivo verrà integrato dopo la consegna e l'approvazione degli asset prodotti esternamente.

## Regola di sicurezza

Il modello può proporre un risultato. Identità, contesto, permessi, transizioni, persistenza, valutazioni, memoria e azioni devono essere verificati da codice server indipendente dal modello.
