# Completamento Programmazione da zero

Stato: in corso
Assegnazione: Codex — integrazione verificata della Lezione 0.9 e relativo Python Project
Branch: `agent/integrate-programming-lesson-0-9`
Pull request: https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/26
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

Nessuno. La Lezione 0.3 usa l’integrazione dinamica già presente e non modifica file condivisi o l’area di lavoro protetta.

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

## Estensione in revisione · Lezione 0.3

Il documento locale `Programmazione_da_Zero_Lezione_0.3_Rappresentazione_dell_informazione.docx` è stato usato soltanto come fonte e, secondo l’indicazione editoriale, non viene caricato nel repository.

File della proposta:

- `src/lib/catalog/subjects/programming-zero-lesson-0-3-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

Contenuti convertiti:

- 11 sezioni e 808 blocchi renderizzabili;
- 10 esercizi guidati e 30 esercizi autonomi;
- 30 domande di quiz;
- 50 voci di glossario;
- prova finale, rubrica e criteri di completamento;
- impronta SHA-256 della fonte locale, senza includere il DOCX.

## Estensione in revisione · Lezione 0.4

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.4_Logica_e_ragionamento_booleano.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-4-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. L'integrazione usa il modello dinamico della Lezione 0.3 e non modifica l'area di lavoro protetta.

Dipendenza: PR #4 già unita; branch basato su `main` aggiornato.

Contenuti convertiti:

- 11 sezioni e 808 blocchi renderizzabili;
- 10 esercizi guidati e 30 esercizi autonomi;
- 30 domande di quiz e 50 voci di glossario;
- prova finale, rubrica e criteri di completamento;
- impronta SHA-256 `8508d2e700c8ddbc07e38dce1344b54da037764189dee40abbfbfd153d2c18fa`, senza includere il DOCX;
- normalizzato il solo refuso `LEZIONE 0.2` → `LEZIONE 0.4` nelle dieci intestazioni di capitolo, dopo confronto con il contenuto distinto della fonte 0.2.

Verifiche: test mirato 21/21, suite completa 138/138, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 0.9

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.9_Laboratorio_e_valutazione_finale.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-9-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #15; branch e Draft PR impilati sulla lezione 0.8.

Contenuti convertiti:

- 11 sezioni e 859 blocchi renderizzabili;
- 10 esercizi guidati e 30 esercizi autonomi;
- 30 domande di quiz e 50 voci di glossario;
- prova scritta integrata, rubrica del progetto, portfolio, recupero e criteri finali del Modulo 0;
- impronta SHA-256 `cac28baa626f64d6e79c10b47784704031cec4f4e8d27f26b04f25dd8773bb9b`, senza includere il DOCX;
- indice editoriale conclusivo letto integralmente e usato per validare ordine, copertura e titolo da Catalogo; indice non caricato nel repository.

Verifiche della PR #26: test mirati 29/29, suite completa 144/144, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 0.8

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.8_Impatto_del_software.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-8-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #13; branch e Draft PR impilati sulla lezione 0.7.

Contenuti convertiti:

- 13 sezioni e 959 blocchi renderizzabili;
- 12 esercizi guidati e 36 esercizi autonomi;
- 36 domande di quiz e 60 voci di glossario;
- prova finale, rubrica e criteri di completamento;
- impronta SHA-256 `441b9e1af37992314cd0ded71a8196929786f3741a4bb2d90d371da4a24af017`, senza includere il DOCX.

Verifiche dichiarate dalla proposta originale: test mirato 21/21, suite completa 138/138, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`. L’integrazione su `main` e il nuovo Python Project vengono verificati nuovamente nella PR #24.

## Estensione in revisione · Lezione 0.7

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.7_Storia_e_aree_dell_informatica.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-7-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #12; branch e Draft PR impilati sulla lezione 0.6.

Contenuti convertiti:

- 13 sezioni e 956 blocchi renderizzabili;
- 12 esercizi guidati e 36 esercizi autonomi;
- 36 domande di quiz e 60 voci di glossario;
- prova finale, rubrica e criteri di completamento;
- impronta SHA-256 `e66df7f6d2469614a86f66274fe36078dcae5e27dfc24ad690d133c4f94dfaff`, senza includere il DOCX.

Verifiche dichiarate dalla proposta originale: test mirato 21/21, suite completa 138/138, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`. L’integrazione su `main` e il nuovo Python Project vengono verificati nuovamente nella PR #22.

## Estensione in revisione · Lezione 0.6

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.6_Come_nasce_il_software.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-6-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #11; branch e Draft PR impilati sulla lezione 0.5.

Contenuti convertiti:

- 13 sezioni e 956 blocchi renderizzabili;
- 12 esercizi guidati e 36 esercizi autonomi;
- 36 domande di quiz e 60 voci di glossario;
- laboratorio finale, rubrica e criteri di completamento;
- impronta SHA-256 `e4508786bb492e2b22d2a930bf55068e0a22a6631711ce1cc4fd65c22deeb58e`, senza includere il DOCX.

Verifiche dichiarate dalla proposta originale: test mirato 21/21, suite completa 138/138, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`. L'integrazione su `main` e il nuovo Python Project vengono verificati nuovamente nella PR #19.

## Estensione in revisione · Lezione 0.5

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_0.5_Pensiero_computazionale_e_pseudocodice.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-0-5-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #9; il branch e la Draft PR 0.5 sono impilati sulla lezione 0.4.

Contenuti convertiti:

- 11 sezioni e 800 blocchi renderizzabili;
- 10 esercizi guidati e 30 esercizi autonomi;
- 30 domande di quiz e 50 voci di glossario;
- prova finale, rubrica e criteri di completamento;
- impronta SHA-256 `1faa694e1279feb929c9c145ba0a253cfc1b4281a3e7fde2155ca69bf05ac5ca`, senza includere il DOCX.

Verifiche dichiarate dalla proposta originale: test mirato 21/21, suite completa 138/138, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`. L'integrazione su `main` e i nuovi Python Project vengono verificati nuovamente nella PR #14.

