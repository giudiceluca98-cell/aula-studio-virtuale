# Completamento Programmazione da zero

Stato: in corso
Assegnazione: Codex — integrazione sequenziale dei contenuti ufficiali, Lezione 3.5 corrente
Branch corrente: `codex/programming-zero-lesson-3-5`
Ultima integrazione completata: Lezione 0.9 e relativo Python Project, [PR #26](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/26)
Proposte in integrazione: Lezione 1.1, [PR #17](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/17), e Lezione 1.2, [PR #20](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/20)
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

## Estensione completata · Lezione 0.9

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

## Estensione in revisione · Lezione 1.3

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.3_Terminale_e_shell.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-1-3-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Base: `main`, che include già le lezioni 1.1 e 1.2 tramite PR #29. L'indice editoriale del Modulo 1 viene usato come controllo di ordine, titolo e copertura.

Contenuti convertiti:

- 11 sezioni e 804 blocchi renderizzabili;
- 10 esercizi guidati e 30 esercizi autonomi;
- 30 domande di quiz e 50 voci di glossario;
- laboratorio finale, rubrica e criteri di completamento;
- impronta SHA-256 `5dc43d5e590fcfa64f8dd169ef28b59f2399e495e0b58c689b59ed7a0f376b1a`, senza includere il DOCX;
- indice editoriale del Modulo 1 usato come controllo, senza caricarlo nel repository.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 2.2

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.2_Come_Python_esegue_un_programma.docx`. Il DOCX non verrà caricato nel repository. File riservati: artefatto 2.2, aggregatore, progressi e test. File condivisi prenotati: nessuno. Dipendenza: PR #38.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio, rubrica e criteri finali conservati. SHA-256 `00657c9f2fa9147c42c5585ac2c0ba0d66fdf6376e1efe8eb3a237b2d37c0e9f`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente.

## Estensione in revisione · Lezione 2.3

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.3_Sintassi_rientri_righe_vuote_commenti.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.3, aggregatore, progressi e test. Dipendenza: PR #39.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `d0f99a4174d942baf6404e8c4834006e5d2d5e43989ca36f454cc2ce9d08906e`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 3.5

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_3.5_Numeri_interi_rappresentazione_operazioni_casi_limite.docx`. Il DOCX non verrà caricato. File riservati: artefatto 3.5, aggregatore, progressi e test. Dipendenza: PR #52.

Contenuti convertiti: 11 sezioni, 915 blocchi, 60 esercizi, 30 quiz e 70 voci di glossario; laboratorio e otto criteri finali conservati. SHA-256 `65163ae728859ab9ea7d506239af698544e1cb58a131e3ce5123d3948d0fb2b3`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 3.4

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_3.4_Tipi_tipizzazione_dinamica_type_isinstance_compatibilita.docx`. Il DOCX non verrà caricato. File riservati: artefatto 3.4, aggregatore, progressi e test. Dipendenza: PR #51.

Contenuti convertiti: 11 sezioni, 915 blocchi, 60 esercizi, 30 quiz e 70 voci di glossario; laboratorio e otto criteri finali conservati. SHA-256 `d15f273e201953deba26b9be6ff6c3c1617e1fd254731ee8da760f9f01ceb7c3`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 3.3

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_3.3_Identificatori_convenzioni_denominazione_costanti.docx`. Il DOCX non verrà caricato. File riservati: artefatto 3.3, aggregatore, progressi e test. Dipendenza: PR #49.

Contenuti convertiti: 11 sezioni, 915 blocchi, 60 esercizi, 30 quiz e 70 voci di glossario; laboratorio e otto criteri finali conservati. SHA-256 `c5bbccb4665f3d5c38fb5370068e72484d799f5bd71311e37f56c5d4761f58fb`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 3.2

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_3.2_Assegnazione_riassegnazione_aggiornamenti_stato.docx`. Il DOCX non verrà caricato. File riservati: artefatto 3.2, aggregatore, progressi e test. Dipendenza: PR #48.

Contenuti convertiti: 11 sezioni, 915 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e otto criteri finali conservati. SHA-256 `d4e5a610eaf9a42ad3e72ec051b457fb5ead3af0bf3e8c8d59b28d5c481e383e`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 2.9

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.9_Laboratorio_conclusivo_e_valutazione.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.9, aggregatore, progressi e test. Dipendenza: PR #46. Indice e registro conclusivi confermano ordine, copertura e chiusura editoriale del Modulo 2 e non vengono caricati.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio conclusivo, valutazione e criteri finali conservati. SHA-256 `c8cdfbcc889f605d31ada72b5f3146cdafbbaee20e9497441261f55549472978`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 3.1

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_3.1_Valori_oggetti_nomi_variabili.docx`. Il DOCX non verrà caricato. File riservati: artefatto 3.1, aggregatore, progressi e test. Dipendenza: PR #47.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `8d6381855ff985eb103c7f76b07f198a859de58704bdd11b2f478c94eab57f53`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 2.8

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.8_Progettare_eseguire_revisionare_programmi_sequenziali.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.8, aggregatore, progressi e test. Dipendenza: PR #45. Indice e registro conclusivi del Modulo 2 sono stati letti integralmente come controllo editoriale e non vengono caricati.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `726d7940392fb03e4e6061edc2031ac660de82d52b190b3a5325e2affecec0e2`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 2.5

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.5_Produrre_output_con_print.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.5, aggregatore, progressi e test. Dipendenza: PR #41.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `ee0f232d89deb1ac50536e203a3121166f0743a6b43df38be2aaba37bd37f57a`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente. Un primo tentativo ha rilevato un ritardo occasionale del test UI del quiz, poi superato sia isolatamente sia nella suite completa.

## Estensione in revisione · Lezione 2.6

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.6_Modalita_interattiva_e_script.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.6, aggregatore, progressi e test. Dipendenza: PR #42.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `b57992d8b2c37e386d3eb43a00ce11e3a31c873d6315ffc54fd9662c2dc14594`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente. Il timeout del test cumulativo è stato portato a 10 secondi perché l'elaborazione delle 24 lezioni ha superato il limite precedente di 5 secondi.

## Estensione in revisione · Lezione 2.7

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.7_Errori_e_traceback.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.7, aggregatore, progressi e test. Dipendenza: PR #44.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `e22b440aa98c46696c17ec19f7410c8da43f461b598fcf22d927c372a9c8f3f5`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 2.4

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.4_Valori_letterali_prime_espressioni.docx`. Il DOCX non verrà caricato. File riservati: artefatto 2.4, aggregatore, progressi e test. Dipendenza: PR #40.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `285290f4529df08b155d7dde4c623f5c37f14c66dec5bfe593609be3f13a3611`.

Verifiche: test 151/151, typecheck e build superati; lint solo warning preesistente.

## Estensione in revisione · Lezione 2.1

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_2.1_Dal_file_py_al_primo_programma.docx`. Il DOCX non verrà caricato nel repository. Al momento non è presente un indice editoriale conclusivo del Modulo 2.

File riservati: artefatto 2.1, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #37; branch e Draft PR impilati sulla lezione 1.9.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio, rubrica e criteri finali conservati. SHA-256 `e2376f901858f41528ddaead1396d38a9f5d0c4b80db726911f0e6b3f593260a`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 1.9

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.9_Laboratorio_e_valutazione_finale.docx`. Il DOCX non verrà caricato nel repository; l'indice editoriale del Modulo 1 viene usato soltanto per validare ordine, titolo e copertura.

File riservati: artefatto 1.9, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #36; branch e Draft PR impilati sulla lezione 1.8.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; laboratorio integrato, rubrica di autovalutazione e criteri di accesso al Modulo 2 conservati. SHA-256 `208ebf5e21fb0828ce07ce0649899827f893217d400fccd857626d648b40a089`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 1.8

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.8_Eseguire_e_diagnosticare_programmi.docx`. Il DOCX non verrà caricato nel repository; l'indice editoriale del Modulo 1 viene usato soltanto per validare ordine, titolo e copertura.

File riservati: artefatto 1.8, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #35; branch e Draft PR impilati sulla lezione 1.7.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; prova finale, rubrica e criteri conservati. SHA-256 `ad4a92c5766519d4e95c8df3365354af88e0dd939802cf78572e021baafa4219`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 1.7

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.7_Struttura_progetto_e_riproducibilita.docx`. Il DOCX non verrà caricato nel repository; l'indice editoriale del Modulo 1 viene usato soltanto per validare ordine, titolo e copertura.

File riservati: artefatto 1.7, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #34; branch e Draft PR impilati sulla lezione 1.6.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; prova finale, rubrica e criteri conservati. SHA-256 `c887c4eba65d169db7547489344150a8043f2dfc641dc4c2a6acc522f9bd7ab7`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 1.5

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.5_Editor_e_IDE.docx`. Il DOCX non verrà caricato nel repository.

File riservati: artefatto 1.5, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #32.

Contenuti convertiti: 11 sezioni, 762 blocchi, 40 esercizi, 30 quiz e 50 voci di glossario; laboratorio e criteri finali conservati. SHA-256 `e8efc49c3afeab0c04b6326cc9086c76760e8c0cfe8ff5c7e5a40c2d2bee9377`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente.

## Estensione in revisione · Lezione 1.6

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.6_Ambienti_virtuali_e_dipendenze.docx`. Il DOCX non verrà caricato nel repository; l'indice editoriale del Modulo 1 viene usato soltanto per validare ordine, titolo e copertura.

File riservati: artefatto 1.6, `src/lib/catalog/subjects/programming-zero-lesson.ts`, `src/lib/programming-lesson-progress.ts`, `tests/programming-subject.test.ts`. File condivisi prenotati: nessuno. Dipendenza: PR #33; branch e Draft PR impilati sulla lezione 1.5.

Contenuti convertiti: 11 sezioni, 914 blocchi, 60 esercizi, 30 quiz e 60 voci di glossario; prova finale, rubrica e criteri conservati. SHA-256 `0f7386291c9410bc54b59da3f86c970ffe9424495cdcdccdbc88b0f1d28d1c6f`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

## Estensione in revisione · Lezione 1.4

Fonte locale esclusiva: `Programmazione_da_Zero_Lezione_1.4_File_system_e_percorsi.docx`. Il DOCX non verrà caricato nel repository.

File riservati:

- `src/lib/catalog/subjects/programming-zero-lesson-1-4-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`

File condivisi prenotati: nessuno. Dipendenza: PR #31; branch e Draft PR impilati sulla lezione 1.3.

Contenuti convertiti: 11 sezioni, 816 blocchi, 10 esercizi guidati, 30 autonomi, 30 quiz e 50 voci di glossario; laboratorio finale, rubrica e criteri conservati. Impronta SHA-256 `58e92a5aeaea1f6b1622aa2432fa359ac64c61e957dbbcf25b5685fdc405e5f0`; nessun DOCX caricato.

Verifiche: test mirato 21/21, suite completa 151/151, typecheck e build superati; lint senza errori e con il solo warning preesistente in `src/lib/vocabulary/mastery.ts`.

