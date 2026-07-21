# Integrazione Programmazione da zero · Lezione 0.9

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-lesson-0-9`
Proposta sorgente: [PR #16](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/16)

## Obiettivo

Integrare su `main` la lezione ufficiale 0.9 “Laboratorio conclusivo e valutazione completa” e aggiungere un Python Project pratico coerente con il calcolo del profilo per dimensione e del recupero mirato, mantenendo invariati layout e funzionamento generale.

## Provenienza

- artefatto ufficiale: `src/lib/catalog/subjects/programming-zero-lesson-0-9-official-content.json`;
- fonte dichiarata: `Programmazione_da_Zero_Lezione_0.9_Laboratorio_e_valutazione_finale.docx`;
- SHA-256: `cac28baa626f64d6e79c10b47784704031cec4f4e8d27f26b04f25dd8773bb9b`;
- metriche: 846 paragrafi, 13 tabelle, 61.683 caratteri, 11 sezioni strutturate;
- DOCX non archiviato nel repository;
- nessuna normalizzazione dichiarata.

## Coordinamento

La PR #16 è impilata sul branch editoriale 0.8 precedente alle integrazioni correnti di `main`. Il branch dell’altro Codex e le proposte sequenziali 1.1–1.2 non vengono modificati. Il solo commit editoriale 0.9 sarà riportato su un branch pulito basato su `main`.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson-0-9-official-content.json`
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
