# CORE-1.7 — VERIFICATION

Verifiche locali del pacchetto:
- applicazione anti-drift e idempotenza;
- sintassi Python e JavaScript;
- test FastAPI del percorso RAG → citazione → apertura fonte;
- test TypeScript del servizio con dipendenze fake;
- controllo migrazione RLS;
- preview senza fetch;
- rollback esatto.

Verifiche obbligatorie per Codex:
- typecheck, lint, Vitest e build completi;
- migrazione PostgreSQL/Supabase temporanea;
- test multiutente e cross-room reali;
- provider disponibile, timeout e fallback;
- fonte assente, hash errato, Eve disattivata;
- installer alpha.17, firma, update e collaudo desktop.
