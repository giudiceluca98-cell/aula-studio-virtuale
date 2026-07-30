# CORE-1.2 — Piano: architettura unificata features/eve e adapter dei prototipi

Stato: `FUNCTIONAL_TESTING` nel pacchetto locale. Dipendenza bloccante: `INTELLIGENCE-0.3 CLOSED`.

## Obiettivo
Creare un confine di produzione stabile per Eve senza copiare i prototipi FastAPI dentro il frontend e senza esporre provider, URL interni o segreti alla UI.

## Incluso
- cartelle `src/features/eve/{ui,agent,prompts,context,retrieval,memory,tools,voice,safety,evaluation}`;
- contratti condivisi e registro delle capacità;
- `src/lib/ai/eve-service-config.ts` server-only;
- adapter FastAPI tipizzato con endpoint in allowlist, timeout, no redirect, MIME e limite byte;
- compositore server-side e route `GET /api/eve/composition`;
- test architetturali e test negativi dell'adapter;
- diagnostica interattiva nella sola preview canonica.

## Escluso
- migrazione SQLite → Supabase;
- provider AI reale;
- chat o RAG di produzione;
- memoria, strumenti o voce attivati;
- modifica di `main`, `demo-canonica`, produzione o workflow;
- duplicati HTML, standalone e nuove cartelle preview.

## Feature flag e rollback
`EVE_CORE_INTEGRATION_ENABLED=false` per impostazione predefinita. Il rollback rimuove i nuovi moduli e ripristina `.env.example` e `index.html`.
