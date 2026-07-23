# Verifica consolidamento Fase 3 — 1.3.0-alpha.10

## Risultato

Il checkpoint finale della Fase 3 usa il checkpoint immutabile `1.3.0-alpha.9` come base verificata e applica nel browser il lettore TXT/Markdown e la diagnostica integrata.

## Base verificata

- Versione: `1.3.0-alpha.9`
- Dimensione: `727961` byte
- Righe: `19865`
- SHA-256: `957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318`
- Git blob SHA: `e0a11bec94aa876c36789430842f498ee97d4e03`

## Checkpoint corrente

- Versione: `1.3.0-alpha.10`
- Dimensione: `7997` byte
- Righe: `22`
- SHA-256: `7125ae833c32daf9742a0310d6dd69227a1638c9934ddfd564320df28a86fede`
- Git blob SHA: `6c9848a82ef8e6ef8160cbc7ae05caf42ba9ffc2`

## Funzioni consolidate

- caricamento del checkpoint alpha.9 dalla stessa cartella;
- verifica SHA-256 tramite Web Crypto prima dell'esecuzione;
- blocco dell'esecuzione se hash o marker non coincidono;
- lettore TXT/Markdown interno con contenuto specifico e fallback dichiarato;
- diagnostica per ID univoci, viewer, importazione, tracking, errori e iframe remoti;
- pulsante `Verifica sistema` nel pannello Materiali;
- reset limitato alle quattro chiavi `localStorage` della sezione Materiali;
- fallback esplicito al checkpoint alpha.9.

## Controlli statici superati

- HTML con `doctype`, `head`, `body` e chiusura completa;
- marker `MATERIALI E WORKSPACE — CONSOLIDAMENTO 1.3.0-alpha.10`;
- hash alpha.9 incorporato correttamente;
- funzioni `aulaTextOpen`, `aulaMaterialDiagnosticsRun`, `aulaMaterialDiagnosticsOpen` e `aulaMaterialDiagnosticsReset` presenti;
- checkpoint e canonico collegati allo stesso blob;
- nessun workflow, script Python o cache tecnica incluso nel commit finale;
- commit atomico costruito tramite Git Data API.

## Limiti reali

Non è stato eseguito un test visuale manuale nel browser. Il caricatore deve poter effettuare `fetch` del file alpha.9 adiacente: alcuni browser bloccano questa operazione quando i file sono aperti direttamente con protocollo `file://`. Per una verifica affidabile, servire la cartella `reference/checkpoints/phase-3` tramite un server HTTP locale, ad esempio `python -m http.server`, e aprire il checkpoint dal browser.

La pagina `github.com/blob/...` mostra il sorgente e non esegue l'HTML.
