# Eve AI Studio — CORE-2.0

- Checkpoint: `CORE-2.0 — Chat contestuale grounded con modello reale`
- Branch: `codex/eve-ai-studio-core-2-0`
- Base: `origin/eve-ai-studio @ 8915e4d`
- Stato: `FUNCTIONAL_TESTING`
- Obiettivo: integrare localmente chat privata per aula, contesto grounded e citazioni verificabili, senza conoscenza generale implicita, memoria o azioni automatiche.
- File riservati: tutti i file elencati in `MANIFEST_CORE_2.0.json`, più rollback locale della migrazione 0021 e relativo ordine nel workflow database.
- File condivisi riservati: `reference/eve-ai-studio-preview/index.html`, `supabase/migrations/0021_eve_grounded_chat.sql`, `supabase/rollback/0021_eve_grounded_chat.down.sql`, `.github/workflows/database-migrations.yml` limitatamente al rollback 0021, `CODEX_COORDINATION.md` limitatamente alla scheda CORE-2.0.
- Vincoli: nessun push, merge, release o database remoto; nessun segreto client-side; nessun accesso cross-room; nessuna demo o sorgente duplicata; preservare tutte le correzioni approvate di CORE-1.7.
- Nota integrazione: lo script del pacchetto ha rilevato drift su 16 file modificati; l'integrazione deve quindi essere effettuata a tre vie e verificata file per file.
- Correzioni locali: persistenza finale con client amministrativo solo dopo autenticazione, FK composite messaggio/conversazione/aula, nessun update dei turni con ruolo authenticated, rollback protetto 0021 in ordine inverso.
- Test locali: 2 specifici e 286 cumulativi Python; 248 cumulativi web; typecheck, lint mirato e build Next.js verdi. Restano database temporaneo/RLS multiutente e prova con provider reale prima della revisione finale.
