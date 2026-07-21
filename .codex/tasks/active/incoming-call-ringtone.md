# Suoneria chiamata in arrivo

Stato: in revisione
Assegnazione: Codex
Branch: `codex/incoming-call-ringtone`

## Obiettivo

Riprodurre una suoneria udibile sul dispositivo del partecipante invitato mentre una chiamata vocale è in attesa di risposta. La suoneria deve interrompersi quando l’invito non è più attivo e non deve modificare il flusso WebRTC, il layout o i controlli già esistenti.

## File previsti

- `src/hooks/use-incoming-call-ringtone.ts`
- `src/components/room/study-room.tsx` (file condiviso prenotato)
- `tests/incoming-call-ringtone.test.tsx`
- `.codex/tasks/active/incoming-call-ringtone.md`
- `CODEX_COORDINATION.md`

## File condivisi prenotati

- `src/components/room/study-room.tsx`

## Verifiche previste

- la suoneria parte soltanto per il destinatario invitato;
- si arresta alla risposta, al rifiuto, alla conclusione o alla rimozione della chiamata;
- non richiede file audio, microfono o modifiche al database;
- test, typecheck, lint e build.

## Verifiche eseguite

- test mirato suoneria: 3 test superati;
- suite completa: 129 test superati su 129;
- typecheck: superato;
- lint: superato con un avviso preesistente in `src/lib/vocabulary/mastery.ts`;
- build di produzione: superata.
