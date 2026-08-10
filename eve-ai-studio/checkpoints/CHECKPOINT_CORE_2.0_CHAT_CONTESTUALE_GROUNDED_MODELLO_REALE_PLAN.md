# CORE-2.0 — Chat contestuale grounded con modello reale — PLAN

Stato del pacchetto: FUNCTIONAL_TESTING.
Dipendenze: CORE-1.6 e CORE-1.7, con sequenza completa indicata nel memo.

## Obiettivo
Realizzare una chat privata che combina contesto server-side, RAG interno e provider reale,
senza inventare fonti e mantenendo distinti materiale autorizzato e conoscenza generale.

## Incluso
- conversazione privata e owner verificato;
- contesto minimo firmato;
- retrieval RAG sui soli materiali autorizzati;
- provider reale via profilo chat-production;
- fallback deterministico dichiarato;
- modalità breve, normale e approfondita;
- output strutturato in fatti, ipotesi e suggerimenti;
- basis materiale/generale su ogni affermazione;
- registry S1..Sn e rifiuto delle fonti inventate;
- risposta non trovata;
- citazioni apribili con locator e SHA-256;
- persistenza e RLS;
- nessuna memoria o azione automatica.

## Escluso
Streaming, interruzione, rigenerazione, ricerca nella cronologia, conversazioni condivise,
memoria, strumenti e attivazione automatica della conoscenza generale.
