# CORE-1.5 — Pannello Eve e integrazione visiva

- Stato: `REVIEW_REQUIRED`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-core-1-5`
- Base: `origin/eve-ai-studio @ 661bc56`
- Pull Request: `#97` Draft verso `eve-ai-studio`
- Release di collaudo: `eve-ai-studio-v1.2.0-alpha.12`

## Obiettivo

Integrare un pannello Eve unico sotto feature flag server-side, con ingressi da
lezione, catalogo e aula. Con flag OFF l'app deve restare invariata e pienamente
utilizzabile. Nessun provider, segreto o autorizzazione viene affidato al client.

## File riservati

- `.env.example`
- `docs/EVE_PANEL_INTEGRATION.md`
- `eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.5_*`
- `reference/eve-ai-studio-preview/eve-panel-workflow.js`
- `reference/eve-ai-studio-preview/index.html`
- `src/app/layout.tsx`
- `src/app/api/eve/ui/status/route.ts`
- `src/components/catalog/catalog-explorer.tsx`
- `src/components/room/programming-lesson-workspace.tsx`
- `src/components/room/study-room.tsx`
- `src/features/eve/contracts.ts`
- `src/features/eve/registry.ts`
- `src/features/eve/server/composition.ts`
- `src/features/eve/ui/**`
- `tests/eve-panel-*.test.ts`
- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/package.json`
- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- `eve-desktop/src-tauri/tauri.conf.json`
- `CODEX_COORDINATION.md`, limitatamente alla scheda CORE-1.5

## Vincoli

Una sola Draft PR. Nessuna demo, standalone, copia HTML o nuova preview.
Nessuna modifica a `main`, `demo-canonica`, Supabase remoto, Vercel o produzione.
Il flag resta OFF per default. Nessun merge prima del collaudo desktop alpha.12
e di una nuova approvazione esplicita dell'utente.

## Esito integrazione

Suite locale, build, verifiche browser e controlli GitHub verdi. La release
desktop firmata alpha.12 è pubblicata esclusivamente per il collaudo. La PR
resta Draft e non è stata unita.
