# INTELLIGENCE-0.2 — integrazione e installer locale

- Stato: `RELEASE_READY`
- Branch locale: `codex/eve-ai-studio-intelligence-0-2-functional`
- Base: `origin/eve-ai-studio` @ `185c084`
- Pubblicazione GitHub: vietata per questa consegna
- Versione desktop prevista: `1.2.0-alpha.4`

## Obiettivo

Applicare localmente il pacchetto INTELLIGENCE-0.2 verificato, completare gli
stadi funzionale e UI nella sorgente canonica e generare un installer Windows
NSIS installabile sopra Eve AI Studio esistente.

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
- nessun push, Pull Request, merge o release GitHub;
- nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase, Vercel o
  produzione.

## Esito locale

- test Python specifici: 46 superati;
- suite Python completa: 211 superati;
- verifica UI statica, HTTP e browser reale: superata;
- test desktop e coerenza versione: superati;
- installer NSIS `1.2.0-alpha.4` generato e verificato tramite SHA-256;
- nessuna operazione remota GitHub eseguita.
