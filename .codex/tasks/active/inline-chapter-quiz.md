# Quiz interattivi dentro i capitoli

Stato: in corso
Assegnazione: Codex
Branch: `codex/inline-chapter-quiz`
Pull request: da aprire

## Obiettivo

Sostituire, durante la lettura di ogni capitolo di “Programmazione da zero”, la rappresentazione testuale dei quiz e delle relative soluzioni con domande interattive. La scheda “Quiz” continua a mostrare tutti i quiz della lezione e riutilizza le stesse risposte salvate.

## Vincoli

- non modificare domande, opzioni, risposte corrette o contenuti editoriali ufficiali;
- non mostrare la soluzione prima che l'utente selezioni una risposta;
- usare gli identificativi e il salvataggio dei progressi già esistenti;
- mantenere invariati navigazione, esercizi, progetto, glossario ed Eve;
- mantenere l'esperienza utilizzabile anche su telefono.

## File previsti e riservati

- `src/components/room/programming-lesson-workspace.tsx` (area di lavoro protetta, modifica richiesta dall'utente)
- `tests/programming-lesson-navigation.test.tsx`
- eventuale nuovo test dedicato ai quiz nei capitoli
- `.codex/tasks/active/inline-chapter-quiz.md`
- `CODEX_COORDINATION.md`

## Criteri di completamento

- ogni capitolo mostra soltanto i propri quiz interattivi;
- le soluzioni testuali non compaiono nella lettura;
- la risposta data nel capitolo è visibile anche nella scheda “Quiz” e viceversa;
- la scheda “Quiz” continua a raccogliere tutti i quiz della lezione;
- test, typecheck, lint e build superati.
