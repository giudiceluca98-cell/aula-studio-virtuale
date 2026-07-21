# Python Project per le lezioni 0.4 e 0.5

Stato: completato
Assegnazione: Codex
Branch: `agent/python-project-lesson-0-4`
Pull request: [#14](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/14)
Commit di merge: `15166e6971ba4c8c065fbad5cc6e286157499088`

## Obiettivo completato

Aggiungere al Python Project attività pratiche coerenti con le lezioni 0.4 e 0.5, collegate al salvataggio e all'avanzamento esistenti, senza anticipare contenuti successivi.

## File modificati

- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `src/components/room/programming-lesson-workspace.tsx` (soltanto testi e griglia del Python Project)
- `tests/programming-python-project.test.tsx`
- `tests/programming-subject.test.ts`

## Risultato

- aggiunto “Una regola di accesso verificabile” per la lezione 0.4, con confronti, `AND`, `OR`, `NOT` e verifica dei confini;
- aggiunto “Dall’algoritmo al primo programma” per la lezione 0.5, con input, output, sequenza, selezione e precondizione contro la divisione per zero;
- consegne separate collegate al salvataggio e all'avanzamento esistenti;
- Eve aggiornata per proporre tutti i Python Project disponibili;
- integrata e pubblicata la lezione ufficiale 0.5 dall'artefatto verificato della PR #11;
- area di lavoro modificata soltanto nella scheda Python Project.

## Verifiche eseguite

- test mirati: 25/25;
- suite completa: 140/140;
- typecheck: superato;
- lint: nessun errore, un warning preesistente in `src/lib/vocabulary/mastery.ts`;
- build di produzione: superata;
- deployment Vercel `dpl_CWXzKek3b7F5GesEvUSemgGsYxDb`: READY;
- Python Project 0.4 e 0.5 verificati nell'aula di produzione.
