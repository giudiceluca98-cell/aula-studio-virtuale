# Python Project guidati

Stato: completato
Assegnazione: Codex
Branch: `codex/guided-python-projects`
Pull request: [#8](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/8)
Commit di merge: `585a67e5becab15b9c9b87e283d6eda53b4c81de`

## Obiettivo completato

La sezione “Progetto modulo” è stata sostituita da “Python Project”: tre micro-progetti pratici e progressivi, uno per lezione, eseguibili direttamente nell'app con output visibile e consegna separata.

## Soluzione

- Python reale tramite Pyodide/WebAssembly;
- esecuzione in un Web Worker isolato dal thread dell'interfaccia;
- sottoinsieme didattico limitato a variabili, calcoli, condizioni e `print`;
- timeout e validazione sintattica per evitare blocchi;
- nessuna esecuzione di codice utente sui server dell'app;
- salvataggio separato per le lezioni 0.1, 0.2 e 0.3 usando le tabelle esistenti;
- Eve indirizza al successivo Python Project ancora da completare.

## Verifica eseguita

- runtime Pyodide reale avviato nel Web Worker;
- programma di prova eseguito nel browser con output `Ciao Luca`;
- persistenza di bozza e consegna coperta dai test;
- `pnpm typecheck`, `pnpm lint`, `pnpm test` e `pnpm build` superati;
- deployment Vercel di produzione `ENgN1hZzkuuS3xPPGCsihkgK51xm` pronto;
- scheda “Python Project” e stato “Python pronto” verificati nell'aula online.
