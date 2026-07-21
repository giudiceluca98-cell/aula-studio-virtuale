# Integrazione Modulo 1 · Lezioni 1.1 e 1.2

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-module-1`
Pull request: da aprire

## Obiettivo

Integrare nell’attuale corso “Programmazione da zero” le lezioni ufficiali disponibili del Modulo 1, recuperando gli artefatti delle PR #17 e #20 senza reintrodurre le vecchie versioni delle lezioni 0.4–0.9.

## Lezioni disponibili

- Lezione 1.1 · Che cos’è un ambiente di sviluppo?
- Lezione 1.2 · Installare Python

## Correzione del blocco

Le proposte originali sono impilate su una base precedente a tutte le integrazioni e correzioni del Modulo 0. L’integrazione viene ricostruita sull’attuale `main`, conservando soltanto gli artefatti ufficiali 1.1 e 1.2 e adattando in modo incrementale aggregatore, moduli, progressi e test.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson-1-1-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-1-2-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/catalog/subjects/programming.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`
- eventuali nuovi test dedicati al Modulo 1
- `.codex/tasks/active/programming-zero.md`
- `.codex/tasks/active/programming-module-1-integration.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

- `src/lib/catalog/roadmap.ts`

## Vincoli

- non sovrascrivere contenuti o correzioni del Modulo 0;
- non riprogettare layout, navigazione o area di lavoro;
- collegare realmente lezioni, quiz, esercizi, glossario, Eve e avanzamento;
- integrare Python Project proporzionati soltanto se supportati inequivocabilmente dagli argomenti delle lezioni;
- non modificare Supabase, segreti o variabili ambiente.

## Verifiche previste

- provenienza, impronte e struttura degli artefatti;
- test mirati 1.1 e 1.2;
- suite completa;
- typecheck;
- lint;
- build di produzione;
- verifica online dopo merge e deployment.
