# Eve AI Studio — Stato delle roadmap

## Stato corrente

```text
Branch operativo: eve-ai-studio
Versione servizio: 1.2.0
Linea CORE: chiusa e in pausa dopo CORE-1.1
Linea INTELLIGENCE: INTELLIGENCE-0.1 implementato, verifica automatica in corso
```

Indice ufficiale:

```text
eve-ai-studio/CHECKPOINT_INDEX.md
```

## Regola fondamentale

- `CORE` continua la piattaforma tecnica esistente;
- `INTELLIGENCE` sviluppa ricerca online, memoria, apprendimento e capacità AI;
- le due numerazioni sono indipendenti;
- ogni checkpoint usa linea, versione e parole chiave.

## Roadmap CORE

| ID | Parole chiave | Stato |
|---|---|---|
| `CORE-0.1` | Fondazione FastAPI, sicurezza, permessi e audit | completato |
| `CORE-0.2` | Modularità e importazione requisiti | completato |
| `CORE-0.3` | Persistenza, versioni e rollback requisiti | completato |
| `CORE-0.4` | Prompt versionati e approvazione | completato |
| `CORE-0.5` | Valutazioni, grader e gate qualità | completato |
| `CORE-0.6` | Runner automatico e artefatti | completato |
| `CORE-0.7` | Provider, orchestrazione e telemetria | completato |
| `CORE-0.8` | Materiali, estrazione e chunking | chiuso e approvato |
| `CORE-0.9` | Retrieval locale e citazioni | chiuso e approvato |
| `CORE-1.0` | Chat RAG grounded e fonti | chiuso e approvato |
| `CORE-1.1` | Apertura fonti e verifica integrità | chiuso e approvato |

Chiusura:

```text
eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.1_APERTURA_FONTI_VERIFICA_INTEGRITA_CLOSURE.md
```

Non esiste un piano `CORE-1.2`.

## Roadmap INTELLIGENCE

### `INTELLIGENCE-0.1` — Centro ricerca e progetti di apprendimento

Stato: **implementato; verifica automatica in corso**

Implementato:

- package `app/intelligence`;
- database SQLite separato;
- progetti isolati per aula;
- obiettivi, domini, lingue, livelli e argomenti;
- stati `draft`, `active`, `paused`, `completed`, `archived`;
- cronologia delle transizioni;
- query pianificate;
- fonti candidate in quarantena;
- URL limitati a HTTP/HTTPS senza credenziali incorporate;
- limiti per progetto, query e fonti;
- API dedicate;
- sezione della preview ufficiale;
- 15 test specifici.

Confini obbligatori:

```text
web_search_enabled=false
content_acquisition_enabled=false
model_training_enabled=false
human_review_required_by_default=true
```

Documenti:

```text
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.1_CENTRO_RICERCA_PROGETTI_APPRENDIMENTO_PLAN.md
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.1_CENTRO_RICERCA_PROGETTI_APPRENDIMENTO_UPDATE.txt
```

### `INTELLIGENCE-0.2` — Acquisizione web controllata e quarantena fonti

Stato: **pianificato, non iniziato**

Introdurrà ricerca e acquisizione web soltanto dopo la chiusura tecnica di `INTELLIGENCE-0.1`.

### `INTELLIGENCE-0.3` — Affidabilità fonti, conflitti e revisione

Stato: **pianificato**

### `INTELLIGENCE-0.4` — Memoria semantica, embedding e retrieval ibrido

Stato: **pianificato**

### `INTELLIGENCE-0.5` — Provider AI reale e generazione citata

Stato: **pianificato**

### `INTELLIGENCE-0.6` — Apprendimento didattico, scrittura e personalizzazione

Stato: **pianificato**

### `INTELLIGENCE-0.7` — Aggiornamento continuo e manutenzione conoscenza

Stato: **pianificato**

## API INTELLIGENCE-0.1

```http
GET  /v1/intelligence/research/status
POST /v1/intelligence/research/projects
GET  /v1/intelligence/research/projects
GET  /v1/intelligence/research/projects/{project_id}
POST /v1/intelligence/research/projects/{project_id}/transition
POST /v1/intelligence/research/projects/{project_id}/queries
GET  /v1/intelligence/research/projects/{project_id}/queries
POST /v1/intelligence/research/projects/{project_id}/sources
GET  /v1/intelligence/research/projects/{project_id}/sources
GET  /v1/intelligence/research/projects/{project_id}/events
```

## Protezioni rispettate

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
- integrazione nella produzione;
- ricerca web reale;
- provider AI reale;
- embedding;
- addestramento del modello.
