# Python Project per le lezioni 0.4 e 0.5

Stato: in revisione
Assegnazione: Codex
Branch: `agent/python-project-lesson-0-4`

## Obiettivo

Aggiungere al Python Project un'attività pratica coerente con la lezione 0.4 “Logica, proposizioni e ragionamento booleano”, collegandola al salvataggio e all'avanzamento già esistenti. La stessa regola viene applicata alla lezione 0.5 durante la sua integrazione, senza anticipare contenuti successivi.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `src/components/room/programming-lesson-workspace.tsx` (soltanto testi e griglia del Python Project; nessuna riprogettazione)
- `tests/programming-python-project.test.tsx`
- `tests/programming-subject.test.ts`

## Coordinamento con la lezione 0.5

La Draft PR #11 è impilata sul vecchio branch della lezione 0.4 e modifica due degli stessi file. Non viene modificato il branch dell'altro Codex. L'integrazione ufficiale 0.5 viene riportata su questo branch a partire da `main`, quindi completata con il relativo Python Project prima della pubblicazione.

## Verifiche previste

- test del Python Project e del corso;
- `pnpm test`;
- `pnpm typecheck`;
- `pnpm lint`;
- `pnpm build`;
- verifica della versione pubblicata.

## Risultato

- aggiunto “Una regola di accesso verificabile” per la lezione 0.4, con confronti, `AND`, `OR`, `NOT` e verifica dei confini;
- aggiunto “Dall’algoritmo al primo programma” per la lezione 0.5, con input, output, sequenza, selezione e precondizione contro la divisione per zero;
- consegne separate collegate al salvataggio e all'avanzamento esistenti;
- Eve aggiornata per proporre tutti i Python Project disponibili;
- area di lavoro modificata soltanto nei testi e nella griglia interna alla scheda Python Project.

## Verifiche eseguite

- test mirati: 25/25;
- suite completa: 140/140;
- typecheck: superato;
- lint: nessun errore, un warning preesistente in `src/lib/vocabulary/mastery.ts`;
- build di produzione: superata.
