# Changelog checkpoint 1.3.0-alpha.10

Data: 2026-07-23

## Aggiunto

- lettore sicuro per TXT e Markdown;
- contenuto dimostrativo per gli appunti Python;
- diagnostica integrata del sistema Materiali;
- controllo di viewer PDF, DOCX/PPTX, video, importazione, tracking ed errori;
- verifica dell'assenza di iframe remoti;
- reset controllato dei soli dati locali Materiali;
- indicatore visibile `Fase 3 consolidata`.

## Architettura del checkpoint

Il file alpha.10 è un caricatore verificato. Recupera il checkpoint immutabile alpha.9 dalla stessa cartella, ne calcola il SHA-256 tramite Web Crypto e procede soltanto se il valore coincide con quello registrato. L'estensione alpha.10 viene quindi inserita in una copia `Blob` locale.

Questa strategia evita dipendenze da GitHub Actions e conserva alpha.9 come punto di ripristino immediato.
