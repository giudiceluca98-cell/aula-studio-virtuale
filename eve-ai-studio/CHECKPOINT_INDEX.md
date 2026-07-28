# Eve AI Studio — Indice ufficiale dei checkpoint

## Separazione delle roadmap

Eve AI Studio usa due linee di sviluppo indipendenti:

- `CORE` — piattaforma tecnica già sviluppata: sicurezza, requisiti, prompt, valutazioni, provider, materiali, retrieval, RAG e apertura delle fonti;
- `INTELLIGENCE` — nuova evoluzione di Eve: ricerca online, acquisizione controllata, memoria, apprendimento e capacità AI.

La linea `CORE` è attualmente **in pausa dopo CORE-1.1**. La linea `INTELLIGENCE` è **pianificata ma non ancora iniziata**.

## Convenzione obbligatoria dei nomi

Ogni documento di checkpoint deve usare il formato:

```text
CHECKPOINT_<LINEA>_<VERSIONE>_<PAROLE_CHIAVE>_<TIPO_FILE>.<estensione>
```

Tipi di file:

- `PLAN` — obiettivo, perimetro e criteri prima dello sviluppo;
- `UPDATE` — riepilogo trasferibile del lavoro svolto;
- `VERIFICATION` — controlli tecnici e browser;
- `CI_RESULT` — risultato automatico;
- `CLOSURE` — approvazione e chiusura definitiva.

Le due linee hanno numerazione indipendente. Non è più ammesso indicare soltanto `Checkpoint 1.2` senza specificare la linea e le parole chiave.

## Linea CORE — piattaforma tecnica storica

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
| `CORE-1.1` | Apertura fonti, verifica integrità | tecnicamente completo; chiusura utente da registrare |

Un eventuale prossimo checkpoint di questa linea continuerà da:

```text
CORE-1.2_<PAROLE_CHIAVE_DA_DEFINIRE>
```

Non esiste ancora un `CORE-1.2` approvato o avviato.

## Linea INTELLIGENCE — nuova AI interna ad Aula Studio

| ID | Parole chiave ufficiali | Obiettivo |
|---|---|---|
| `INTELLIGENCE-0.1` | Centro ricerca, progetti apprendimento | creare ricerche, obiettivi, query, avanzamento e catalogo fonti |
| `INTELLIGENCE-0.2` | Acquisizione web controllata, quarantena fonti | cercare online, acquisire contenuti e isolarli prima dell'apprendimento |
| `INTELLIGENCE-0.3` | Affidabilità fonti, conflitti, revisione | valutare qualità, confrontare affermazioni e richiedere approvazione |
| `INTELLIGENCE-0.4` | Memoria semantica, embedding, retrieval ibrido | costruire conoscenza persistente e ricerca per significato |
| `INTELLIGENCE-0.5` | Provider AI reale, generazione citata | collegare modelli reali mantenendo fonti, limiti e tracciabilità |
| `INTELLIGENCE-0.6` | Apprendimento didattico, scrittura, personalizzazione | apprendere come spiegare, scrivere, esercitare e adattarsi al livello |
| `INTELLIGENCE-0.7` | Aggiornamento continuo, manutenzione conoscenza | ricontrollare fonti, versionare e ritirare informazioni superate |

Il primo documento della nuova linea dovrà chiamarsi:

```text
CHECKPOINT_INTELLIGENCE_0.1_CENTRO_RICERCA_PROGETTI_APPRENDIMENTO_PLAN.md
```

## Regole permanenti

1. Un checkpoint `CORE` non include ricerca autonoma o apprendimento web.
2. Un checkpoint `INTELLIGENCE` può riutilizzare servizi CORE approvati, senza riscriverne la cronologia.
3. Ogni nuovo checkpoint nasce con un file `PLAN` prima di qualsiasi codice.
4. Ogni commit, rapporto e documento deve indicare linea, versione e parole chiave.
5. I file storici mantengono il loro contenuto; il nuovo nome serve a renderli immediatamente ricercabili.
