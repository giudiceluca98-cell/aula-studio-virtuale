# Sostituzione dell’interfaccia con la demo canonica

- Stato: In corso
- Responsabile: Codex
- Branch: `agent/canonical-app-replacement`
- Obiettivo: trasformare l’app Next.js reale nella demo canonica, senza sovrapporre il vecchio layout alla nuova interfaccia.

## Regola architetturale

La demo canonica è l’unica fonte visiva e comportamentale. L’interfaccia precedente non viene adattata, montata o sovrapposta alla demo e non costituisce più la base dell’applicazione visibile.

Il documento canonico viene pubblicato senza trasformazioni e gestisce direttamente Presentazione, Dashboard, Catalogo e Aula. I servizi reali preesistenti restano archiviati nel repository e potranno essere reintegrati in seguito, manualmente e uno alla volta, senza cambiare la demo.

Non devono convivere due strutture grafiche e non deve essere introdotto un secondo tema che riproponga la vecchia applicazione.

## File riservati

- `reference/demo-aula-studio-virtuale-canonica.html` (sola lettura)
- `public/aula-studio-virtuale.html`
- `scripts/publish-canonical-demo.mjs`
- `next.config.ts`
- `tests/canonical-app-replacement.test.ts`
- `PIANO_LAVORO_GITHUB_DEMO_CANONICA.txt`

## File condivisi richiesti

- nessuno; i componenti della vecchia interfaccia non vengono modificati

## Vincoli

- nessuna modifica distruttiva al database;
- nessun deploy prima dell’anteprima locale approvata;
- nessun adattatore grafico costruito sui componenti della vecchia interfaccia;
- copia pubblica obbligatoriamente identica byte per byte alla fonte canonica;
- reintegrazione successiva dei servizi soltanto dopo approvazione dell’interfaccia canonica.

## Stato della sostituzione

- rimossi gli adattatori grafici incompleti costruiti sulla vecchia interfaccia;
- pubblicata la demo canonica come documento autonomo `public/aula-studio-virtuale.html`;
- collegati gli ingressi Presentazione, Dashboard, Catalogo, Aula e autenticazione alle viste canoniche;
- verificata la parità byte per byte con SHA-256 `85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c`;
- verificati nel browser Presentazione, Dashboard, Catalogo, Aula, Eve Voice e apertura del Timer;
- test canonici, typecheck, lint e build superati;
- la pubblicazione Vercel resta sospesa in attesa dell’approvazione dell’anteprima locale.
