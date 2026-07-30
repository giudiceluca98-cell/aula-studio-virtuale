# INTELLIGENCE-0.3 — Piano: revisione umana, qualità e promozione controllata

Data di avvio proposta: 29 luglio 2026  
Baseline obbligatoria: `INTELLIGENCE-0.2` chiuso, approvato e installato come `1.2.0-alpha.6`  
Linea: `INTELLIGENCE`  
Stato iniziale: `PLANNED → IN_PROGRESS`

## Obiettivo

Trasformare un documento acquisito e mantenuto in quarantena in una fonte valutabile,
senza confondere il download con l'approvazione didattica e senza inserire contenuti
nei materiali CORE mediante automatismi o soli punteggi.

## Ambito incluso

- coda di revisione separata per aula;
- identità e ruolo del revisore;
- revisione fissata all'acquisizione esatta tramite `acquisition_id` e SHA-256;
- stati `quarantined`, `under_review`, `approved`, `rejected`, `expired`, `superseded`;
- autore, editore, data, licenza e lingua quando disponibili;
- punteggi 0–100 per qualità, autorevolezza, aggiornamento, pertinenza e completezza;
- punteggi utilizzati soltanto come evidenza per il revisore;
- analisi deterministica di contenuti sospetti e indicatori di prompt injection;
- presa d'atto esplicita prima di approvare un contenuto segnalato;
- motivazione obbligatoria per approvazione, rifiuto e revoca;
- cronologia immutabile degli eventi di revisione;
- confronto tra le due acquisizioni riuscite più recenti della stessa fonte;
- scadenza della revisione quando cambia l'acquisizione;
- promozione esplicita e idempotente verso il catalogo materiali CORE;
- provenienza completa tra progetto, fonte, acquisizione, revisione, promozione,
  materiale e versione;
- revoca senza cancellare versioni, metadati o audit;
- esclusione dal retrieval mediante disattivazione del `current_version_id`;
- feature flag server-side distinti per revisione e promozione;
- preview canonica interattiva dichiarata come simulazione UI.

## Ambito escluso

- approvazione automatica basata su punteggi, regole o modelli;
- ricerca web generalista;
- crawling;
- embedding e retrieval vettoriale;
- provider AI reale;
- addestramento del modello;
- cancellazione distruttiva della cronologia;
- modifiche a `main`, `demo-canonica`, Aula Studio, Vercel o produzione;
- demo, HTML alternativi, standalone o nuove cartelle preview;
- pubblicazione autonoma della release.

## Modello di sicurezza

1. Tutti i contenuti acquisiti restano dati esterni non fidati.
2. L'analisi di sicurezza genera indicatori, non decisioni.
3. L'approvazione richiede identità, motivazione e punteggi completi.
4. Un contenuto sospetto richiede `risk_acknowledged=true`.
5. La promozione richiede una revisione approvata della stessa acquisizione corrente.
6. La promozione è disattivata per impostazione predefinita.
7. L'idempotency key impedisce doppie importazioni intenzionali.
8. La revoca disattiva il materiale dal retrieval ma conserva la cronologia.
9. L'isolamento per `room_id` viene applicato a revisioni, eventi e promozioni.
10. Nessun punteggio o scanner cambia autonomamente lo stato in `approved`.

## API previste

```http
GET  /v1/intelligence/research/reviews
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/review/start
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/review
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/review/decision
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/review/events
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/versions/compare
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/promote
GET  /v1/intelligence/research/projects/{project_id}/sources/{source_id}/promotion
POST /v1/intelligence/research/projects/{project_id}/sources/{source_id}/promotion/revoke
```

## Dati scritti

Database ricerca:

- `research_source_reviews`;
- `research_review_events`;
- `research_source_promotions`;
- aggiornamento controllato dello stato della fonte candidata.

Database materiali CORE:

- materiale e versione soltanto dopo promozione esplicita;
- metadati di provenienza completi;
- `current_version_id = NULL` durante la revoca, senza cancellare versioni e chunk.

## Feature flag

```text
EVE_RESEARCH_REVIEW_ENABLED=true
EVE_RESEARCH_PROMOTION_ENABLED=false
```

La promozione può essere abilitata nella build di test soltanto dal server o dalla
configurazione di release predisposta da Codex.

## Criteri di completamento

1. revisione attribuibile e isolata per aula;
2. motivazione obbligatoria per ogni decisione;
3. indicatori di prompt injection testati;
4. nessuna approvazione automatica;
5. confronto versioni e scadenza della revisione verificati;
6. promozione idempotente;
7. metadati di provenienza verificabili nel materiale CORE;
8. revoca che rimuove il materiale dal retrieval senza cancellare la storia;
9. API verificate;
10. preview canonica aggiornata senza HTML alternativi;
11. suite specifica e cumulativa verdi;
12. release desktop di prova installata e approvata dall'utente.

## Rollback

- ripristino dei file dal branch di partenza;
- rimozione dei nuovi moduli e test;
- nessuna cancellazione automatica dei database dell'utente;
- eventuali tabelle nuove restano compatibili e inattive se il codice viene ripristinato;
- materiali promossi durante test devono essere revocati prima del rollback applicativo.
