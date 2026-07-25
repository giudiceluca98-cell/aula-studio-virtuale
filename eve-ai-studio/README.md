# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.4.0`

Checkpoint implementati:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — separazione dei moduli e importatore strutturato del piano approfondito;
- `0.3` — persistenza SQLite, cronologia importazioni, versioni, confronto e rollback;
- `0.4` — prompt versionati, modalità didattiche e ciclo bozza–revisione–pubblicazione.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # astrazione e provider mock
│   ├── requirements/         # piano, storage, versioni, confronto e rollback
│   ├── prompts/              # prompt, modalità, workflow, storage e API
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

Il Checkpoint 0.4 introduce un secondo archivio SQLite separato:

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

Transizioni aggiuntive controllate:

```text
in_review → draft
publishable → draft
```

Regole:

- una bozza non può essere pubblicata direttamente;
- `publishable` richiede `review_tests_passed=true`;
- una sola versione pubblicata può essere attiva per configurazione;
- pubblicando una nuova versione, la precedente attiva viene archiviata;
- il rollback copia una versione storica in una nuova bozza;
- il rollback non elimina né riscrive lo storico.

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

## Test del Checkpoint 0.4

Eseguiti localmente sul nuovo modulo prompt e sulle sue API:

```text
15 passed
```

Coprono:

- migrazione SQLite;
- configurazione iniziale pubblicata;
- creazione delle bozze;
- conflitti sulle chiavi;
- revisioni immutabili;
- transizioni consentite e vietate;
- obbligo dei test prima della pubblicabilità;
- archiviazione automatica della versione attiva precedente;
- confronto dei campi;
- rollback non distruttivo;
- persistenza dopo riapertura;
- errori per versioni inesistenti;
- API di creazione, elenco, dettaglio, confronto e rollback.

La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata in questo passaggio; il numero `15` non deve essere sommato automaticamente ai risultati precedenti.

## Limiti attuali

Non sono ancora implementati:

- modello AI reale;
- RAG e indicizzazione dei materiali;
- Supabase;
- autenticazione amministrativa;
- memoria didattica;
- voce;
- strumenti che modificano l'app;
- pubblicazione nell'app ufficiale.

L'avatar animato definitivo verrà integrato dopo la consegna e l'approvazione degli asset prodotti esternamente.

## Regola di sicurezza

Il modello può proporre un risultato. Identità, contesto, permessi, transizioni, persistenza, memoria e azioni devono essere verificati da codice server indipendente dal modello.
