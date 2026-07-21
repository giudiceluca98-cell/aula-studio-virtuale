# Integrazione Programmazione da zero · Lezione 0.7

Stato: in corso
Assegnazione: Codex
Branch: `agent/integrate-programming-lesson-0-7`
Proposta sorgente: [PR #13](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/13)

## Obiettivo

Integrare su `main` la lezione ufficiale 0.7 “Storia essenziale dell’informatica” e aggiungere un Python Project pratico coerente con il confronto fra attribuzioni di primato mediante criteri espliciti, mantenendo invariati layout e funzionamento generale.

## Provenienza

- artefatto ufficiale: `src/lib/catalog/subjects/programming-zero-lesson-0-7-official-content.json`;
- fonte dichiarata: `Programmazione_da_Zero_Lezione_0.7_Storia_e_aree_dell_informatica.docx`;
- SHA-256: `e66df7f6d2469614a86f66274fe36078dcae5e27dfc24ad690d133c4f94dfaff`;
- metriche: 941 paragrafi, 15 tabelle, 82.970 caratteri, 13 sezioni strutturate;
- DOCX non archiviato nel repository;
- nessuna normalizzazione dichiarata.

## Coordinamento

La PR #13 è impilata sul branch editoriale 0.6 precedente alle integrazioni correnti di `main`. Il branch dell’altro Codex e le proposte sequenziali 0.8–1.2 non vengono modificati. Il solo commit editoriale 0.7 sarà riportato su un branch pulito basato su `main`.

## File riservati

- `src/lib/catalog/subjects/programming-zero-lesson-0-7-official-content.json`
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
