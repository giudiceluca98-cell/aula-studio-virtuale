# Verifica INTELLIGENCE-0.6

Controlli locali preparati:
- stabilità e normalizzazione del provider deterministico;
- flag OFF;
- promozione attiva obbligatoria;
- idempotenza e rebuild;
- isolamento tra aule;
- locator verificabile;
- fallback lessicale;
- deduplicazione SHA-256;
- delete/rebuild;
- precision@k e recall@k;
- API status ed errore disabilitato;
- sintassi Python/JavaScript;
- preview senza `fetch`;
- applicazione anti-drift e rollback.

Codex deve ripetere la suite sull'ultima baseline, eseguire la suite cumulativa,
verificare browser e desktop, quindi produrre alpha.14 firmata.
