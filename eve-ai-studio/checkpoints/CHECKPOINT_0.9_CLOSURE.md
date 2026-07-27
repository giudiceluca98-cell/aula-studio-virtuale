# Eve AI Studio — Chiusura Checkpoint 0.9

Data: 27 luglio 2026

Branch: `eve-ai-studio`

Versione verificata: `0.9.0`

## Esito

**CHECKPOINT 0.9 CHIUSO E APPROVATO**

L'utente ha approvato esplicitamente il Checkpoint 0.9 e ha autorizzato il passaggio al checkpoint successivo.

## Perimetro approvato

- retrieval lessicale locale;
- ranking deterministico `eve-lexical-v1`;
- isolamento per aula;
- uso delle sole versioni correnti `ready`;
- controllo SHA-256 dei chunk;
- esclusione dei chunk alterati;
- citazioni verificabili;
- segnalazione dei contenuti simili a prompt injection;
- API `/v1/retrieval/status` e `/v1/retrieval/search`;
- nessun embedding, provider esterno o database vettoriale.

## Verifica approvata

- 14 test specifici;
- 139 test cumulativi;
- 4 scenari retrieval nel browser;
- 5 scenari materiali nel browser;
- GitHub Actions completamente verde sul commit `ded899f36cd7cfa9832a984e7b3b916ddcce9f1c`.

## Passaggio autorizzato

Checkpoint 1.0 — chat RAG locale e deterministica con risposte costruite soltanto da fonti autorizzate e citazioni verificabili.

Restano esclusi dal passaggio automatico:

- provider AI reali;
- embedding;
- ricerca semantica;
- database vettoriali;
- integrazione nella produzione;
- modifica della demo canonica.
