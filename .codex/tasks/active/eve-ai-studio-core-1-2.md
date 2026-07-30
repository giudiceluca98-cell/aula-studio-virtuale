# CORE-1.2 — Architettura unificata features/eve e adapter prototipi

- Stato: `REVIEW_REQUIRED`
- Branch: `codex/eve-ai-studio-core-1-2`
- Base contenutistica: `eve-ai-studio` dopo merge PR #92, commit `fbc7619`
- Baseline desktop: `1.2.0-alpha.7`
- Release desktop di prova prevista: `1.2.0-alpha.8`

## Obiettivo

Integrare l'architettura modulare `src/features/eve/`, la composizione
server-side e l'adapter esplicito verso i prototipi FastAPI, mantenendo
l'integrazione disattivata per impostazione predefinita.

## File prenotati

- `.env.example`
- `src/app/api/eve/composition/route.ts`
- `src/features/eve/**`
- `src/lib/ai/eve-service-config.ts`
- `tests/eve-architecture.test.ts`
- `tests/eve-fastapi-adapter.test.ts`
- `eve-ai-studio/checkpoints/CHECKPOINT_CORE_1.2_*`
- `reference/eve-ai-studio-preview/index.html`
- `reference/eve-ai-studio-preview/core-architecture-workflow.js`
- i cinque riferimenti di versione sotto `eve-desktop/`
- `.github/workflows/release-eve-ai-studio-desktop.yml` soltanto se necessario
  per la release di prova dal branch
- questa scheda e la sezione CORE-1.2 in `CODEX_COORDINATION.md`

## Vincoli

- `EVE_CORE_INTEGRATION_ENABLED=false` per impostazione predefinita;
- token e URL interni esclusivamente server-side;
- una sola preview canonica;
- nessuna modifica a `main`, `demo-canonica`, Aula Studio, Supabase, Vercel o
  produzione;
- una sola Draft PR;
- nessun merge e nessuna chiusura prima del collaudo desktop alpha.8 e
  dell'approvazione esplicita dell'utente.

## Verifiche locali

- verificatore del pacchetto CORE-1.2: `PASS`;
- test mirati Vitest: `10/10`;
- suite Vitest completa: `181/181`;
- suite FastAPI cumulativa: `224/224` (un avviso di deprecazione esterno);
- TypeScript: `PASS`;
- lint dei file CORE-1.2: `PASS`;
- build Next.js: `PASS`;
- preview canonica: navigazione, simulazione dei quattro adapter e sei
  controlli architetturali verificati nel browser.
- Draft PR: `#93`, aperta verso `eve-ai-studio`.

Il lint globale resta bloccato da artefatti desktop preesistenti sotto
`eve-desktop/frontend-dist/` e `eve-desktop/src-tauri/target/`; i file nuovi e
modificati per CORE-1.2 non introducono errori lint.
