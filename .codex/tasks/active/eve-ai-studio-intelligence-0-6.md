# INTELLIGENCE-0.6 — Embedding, indice vettoriale e retrieval ibrido

- Stato: `REVIEW_REQUIRED`
- Responsabile: Codex integrazione funzionale, UI canonica e desktop di prova
- Branch: `codex/eve-ai-studio-intelligence-0-6`
- Base: `origin/eve-ai-studio @ 1bc0178`
- Destinazione PR: `eve-ai-studio`

## Obiettivo

Integrare il pacchetto INTELLIGENCE-0.6 sul solo corpus approvato, verificando
isolamento cross-room, versioni, locator, SHA-256, fallback lessicale e feature
flag OFF. Preparare una sola Draft PR. La desktop alpha.14 richiede una distinta
autorizzazione dopo tutti i test.

## File prenotati

I file elencati nella scheda INTELLIGENCE-0.6 di `CODEX_COORDINATION.md` e nel
manifest ufficiale del pacchetto.

## Vincoli

Nessuna demo o sorgente duplicata; nessun provider o segreto client-side;
nessun contenuto non promosso nell'indice; nessuna modifica a `main`,
`demo-canonica`, Aula Studio, Supabase remoto, Vercel o produzione; nessun merge
o rilascio senza autorizzazione esplicita dell'utente.

## Verifiche

- 13 test Python specifici e 261 cumulativi;
- 224 test web, typecheck e build Next.js;
- sintassi e lint mirato JavaScript;
- test e coerenza versione desktop `1.2.0-alpha.14`;
- browser HTTP canonico: indice 5/5 e retrieval 6/6, console pulita.

Correzioni: confronto baseline CRLF nel validatore estratto, esclusione dal
retrieval delle promozioni revocate e badge canonico aggiornato a 0.6.
