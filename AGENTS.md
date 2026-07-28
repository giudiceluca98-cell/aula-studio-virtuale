# Regole per gli agenti Codex

Queste regole si applicano all'intero repository. Gli agenti sono generalisti: non sono associati permanentemente a un computer, una materia o un ruolo.

## Prima di lavorare

1. Eseguire `git fetch origin --prune`.
2. Leggere `AGENTS.md` e `CODEX_COORDINATION.md`.
3. Controllare `.codex/tasks/active/`, i branch `codex/*` e le pull request aperte.
4. Lavorare in un branch o una worktree dedicata. Non lavorare direttamente su `main`.
5. Prendere in carico una sola attività alla volta e dichiarare i file che si intendono modificare prima di cambiare il codice.

## Coordinamento

1. Branch, commit, pull request e file di coordinamento sono le sole fonti condivise autorevoli.
2. Non assumere di vedere le conversazioni, la memoria o le modifiche non committate degli altri agenti.
3. Non modificare file riservati a un altro agente.
4. L'agente che prende in carico un'attività ne è responsabile end-to-end: contenuti, collegamento nell'app, test e documentazione prevista.
5. I file condivisi elencati in `CODEX_COORDINATION.md` possono essere modificati dal responsabile dell'attività soltanto dopo una prenotazione esplicita.
6. Una pull request attiva che modifica un file condiviso ne blocca l'uso agli altri agenti, salvo coordinamento esplicito registrato.
7. Se non è possibile prenotare un file condiviso, l'integrazione viene affidata a un'attività separata.
8. Non modificare migrazioni Supabase già applicate. Creare una nuova migrazione incrementale.

## Eve AI Studio canonica

Per qualunque attività relativa a Eve AI Studio, leggere integralmente anche:

`docs/EVE_AI_STUDIO_COORDINATION.md`

Regole inderogabili:

1. Il branch canonico è `eve-ai-studio`.
2. L'unica sorgente ufficiale è `reference/eve-ai-studio-preview/`.
3. L'unico punto di ingresso è `reference/eve-ai-studio-preview/index.html`.
4. Sviluppo, anteprima, verifica, pacchetto desktop e aggiornamenti devono derivare dalla stessa sorgente canonica.
5. Non creare demo, HTML alternativi, standalone, nuove cartelle preview o copie complete dell'interfaccia.
6. I documenti storici che citano uno standalone descrivono un flusso superato e non autorizzano a ricrearlo.
7. Ogni attività parte dall'ultima `origin/eve-ai-studio` e usa un branch `codex/eve-ai-studio-<funzione>`.
8. Prima di modificare file, registrare checkpoint, branch, stato e prenotazioni in `CODEX_COORDINATION.md`.
9. I due Codex lavorano in sequenza sullo stesso checkpoint: prima la parte funzionale, poi grafica/UX/desktop.
10. Il secondo Codex può iniziare soltanto dopo uno stato esplicito `READY_FOR_HANDOFF`, un commit congelato e un documento `HANDOFF`.
11. Un file presente nel repository non è automaticamente disponibile: fanno fede prenotazioni, stato e handoff pubblicati.
12. Non modificare `main`, `demo-canonica`, Aula Studio o la produzione durante questo flusso.
13. Non effettuare merge senza approvazione esplicita dell'utente.

## Demo canonica

Il branch `demo-canonica` contiene il riferimento visivo e funzionale ufficiale della demo.
Il file canonico deve essere collocato in:

`reference/demo-aula-studio-virtuale-canonica.html`

Regole obbligatorie:

1. Non ricostruire la demo da descrizioni, screenshot o vecchi add-on.
2. Usare il file canonico come fonte di verità per aspetto, interazioni e stati.
3. Non sostituire l'app Next.js con il singolo HTML della demo.
4. Trasferire ogni funzione nell'architettura ufficiale conservando autenticazione, routing, Supabase, RLS e Realtime.
5. Non copiare `localStorage` o dati mock quando nell'app ufficiale esiste una persistenza reale.
6. Integrare una funzione per volta in un branch dedicato.
7. Confrontare visivamente il risultato con la demo prima di dichiarare il lavoro concluso.
8. Non eliminare o semplificare funzioni presenti nella demo per far passare più facilmente l'integrazione.

Una funzione è equivalente soltanto quando:

- aspetto e comportamento corrispondono alla demo;
- funzionano anche gli stati intermedi;
- refresh, navigazione e responsive non rompono il flusso;
- non compaiono errori in console;
- la persistenza usa il livello corretto;
- test, typecheck, lint e build passano.

## Sicurezza

1. Non committare `.env`, segreti, token, password, dati personali, log privati, dump o file caricati dagli utenti.
2. Non esporre chiavi Supabase amministrative, `OPENAI_API_KEY`, `WEBHOOK_SECRET` o credenziali Vercel.
3. Non modificare variabili, dominio o collegamento Vercel senza autorizzazione esplicita.
4. Conservare RLS, autorizzazioni server-side e separazione tra dati condivisi e privati.

## Consegna

1. Creare commit piccoli e descrittivi.
2. Pubblicare presto il branch e aprire una Draft Pull Request.
3. Aggiornare lo stato del compito, i file toccati, le dipendenze e gli eventuali conflitti.
4. Prima della consegna eseguire, quando applicabile:

   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

5. Segnalare chiaramente errori preesistenti, controlli non eseguiti e limiti residui.
6. Dopo il merge, chiudere l'attività corrente. Lo stesso agente può quindi prendere in carico qualunque nuova attività disponibile.
