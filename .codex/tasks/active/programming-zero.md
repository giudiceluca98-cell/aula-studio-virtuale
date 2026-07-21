# Completamento Programmazione da zero

Stato: in revisione
Assegnazione: Codex — integrazione delle sole fonti ufficiali 0.1 e 0.2
Branch: `codex/programming-zero`
Pull request: https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/3
Pacchetto: `programming`
Percorso: `programming-zero`

## Obiettivo

Sviluppare i contenuti completi del corso esistente “Programmazione da zero” e inserirli realmente nell'app. L'incarico comprende lezioni, esempi, esercizi, verifiche, progressione didattica, test e collegamenti necessari affinché i contenuti siano utilizzabili dal catalogo e dall'aula.

## File principali disponibili

- `src/lib/catalog/subjects/programming.ts`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

## File previsti per questa integrazione

- `docs/courses/programming-zero/source/Programmazione_da_Zero_Lezione_0.1_Che_cosa_significa_programmare.docx` (sola lettura)
- `docs/courses/programming-zero/source/Programmazione_da_Zero_Lezione_0.2_Che_cosa_e_un_computer.docx` (sola lettura)
- `scripts/generate-programming-zero-content.mjs`
- `src/lib/catalog/subjects/programming-zero-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/catalog/subjects/programming.ts`
- `src/lib/programming-lesson-progress.ts`
- `src/components/room/programming-lesson-workspace.tsx` (modifica minima di rendering)
- `src/lib/catalog/roadmap.ts` (collegamento al catalogo; file condiviso prenotato)
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

- `src/lib/catalog/roadmap.ts` — prenotato per collegare le lezioni ufficiali 0.1 e 0.2 al percorso esistente.

## Criteri di completamento

- contenuti didattici completi e coerenti con il percorso approvato;
- contenuti realmente raggiungibili dall'app, non soltanto presenti come file isolati;
- progressi ed esercizi compatibili con il funzionamento esistente;
- nessuna regressione dell'area di lavoro;
- test, typecheck, lint e build eseguiti;
- Draft Pull Request aperta e scheda aggiornata.

## Risultato dell’integrazione

- importate integralmente e in ordine le sole lezioni ufficiali 0.1 e 0.2;
- sostituiti i precedenti contenuti didattici non provenienti dalle fonti;
- collegati 22 sezioni, 80 esercizi, 60 domande di quiz, 100 voci di glossario e 2 prove finali;
- conservati l’identificatore del materiale nativo e il sistema di salvataggio dei progressi già esistente;
- catalogo, percorso, aula ed Eve aggiornati senza modifiche a Supabase o Vercel;
- test, typecheck, lint e build eseguiti; resta un solo warning lint preesistente in `src/lib/vocabulary/mastery.ts`.

Terminata e unita questa attività, lo stesso Codex potrà prendere in carico qualsiasi altro corso o funzione.
