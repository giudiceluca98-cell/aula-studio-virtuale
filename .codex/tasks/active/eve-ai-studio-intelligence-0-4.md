# INTELLIGENCE-0.4 — Ricerca web e pianificazione delle query

- Stato: `REVIEW_REQUIRED`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-intelligence-0-4`
- Base: `origin/eve-ai-studio @ 87a6901`
- Ultimo commit applicativo: `dace16f`
- Pull Request: [#95](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/95) verso `eve-ai-studio`

## Obiettivo

Integrare il flusso query → provider → risultati → candidati mantenendo rete e
provider disattivati per impostazione predefinita. Nessuna acquisizione,
approvazione, embedding o attività di training può avvenire automaticamente.

## File riservati

- `eve-ai-studio/.env.example`
- `eve-ai-studio/app/core/config.py`
- `eve-ai-studio/app/intelligence/__init__.py`
- `eve-ai-studio/app/intelligence/errors.py`
- `eve-ai-studio/app/intelligence/models.py`
- `eve-ai-studio/app/intelligence/router.py`
- `eve-ai-studio/app/intelligence/search_provider.py`
- `eve-ai-studio/app/intelligence/search_storage.py`
- `eve-ai-studio/app/intelligence/service.py`
- `eve-ai-studio/app/intelligence/storage.py`
- `eve-ai-studio/app/main.py`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.4_*`
- `eve-ai-studio/tests/test_intelligence_search.py`
- `reference/eve-ai-studio-preview/research-center-workflow.js`
- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/package.json`
- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- `eve-desktop/src-tauri/tauri.conf.json`
- `CODEX_COORDINATION.md`, limitatamente alla scheda del checkpoint

## Vincoli

Una sola Draft PR. Nessuna demo, standalone, copia HTML o cartella preview.
Nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase, Vercel o
produzione. La release desktop alpha.10 è solo di prova e non autorizza il
merge senza un nuovo collaudo e l'approvazione esplicita dell'utente.

## Verifiche

- 12 test Python specifici superati.
- 236 test Python cumulativi superati.
- 194 test Vitest superati.
- Typecheck e build superati.
- `node --check`, lint mirato e test desktop superati.
- Preview canonica verificata via HTTP e browser reale senza errori console.
- Lint globale: soli errori preesistenti in `app.js` e artefatti Tauri generati.

## Release desktop di prova

- Workflow: [30724903788](https://github.com/giudiceluca98-cell/aula-studio-virtuale/actions/runs/30724903788), completato.
- Release: [eve-ai-studio-v1.2.0-alpha.10](https://github.com/giudiceluca98-cell/eve-ai-studio-releases/releases/tag/eve-ai-studio-v1.2.0-alpha.10).
- Asset: installer NSIS, firma updater e `latest.json` presenti.
- SHA-256 installer: `e64cb8cbcf6215a29ab95c66abb3e63ccad5e83749d6c59d462177060ae1177e`.
- SHA-256 `latest.json`: `7da7a98690b0463edc0fa096dcbe309f71ab4463429e1018f95fd44623bb0ed6`.
- Il merge resta vietato fino al collaudo e all'approvazione dell'utente.
