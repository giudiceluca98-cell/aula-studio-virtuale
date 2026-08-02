# CORE-1.4 — Identità, ruoli, permessi e Context Builder

- Stato: `FUNCTIONAL_TESTING`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-core-1-4`
- Base: `origin/eve-ai-studio @ 7b18ee8`
- Pull Request: da aprire verso `eve-ai-studio`

## Obiettivo

Costruire server-side il contesto minimo autorizzato usando sessione, aula,
ruoli, RLS e materiali verificati. Nessun identificativo o ruolo inviato dal
client può essere usato come autorizzazione.

## File riservati

- `.env.example`
- `docs/EVE_CONTEXT_SECURITY.md`
- `eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.4_*`
- `reference/eve-ai-studio-preview/identity-context-workflow.js`
- `reference/eve-ai-studio-preview/index.html`
- `src/app/api/eve/context/route.ts`
- `src/features/eve/context/**`
- `src/features/eve/contracts.ts`
- `src/features/eve/registry.ts`
- `src/features/eve/server/composition.ts`
- `supabase/migrations/0019_eve_identity_roles_context.sql`
- `supabase/rollback/0019_eve_identity_roles_context.down.sql`
- `tests/eve-context-*.test.ts`
- `supabase/tests/core_1_4_rls.sql`
- `.github/workflows/eve-core-1.3-database-checks.yml`
- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/package.json`
- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- `eve-desktop/src-tauri/tauri.conf.json`
- `CODEX_COORDINATION.md`, limitatamente alla scheda CORE-1.4

## Vincoli

Una sola Draft PR. Nessuna demo, standalone, copia HTML o cartella preview.
Nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase remoto,
Vercel o produzione. Nessun merge prima del collaudo desktop alpha.11 e della
nuova approvazione esplicita dell'utente.
