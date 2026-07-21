# Python Project guidati

Stato: in corso
Assegnazione: Codex
Branch: `codex/guided-python-projects`
Pull request: da aprire

## Obiettivo

Sostituire la sezione “Progetto modulo” con “Python Project”: tre micro-progetti pratici e progressivi, uno per lezione, eseguibili direttamente nell'app con output visibile e consegna separata.

## Scelte tecniche

- Python reale tramite Pyodide/WebAssembly;
- esecuzione in un Web Worker isolato dal thread dell'interfaccia;
- sottoinsieme didattico limitato a variabili, calcoli, condizioni e `print`;
- timeout e validazione sintattica per evitare blocchi;
- nessuna esecuzione di codice utente sui server dell'app;
- salvataggio separato per le lezioni 0.1, 0.2 e 0.3 usando le tabelle esistenti.

## File previsti e riservati

- `next.config.ts`
- `public/python-runner.worker.mjs`
- `src/hooks/use-python-runner.ts`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `src/components/room/programming-lesson-workspace.tsx` (area protetta, modifica richiesta dall'utente)
- `src/components/room/material-workspace-viewer.tsx`
- `src/app/api/rooms/[roomId]/materials/[materialId]/content/route.ts`
- `src/app/api/rooms/[roomId]/materials/[materialId]/lesson/route.ts`
- test dedicati e test del corso esistenti
- `.codex/tasks/active/guided-python-projects.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

Nessun file dell'elenco condiviso. Non sono previste dipendenze o migrazioni Supabase.

## Criteri di completamento

- la scheda si chiama “Python Project”;
- sono presenti tre progetti semplici e proporzionati alle lezioni;
- ogni progetto ha istruzioni, codice iniziale, output, esecuzione e consegna distinti;
- il codice gira soltanto nel browser e non può usare import, rete, file o cicli infiniti;
- le consegne restano disponibili dopo il ricaricamento;
- il modulo considera concluso il progetto soltanto dopo le tre consegne;
- test, typecheck, lint e build superati.
