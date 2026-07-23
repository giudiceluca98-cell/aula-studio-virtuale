# Contenuti ufficiali dei corsi nella demo canonica

Stato: in revisione
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
- `reference/demo-aula-studio-virtuale-integrata.html`
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

## Risultato

- demo canonica sorgente: `1.4.0-alpha.1`, SHA-256
  `6d8fd182954be313b51049831d54dfdb529a523ed9715b46737e1810776c7974`;
- checkpoint canonico conservato byte per byte;
- loader integrato rigenerabile:
  `reference/demo-aula-studio-virtuale-integrata.html`;
- lezioni ufficiali collegate: `0.1`–`0.9`, `1.1`, `1.2`;
- totali: 127 sezioni, 464 esercizi, 348 domande, 580 voci di glossario
  e 11 Python Project;
- Checklist 1.4 e corsi verificati insieme nell’anteprima locale;
- selezione lezione, quiz interattivi, ripristino risposte e avanzamento verificati;
- test mirati: 5/5;
- suite completa: 172 test superati al primo passaggio e 4 timeout sotto carico;
  le tre suite interessate sono state rieseguite in sequenza con 14/14 test superati;
- typecheck superato;
- lint superato con un avviso storico non collegato in
  `src/lib/vocabulary/mastery.ts`;
- build di produzione superata.

## Consegna

Draft Pull Request:
https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/66

## Rifinitura editoriale completata

Su richiesta dell'utente, il renderer dei contenuti ufficiali viene rifinito prima
della futura sincronizzazione con il checkpoint canonico 1.4 approvato.

Perimetro:

- struttura editoriale della copertina e dei metadati della lezione;
- gerarchia visiva di titoli, paragrafi, elenchi, callout, diagrammi e tabelle;
- larghezza e ritmo tipografico responsive del solo foglio di lettura;
- nessuna modifica al checkpoint canonico, a Eve o alla logica generale della demo.

Verifiche:

- copertina, metadati, corpo introduttivo e pagine di capitolo controllati
  nell'anteprima locale;
- diagrammi testuali ricomposti su righe leggibili senza riscriverne il contenuto;
- suite completa: 32 file e 177 test superati;
- test mirato finale: 6/6 superati;
- typecheck superato;
- lint senza errori, con il solo avviso storico in
  `src/lib/vocabulary/mastery.ts`;
- build di produzione superata.

La pubblicazione resta sospesa fino alla verifica visiva dell’utente.
