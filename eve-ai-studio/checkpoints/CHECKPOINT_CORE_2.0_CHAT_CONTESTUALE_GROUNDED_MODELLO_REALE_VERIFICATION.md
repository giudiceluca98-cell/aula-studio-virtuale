# CORE-2.0 — VERIFICATION

Verifiche locali eseguite il 2026-08-10:
- SHA-256 esterno e tutti gli hash interni del pacchetto verificati;
- drift della baseline rilevato e integrazione a tre vie eseguita preservando CORE-1.7;
- 2 test Python specifici e 286 test Python cumulativi superati;
- 248 test web cumulativi superati;
- TypeScript, lint mirato e build Next.js superati;
- route `/api/eve/chat` e `/api/eve/chat/source` incluse nella build;
- rollback protetto 0021 aggiunto prima del rollback 0020;
- persistenza assistant/finalizzazione riservata al client amministrativo server-side;
- FK composite messaggio/conversazione/aula e assenza di update RLS autenticato verificate dai test.

Resta obbligatorio prima di merge o release:
- PostgreSQL/Supabase temporaneo e RLS multiutente;
- provider reale configurato e output JSON validato;
- fonte inventata, fonte assente, cross-room, timeout, budget e fallback;
- installer alpha.18, firma e aggiornamento sopra alpha.17;
- test desktop e approvazione utente.
