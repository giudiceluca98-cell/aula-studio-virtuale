# CORE-1.7 — Gate MVP end-to-end — PLAN

Stato iniziale: PLANNED.
Stato del pacchetto: FUNCTIONAL_TESTING.
Dipendenze: CORE-1.3, CORE-1.4, CORE-1.5, CORE-1.6 e INTELLIGENCE-0.7.

## Obiettivo
Dimostrare il primo percorso completo: utente autenticato, contesto didattico verificato,
materiali autorizzati, retrieval, risposta grounded, citazioni, apertura fonte e feedback.

## Incluso
- feature flag server-side;
- route autenticata;
- composizione Context Builder + FastAPI RAG + source opening;
- persistenza di conversazione, messaggi, traccia e feedback con RLS;
- blocco cross-room;
- risposta non trovata quando le fonti non bastano;
- nessuna memoria e nessuna azione automatica;
- test positivi, negativi e preview canonica.

## Escluso
Streaming, memoria, strumenti, conversazioni condivise, provider configurato nel client,
pubblicazione automatica, modifiche alla produzione e integrazione nel branch ufficiale.

## Rollback
Feature flag OFF, rollback dei file e rollback della migrazione soltanto dopo backup e
verifica di assenza dati da conservare.
