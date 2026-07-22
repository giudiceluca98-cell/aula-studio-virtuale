# Logo circolare dell'app

Stato: in revisione
Assegnazione: Codex
Branch: `agent/app-round-logo`

## Obiettivo

Integrare il simbolo grafico fornito dall'utente come logo circolare ufficiale di Aula Studio Virtuale, mantenendolo leggibile anche nelle dimensioni ridotte dell'interfaccia.

## File previsti e riservati

- `public/aula-app-icon.png`
- `src/components/brand/app-logo.tsx`
- `src/app/layout.tsx`
- `src/app/manifest.ts`
- `src/app/page.tsx`
- `src/components/auth/auth-form.tsx`
- `src/components/dashboard/room-launcher.tsx`
- `src/components/catalog/catalog-explorer.tsx` (file condiviso prenotato)
- `src/components/room/study-room.tsx` (file condiviso prenotato)
- `tests/app-logo.test.tsx`
- `.codex/tasks/active/app-round-logo.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

- `src/components/catalog/catalog-explorer.tsx`
- `src/components/room/study-room.tsx`

## Verifiche previste

- logo circolare visibile nella presentazione, autenticazione, dashboard, catalogo e aula;
- favicon e metadati per installazione sul dispositivo collegati allo stesso simbolo;
- nessuna modifica al comportamento dell'area di lavoro o di Eve;
- test, typecheck, lint e build.

## Verifiche eseguite

- controllo visivo locale: logo caricato, 36 × 36 px, ritaglio circolare e simbolo leggibile;
- test mirati logo e presentazione: 3/3 superati;
- suite completa: 167/171 superati; quattro timeout dovuti alla concorrenza del runner;
- riesecuzione isolata dei quattro test in timeout: 14/14 superati;
- typecheck: superato;
- lint: superato;
- build di produzione: superata, incluso `/manifest.webmanifest`;
- Draft Pull Request: [PR #60](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/60).
