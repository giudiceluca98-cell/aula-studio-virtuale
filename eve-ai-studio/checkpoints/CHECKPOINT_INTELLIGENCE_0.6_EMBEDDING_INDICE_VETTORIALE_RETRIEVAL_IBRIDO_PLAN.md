# INTELLIGENCE-0.6 — Embedding, indice vettoriale e retrieval ibrido

Stato iniziale: `FUNCTIONAL_TESTING` nel pacchetto locale, non chiuso.

## Obiettivo
Affiancare al retrieval lessicale un indice vettoriale versionato e un retrieval
ibrido verificabile, mantenendo approvazione umana, isolamento per aula, locator e
fallback lessicale.

## Dipendenze
- INTELLIGENCE-0.3: revisione e promozione esplicita;
- INTELLIGENCE-0.5: ingestione con segmenti e locator;
- CORE-0.8/0.9/1.1: materiali, chunk, citazioni e apertura fonti.

## Incluso
- provider embedding sostituibile;
- provider locale deterministico per test, senza rete;
- modello, dimensioni e job versionati;
- job idempotenti e ricostruibili;
- indice persistente separato per `room_id`;
- indicizzazione soltanto di una promozione attiva;
- ricerca lessicale + semantica + filtri;
- reranking e deduplicazione dei passaggi;
- soglia minima e fallback lessicale;
- cancellazione/ricostruzione dell'indice;
- metriche di latenza, token, costo, precision@k e recall@k;
- locator obbligatorio per ogni risultato.

## Escluso
- provider embedding remoto configurato automaticamente;
- addestramento o modifica dei pesi;
- indicizzazione di contenuti in quarantena non approvati;
- database vettoriale esterno;
- citazioni prive di locator.

## Feature flag
- `EVE_RESEARCH_EMBEDDINGS_ENABLED=false`
- `EVE_RESEARCH_HYBRID_RETRIEVAL_ENABLED=false`

## Gate
Test specifici e cumulativi verdi, isolamento cross-room, idempotenza, fallback,
cancellazione/ricostruzione, nessun contenuto non approvato nell'indice e prova
desktop della release alpha.14.
