# Correzione e coerenza dei contenuti · Programmazione da zero

Stato: completato
Assegnazione: Codex
Branch: `agent/correct-programming-content`
Pull request: [PR #28](https://github.com/giudiceluca98-cell/aula-studio-virtuale/pull/28)

## Obiettivo

Correggere le incoerenze fattuali, terminologiche e didattiche individuate nelle Lezioni 0.1–0.9 e nei relativi Python Project, usando come base esclusivamente i contenuti già presenti nel repository e senza consultare o modificare i DOCX.

## Perimetro

- correggere la distinzione fra MB/GB e MiB/GiB nel Python Project 0.3;
- gestire esplicitamente le parità nei Python Project 0.7 e 0.8;
- rendere non ambiguo il quiz sulle proposizioni della Lezione 0.4;
- precisare la terminologia UTF-8 e release;
- qualificare le voci di glossario omonime con significati differenti;
- rendere coerente la Lezione 0.9 con i Python Project richiesti nel Modulo 0;
- aggiungere test mirati per impedire regressioni.

## Vincoli

- non usare, sostituire o modificare i DOCX;
- non riprogettare layout, navigazione o funzionamento generale dell’aula;
- non modificare Supabase, Vercel, variabili ambiente o segreti;
- non modificare le lezioni 1.1 e successive;
- conservare identificativi, struttura e salvataggio dei progressi esistenti.

## File riservati

- `src/lib/catalog/subjects/programming-zero-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-3-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-4-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-6-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-7-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-8-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson-0-9-official-content.json`
- `src/lib/catalog/subjects/programming-zero-lesson.ts`
- `tests/programming-content-corrections.test.ts`
- `.codex/tasks/active/programming-content-corrections.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

Nessuno dei percorsi condivisi elencati in `CODEX_COORDINATION.md`.

## Verifiche previste

- test mirati sulle correzioni editoriali e sui casi limite dei Python Project;
- suite completa;
- typecheck;
- lint;
- build di produzione.

## Esito della revisione

- corretti uso e denominazione delle unità decimali MB/GB nel Python Project 0.3;
- precisata la distinzione fra punti di codice Unicode, valori scalari e codifica UTF-8;
- eliminata l’ambiguità dal quiz sulle proposizioni della Lezione 0.4;
- precisato il concetto di release nella Lezione 0.6;
- aggiunta la gestione esplicita delle parità nei Python Project 0.7 e 0.8;
- distinto il dossier teorico 0.9 dalle esercitazioni Python guidate richieste dall’app;
- qualificate le voci di glossario omonime che indicavano concetti differenti;
- controllati i 32 termini ancora presenti con più definizioni: le variazioni residue sono formulazioni compatibili dello stesso concetto;
- validati tutti gli 8 artefatti JSON;
- suite completa: 24 file e 150 test superati;
- typecheck superato;
- lint: 0 errori e 1 avvertenza preesistente fuori perimetro in `src/lib/vocabulary/mastery.ts`;
- build di produzione completata.
