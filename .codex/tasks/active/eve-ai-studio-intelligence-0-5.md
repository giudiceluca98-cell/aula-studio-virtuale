# INTELLIGENCE-0.5 — Ingestione documentale avanzata e crawling limitato

- Stato: `IN_PROGRESS`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-intelligence-0-5`
- Base: `origin/eve-ai-studio @ 377b1d6`
- Release di collaudo prevista: `1.2.0-alpha.13`

## Obiettivo

Integrare ingestione sicura di PDF, DOCX ed EPUB, deduplicazione deterministica
e crawling same-domain limitato. Tutto il contenuto resta non fidato e in
quarantena; nessuna macro, istruzione, promozione o rete viene eseguita
automaticamente.

## File riservati

- `eve-ai-studio/.env.example`
- `eve-ai-studio/app/core/config.py`
- `eve-ai-studio/app/intelligence/**`
- `eve-ai-studio/app/main.py`
- `eve-ai-studio/pyproject.toml`
- `eve-ai-studio/tests/test_intelligence_ingestion.py`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.5_*`
- `reference/eve-ai-studio-preview/research-center-workflow.js`
- `.github/workflows/release-eve-ai-studio-desktop.yml`
- `eve-desktop/package.json`
- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- `eve-desktop/src-tauri/tauri.conf.json`
- `CODEX_COORDINATION.md`, limitatamente alla scheda INTELLIGENCE-0.5

## Vincoli

Una sola Draft PR verso `eve-ai-studio`. Nessuna demo, standalone, copia HTML,
nuova preview, modifica a `main`, `demo-canonica`, Aula Studio, Supabase remoto,
Vercel o produzione. Nessun merge o release desktop senza test verdi, collaudo
e autorizzazione esplicita dell'utente.
