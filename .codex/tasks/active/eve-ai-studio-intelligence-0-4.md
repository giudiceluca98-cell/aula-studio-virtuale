# INTELLIGENCE-0.4 — Ricerca web e pianificazione delle query

- Stato: `IN_PROGRESS`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-intelligence-0-4`
- Base: `origin/eve-ai-studio @ 87a6901`
- Pull Request: da aprire verso `eve-ai-studio`

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
