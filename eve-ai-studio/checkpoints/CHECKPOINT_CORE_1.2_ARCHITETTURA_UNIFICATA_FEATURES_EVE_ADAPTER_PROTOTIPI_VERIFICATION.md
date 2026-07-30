# Verifica CORE-1.2

## Controlli del pacchetto
- sintassi TypeScript tramite `transpileModule`;
- sintassi JavaScript con `node --check`;
- test statico dello scope e assenza di HTML duplicati;
- applicazione idempotente e rollback su copia locale;
- smoke HTTP della preview canonica;
- verifica che il modulo preview non contenga `fetch`.

## Controlli obbligatori per Codex
- `pnpm test -- tests/eve-architecture.test.ts tests/eve-fastapi-adapter.test.ts`;
- `pnpm typecheck`;
- `pnpm lint`;
- `pnpm build`;
- suite Python cumulativa dei prototipi;
- browser desktop sulla preview canonica;
- build e installazione firmata `1.2.0-alpha.8` sopra alpha.7;
- prova con flag OFF e con servizio locale controllato.

Il documento non dichiara superati i controlli che richiedono il checkout reale o la firma di release.
