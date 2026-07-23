# Parità Dashboard con la demo canonica

Stato: in corso
Assegnazione: Codex
Branch: `agent/canonical-demo-staging`

## Obiettivo

Trasferire nella Dashboard Next.js reale la struttura e gli stati approvati della
demo canonica, mantenendo autenticazione, RPC, RLS e dati Supabase come fonte
autorevole.

## Fonte

- branch `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- checkpoint Dashboard 1.2.0-alpha.1–1.2.0-alpha.6;
- regola: UX dalla demo, dati e autorizzazioni dall'app ufficiale.

## File previsti e riservati

- `src/components/dashboard/room-launcher.tsx`
- `tests/dashboard-canonical-parity.test.tsx`
- `.codex/tasks/active/canonical-dashboard-parity.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

Nessuno.

## Funzioni da integrare

- intestazione e navigazione equivalenti alla demo;
- ingresso contestuale al Catalogo con stanza di destinazione;
- schede stanza con ruolo, presenza e accessi separati;
- copia del codice invito e collegamento alla gestione reale;
- stati caricamento, vuoto ed errore accessibili;
- riepilogo personale basato su progressi e sessioni reali;
- attività recente derivata dagli eventi autorizzati;
- responsive e parità tra temi.

## Vincoli

- nessun dato mock sostituisce Supabase;
- nessuna modifica a schema, RLS, migrazioni o variabili ambiente;
- nessuna pubblicazione prima dell'approvazione dell'anteprima locale;
- le altre aree della demo canonica restano attività successive separate.

