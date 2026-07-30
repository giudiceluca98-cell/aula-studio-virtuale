# Eve AI Studio — Indice ufficiale dei checkpoint

## Separazione delle roadmap

Eve AI Studio usa due linee di sviluppo indipendenti:

- `CORE` — piattaforma tecnica: sicurezza, requisiti, prompt, valutazioni, provider, materiali, retrieval, RAG e apertura delle fonti;
- `INTELLIGENCE` — ricerca online, acquisizione controllata, revisione, qualità del corpus e capacità AI.

La linea `CORE` è chiusa e in pausa dopo `CORE-1.1`.
La linea `INTELLIGENCE` ha chiuso e approvato `INTELLIGENCE-0.3`.

## Convenzione obbligatoria dei nomi

Ogni documento di checkpoint usa il formato:

```text
CHECKPOINT_<LINEA>_<VERSIONE>_<PAROLE_CHIAVE>_<TIPO_FILE>.<estensione>
```

Tipi di file:

- `PLAN` — obiettivo, perimetro e criteri prima dello sviluppo;
- `UPDATE` — riepilogo trasferibile del lavoro svolto;
- `VERIFICATION` — controlli tecnici e browser;
- `CI_RESULT` — risultato automatico;
- `CLOSURE` — approvazione e chiusura definitiva.

Le due linee hanno numerazione indipendente.

## Linea CORE

| ID | Parole chiave ufficiali | Stato |
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
| `CORE-1.2` | Architettura unificata e adapter dei prototipi | pianificato; bloccato fino al Gate C |

## Linea INTELLIGENCE

| ID | Parole chiave ufficiali | Stato/obiettivo |
|---|---|---|
| `INTELLIGENCE-0.1` | Centro ricerca, progetti apprendimento | chiuso e approvato |
| `INTELLIGENCE-0.2` | Acquisizione web controllata, quarantena fonti | chiuso e approvato; release installata `1.2.0-alpha.6` |
| `INTELLIGENCE-0.3` | Revisione umana, qualità, promozione controllata | chiuso e approvato; release `1.2.0-alpha.7` |
| `INTELLIGENCE-0.4` | Ricerca web, pianificazione query | pianificato; sbloccato dal Gate C |
| `INTELLIGENCE-0.5` | Ingestione documentale avanzata, crawling limitato | pianificato |
| `INTELLIGENCE-0.6` | Embedding, indice vettoriale, retrieval ibrido | pianificato |
| `INTELLIGENCE-0.7` | Freschezza, contraddizioni, salute fonti | pianificato |

## Documenti del checkpoint attivo

```text
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_PLAN.md
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_UPDATE.txt
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_VERIFICATION.md
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_CI_RESULT.md
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_HANDOFF.md
eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_REVISIONE_UMANA_QUALITA_PROMOZIONE_CONTROLLATA_CLOSURE.md
```

La `CLOSURE` definitiva è stata approvata dopo il collaudo desktop dell'utente.

## Regole permanenti

1. Un checkpoint `CORE` non viene salvato come `INTELLIGENCE` e viceversa.
2. Un checkpoint `INTELLIGENCE` può riutilizzare servizi CORE approvati senza riscriverne la cronologia.
3. Ogni nuovo checkpoint nasce con un `PLAN` prima del codice.
4. Ogni rapporto indica linea, versione e parole chiave.
5. La preview canonica resta in `reference/eve-ai-studio-preview/` con un solo `index.html`.
6. Nessun checkpoint viene dichiarato chiuso soltanto perché appare nell'interfaccia.
