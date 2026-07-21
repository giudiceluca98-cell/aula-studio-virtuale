# Integrazione Programmazione da zero · Lezione 0.6

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-lesson-0-6`
Proposta sorgente: [PR #12](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/12)

## Obiettivo

Integrare su `main` la lezione ufficiale 0.6 “Come nasce il software” e aggiungere un Python Project pratico coerente con requisiti, precondizioni, stati e casi di test, mantenendo invariata l'area di lavoro generale.

## Provenienza

- artefatto ufficiale: `src/lib/catalog/subjects/programming-zero-lesson-0-6-official-content.json`;
- fonte dichiarata: `Programmazione_da_Zero_Lezione_0.6_Come_nasce_il_software.docx`;
- SHA-256: `e4508786bb492e2b22d2a930bf55068e0a22a6631711ce1cc4fd65c22deeb58e`;
- DOCX non archiviato nel repository;
- nessuna normalizzazione dichiarata.

## Coordinamento

La PR #12 è impilata sul branch 0.5 precedente alla PR #14. Il branch dell'altro Codex non viene modificato. Il solo commit editoriale 0.6 viene riportato su un branch pulito basato su `main`, risolvendo esclusivamente i file di coordinamento e preservando i Python Project già pubblicati.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson-0-6-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `src/lib/programming-lesson-progress.ts`
- `src/components/room/programming-lesson-workspace.tsx` (nessuna modifica prevista)
- `tests/programming-subject.test.ts`
- `tests/programming-python-project.test.tsx`

## Verifiche previste

- test mirati e suite completa;
- typecheck;
- lint;
- build;
- verifica della lezione e del Python Project in produzione.
