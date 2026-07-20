# Completamento Programmazione da zero

Stato: disponibile
Assegnazione prevista: Codex dell'altro computer
Branch previsto: `codex/programming-zero`
Pacchetto: `programming`
Percorso: `programming-zero`

## Obiettivo

Sviluppare i contenuti completi del corso esistente “Programmazione da zero” e inserirli realmente nell'app. L'incarico comprende lezioni, esempi, esercizi, verifiche, progressione didattica, test e collegamenti necessari affinché i contenuti siano utilizzabili dal catalogo e dall'aula.

## File principali disponibili

- `src/lib/catalog/subjects/programming.ts`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

L'agente può creare nuovi file dedicati sotto percorsi chiaramente riferiti a Programmazione.

## Area di lavoro protetta

- `src/components/room/programming-lesson-workspace.tsx`
- componenti condivisi dell'aula e del lettore

Il funzionamento e il layout già approvati non devono essere riprogettati. Modifiche minime sono ammesse soltanto se indispensabili per visualizzare i nuovi contenuti e devono essere dichiarate prima.

## Integrazione end-to-end

L'agente può collegare direttamente i contenuti al corso, al catalogo e all'aula. Prima di modificare un file condiviso deve:

1. elencarlo in questa scheda nella sezione “File condivisi prenotati”;
2. registrarlo in `CODEX_COORDINATION.md`;
3. verificare che nessun'altra attività o pull request lo stia già modificando;
4. includere test di regressione appropriati.

## File condivisi prenotati

Nessuno. Da compilare durante la presa in carico soltanto se necessario.

## Criteri di completamento

- contenuti didattici completi e coerenti con il percorso approvato;
- contenuti realmente raggiungibili dall'app, non soltanto presenti come file isolati;
- progressi ed esercizi compatibili con il funzionamento esistente;
- nessuna regressione dell'area di lavoro;
- test, typecheck, lint e build eseguiti;
- Draft Pull Request aperta e scheda aggiornata.

Terminata e unita questa attività, lo stesso Codex potrà prendere in carico qualsiasi altro corso o funzione.
