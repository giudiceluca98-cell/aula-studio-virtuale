# CORE-1.6 — Provider AI reale, segreti, budget e fallback

- Stato: `REVIEW_REQUIRED`
- Branch: `codex/eve-ai-studio-core-1-6`
- Base: `origin/eve-ai-studio @ c821798`
- Destinazione: Draft PR verso `eve-ai-studio`

Integrare il pacchetto CORE-1.6 mantenendo provider esterni disattivati per
default, segreti esclusivamente server-side, output JSON strutturato, budget,
rate limit, circuit breaker e fallback verificabili.

Sono prenotati i file del manifest e, come file condiviso,
`reference/eve-ai-studio-preview/index.html`. Vietati demo duplicate, chiavi
reali, modifiche a produzione, merge e release senza autorizzazione esplicita.

Verifiche concluse: 10 test Python specifici, 271 cumulativi, 227 test web,
typecheck, lint mirato e build Next.js verdi. Corretto il tipo dell'ambiente
server-side per mantenere testabilità senza richiedere artificialmente
`NODE_ENV`. Desktop predisposto come `1.2.0-alpha.15`; pubblicazione e merge
restano separati e richiedono autorizzazione esplicita.
