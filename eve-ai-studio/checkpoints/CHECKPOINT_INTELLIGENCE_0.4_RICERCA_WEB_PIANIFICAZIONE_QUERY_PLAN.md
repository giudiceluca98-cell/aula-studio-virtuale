# INTELLIGENCE-0.4 — Ricerca web e pianificazione delle query

Stato iniziale: `FUNCTIONAL_TESTING`.

## Obiettivo
Eseguire query già pianificate tramite provider configurabili, senza trasformare il centro ricerca in un crawler e senza acquisire automaticamente i risultati.

## Incluso
- interfaccia provider sostituibile;
- provider disattivati per impostazione predefinita;
- lifecycle query `planned → running → succeeded/failed`;
- limiti per progetto, aula, attore e giorno;
- filtri per dominio, lingua, data e tipo di fonte;
- normalizzazione e deduplicazione URL;
- ranking motivato;
- retry e fallback tracciati;
- costo e request ID del provider;
- registrazione opzionale dei risultati come candidati in quarantena;
- nessuna acquisizione automatica;
- isolamento per aula;
- anteprima canonica dichiarata come simulazione.

## Escluso
Crawling, login/cookie, acquisizione automatica, approvazione, embedding, addestramento, provider reale preconfigurato e chiavi nel client.

## Feature flag
`EVE_RESEARCH_SEARCH_ENABLED=false`.

## Dipendenze
INTELLIGENCE-0.2, INTELLIGENCE-0.3, CORE-1.2 e CORE-1.3 applicati nell'ordine indicato nel memo.
