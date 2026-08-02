# INTELLIGENCE-0.7 — Freschezza, contraddizioni e salute delle fonti

Stato: `REVIEW_REQUIRED`.

## Dipendenze
- INTELLIGENCE-0.3: revisione e promozione controllata;
- INTELLIGENCE-0.6: corpus indicizzato e retrieval ibrido;
- CORE-1.6: provider e runtime controllati, senza dipendenza necessaria per i check deterministici.

## Obiettivo
Rendere osservabili obsolescenza, modifiche, rimozioni, sostituzioni e contraddizioni,
senza trasformare un punteggio tecnico in approvazione automatica.

## Ambito
- date di acquisizione e della fonte;
- scadenza globale e configurabile per singola fonte;
- coda `due` per ricontrolli periodici espliciti;
- confronto checksum e creazione di una nuova acquisizione soltanto se il contenuto cambia;
- stati separati di disponibilità, freschezza e coerenza;
- fonte rimossa, non disponibile, modificata o sostituita;
- registro conflitti con claim e locator;
- preferenza umana motivata, oppure mantenimento di entrambe le fonti;
- snapshot immutabili e riferimenti alle citazioni storiche;
- report di copertura e affidabilità del corpus;
- health score informativo, mai usato per approvare o promuovere.

## Escluso
- scheduler nascosto o crawling continuo;
- revoca automatica di una promozione;
- approvazione automatica;
- risoluzione AI autonoma delle contraddizioni;
- cancellazione delle fonti storiche;
- modifica dei pesi del modello.

## Feature flag
- `EVE_RESEARCH_SOURCE_HEALTH_ENABLED=false`
- `EVE_RESEARCH_SOURCE_RECHECK_ENABLED=false`
- `EVE_RESEARCH_SOURCE_CONFLICTS_ENABLED=false`
- `EVE_RESEARCH_CORPUS_REPORTING_ENABLED=true`

## Gate
Suite specifica e cumulativa verde, isolamento cross-room, checksum invariato senza
nuova acquisizione, contenuto modificato in quarantena, rimozione e backoff,
preferenza umana motivata, report verificabile e prova desktop alpha.16.
