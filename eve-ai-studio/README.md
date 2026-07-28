# Eve AI Studio — Fondazione modulare

Servizio isolato di Eve sviluppato sul branch `eve-ai-studio`, senza modificare `main`, `demo-canonica`, l’HTML canonico o l’app pubblica.

## Due roadmap indipendenti

- **`CORE`** — piattaforma tecnica: sicurezza, requisiti, prompt, valutazioni, provider, materiali, retrieval, RAG e apertura delle fonti;
- **`INTELLIGENCE`** — ricerca online controllata, memoria, apprendimento, scrittura e capacità AI.

Indice ufficiale:

```text
eve-ai-studio/CHECKPOINT_INDEX.md
```

La linea `CORE` è chiusa e in pausa dopo `CORE-1.1`. La linea `INTELLIGENCE` è attiva su `INTELLIGENCE-0.1`.

## Stato del servizio

```text
Versione: 1.2.0
Branch: eve-ai-studio
CORE: CORE-1.1 chiuso e approvato
INTELLIGENCE: INTELLIGENCE-0.1 implementato, verifica in corso
Suite CORE precedente: 165 test superati
Test specifici INTELLIGENCE-0.1: 15
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
| `CORE-1.1` | Apertura fonti, verifica integrità | chiuso e approvato |

## INTELLIGENCE-0.1 — Centro ricerca e progetti di apprendimento

Il checkpoint aggiunge:

- package `app/intelligence` separato;
- database `data/eve-research.sqlite3`;
- progetti isolati per `room_id`;
- obiettivi, domini, lingue, livelli e argomenti;
- stati e cronologia delle transizioni;
- query pianificate;
- catalogo di URL e metadati;
- fonti in quarantena con `content_acquired=false`;
- revisione umana predefinita;
- API `/v1/intelligence/research`;
- sezione “Ricerca e apprendimento” nella preview.

In questo checkpoint sono esplicitamente disattivati:

```text
web_search_enabled=false
content_acquisition_enabled=false
model_training_enabled=false
```

La ricerca online reale appartiene a `INTELLIGENCE-0.2`.

## Avvio locale

```bash
cd eve-ai-studio
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Anteprima ufficiale

```text
reference/eve-ai-studio-preview/index.html
reference/eve-ai-studio-preview/EVE_AI_STUDIO_STANDALONE.html
```

## Protezioni

Non modificati:

- `main`;
- `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- app ufficiale;
- `eve-canonical-integration-v2`;
- pacchetto master Eve Animation Library 1.2.2.

Non eseguiti nel checkpoint `INTELLIGENCE-0.1`:

- ricerca web reale;
- provider AI esterni;
- embedding;
- addestramento del modello;
- pull request;
- merge;
- integrazione nella produzione.
