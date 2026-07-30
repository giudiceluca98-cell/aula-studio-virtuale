# INTELLIGENCE-0.3 — revisione umana e promozione controllata

- Stato: `FUNCTIONAL_TESTING`
- Branch: `codex/eve-ai-studio-intelligence-0-3`
- Base: `origin/eve-ai-studio` @ `72278e1`
- Versione desktop di prova: `1.2.0-alpha.7`
- Stato finale previsto: `PENDING_USER_DESKTOP_APPROVAL`

## Obiettivo

Integrare e verificare revisione umana, qualità, versioni, promozione controllata
e revoca delle acquisizioni INTELLIGENCE-0.2. Pubblicare una release desktop
firmata di prova senza unire il branch nella canonica prima del collaudo utente.

## File prenotati

- `eve-ai-studio/.env.example`
- `eve-ai-studio/CHECKPOINT_INDEX.md`
- `eve-ai-studio/PHASE_STATUS.md`
- `eve-ai-studio/app/core/config.py`
- `eve-ai-studio/app/intelligence/__init__.py`
- `eve-ai-studio/app/intelligence/acquisition_storage.py`
- `eve-ai-studio/app/intelligence/errors.py`
- `eve-ai-studio/app/intelligence/models.py`
- `eve-ai-studio/app/intelligence/review_analysis.py`
- `eve-ai-studio/app/intelligence/review_storage.py`
- `eve-ai-studio/app/intelligence/router.py`
- `eve-ai-studio/app/intelligence/service.py`
- `eve-ai-studio/app/intelligence/storage.py`
- `eve-ai-studio/app/main.py`
- `eve-ai-studio/app/materials/models.py`
- `eve-ai-studio/app/materials/storage.py`
- `eve-ai-studio/checkpoints/CHECKPOINT_INTELLIGENCE_0.3_*`
- `eve-ai-studio/tests/test_intelligence_review.py`
- `reference/eve-ai-studio-preview/index.html`
- `reference/eve-ai-studio-preview/research-center-workflow.js`
- i cinque riferimenti di versione sotto `eve-desktop/`
- `.github/workflows/release-eve-ai-studio-desktop.yml`, soltanto se indispensabile
  per generare la release di prova dal branch senza merge
- questa scheda e la sezione dedicata in `CODEX_COORDINATION.md`

## Vincoli

- `EVE_RESEARCH_REVIEW_ENABLED=true`;
- `EVE_RESEARCH_PROMOTION_ENABLED=false` per impostazione predefinita;
- nessuna approvazione automatica;
- nessun merge in `eve-ai-studio` prima del collaudo utente;
- una sola Draft PR e una sola release di prova;
- nessuna demo, copia HTML, standalone o nuova cartella preview;
- nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase, Vercel o
  produzione.
