# Sostituzione dell’interfaccia con la demo canonica

- Stato: In corso
- Responsabile: Codex
- Branch: `agent/canonical-app-replacement`
- Obiettivo: trasformare l’app Next.js reale nella demo canonica, senza sovrapporre il vecchio layout alla nuova interfaccia.

## Regola architetturale

La demo canonica è l’unica fonte visiva e comportamentale. L’app precedente viene conservata soltanto come fonte dei servizi reali: autenticazione, routing, Supabase, RLS, Realtime, Storage e API.

Non devono convivere due strutture grafiche e non deve essere introdotto un secondo tema che riproponga la vecchia applicazione.

## File riservati

- `src/components/room/study-room.tsx`
- `src/components/room/programming-lesson-workspace.tsx`
- `src/components/dashboard/room-launcher.tsx`
- `src/components/auth/auth-form.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- nuovi componenti in `src/components/canonical/**`
- test di parità canonica

## File condivisi richiesti

- `src/components/room/study-room.tsx`
- `src/components/catalog/catalog-explorer.tsx`, soltanto quando verrà portato il Catalogo

## Vincoli

- nessuna modifica distruttiva al database;
- nessuna sostituzione dei servizi reali con dati mock o `localStorage`;
- nessun deploy prima dell’anteprima locale approvata;
- integrazione per superfici verificabili: shell, Dashboard, Aula, workspace, pannelli e stati.

