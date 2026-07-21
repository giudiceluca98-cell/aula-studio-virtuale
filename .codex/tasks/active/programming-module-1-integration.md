# Integrazione Modulo 1 · Lezioni 1.1 e 1.2

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-module-1`
Pull request: [PR #29](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/29)

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

## Integrazione eseguita

- importati esclusivamente gli artefatti ufficiali delle lezioni 1.1 e 1.2 dai commit di AndreaGiudice94;
- escluse le copie impilate delle lezioni 0.4–0.9 presenti nei branch sorgente;
- creato il Modulo 1 separato nel catalogo, nel percorso e nell’indice dell’aula;
- collegati esercizi, quiz, glossario, prove finali, Eve e avanzamento;
- aggiunti due Python Project compatibili con l’esecutore isolato già presente;
- verificati i contenuti tecnici della lezione 1.2 rispetto alla documentazione ufficiale Python corrente.

Impronte delle fonti dichiarate negli artefatti:

- Lezione 1.1: `adf2899abed24ff5b51ae9ec693cd24e73d40c8b0debfa25a60415cda3e8d755`;
- Lezione 1.2: `3cc6e6166ef7e3ead6e11dd70a23aca68dc7bf4773bbf928eff4260cfdef952a`.

Verifiche completate: typecheck, lint senza errori e build di produzione. L’esecuzione locale di Vitest è impedita dal profilo filesystem del sandbox; le aspettative del test dedicato sono state aggiornate e compilano correttamente.
