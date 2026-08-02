# CORE-1.6 — Provider AI reale, segreti, budget e fallback — PLAN

Stato: REVIEW_REQUIRED
Dipendenze: CORE-1.2, CORE-1.4, CORE-1.5, INTELLIGENCE-0.6.

## Obiettivo

Attivare un provider AI reale server-side mantenendo mock, output strutturato, segreti
redatti, budget, timeout, retry, fallback, rate limit, circuit breaker e telemetria.

## Incluso

- adapter OpenAI-compatible sostituibile;
- HTTPS obbligatorio per provider remoti;
- API key esclusivamente server-side;
- output JSON validato in ChatResponse;
- profilo chat-production con fallback mock;
- budget per esecuzione e giornalieri;
- rate limit e circuit breaker;
- endpoint di stato privo di segreti;
- preview canonica dichiaratamente simulata.

## Escluso

- attivazione automatica del provider;
- scelta silenziosa di modello;
- streaming;
- strumenti o azioni eseguite dal modello;
- memoria automatica;
- pubblicazione o chiusura senza collaudo desktop.

## Flag iniziale e rollback

`EVE_EXTERNAL_PROVIDERS_ENABLED=false`. Il rollback ripristina i file; la disattivazione
immediata del flag mantiene disponibile il profilo mock.
