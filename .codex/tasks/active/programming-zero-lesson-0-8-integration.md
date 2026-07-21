# Integrazione Programmazione da zero · Lezione 0.8

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-lesson-0-8`
Proposta sorgente: [PR #15](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/15)

## Obiettivo

Integrare su `main` la lezione ufficiale 0.8 “Impatto del software” e aggiungere un Python Project pratico coerente con il confronto fra risultati globali e risultati per gruppo, mantenendo invariati layout e funzionamento generale.

## Provenienza

- artefatto ufficiale: `src/lib/catalog/subjects/programming-zero-lesson-0-8-official-content.json`;
- fonte dichiarata: `Programmazione_da_Zero_Lezione_0.8_Impatto_del_software.docx`;
- SHA-256: `441b9e1af37992314cd0ded71a8196929786f3741a4bb2d90d371da4a24af017`;
- metriche: 944 paragrafi, 15 tabelle, 77.370 caratteri, 13 sezioni strutturate;
- DOCX non archiviato nel repository;
- nessuna normalizzazione dichiarata.

## Coordinamento

La PR #15 è impilata sul branch editoriale 0.7 precedente alle integrazioni correnti di `main`. Il branch dell’altro Codex e le proposte sequenziali 0.9–1.2 non vengono modificati. Il solo commit editoriale 0.8 sarà riportato su un branch pulito basato su `main`.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson-0-8-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `tests/programming-subject.test.ts`
- `tests/programming-python-project.test.tsx`

## File condivisi prenotati

Nessuno. Non è prevista alcuna modifica ai file condivisi o all’area di lavoro protetta.

## Verifiche previste

- test mirati e suite completa;
- typecheck;
- lint;
- build;
- verifica online della lezione e del Python Project.
