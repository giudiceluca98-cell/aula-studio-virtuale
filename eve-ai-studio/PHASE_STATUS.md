# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.8 implementato nel branch `eve-ai-studio`**

La fase resta isolata da `main`, `demo-canonica`, dall'HTML canonico, dall'app ufficiale e dal branch `eve-canonical-integration-v2`.

## Checkpoint completati

### 0.1 — Fondazione iniziale

- FastAPI;
- provider `mock`;
- contratti tipizzati;
- contesto didattico;
- permessi;
- limiti;
- audit pseudonimizzato;
- feature flag;
- 4 test specifici.

### 0.2 — Modularità e importatore

- separazione di core, contesto e provider;
- parser delle 36 sezioni e 1.197 schede;
- validazione;
- checksum;
- routing dei requisiti;
- API e CLI;
- manifesto;
- anteprima aggiornata;
- 9 test specifici.

### 0.3 — Persistenza dei requisiti

- SQLite;
- cronologia importazioni;
- snapshot immutabili;
- versione attiva;
- replace e merge;
- deduplicazione;
- confronto;
- rollback non distruttivo;
- 15 test specifici.

### 0.4 — Prompt versionati

- storage dedicato;
- revisioni immutabili;
- modalità didattiche;
- parametri tipizzati;
- workflow `draft → in_review → publishable → published → archived`;
- confronto;
- rollback;
- gate server-side;
- API e anteprima;
- 15 test specifici.

### 0.5 — Valutazioni persistenti

- scenari versionati;
- severità, pesi e soglie;
- scenari obbligatori e opzionali;
- snapshot della suite;
- run collegati alla versione prompt;
- risultati per criterio;
- punteggio ponderato;
- errori critici;
- invalidazione dei run obsoleti;
- gate reale dei prompt;
- 18 test specifici.

### 0.6 — Runner automatico

- `ChatRequest` eseguibili;
- provider mock deterministico;
- otto grader iniziali;
- durata per scenario;
- completamento automatico dei run;
- artefatti redatti;
- SHA-256 dell'output;
- nessuna risposta completa salvata;
- schema valutazioni `2`;
- API e anteprima;
- 29 test specifici.

### 0.7 — Provider, modelli e orchestrazione

- servizio `0.7.0`;
- catalogo server-side dei provider;
- catalogo server-side dei modelli;
- provider mock primario;
- modello mock di fallback;
- segnaposto esterno disattivato;
- profili di esecuzione separati;
- timeout per target;
- retry e backoff;
- fallback ordinato;
- limiti token;
- budget giornalieri;
- stima dei costi;
- telemetria persistente e redatta;
- chat e valutazioni instradate tramite profili dedicati;
- API e anteprima;
- 28 test specifici.

### 0.8 — Catalogo materiali e preparazione RAG

Stato: **implementato, in attesa di verifica visuale completa dell'anteprima**

Versione servizio:

```text
0.8.0
```

Base di sviluppo del checkpoint:

```text
4df3d995569f0174fa56c8b0cb9be7631f88954f
```

Implementato:

- package `app/materials` separato;
- catalogo materiali persistente;
- SQLite schema `1`;
- isolamento per aula;
- importazione base64 controllata;
- limiti applicati prima dell'elaborazione;
- media type normalizzato;
- metadati JSON limitati;
- checksum SHA-256 dei byte originali;
- deduplicazione per checksum nella stessa aula;
- versioni immutabili;
- versione corrente aggiornata soltanto dopo successo;
- stati `processing`, `ready` e `failed`;
- cronologia importazioni;
- errori redatti tramite codice e classe;
- estrazione testuale locale iniziale;
- testo UTF-8;
- normalizzazione del testo;
- conversione HTML senza script e stili;
- JSON validato e serializzato deterministicamente;
- chunk testuali deterministici;
- offset di inizio e fine;
- checksum SHA-256 di ogni chunk;
- stato embedding `not_requested`;
- nessun embedding esterno;
- nessuna chiamata di rete;
- API dedicate;
- stessa anteprima ufficiale aggiornata;
- collegamento con Eve Animation Library 1.2.2;
- 20 test specifici superati nel banco di prova locale.

## Database materiali

Percorso predefinito:

```text
data/eve-materials.sqlite3
```

Variabile:

```text
EVE_MATERIALS_DB_PATH
```

Schema:

```text
1
```

Tabelle:

```text
material_schema_metadata
materials
material_versions
material_chunks
material_import_events
```

## Formati supportati nel checkpoint 0.8

```text
text/plain
text/markdown
text/csv
text/html
application/xhtml+xml
application/json
```

Esclusi:

- PDF;
- Word e altri formati Office;
- immagini;
- audio;
- video;
- OCR;
- trascrizione;
- parser remoti.

Il formato escluso produce una versione `failed` con codice redatto `unsupported_media_type`.

## Limiti materiali

Valori predefiniti:

```text
materiale: 2.000.000 byte
testo estratto: 2.000.000 caratteri
metadati: 16.000 caratteri
chunk: 1.200 caratteri
overlap: 150 caratteri
versioni per materiale: 50
```

Variabili:

```text
EVE_MATERIAL_MAX_BYTES
EVE_MATERIAL_MAX_TEXT_CHARS
EVE_MATERIAL_MAX_METADATA_CHARS
EVE_MATERIAL_CHUNK_CHARS
EVE_MATERIAL_CHUNK_OVERLAP_CHARS
EVE_MATERIAL_MAX_VERSIONS
```

## Checksum e deduplicazione

- SHA-256 calcolato sui byte originali;
- deduplicazione applicata soltanto alle versioni `ready`;
- il perimetro della deduplicazione è l'aula;
- un duplicato genera un evento senza creare una nuova versione;
- lo stesso file in aule diverse resta separato;
- una versione fallita non impedisce un nuovo tentativo.

## Versioni

- `material_id` stabile;
- `version_number` crescente;
- record di versione immutabile;
- byte originali conservati come BLOB locale;
- una versione fallita conserva stato e codice errore;
- una nuova versione fallita non sostituisce la versione pronta corrente;
- la prima versione fallita resta visibile nel catalogo come materiale fallito.

## Preparazione RAG

Stato dichiarato:

```text
text_extracted_and_chunked_no_embeddings
```

Ogni chunk conserva:

- ID;
- versione;
- indice;
- offset iniziale;
- offset finale;
- testo;
- SHA-256 del testo;
- `embedding_status=not_requested`.

Non implementato:

- modello embedding;
- provider embedding;
- indice vettoriale;
- similarità semantica;
- retrieval;
- citazioni RAG nella chat;
- generazione basata sui chunk.

## Privacy e redazione

La cronologia importazioni non conserva o restituisce:

- contenuto completo del documento;
- testo estratto;
- nome file dell'importazione fallita;
- corpo completo dell'eccezione;
- stack trace;
- dati di un'altra aula.

Vengono conservati soltanto i dati necessari, tra cui:

- aula;
- materiale e versione quando disponibili;
- stato;
- checksum;
- dimensione;
- codice errore;
- classe errore;
- date.

Un accesso con `room_id` errato restituisce `404 Materiale non trovato`.

## API aggiunte nel 0.8

```text
GET  /v1/materials/status
GET  /v1/materials/imports
POST /v1/materials/import
GET  /v1/materials
GET  /v1/materials/{material_id}
GET  /v1/materials/{material_id}/versions
GET  /v1/materials/{material_id}/versions/{version_number}
GET  /v1/materials/{material_id}/versions/{version_number}/chunks
```

## Test del checkpoint 0.8

Esecuzione locale del nuovo modulo:

```text
20 passed in 0.95s
```

Verificati:

1. schema e stato vuoto;
2. importazione plaintext, checksum e chunk;
3. deduplicazione per aula;
4. nuova versione e versione corrente;
5. fallimento senza sostituzione della versione pronta;
6. prima versione fallita visibile;
7. isolamento tra aule;
8. base64 non valido;
9. limite dimensione;
10. limite metadati;
11. limite versioni;
12. estrazione HTML sicura;
13. JSON deterministico;
14. rifiuto testo non UTF-8;
15. chunking deterministico e sovrapposto;
16. ricerca, filtro e paginazione;
17. persistenza dopo riapertura;
18. API e messaggi redatti;
19. cronologia per aula e redazione;
20. verifica aula precedente al limite versioni.

La suite cumulativa completa dei checkpoint precedenti non è stata rilanciata. GitHub Actions non è stato eseguito.

## Anteprima del checkpoint 0.8

Percorso invariato:

```text
reference/eve-ai-studio-preview/index.html
```

Nuovo modulo:

```text
reference/eve-ai-studio-preview/materials-workflow.js
```

Nuova vista:

```text
Materiali e RAG
```

Mostra:

- metriche del catalogo;
- importazione controllata;
- pipeline RAG preparatoria;
- catalogo per aula;
- versioni;
- chunk con offset e hash;
- cronologia redatta;
- embedding disattivati;
- scenari valido, duplicato, versione, PDF non supportato e limite.

Stati Eve usati:

- `eve-uploading`;
- `eve-searching`;
- `eve-reading`;
- `eve-indexing`;
- `eve-success`;
- `eve-error-supportive`;
- `eve-confirmation-needed`;
- `eve-idle-soft`.

Il JavaScript della nuova vista ha superato `node --check` nel banco di prova locale. La verifica visiva completa nel browser non è ancora stata eseguita.

## Escluso dalla fase corrente

- provider AI reale;
- chiavi API;
- tokenizer ufficiale;
- circuit breaker e code distribuite;
- parsing PDF e Office;
- OCR;
- embedding;
- indice vettoriale;
- retrieval semantico;
- RAG nella chat;
- Supabase;
- autenticazione amministrativa;
- memoria didattica persistente;
- strumenti che modificano l'app ufficiale;
- merge con la demo canonica.

## Prossimo checkpoint

Il perimetro successivo deve essere definito e approvato prima dell'implementazione. Il checkpoint 0.8 prepara i dati per un futuro retrieval, ma non autorizza automaticamente embedding esterni, database vettoriali, provider reali o collegamenti alla produzione.
