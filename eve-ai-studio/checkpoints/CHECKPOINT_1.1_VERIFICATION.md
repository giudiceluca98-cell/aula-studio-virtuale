# Eve AI Studio — Verifica conclusiva Checkpoint 1.1

Data: 27 luglio 2026

Branch: `eve-ai-studio`

Versione servizio: `1.1.0`

## Esito tecnico

**CHECKPOINT 1.1 IMPLEMENTATO E VERIFICATO TECNICAMENTE**

L’approvazione conclusiva dell’utente resta da registrare prima di definire o implementare il checkpoint successivo.

## Funzione verificata

La funzione `apertura della fonte` risolve un locator citato e restituisce il passaggio esatto soltanto quando aula, versione, chunk, coordinate e integrità risultano coerenti.

Formato:

```text
material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}
```

## Controlli

- parser rigido del locator;
- query SQL limitata al `room_id` richiesto;
- stessa risposta `404 source_not_found` per fonte assente o cross-room;
- verifica coordinate;
- verifica SHA-256 salvato;
- verifica del chunk contro il testo estratto;
- verifica opzionale dello SHA-256 della citazione;
- apertura delle versioni storiche `ready` con flag `stale`;
- blocco delle versioni storiche quando `require_current=true`;
- contesto limitato;
- navigazione con resource path, anchor e pagina opzionale;
- segnalazione dei contenuti sospetti;
- `instructions_executable=false`.

## GitHub Actions

Commit verificato:

```text
19fcd0e4ac55df862eb0131e6546f37a69746959
```

Esito:

```text
SUPERATO
```

| Controllo | Esito |
|---|---|
| installazione Python | success |
| compilazione Python | success |
| pytest cumulativo | success |
| sintassi JavaScript | success |
| installazione Chromium | success |
| scenari browser | success |

Suite:

```text
165 passed, 1 warning in 2.59s
```

Il warning è una `StarletteDeprecationWarning` proveniente da `fastapi.testclient` e non modifica l’esito.

## Browser

Scenari verificati:

1. fonte corrente verificata;
2. versione storica;
3. hash non corrispondente;
4. isolamento tra aule;
5. fonte sospetta.

Totale cumulativo:

```text
5 materiali
4 retrieval
4 chat RAG
5 aperture fonte
18/18 scenari
```

JavaScript verificato:

```text
reference/eve-ai-studio-preview/source-opening-workflow.js
```

## API

```http
GET  /v1/sources/status
POST /v1/sources/open
```

## Protezioni rispettate

Non modificati:

- `main`;
- `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- app ufficiale;
- `eve-canonical-integration-v2`;
- pacchetto master Eve Animation Library 1.2.2.

Non eseguiti:

- pull request;
- merge;
- provider AI reali;
- embedding;
- database vettoriali;
- integrazione nella produzione.

## Limiti

Il checkpoint apre fonti testuali già acquisite e segmentate. Non introduce ancora PDF, Office, OCR, coordinate pagina derivate da parser documentali, provider AI reali o apertura dentro l’app ufficiale.

## Stato finale

Il Checkpoint 1.1 dispone di codice, API, test specifici, suite cumulativa, verifica browser, rapporto GitHub Actions, anteprima ufficiale e documentazione aggiornati.

È tecnicamente pronto per l’approvazione conclusiva dell’utente.
