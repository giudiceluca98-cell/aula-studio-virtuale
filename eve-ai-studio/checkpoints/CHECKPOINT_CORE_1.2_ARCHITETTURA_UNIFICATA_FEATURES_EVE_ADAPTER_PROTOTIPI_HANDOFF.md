# Handoff CORE-1.2

Stato: `FUNCTIONAL_TESTING`.

## File funzionali congelabili dopo i test
- `src/features/eve/**`
- `src/lib/ai/eve-service-config.ts`
- `src/app/api/eve/composition/route.ts`
- `tests/eve-architecture.test.ts`
- `tests/eve-fastapi-adapter.test.ts`

## File UI disponibile dopo handoff funzionale
- `reference/eve-ai-studio-preview/core-architecture-workflow.js`
- modifica minima a `reference/eve-ai-studio-preview/index.html`

## Divieti
Non spostare rete o segreti nella UI; non importare direttamente moduli Python; non attivare memoria, tools, provider o migrazioni; non creare una seconda preview.

## Release proposta
`1.2.0-alpha.8`, da costruire e pubblicare da Codex soltanto dopo baseline alpha.7/INTELLIGENCE-0.3 verificata.
