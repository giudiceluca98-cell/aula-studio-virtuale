# CORE-1.3 — VERIFICATION

Controlli locali del pacchetto:
- sintassi Python degli strumenti;
- sintassi JavaScript della preview;
- test statici SQL su tabelle, RLS, relazioni composite, audit e import;
- test TypeScript del mapping idempotente;
- applicazione anti-drift e seconda applicazione idempotente;
- smoke HTTP della preview canonica;
- nessuna seconda pagina HTML e nessun fetch nella preview.

Da eseguire obbligatoriamente da Codex:
- migrazione su PostgreSQL/Supabase temporaneo;
- test ruoli e cross-room reali;
- backup/restore e rollback;
- suite completa, lint, typecheck e build;
- installer alpha.9 e collaudo desktop.
