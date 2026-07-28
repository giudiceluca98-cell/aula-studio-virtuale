# Coordinamento Codex

Questo file registra incarichi temporanei, proprietà dei file e dipendenze tra agenti. Gli agenti sono generalisti e possono passare a un'altra materia o funzione dopo la chiusura dell'attività corrente.

## Eve AI Studio — regole attive

La procedura completa e vincolante è in `docs/EVE_AI_STUDIO_COORDINATION.md`.

Fonte unica:

```text
branch: eve-ai-studio
cartella: reference/eve-ai-studio-preview/
ingresso: reference/eve-ai-studio-preview/index.html
```

Non creare demo alternative, copie HTML, standalone, cartelle preview o sorgenti duplicate. Il flusso sullo stesso checkpoint è sequenziale: Codex funzionale, `READY_FOR_HANDOFF`, approvazione e merge, poi Codex grafico/desktop.

Stati ammessi per Eve AI Studio: `RESERVED`, `IN_PROGRESS`, `FUNCTIONAL_TESTING`, `READY_FOR_HANDOFF`, `UI_INTEGRATION`, `REVIEW_REQUIRED`, `RELEASE_READY`.

### GOVERNANCE-0.1 — Sorgente canonica, coordinamento e handoff

```text
CHECKPOINT:
GOVERNANCE-0.1 — Sorgente canonica, coordinamento e handoff

RESPONSABILE:
Codex coordinamento

STATO:
REVIEW_REQUIRED

BRANCH DI PARTENZA:
origin/eve-ai-studio @ 13b8822

BRANCH DI LAVORO:
codex/eve-ai-studio-coordination-policy

OBIETTIVO:
Rendere operative nel repository le regole che impediscono duplicati e
coordinano in sequenza il Codex funzionale e il Codex grafico/desktop.

FILE PRENOTATI:
- AGENTS.md
- CODEX_COORDINATION.md
- docs/EVE_AI_STUDIO_COORDINATION.md
- .codex/tasks/active/eve-ai-studio-coordination-policy.md

FILE CONDIVISI PRENOTATI:
- CODEX_COORDINATION.md, limitatamente alla nuova sezione Eve AI Studio

MODULI CANONICI MODIFICATI:
- nessuno

ULTIMO COMMIT:
fda7361

PULL REQUEST:
https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/75

DISPONIBILE PER L'ALTRO CODEX:
SÌ per lettura e applicazione della procedura; NO per modificare i file
prenotati fino alla revisione della Pull Request.

ATTIVITÀ CONSENTITE ALL'ALTRO CODEX:
- continuare esclusivamente sui file già prenotati e dichiarati;
- leggere la nuova procedura quando pubblicata.

ATTIVITÀ VIETATE ALL'ALTRO CODEX:
- creare nuove demo o standalone;
- modificare i file prenotati da questa attività;
- iniziare un'integrazione UI senza READY_FOR_HANDOFF.

NOTE:
Questa attività non modifica la sorgente canonica, il backend, main,
demo-canonica, Aula Studio, desktop o produzione.
```

### Stato del checkpoint INTELLIGENCE-0.2

Il codice funzionale di `INTELLIGENCE-0.2 — Acquisizione web controllata e quarantena fonti` risulta già presente sul branch canonico, ma non è ancora registrato un handoff conforme alla procedura nuova. Di conseguenza:

- lo stato coordinativo è `FUNCTIONAL_TESTING`;
- non è disponibile per interventi grafici o desktop;
- il Codex funzionale deve pubblicare commit congelato, Pull Request o riferimento equivalente, file congelati, test e documento `CHECKPOINT_INTELLIGENCE_0.2_ACQUISIZIONE_WEB_CONTROLLATA_QUARANTENA_FONTI_HANDOFF.md`;
- soltanto dopo lo stato esplicito `READY_FOR_HANDOFF` può iniziare un branch `codex/eve-ai-studio-intelligence-0-2-ui-integration`.

I documenti storici che richiedono una preview standalone sono superati: la verifica deve usare esclusivamente la sorgente modulare canonica.

### DESKTOP-0.1 — Applicazione installabile e aggiornamenti

```text
CHECKPOINT:
DESKTOP-0.1 — Applicazione installabile e aggiornamenti

RESPONSABILE:
Codex grafico/desktop

STATO:
RELEASE_READY

BRANCH DI PARTENZA:
codex/eve-ai-studio-coordination-policy @ 238f721
(contenuti applicativi allineati a origin/eve-ai-studio @ 13b8822)

BRANCH DI LAVORO:
codex/eve-ai-studio-desktop-installable

OBIETTIVO:
Generare l'app Windows installabile direttamente dalla sorgente canonica,
con finestra nativa, aggiornamenti firmati via GitHub Release e preservazione
dei dati locali compatibili.

FILE PRENOTATI:
- .github/workflows/release-eve-ai-studio-desktop.yml
- eve-desktop/**
- .codex/tasks/active/eve-ai-studio-desktop-installable.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- nessuno dei file condivisi della sorgente canonica

MODULI CANONICI MODIFICATI:
- nessuno

ULTIMO COMMIT:
0a1527d

DISPONIBILE PER L'ALTRO CODEX:
NO, fino al completamento dei test desktop.

ATTIVITÀ CONSENTITE ALL'ALTRO CODEX:
- continuare il checkpoint funzionale sui file già dichiarati;
- non intervenire sull'infrastruttura desktop prenotata.

ATTIVITÀ VIETATE ALL'ALTRO CODEX:
- creare una seconda sorgente desktop;
- creare standalone o copie HTML committate;
- modificare i file prenotati da DESKTOP-0.1.

NOTE:
La directory frontend generata durante la build è ignorata da Git e deriva
ogni volta da reference/eve-ai-studio-preview/. Non è una fonte modificabile.
Il checkpoint non modifica main, demo-canonica, Aula Studio o produzione.
Build frontend, provenienza canonica, 64 asset, sintassi JavaScript, versioni
e manifest Cargo verificati localmente. La compilazione NSIS deve essere
completata dal workflow Windows perché l'ambiente locale non dispone dei
Build Tools MSVC e non consente l'esecuzione di rustc.
```

### DESKTOP-0.1-CI — Correzione compilazione installer

```text
CHECKPOINT:
DESKTOP-0.1-CI — Correzione compilazione installer

RESPONSABILE:
Codex grafico/desktop

STATO:
RELEASE_READY

BRANCH DI PARTENZA:
origin/eve-ai-studio @ 11acd27

BRANCH DI LAVORO:
codex/eve-ai-studio-desktop-serde-fix

OBIETTIVO:
Correggere esclusivamente l'errore E0433 della build Windows aggiungendo
la dipendenza Rust richiesta dal macro tauri::generate_context!.

FILE PRENOTATI:
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- .codex/tasks/active/eve-ai-studio-desktop-installable.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- nessuno

MODULI CANONICI MODIFICATI:
- nessuno

DISPONIBILE PER L'ALTRO CODEX:
SÌ, esclusi i file prenotati sopra fino alla conclusione della build.

NOTE:
Non vengono modificati la sorgente canonica, main, demo-canonica, Aula Studio
o produzione. Non vengono create demo, standalone o sorgenti duplicate.
Build frontend, coerenza versione, metadata Cargo e diff verificati localmente.
La compilazione completa resta affidata al runner Windows di GitHub Actions.
```

### DESKTOP-0.1-RELEASE — Token dedicato repository installer

```text
CHECKPOINT:
DESKTOP-0.1-RELEASE — Token dedicato repository installer

RESPONSABILE:
Codex grafico/desktop

STATO:
RELEASE_READY

BRANCH DI PARTENZA:
origin/eve-ai-studio @ 890a8fe

BRANCH DI LAVORO:
codex/eve-ai-studio-desktop-release-token

OBIETTIVO:
Collegare il workflow desktop al segreto separato EVE_RELEASE_TOKEN per
pubblicare gli installer nel repository eve-ai-studio-releases.

FILE PRENOTATI:
- .github/workflows/release-eve-ai-studio-desktop.yml
- .codex/tasks/active/eve-ai-studio-desktop-installable.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- nessuno

MODULI CANONICI MODIFICATI:
- nessuno

DISPONIBILE PER L'ALTRO CODEX:
SÌ, esclusi i file prenotati sopra fino alla verifica della release.

NOTE:
Il valore del segreto non è presente nel repository o nei log. Non vengono
modificati la sorgente canonica, main, demo-canonica, Aula Studio o produzione.
Release verificata dal workflow 30373628931. Pubblicati installer NSIS,
firma e latest.json per la versione 1.2.0-alpha.1 nel repository dedicato.
```

## Attività storiche di Aula Studio

La tabella seguente è conservata come cronologia del precedente flusso di Aula Studio. Non assegna né prenota file di Eve AI Studio e non prevale sulle regole attive sopra.

## Attività

| Attività | Assegnazione prevista | Branch | Stato | File riservati | File condivisi richiesti | Pull request | Ultimo aggiornamento |
|---|---|---|---|---|---|---|---|
| Correzione pubblicazione checkpoint 1.4 autonomo | Codex | `agent/phase4-publisher-fix` | In corso | `scripts/apply-phase4-alpha1.py`, scheda attività | `CODEX_COORDINATION.md` | Da aprire verso `demo-canonica` | 2026-07-23 |
| Logo circolare ufficiale dell'app | Codex | `agent/app-round-logo` | In revisione | asset logo, componente brand, metadati, presentazione, autenticazione, dashboard e test | `src/components/catalog/catalog-explorer.tsx`, `src/components/room/study-room.tsx` | [PR #60](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/60) | 2026-07-22 |
| Fedeltà pannello Eve e area di lavoro alla demo ufficiale | Codex | `agent/eve-panel-reference-fidelity` | In revisione | `globals.css`, workspace lezione, Eve Voice e test | nessuno | [PR #57](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/57) · confronto visivo completato; controlli superati | 2026-07-22 |
| Completamento fedele demo e parità tra temi | Codex | `agent/complete-demo-layout` | Completato | intro completa, workspace lezione, Eve, centro messaggi, CSS e test | nessuno | Intro demo, layout condiviso, Eve Voice completa e chat flottanti verificati; pronto per pubblicazione | 2026-07-22 |
| Tema Futuristica Focus e aggiornamenti master | Codex | `agent/futuristic-focus-theme` | In revisione | temi, CSS, impostazioni, centro messaggi, Eve lezione/esercizi, migrazione 0017 e test | `src/components/room/study-room.tsx`, `programming-lesson-workspace.tsx`, `src/hooks/use-room-realtime.ts`, `src/lib/types.ts`, `supabase/migrations/0017_message_center.sql` | — | 2026-07-22 |
| Controlli di lettura e scorrimento dell’aula | Codex | `agent/lesson-reading-controls` | In revisione | `programming-lesson-workspace.tsx`, test dedicato | `src/components/room/study-room.tsx` | — | 2026-07-22 |
| Integrazione Modulo 1 · Lezioni 1.1 e 1.2 | Codex | `agent/integrate-programming-module-1` | In revisione | Artefatti 1.1/1.2, aggregatore, progressi e test | `src/lib/catalog/roadmap.ts` | [PR #29](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/29) | 2026-07-21 |
| Correzione e coerenza contenuti · Programmazione da zero | Codex | `agent/correct-programming-content` | Completato | Artefatti 0.1–0.9 interessati, aggregatore e test mirati | Nessuno | [PR #28](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/28) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.3 | Codex — contenuto ufficiale 0.3 convertito in codice | `codex/programming-zero-lesson-0-3` | Completato | Artefatto 0.3, aggregatore, progressi e test | Nessuno | [PR #4](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/4) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.4 | Codex — contenuto ufficiale 0.4 convertito in codice | `codex/programming-zero-lesson-0-4` | Completato | Artefatto 0.4, aggregatore, progressi e test | Nessuno | [PR #9](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/9) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.5 | Codex — artefatto ufficiale 0.5 da PR #11, integrazione sicura su `main` | `agent/python-project-lesson-0-4` | Completato | Artefatto 0.5, aggregatore, progressi e test | Nessuno | [PR #14](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/14) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.6 | Codex — artefatto ufficiale 0.6 da PR #12, integrazione sicura su `main` | `agent/integrate-programming-lesson-0-6` | Completato | Artefatto 0.6, aggregatore, progressi, area Python Project e test | Nessuno | [PR #19](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/19) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.7 | Codex — artefatto ufficiale 0.7 da PR #13, integrazione sicura su `main` | `agent/integrate-programming-lesson-0-7` | Completato | Artefatto 0.7, aggregatore, progressi e test Python Project | Nessuno | [PR #22](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/22) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.8 | Codex — artefatto ufficiale 0.8 da PR #15, integrazione sicura su `main` | `agent/integrate-programming-lesson-0-8` | Completato | Artefatto 0.8, aggregatore, progressi e test Python Project | Nessuno | [PR #24](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/24) | 2026-07-21 |
| Completamento Programmazione da zero · Lezione 0.9 | Codex — artefatto ufficiale 0.9 da PR #16, integrazione sicura su `main` | `agent/integrate-programming-lesson-0-9` | Completato | Artefatto 0.9, aggregatore, progressi e test Python Project | Nessuno | [PR #26](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/26) | 2026-07-21 |
| Suoneria chiamata in arrivo | Codex | `codex/incoming-call-ringtone` | Completato | `src/hooks/use-incoming-call-ringtone.ts`, `tests/incoming-call-ringtone.test.tsx` | `src/components/room/study-room.tsx` | [PR #5](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/5) | 2026-07-21 |
| Navigazione moduli e lezioni separate | Codex | `codex/lesson-module-navigation` | Completato | aggregatore, area di lavoro e test dedicati | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #6](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/6) | 2026-07-21 |
| Quiz interattivi dentro i capitoli | Codex | `codex/inline-chapter-quiz` | Completato | area di lavoro e test dedicati | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #7](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/7) | 2026-07-21 |
| Python Project guidati | Codex | `codex/guided-python-projects` | Completato | runner, aggregatore, progressi, area di lavoro, API e test | `src/components/room/programming-lesson-workspace.tsx` (area protetta) | [PR #8](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/8) | 2026-07-21 |
| Python Project Lezioni 0.4 e 0.5 | Codex | `agent/python-project-lesson-0-4` | Completato | aggregatore, progressi e test Python Project | `src/components/room/programming-lesson-workspace.tsx` (modifica minima al solo Python Project) | [PR #14](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/14) | 2026-07-21 |
| Matematica da zero | Qualunque Codex, non ancora assegnato | `codex/mathematics-zero` | Disponibile | Vedere scheda attività | Da dichiarare alla presa in carico | — | 2026-07-21 |

Stati ammessi: `Disponibile`, `In corso`, `In revisione`, `Bloccato`, `Completato`.

L'assegnazione è legata all'attività, non al computer. Dopo il merge, lo stesso Codex può prendere in carico un altro corso o una funzione diversa dell'app.

## File condivisi storici di Aula Studio

I seguenti percorsi hanno un impatto trasversale e devono essere prenotati esplicitamente prima dell'uso:

```text
src/lib/catalog/roadmap.ts
src/lib/catalog/search.ts
src/lib/catalog/subjects/index.ts
src/lib/catalog/subjects/registry.ts
src/components/catalog/catalog-explorer.tsx
src/components/room/study-room.tsx
src/app/api/catalog/search/route.ts
src/app/api/catalog/path/route.ts
src/app/api/catalog/action/route.ts
supabase/migrations/*
package.json
pnpm-lock.yaml
```

Regole:

1. Due agenti non modificano contemporaneamente lo stesso file condiviso.
2. Il responsabile di un'attività può effettuare anche l'integrazione end-to-end nei file condivisi necessari, dopo averli dichiarati nella propria scheda e in questa tabella.
3. Una Draft Pull Request attiva che modifica un file condiviso lo riserva fino al merge, alla chiusura o a un accordo registrato qui.
4. Se un file è già prenotato, l'altro agente continua sui file non in conflitto oppure apre una successiva attività di integrazione.
5. Le funzioni già operative dell'area di lavoro non devono essere riprogettate durante un'attività editoriale, salvo richiesta esplicita.

## Procedura storica di presa in carico Aula Studio

1. Scegliere un'attività con stato `Disponibile` in `.codex/tasks/active/`.
2. Aggiornare la scheda con agente, branch, stato, file riservati e file condivisi indispensabili.
3. Aggiornare questa tabella nello stesso branch.
4. Pubblicare il branch e aprire una Draft Pull Request all'inizio del lavoro.
5. Sviluppare e integrare l'attività soltanto nel perimetro dichiarato.
6. Al completamento spostare la scheda in `.codex/tasks/completed/` e aggiornare questa tabella.
7. Dopo il merge, l'agente torna libero e può prendere in carico qualsiasi altra attività disponibile.

## Fonte di verità

Gli agenti non condividono automaticamente conversazioni o modifiche non committate. La coordinazione avviene esclusivamente tramite questo file, i file dei compiti, branch pubblicati, commit e pull request.

