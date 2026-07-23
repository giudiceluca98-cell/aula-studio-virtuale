# Verifica — 1.4.0-alpha.1

## Identificatori

- Dimensione: `763281` byte
- Righe: `20872`
- SHA-256: `85ad819914cf85740b0013f0d3147adaa2ff7b233f99935ba67f4fb77fefe95c`
- Git blob SHA atteso: `1a4b68f4aa04bd5602afddb7a9feba867da33574`

## Controlli superati

- File prodotto direttamente dal checkpoint completo `1.3.0-alpha.9` fornito dall'utente.
- Canonico e checkpoint identici byte per byte.
- Chiusura `</html>` presente.
- Tag `script` e `style` bilanciati.
- Nessun ID HTML statico duplicato.
- Due blocchi JavaScript inline verificati con `node --check`.
- Marker della Checklist, del viewer TXT/Markdown e della diagnostica Materiali presenti.
- Nessun riferimento a GitHub Raw o jsDelivr.
- Apertura locale tramite doppio clic verificata dall'utente.
- Creazione dello ZIP usata esclusivamente per facilitare il download; lo ZIP non viene versionato nel repository.

## Limiti reali

- La Checklist della demo usa `localStorage`; nell'app ufficiale deve essere collegata a Supabase, RLS e Realtime.
- Non è stato eseguito un confronto visuale automatizzato multipiattaforma.
- Le funzioni native del browser possono avere differenze minori tra Chrome, Edge, Firefox e Safari.

## Stato

`APPROVATO`
