# Navigazione moduli e lezioni separate

Stato: in revisione
Assegnazione: Codex
Branch: `codex/lesson-module-navigation`
Pull request: da aprire

## Obiettivo

Rendere permanente la gerarchia corso → moduli → lezioni. Nell’area di lavoro di Programmazione da zero, l’utente deve poter scegliere il modulo, poi una singola lezione, e visualizzare nell’indice soltanto le sezioni appartenenti alla lezione scelta.

## Vincoli

- non modificare il contenuto editoriale delle lezioni 0.1, 0.2 e 0.3;
- conservare il materiale nativo, il salvataggio dei progressi, Eve e gli endpoint esistenti;
- non modificare Supabase o Vercel durante lo sviluppo;
- mantenere la navigazione utilizzabile anche su telefono.

## File previsti e riservati

- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/components/room/programming-lesson-workspace.tsx` (area di lavoro protetta, modifica autorizzata dalla richiesta utente)
- `tests/programming-subject.test.ts`
- `tests/programming-lesson-navigation.test.tsx`
- `.codex/tasks/active/lesson-module-navigation.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

Nessuno dei percorsi dell’elenco condiviso. L’area di lavoro protetta `src/components/room/programming-lesson-workspace.tsx` è riservata a questa attività fino al merge.

## Criteri di completamento

- l’indice mostra i moduli e le lezioni contenute;
- scegliendo una lezione compaiono soltanto le sue sezioni;
- avanti e indietro restano dentro la lezione selezionata;
- esercizi, quiz e glossario rispettano la lezione scelta senza perdere i progressi globali;
- test, typecheck, lint e build superati.

## Verifiche eseguite

- test mirato della navigazione: 2/2 superati;
- suite completa: 131/131 test superati;
- TypeScript: superato;
- lint: superato senza errori (un avviso preesistente fuori ambito);
- build di produzione Next.js: superata.
