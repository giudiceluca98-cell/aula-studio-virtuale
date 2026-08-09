# Eve AI Studio — CORE-1.7

- Checkpoint: `CORE-1.7 — Gate MVP end-to-end`
- Branch: `codex/eve-ai-studio-core-1-7`
- Base: `origin/eve-ai-studio @ 2862b89`
- Stato: `REVIEW_REQUIRED`
- Obiettivo: integrare il primo percorso MVP autenticato e verificabile, con citazioni integre, isolamento per aula, RLS, feedback attribuibile e feature flag OFF per default.
- File riservati: tutti i file elencati in `MANIFEST_CORE_1.7.json`, i metadati desktop alpha.17 e il workflow desktop limitatamente all'allowlist del branch.
- File condivisi riservati: `reference/eve-ai-studio-preview/index.html`, `CODEX_COORDINATION.md` limitatamente alla scheda CORE-1.7, `supabase/migrations/0020_eve_mvp_gate.sql`.
- Vincoli: nessuna demo o sorgente duplicata; nessun segreto client-side; nessun accesso cross-room; nessuna memoria o azione automatica; nessun merge o release senza autorizzazione esplicita.
- Correzioni locali: FK composite messaggio/conversazione/aula; persistenza delle risposte assistant tramite client amministrativo solo server dopo autenticazione; revocato l'update diretto dei run agli utenti autenticati.
- Collaudo finale: 12 test mirati, 239 test web, 284 test Python, typecheck, lint mirato e build Next.js superati. Resta un solo warning Starlette di deprecazione non bloccante.
- Nota integrità: lo SHA-256 esterno dello ZIP non corrisponde; hash reale `59517e1450afcecb52588607447ff9d673ff7252bbd07859226c43d317736b16`. Tutti i 49 hash interni risultano validi.
