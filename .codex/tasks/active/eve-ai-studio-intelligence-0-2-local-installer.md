# INTELLIGENCE-0.2 — integrazione e release desktop

- Stato: `RELEASE_READY`
- Branch locale: `codex/eve-ai-studio-intelligence-0-2-functional`
- Base riallineata: `origin/eve-ai-studio` @ `cc9153f`
- Pubblicazione GitHub: autorizzata esplicitamente dall'utente il 29 luglio 2026
- Versione desktop prevista: `1.2.0-alpha.6`

## Obiettivo

Integrare il pacchetto INTELLIGENCE-0.2 verificato nella sorgente canonica e
pubblicare l'aggiornamento desktop firmato, installabile sopra Eve AI Studio
esistente tramite updater o installer Windows NSIS.

## File prenotati

- `eve-ai-studio/app/main.py`
- `eve-ai-studio/app/intelligence/web_acquisition.py`
- `eve-ai-studio/.env.example`
- `eve-ai-studio/tests/test_intelligence_acquisition.py`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.2_*`
- `reference/eve-ai-studio-preview/research-center-workflow.js`
- `eve-desktop/package.json`
- `eve-desktop/runtime/eve-desktop-updater.js`
- `eve-desktop/src-tauri/tauri.conf.json`
- `eve-desktop/src-tauri/Cargo.toml`
- `eve-desktop/src-tauri/Cargo.lock`
- questa scheda e la relativa sezione di `CODEX_COORDINATION.md`

## Vincoli

- `EVE_RESEARCH_WEB_ENABLED=false` per impostazione predefinita;
- nessuna approvazione o promozione automatica nei materiali CORE;
- nessun HTML alternativo, standalone, nuova preview o secondo updater;
- una sola Pull Request e release GitHub, entrambe autorizzate dall'utente;
- nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase, Vercel o
  produzione.

## Esito locale

- test Python specifici: 31 superati;
- suite Python completa: 211 superati;
- verifica UI statica, HTTP e browser reale: superata;
- test desktop e coerenza versione: superati;
- build locale precedente verificata; pubblicazione firmata prevista come `1.2.0-alpha.6`;
- sorgente riallineata alla versione canonica `1.2.0-alpha.5`.
