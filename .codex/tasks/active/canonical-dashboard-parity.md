# Parità Dashboard con la demo canonica

Stato: in revisione
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

## Risultato

- Dashboard reale allineata alla struttura del checkpoint canonico;
- selettore stanza e collegamento contestuale al Catalogo sempre disponibili;
- schede stanza con ruolo, partecipanti, presenza recente, invito e gestione;
- dialog invito con codice reale e collegamento alla rotazione autorizzata;
- attività recente, progressi, esercizi e tempo focus caricati da Supabase;
- stati caricamento, vuoto, errore e conferma accessibili;
- presenza Dashboard considerata online con tolleranza di due minuti;
- layout verificato in Futuristica Focus su desktop e mobile senza overflow.

## Verifiche

- test mirato Dashboard: 1/1;
- suite completa: 32 file, 172/172 test;
- typecheck: superato;
- lint: nessun errore, un warning preesistente in `src/lib/vocabulary/mastery.ts`;
- build Next.js di produzione: superata;
- verifica browser: dati reali caricati, Catalogo contestuale e dialog invito operativi;
- Draft Pull Request: [PR #65](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/65).

## Stato consegna

Anteprima locale in attesa di approvazione. Nessun merge e nessun deployment di
produzione eseguiti.
