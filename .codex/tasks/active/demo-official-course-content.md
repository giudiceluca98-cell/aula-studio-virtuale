# Contenuti ufficiali dei corsi nella demo canonica

Stato: in corso
Assegnazione: Codex
Branch: `agent/demo-course-content-sync`

## Obiettivo

Caricare nella demo canonica i contenuti didattici ufficiali già approvati del corso
“Programmazione da zero”, mantenendo intatta la base funzionale aggiornata dall’altro
agente. La demo resta la fonte per interfaccia e comportamento; questo lavoro aggiunge
soltanto il livello editoriale mancante.

## Fonti ufficiali

- `src/lib/catalog/subjects/programming-zero-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-3-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-4-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-5-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-6-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-7-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-8-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-9-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-1-1-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-1-2-official-content.json`

Le lezioni successive ancora presenti soltanto in Draft Pull Request non vengono
considerate approvate e non entrano in questo primo pacchetto.

## File previsti e riservati

- `scripts/generate-demo-course-content.mjs`
- `reference/course-content/**`
- `reference/demo-aula-studio-virtuale-canonica.html`
- test mirati del pacchetto didattico della demo
- `.codex/tasks/active/demo-official-course-content.md`
- `CODEX_COORDINATION.md`

## Vincoli

- non modificare il checkpoint immutabile `1.3.0-alpha.9`;
- non riscrivere interfaccia, materiali, Eve o altri comportamenti della demo;
- preservare titoli, ordine, blocchi, esercizi, quiz, glossario e prove finali;
- non inventare soluzioni o lezioni mancanti;
- mantenere separato il livello editoriale così che possa essere rigenerato quando
  la demo canonica viene aggiornata.

## Verifiche previste

- corrispondenza di identificativi e titoli con le fonti ufficiali;
- conteggio completo di sezioni, esercizi, quiz e voci di glossario;
- selezione reale di ogni lezione nella demo;
- funzionamento di lettore, Eve, esercizi, quiz, progetto e avanzamento;
- anteprima locale prima della pubblicazione.
