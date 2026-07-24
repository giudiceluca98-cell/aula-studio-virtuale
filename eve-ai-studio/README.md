# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.3.0`

Checkpoint implementati:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — separazione dei moduli e importatore strutturato del piano approfondito;
- `0.3` — persistenza SQLite, cronologia importazioni, versioni, confronto e rollback.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # astrazione e provider mock
│   ├── requirements/         # parser, routing, storage, registro, CLI e modelli
│   ├── main.py               # API FastAPI
│   └── models.py             # contratti chat condivisi
├── data/
│   └── requirements-import-manifest.json
├── tests/
├── checkpoints/
├── .env.example
├── PHASE_STATUS.md
└── pyproject.toml
```

## Catalogo requisiti persistente

Il catalogo non vive più soltanto in memoria. Il Checkpoint 0.3 usa SQLite e mantiene:

- tentativi di importazione riusciti, invariati o falliti;
- snapshot immutabili delle versioni;
- sezioni e schede associate a ogni versione;
- versione attiva;
- eventi di attivazione e rollback;
- hash della sorgente e del catalogo strutturato.

Percorso predefinito:

```text
data/eve-requirements.sqlite3
```

È configurabile tramite `EVE_REQUIREMENTS_DB_PATH`. Il database locale, i file WAL e SHM sono esclusi da Git.

### Migrazioni

Lo storage applica automaticamente le migrazioni tramite `PRAGMA user_version`. La versione schema corrente è `1`. Il servizio rifiuta un database creato da una versione schema più nuova del software.

## Versionamento

Ogni importazione valida produce uno snapshot completo, salvo quando il catalogo risultante è identico a una versione già esistente.

In quel caso:

- l'importazione viene registrata;
- lo stato è `unchanged`;
- non viene duplicata una versione;
- la versione equivalente può essere riattivata.

Sono supportate importazioni `replace` e `merge`.

## Confronto e rollback

Il confronto tra due versioni restituisce:

- schede aggiunte;
- schede rimosse;
- schede modificate;
- schede invariate;
- campi modificati per ogni scheda cambiata.

Il rollback cambia soltanto la versione attiva. Gli snapshot successivi non vengono eliminati e possono essere riattivati.

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
```

Esempio importazione:

```json
{
  "text": "...plaintext completo...",
  "expected_sections": 36,
  "expected_cards": 1197,
  "replace": true,
  "label": "Piano ufficiale",
  "note": "Importazione verificata"
}
```

Esempio confronto:

```http
GET /v1/requirements/compare?from_version_id=1&to_version_id=2
```

Esempio rollback:

```json
{
  "version_id": 1,
  "note": "Ripristino dopo revisione"
}
```

## Verifica del plaintext ufficiale

```text
36 sezioni
1.197 schede
0 avvisi
SHA-256 sorgente: da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313
SHA-256 catalogo: 886e2cd4146431da68a0bb7c86975cc7900ca863370eea29d8bad9ec4555ed9f
```

Una seconda importazione identica è stata riconosciuta come `unchanged` e non ha creato una versione duplicata.

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

## Test

```bash
pytest
```

Risultato del Checkpoint 0.3:

```text
15 passed
```

Sono verificati parser, provider mock, limiti, permessi, migrazione SQLite, persistenza tra riavvii, cronologia, confronto, riuso delle versioni identiche, errori e rollback.

## Limiti attuali

Non sono ancora implementati:

- modello AI reale;
- RAG e indicizzazione dei materiali didattici;
- Supabase;
- autenticazione dell'interfaccia amministrativa;
- memoria didattica;
- voce;
- strumenti di scrittura nell'app;
- integrazione con l'app ufficiale.

## Regola di sicurezza

Il modello può proporre un risultato. Identità, contesto, permessi, persistenza, limiti, memoria e azioni devono essere verificati da codice server indipendente dal modello.
