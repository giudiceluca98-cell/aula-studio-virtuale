# CORE-1.3 — VERIFICATION

Controlli locali del pacchetto:
- sintassi Python degli strumenti;
- sintassi JavaScript della preview;
- test statici SQL su tabelle, RLS, relazioni composite, audit e import;
- test TypeScript del mapping idempotente;
- applicazione anti-drift e seconda applicazione idempotente;
- smoke HTTP della preview canonica;
- nessuna seconda pagina HTML e nessun fetch nella preview.

Verificati su GitHub:
- migrazione su PostgreSQL/Supabase temporaneo;
- test ruoli, cross-room e `service_role`;
- backup di schema e dati e rollback protetto;
- suite completa, lint, typecheck e build;
- controlli generali, preview modulare e INTELLIGENCE.

Resta obbligatorio:
- installer alpha.9 e collaudo desktop;
- approvazione esplicita dell'utente prima del merge.
