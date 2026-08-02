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
CLOSED — collaudo desktop alpha.10 approvato dall'utente il 2026-08-02

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

`INTELLIGENCE-0.2 — Acquisizione web controllata e quarantena fonti` ha completato
implementazione funzionale, UI canonica, test specifici e cumulativi, verifica
browser e prova desktop. L'utente ha approvato esplicitamente integrazione e
pubblicazione desktop il 29 luglio 2026. Stato coordinativo: `RELEASE_READY`.

I documenti storici che richiedono una preview standalone sono superati: la verifica deve usare esclusivamente la sorgente modulare canonica.

#### Integrazione e release INTELLIGENCE-0.2

```text
RESPONSABILE:
Codex integrazione funzionale, UI e desktop

STATO:
RELEASE_READY

BRANCH LOCALE:
codex/eve-ai-studio-intelligence-0-2-functional

BASE:
origin/eve-ai-studio @ cc9153f

OBIETTIVO:
Applicare il pacchetto INTELLIGENCE-0.2 verificato e pubblicare l'aggiornamento
desktop firmato Windows NSIS 1.2.0-alpha.6.

FILE PRENOTATI:
Vedere .codex/tasks/active/eve-ai-studio-intelligence-0-2-local-installer.md.

VINCOLI:
Una sola PR e una sola release autorizzate dall'utente. Nessuna demo,
standalone, copia HTML, nuova preview o secondo updater. Main, demo-canonica,
Aula Studio, Supabase, Vercel e produzione restano invariati.

ESITO:
Funzionale, UI canonica, browser reale e desktop verificati. Release firmata
1.2.0-alpha.6 autorizzata e pronta per il workflow ufficiale.
```

### DESKTOP-0.1 — Applicazione installabile e aggiornamenti

### INTELLIGENCE-0.3 — Revisione umana, qualità e promozione controllata

```text
RESPONSABILE:
Codex integrazione funzionale, UI e desktop di prova

STATO:
CLOSED — approvato dall'utente il 2026-07-30

BRANCH:
codex/eve-ai-studio-intelligence-0-3

BASE:
origin/eve-ai-studio @ 72278e1

OBIETTIVO:
Integrare revisione umana attribuibile, controlli qualità, confronto versioni,
promozione esplicita e revoca. Pubblicare alpha.7 dal branch per il collaudo
senza merge preventivo nella canonica.

FILE PRENOTATI:
Tutti i file elencati in
.codex/tasks/active/eve-ai-studio-intelligence-0-3.md e nel manifest ufficiale
INTELLIGENCE-0.3.

FILE CONDIVISI PRENOTATI:
- reference/eve-ai-studio-preview/index.html
- CODEX_COORDINATION.md, limitatamente a questa sezione
- .github/workflows/release-eve-ai-studio-desktop.yml, soltanto se necessario
  per consentire la release di prova dal branch

VINCOLI:
Una sola Draft PR. Collaudo, approvazione utente e merge completati.
INTELLIGENCE-0.3 è `CLOSED`. Nessuna demo, standalone, copia HTML, nuova
preview, modifica a main, demo-canonica, Aula Studio, Supabase, Vercel o
produzione.
```

### CORE-1.2 — Architettura unificata features/eve e adapter prototipi

```text
RESPONSABILE:
Codex integrazione funzionale, UI e desktop di prova

STATO:
CLOSED

BRANCH:
codex/eve-ai-studio-core-1-2

BASE:
eve-ai-studio dopo merge PR #92 @ fbc7619

OBIETTIVO:
Integrare l'architettura modulare features/eve, la composizione server-side e
l'adapter esplicito dei prototipi FastAPI. Preparare alpha.8 per il collaudo
senza merge preventivo nella canonica.

FILE PRENOTATI:
Tutti i file elencati in
.codex/tasks/active/eve-ai-studio-core-1-2.md e nel manifest CORE-1.2.

FILE CONDIVISI PRENOTATI:
- reference/eve-ai-studio-preview/index.html
- CODEX_COORDINATION.md, limitatamente a questa sezione
- .github/workflows/release-eve-ai-studio-desktop.yml, soltanto se necessario
  per consentire la release di prova dal branch

VINCOLI:
EVE_CORE_INTEGRATION_ENABLED=false per impostazione predefinita. Token e URL
interni soltanto server-side. Una sola Draft PR, nessun merge o CLOSED prima
del collaudo desktop alpha.8 e dell'approvazione esplicita dell'utente.
```

#### DESKTOP-0.3 — Aggiornamento firmato da file locale

```text
CHECKPOINT:
DESKTOP-0.3 — Selezione locale di un aggiornamento ufficiale firmato

RESPONSABILE:
Codex desktop

STATO:
REVIEW_REQUIRED

BRANCH DI PARTENZA:
origin/eve-ai-studio @ 185c084

BRANCH DI LAVORO:
codex/eve-ai-studio-local-updates

OBIETTIVO:
Affiancare al controllo online la selezione dal computer dell'installer
ufficiale corrispondente alla release online, riutilizzando verifica firma e
installazione del solo updater Tauri esistente.

FILE PRENOTATI:
- eve-desktop/runtime/eve-desktop-updater.js
- eve-desktop/runtime/eve-desktop.css
- eve-desktop/src-tauri/src/lib.rs
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- eve-desktop/src-tauri/tauri.conf.json
- eve-desktop/src-tauri/capabilities/default.json
- eve-desktop/scripts/test-desktop-build.mjs
- eve-desktop/README.md
- .codex/tasks/active/eve-ai-studio-local-updates.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- nessuno

MODULI CANONICI MODIFICATI:
- nessuno

NOTE:
Nessuna demo, copia HTML, standalone o secondo updater. Main, demo-canonica,
Aula Studio, Vercel e produzione restano invariati. Nessun pacchetto locale
viene accettato senza una release online corrispondente e firma valida.

TEST:
node --check, test desktop, check:version, cargo check, build Tauri/NSIS,
verifica browser reale e avvio dell'eseguibile completati con successo.
```

Handoff operativo completo:
`docs/CHECKPOINT_DESKTOP_0.1_INSTALLER_RELEASE_HANDOFF.md`

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

### DESKTOP-0.2 — Fluidità, caricamento progressivo e updater

```text
CHECKPOINT:
DESKTOP-0.2 — Fluidità, caricamento progressivo e updater

RESPONSABILE:
Codex grafico/desktop

STATO:
COMPLETATO

BRANCH DI PARTENZA:
origin/eve-ai-studio @ b8ec526

BRANCH DI LAVORO:
codex/eve-ai-studio-desktop-performance

OBIETTIVO:
Correggere il canale alpha dell'updater e caricare logiche e grafica soltanto
quando la relativa sezione è effettivamente utilizzata.

FILE PRENOTATI:
- reference/eve-ai-studio-preview/index.html
- reference/eve-ai-studio-preview/particles.js
- reference/eve-ai-studio-preview/graphics-performance.js
- reference/eve-ai-studio-preview/animation-library-gallery.js
- reference/eve-ai-studio-preview/styles.css
- eventuale nuovo modulo lazy loader canonico
- .github/workflows/release-eve-ai-studio-desktop.yml
- eve-desktop/package.json
- eve-desktop/src-tauri/tauri.conf.json
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- test desktop strettamente necessari
- .codex/tasks/active/eve-ai-studio-desktop-performance.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- i cinque file canonici elencati sopra, per la durata del checkpoint

DISPONIBILE PER L'ALTRO CODEX:
NO sui file prenotati; SÌ sugli altri moduli già dichiarati dal suo checkpoint.

NOTE:
Nessuna demo o sorgente duplicata. Main, demo-canonica e Aula Studio restano
invariati. Grafica completa e funzioni esistenti restano disponibili.
Preparata la versione 1.2.0-alpha.2. Sintassi, coerenza versione, build desktop
e caricamento progressivo verificati localmente; nessun errore JavaScript
rilevato nell'apertura reale del laboratorio.
PR #82 unita in eve-ai-studio al commit b61d364. Workflow 30380270017
completato con successo; installer NSIS, firma e latest.json pubblicati nella
release eve-ai-studio-v1.2.0-alpha.2. Endpoint latest verificato con HTTP 200.
```

### REPOSITORY-0.1 — Riordino GitHub e workflow canonici

```text
CHECKPOINT:
REPOSITORY-0.1 — Riordino GitHub e workflow canonici

RESPONSABILE:
Codex coordinamento

STATO:
COMPLETATO

BRANCH:
codex/eve-ai-studio-repository-cleanup

OBIETTIVO:
Correggere workflow incoerenti con la preview modulare, archiviare attività
concluse, ripulire la PR #84 e rimuovere branch remoti certamente superati.

FILE PRENOTATI:
- .github/workflows/eve-ai-studio-checks.yml
- .github/workflows/eve-hq-final-verification.yml
- .github/workflows/eve-intelligence-0.1-checks.yml
- .github/workflows/eve-ai-studio-install-hq-animations.yml
- .codex/tasks/active e completed, limitatamente alle attività verificate
- docs/EVE_AI_STUDIO_COORDINATION.md
- CODEX_COORDINATION.md, limitatamente a questa scheda

DISPONIBILE PER L'ALTRO CODEX:
SÌ sui file applicativi della libreria 1.2.6; NO sui file di coordinamento e
workflow durante questa pulizia.

NOTE:
Workflow canonici corretti e verificati; attività concluse archiviate; PR #84
compattata senza integrare contenuti applicativi; sette branch già uniti o
contenuti nel canonico rimossi. Il branch legacy divergente
`eve-canonical-integration-v2` resta isolato: contiene la vecchia demo monolitica
1.2.2 e non deve essere usato o unito. Nessuna modifica a main, demo-canonica,
Aula Studio o produzione.
```

### ANIMATION-1.2.6 — Libreria ufficiale e prestazioni

```text
RESPONSABILE:
AndreaGiudice94 / Codex integrazione grafica

STATO:
REVIEW_REQUIRED

BRANCH:
codex/eve-ai-studio-animation-library-1-2-6-review

PULL REQUEST:
#84 (Draft) verso eve-ai-studio

ULTIMO COMMIT APPLICATIVO:
6d9ea1a

OBIETTIVO:
Sostituire il runtime 1.2.2 con Eve Animation Library 1.2.6 nella sola preview
canonica, mantenendo 64 asset e il profilo prestazioni approvato.

FILE PRENOTATI:
Vedere .codex/tasks/active/eve-ai-studio-animation-library-1-2-6-review.md.

VINCOLI:
Nessuna demo, copia HTML, standalone, cartella preview, modifica ai workflow,
merge o release. È ammesso un solo task e un solo handoff per questa attività.

DISPONIBILE PER L'ALTRO CODEX:
NO sui file prenotati fino alla revisione e all'approvazione dell'utente.

ATTIVITÀ CONSENTITE ALL'ALTRO CODEX:
- leggere e collaudare il commit applicativo congelato;
- lasciare osservazioni sulla stessa Draft Pull Request.

ATTIVITÀ VIETATE ALL'ALTRO CODEX:
- modificare in parallelo i file prenotati;
- creare demo, standalone, copie o nuove Pull Request per la stessa attività;
- effettuare merge o pubblicare una release desktop.

NOTE:
Integrati il runtime ufficiale 1.2.6, 64 asset e 64 poster nella sola preview
canonica. Hash, sintassi JavaScript, typecheck, test, build, test Python, 150
risorse HTTP e layout desktop/mobile verificati. Nessun riferimento eseguibile
alla versione 1.2.2 e nessun duplicato HTML. Il lint completo conserva un errore
preesistente in app.js, file non modificato da questa attività. Nessun merge o
rilascio eseguito. Ogni scheda della galleria include il comando diretto
`Riproduci su Eve`, verificato su tutti i 64 asset.
```

### CORE-1.3 — Database di produzione, migrazioni e RLS

- Stato: `CLOSED` — collaudo desktop alpha.9 approvato dall'utente il 2026-08-02
- Branch: `codex/eve-ai-studio-core-1-3`
- Base: `eve-ai-studio` dopo merge PR #93
- Baseline desktop: `1.2.0-alpha.8`
- Release di prova prevista: `1.2.0-alpha.9`
- File riservati: `.env.example`, `docs/DATABASE.md`,
  `src/app/api/eve/database/**`, `src/features/eve/data/**`,
  `src/features/eve/contracts.ts`, `src/features/eve/server/composition.ts`,
  migrazione e rollback 0018, test database, checkpoint CORE-1.3 e preview
  canonica. Il workflow desktop è riservato soltanto per autorizzare questo
  branch alla release alpha.9 di prova.

Entrambi i feature flag restano disattivati. Nessun SQL remoto o di
produzione è stato eseguito. Migrazioni, RLS, isolamento cross-room,
`service_role`, backup, rollback, suite, typecheck, lint, build e preview sono
verdi nei workflow GitHub del 2026-07-30. Il collaudo desktop alpha.9 è stato
approvato esplicitamente dall'utente e la PR #94 è stata unita in
`eve-ai-studio` al commit `87a6901` il 2026-08-02.

### INTELLIGENCE-0.4 — Ricerca web e pianificazione delle query

```text
RESPONSABILE:
Codex integrazione funzionale, UI canonica e desktop di prova

STATO:
REVIEW_REQUIRED

BRANCH:
codex/eve-ai-studio-intelligence-0-4

BASE:
origin/eve-ai-studio @ 87a6901

OBIETTIVO:
Integrare il flusso query → provider → risultati → candidati, mantenendo rete
e provider disattivati per impostazione predefinita, senza acquisizione,
approvazione, embedding o training automatici. Preparare alpha.10 soltanto
dopo tutti i test verdi.

FILE PRENOTATI:
- eve-ai-studio/.env.example
- eve-ai-studio/app/core/config.py
- eve-ai-studio/app/intelligence/__init__.py
- eve-ai-studio/app/intelligence/errors.py
- eve-ai-studio/app/intelligence/models.py
- eve-ai-studio/app/intelligence/router.py
- eve-ai-studio/app/intelligence/search_provider.py
- eve-ai-studio/app/intelligence/search_storage.py
- eve-ai-studio/app/intelligence/service.py
- eve-ai-studio/app/intelligence/storage.py
- eve-ai-studio/app/main.py
- eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.4_*
- eve-ai-studio/tests/test_intelligence_search.py
- reference/eve-ai-studio-preview/research-center-workflow.js
- .github/workflows/release-eve-ai-studio-desktop.yml
- eve-desktop/package.json
- eve-desktop/runtime/eve-desktop-updater.js
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- eve-desktop/src-tauri/tauri.conf.json
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- nessuno dei file condivisi elencati nella procedura canonica

VINCOLI:
Una sola Draft PR verso eve-ai-studio. Nessuna demo, standalone, copia HTML,
nuova preview, modifica a main, demo-canonica, Aula Studio, Supabase, Vercel o
produzione. Nessun merge prima del collaudo desktop alpha.10 e di una nuova
approvazione esplicita dell'utente.

ULTIMO COMMIT:
dace16f

PULL REQUEST:
https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/95

TEST:
12 test Python specifici, 236 test Python cumulativi e 194 test Vitest verdi;
typecheck, build, node --check, lint mirato, test desktop e browser reale verdi.
Il lint globale conserva errori preesistenti in app.js e negli artefatti Tauri
generati, fuori dal perimetro del checkpoint.

RELEASE DI PROVA:
Workflow 30724903788 completato con successo. Pubblicati installer NSIS, firma
e latest.json nella release eve-ai-studio-v1.2.0-alpha.10. Il manifest dichiara
1.2.0-alpha.10 e punta all'asset firmato Windows. Il collaudo è stato approvato
esplicitamente dall'utente e la PR #95 è stata unita in `eve-ai-studio` al
commit `7b18ee8` il 2026-08-02.
```

### CORE-1.4 — Identità, ruoli, permessi e Context Builder

```text
RESPONSABILE:
Codex integrazione funzionale, UI canonica e desktop di prova

STATO:
REVIEW_REQUIRED

BRANCH:
codex/eve-ai-studio-core-1-4

BASE:
origin/eve-ai-studio @ 7b18ee8

OBIETTIVO:
Costruire server-side un contesto minimo verificato da sessione autenticata,
appartenenza aula, ruoli, RLS e materiali autorizzati. Preparare alpha.11
soltanto dopo tutti i test verdi.

FILE PRENOTATI:
- .env.example
- docs/EVE_CONTEXT_SECURITY.md
- eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.4_*
- reference/eve-ai-studio-preview/identity-context-workflow.js
- reference/eve-ai-studio-preview/index.html
- src/app/api/eve/context/route.ts
- src/features/eve/context/**
- src/features/eve/contracts.ts
- src/features/eve/registry.ts
- src/features/eve/server/composition.ts
- supabase/migrations/0019_eve_identity_roles_context.sql
- supabase/rollback/0019_eve_identity_roles_context.down.sql
- tests/eve-context-*.test.ts
- supabase/tests/core_1_4_rls.sql
- .github/workflows/eve-core-1.3-database-checks.yml
- .github/workflows/release-eve-ai-studio-desktop.yml
- eve-desktop/package.json
- eve-desktop/runtime/eve-desktop-updater.js
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- eve-desktop/src-tauri/tauri.conf.json
- CODEX_COORDINATION.md, limitatamente a questa scheda

FILE CONDIVISI PRENOTATI:
- reference/eve-ai-studio-preview/index.html
- supabase/migrations/0019_eve_identity_roles_context.sql
- .github/workflows/eve-core-1.3-database-checks.yml, limitatamente a CORE-1.4

VINCOLI:
Il client non può fornire userId o ruoli autorizzativi. Il testo selezionato non
deve essere persistito nell'audit; il segreto Context Builder non deve apparire
nella UI o nei log. Nessuna demo, standalone, copia HTML, nuova preview,
modifica a main, demo-canonica, Aula Studio, Supabase remoto, Vercel o
produzione. Draft PR #96 aperta verso eve-ai-studio. Release desktop di collaudo
eve-ai-studio-v1.2.0-alpha.11 pubblicata con installer, firma e latest.json.
Tutti i workflow, inclusi i due test Supabase temporanei, sono verdi. Nessun
merge prima del collaudo alpha.11 e di una nuova approvazione esplicita
dell'utente.
```

### CORE-1.5 — Pannello Eve e integrazione visiva

```text
RESPONSABILE:
Codex integrazione funzionale, UI canonica e desktop di prova

STATO:
REVIEW_REQUIRED

BRANCH:
codex/eve-ai-studio-core-1-5

BASE:
origin/eve-ai-studio @ 661bc56

OBIETTIVO:
Integrare un pannello Eve unico sotto feature flag server-side con ingressi da
lezione, catalogo e aula. Preparare alpha.12 soltanto dopo tutti i test verdi.

FILE PRENOTATI:
- .env.example
- docs/EVE_PANEL_INTEGRATION.md
- eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.5_*
- reference/eve-ai-studio-preview/eve-panel-workflow.js
- reference/eve-ai-studio-preview/index.html
- src/app/layout.tsx
- src/app/api/eve/ui/status/route.ts
- src/components/catalog/catalog-explorer.tsx
- src/components/room/programming-lesson-workspace.tsx
- src/components/room/study-room.tsx
- src/features/eve/contracts.ts
- src/features/eve/registry.ts
- src/features/eve/server/composition.ts
- src/features/eve/ui/**
- tests/eve-panel-*.test.ts
- .github/workflows/release-eve-ai-studio-desktop.yml
- eve-desktop/package.json
- eve-desktop/runtime/eve-desktop-updater.js
- eve-desktop/src-tauri/Cargo.toml
- eve-desktop/src-tauri/Cargo.lock
- eve-desktop/src-tauri/tauri.conf.json
- CODEX_COORDINATION.md, limitatamente a questa scheda

VINCOLI:
Il flag resta OFF per default e viene deciso dal server. Nessun provider, segreto
o autorizzazione nel client. Nessuna demo, standalone, copia HTML, nuova preview,
modifica a main, demo-canonica, Supabase remoto, Vercel o produzione. Una sola
Draft PR e nessun merge prima del collaudo alpha.12 e di una nuova approvazione
esplicita dell'utente.

ESITO:
Draft PR #97 aperta verso eve-ai-studio. Verifiche GitHub verdi e release di
collaudo eve-ai-studio-v1.2.0-alpha.12 pubblicata con installer, firma e
latest.json. Nessun merge eseguito; attesa approvazione dopo collaudo desktop.
```

## Attività storiche di Aula Studio

La tabella seguente è conservata come cronologia del precedente flusso di Aula Studio. Non assegna né prenota file di Eve AI Studio e non prevale sulle regole attive sopra.

## Attività

| Attività | Assegnazione prevista | Branch | Stato | File riservati | File condivisi richiesti | Pull request | Ultimo aggiornamento |
|---|---|---|---|---|---|---|---|
| Correzione pubblicazione checkpoint 1.4 autonomo | Codex | `agent/phase4-publisher-fix` | In corso | `scripts/apply-phase4-alpha1.py`, scheda attività | `CODEX_COORDINATION.md` | Da aprire verso `demo-canonica` | 2026-07-23 |
| Logo circolare ufficiale dell'app | Codex | `agent/app-round-logo` | Completato | asset logo, componente brand, metadati, presentazione, autenticazione, dashboard e test | `src/components/catalog/catalog-explorer.tsx`, `src/components/room/study-room.tsx` | [PR #60](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/60) | 2026-07-22 |
| Fedeltà pannello Eve e area di lavoro alla demo ufficiale | Codex | `agent/eve-panel-reference-fidelity` | Completato | `globals.css`, workspace lezione, Eve Voice e test | nessuno | [PR #57](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/57) · confronto visivo completato; controlli superati | 2026-07-22 |
| Completamento fedele demo e parità tra temi | Codex | `agent/complete-demo-layout` | Completato | intro completa, workspace lezione, Eve, centro messaggi, CSS e test | nessuno | Intro demo, layout condiviso, Eve Voice completa e chat flottanti verificati; pronto per pubblicazione | 2026-07-22 |
| Tema Futuristica Focus e aggiornamenti master | Codex | `agent/futuristic-focus-theme` | In revisione | temi, CSS, impostazioni, centro messaggi, Eve lezione/esercizi, migrazione 0017 e test | `src/components/room/study-room.tsx`, `programming-lesson-workspace.tsx`, `src/hooks/use-room-realtime.ts`, `src/lib/types.ts`, `supabase/migrations/0017_message_center.sql` | — | 2026-07-22 |
| Controlli di lettura e scorrimento dell’aula | Codex | `agent/lesson-reading-controls` | In revisione | `programming-lesson-workspace.tsx`, test dedicato | `src/components/room/study-room.tsx` | — | 2026-07-22 |
| Integrazione Modulo 1 · Lezioni 1.1 e 1.2 | Codex | `agent/integrate-programming-module-1` | Completato | Artefatti 1.1/1.2, aggregatore, progressi e test | `src/lib/catalog/roadmap.ts` | [PR #29](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/29) | 2026-07-21 |
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

