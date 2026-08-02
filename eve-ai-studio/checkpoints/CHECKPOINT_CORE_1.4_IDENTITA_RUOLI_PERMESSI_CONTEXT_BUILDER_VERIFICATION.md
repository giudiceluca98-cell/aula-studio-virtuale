# CORE-1.4 — VERIFICATION

## Verifiche locali del pacchetto

- hash di tutti i payload;
- sintassi Python degli strumenti;
- `node --check` della preview;
- assenza di `fetch` nella preview;
- assenza di HTML alternativi;
- controllo statico di RLS, audit append-only e assenza del testo nei log;
- applicazione anti-drift e idempotenza su baseline locale sequenziale;
- smoke HTTP della preview canonica.

## Verifiche obbligatorie per Codex

- typecheck, lint, Vitest e build completi;
- migrazione su PostgreSQL/Supabase temporaneo;
- test owner/admin/member/outsider;
- cross-room, corso errato, materiale revocato e conversazione altrui;
- firma alterata, token scaduto e segreto assente;
- conferma che l'audit non contiene testo selezionato;
- build, firma e installazione desktop `1.2.0-alpha.11`.
