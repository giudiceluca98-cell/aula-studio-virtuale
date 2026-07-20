# Regole per gli agenti Codex

Queste regole si applicano all'intero repository.

## Prima di lavorare

1. Eseguire `git fetch origin --prune`.
2. Leggere `AGENTS.md` e `CODEX_COORDINATION.md`.
3. Controllare `.codex/tasks/active/`, i branch `codex/*` e le pull request aperte.
4. Lavorare in un branch o una worktree dedicata. Non lavorare direttamente su `main`.
5. Registrare il compito e dichiarare i file che si intendono modificare prima di cambiare il codice.

## Coordinamento

1. Branch, commit, pull request e file di coordinamento sono le sole fonti condivise autorevoli.
2. Non assumere di vedere le conversazioni, la memoria o le modifiche non committate degli altri agenti.
3. Non modificare file riservati a un altro agente.
4. Evitare i file condivisi elencati in `CODEX_COORDINATION.md`; lasciarli all'agente integratore quando possibile.
5. Se un file condiviso è indispensabile, registrare prima la necessità nel file del compito e nel registro di coordinamento.
6. Una pull request attiva che modifica un file condiviso ne blocca l'uso agli altri agenti, salvo coordinamento esplicito.
7. Non modificare migrazioni Supabase già applicate. Creare una nuova migrazione incrementale.

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
6. L'integrazione finale dei pacchetti nei file condivisi spetta a un agente integratore dedicato.
