# CORE-1.4 — Identità, ruoli, permessi e Context Builder — PLAN

Stato iniziale: `PLANNED`
Dipendenze: `CORE-1.3`, con sequenza coordinata fino a `INTELLIGENCE-0.4`.

## Obiettivo

Costruire il contesto minimo che Eve può usare partendo esclusivamente da identità e
risorse verificate server-side. Il client propone identificativi; il server autorizza,
minimizza, firma e registra l'operazione.

## Incluso

- sessione autenticata;
- appartenenza all'aula;
- ruoli student, teacher, author, admin;
- corso, materia, modulo, lezione e sezione corrente;
- testo selezionato legato a un materiale autorizzato;
- allowlist di materiali CORE attivi;
- contesto privato e condiviso distinti;
- token HMAC a TTL breve;
- audit senza testo selezionato;
- RLS e test cross-room.

## Escluso

- memoria permanente;
- provider AI reale;
- condivisione automatica del testo;
- diagnosi o inferenza dei ruoli;
- strumenti o azioni nell'app;
- modifica di Supabase remoto da parte del pacchetto.

## Feature flag

`EVE_CONTEXT_BUILDER_ENABLED=false` e
`EVE_CONTEXT_SHARED_SELECTION_ENABLED=false` per impostazione predefinita.
