# CORE-1.3 — Database di produzione, migrazioni e RLS

- Stato: `FUNCTIONAL_TESTING`
- Branch: `codex/eve-ai-studio-core-1-3`
- Base contenutistica: `eve-ai-studio` dopo merge PR #93
- Baseline desktop: `1.2.0-alpha.8`
- Release desktop di prova prevista: `1.2.0-alpha.9`

## Obiettivo

Integrare schema PostgreSQL/Supabase, migrazione 0018, policy RLS,
importazione deterministica da SQLite e audit append-only, mantenendo
database di produzione e importazione disattivati per impostazione predefinita.

## File prenotati

- `.env.example`
- `docs/DATABASE.md`
- `src/app/api/eve/database/**`
- `src/features/eve/data/**`
- `src/features/eve/contracts.ts`
- `src/features/eve/server/composition.ts`
- `supabase/migrations/0018_eve_core_production_data.sql`
- `supabase/rollback/0018_eve_core_production_data.down.sql`
- `tests/eve-database-*.test.ts`
- `eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.3_*`
- `reference/eve-ai-studio-preview/index.html`
- `reference/eve-ai-studio-preview/database-production-workflow.js`
- questa scheda e la sezione CORE-1.3 in `CODEX_COORDINATION.md`

## Vincoli

- `EVE_PRODUCTION_DATABASE_ENABLED=false` e `EVE_SQLITE_IMPORT_ENABLED=false`;
- nessun SQL su database remoto o di produzione;
- collaudo obbligatorio su PostgreSQL/Supabase temporaneo;
- una sola preview canonica e una sola Draft PR;
- nessun merge o rilascio definitivo prima del collaudo desktop alpha.9 e
  dell'approvazione esplicita dell'utente.

## Stato verifiche

- archivio esterno verificato:
  `77a46038c2b8db01b058e4d7c9903bc7e48994b28bb17a29387c9977038bc77f`;
- verificatore e applicazione locale: `PASS`;
- test automatici, database temporaneo, preview e build: in corso.
