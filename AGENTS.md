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
