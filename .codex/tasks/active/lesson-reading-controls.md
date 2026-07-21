# Controlli di lettura e scorrimento dell’aula

Stato: in revisione
Assegnazione: Codex
Branch: `agent/lesson-reading-controls`

## Obiettivo

Rendere più comoda la lettura delle lezioni nell’aula:

- la testata dell’aula e la barra degli strumenti devono scorrere via insieme al contenuto;
- un controllo compatto deve riportare rapidamente all’inizio dell’aula;
- i pulsanti meno e più devono ridurre o aumentare soltanto il testo della lezione;
- layout, navigazione didattica, progressi, Eve e strumenti dell’aula devono restare invariati.

## File previsti e riservati

- `src/components/room/study-room.tsx` (file condiviso prenotato)
- `src/components/room/programming-lesson-workspace.tsx` (area di lavoro protetta, modifica richiesta dall’utente)
- `tests/programming-lesson-navigation.test.tsx`
- `tests/room-layout-removal.test.ts`
- `.codex/tasks/active/lesson-reading-controls.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

- `src/components/room/study-room.tsx`

## Verifiche previste

- la testata non resta bloccata durante lo scorrimento su desktop;
- il comando “Torna su” riporta all’inizio dell’aula;
- lo zoom del testo rispetta limiti minimi e massimi e non modifica il resto dell’interfaccia;
- test, typecheck, lint e build.

## Verifiche eseguite

- test mirati su navigazione, controlli di lettura e layout aula: 14/14 superati;
- typecheck: superato;
- lint: nessun errore; rimane un warning preesistente in `src/lib/vocabulary/mastery.ts`;
- build di produzione: superata;
- suite completa avviata insieme al server di prova e interrotta per memoria insufficiente; il successivo tentativo isolato non è stato autorizzato dall’ambiente per esaurimento della quota operativa.
- controllo locale in modalità demo: involucro dell’aula caricato correttamente con il nuovo contenitore di scorrimento.
