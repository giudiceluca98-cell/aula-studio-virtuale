# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **Checkpoint 0.9 implementato e verificato tecnicamente nel branch `eve-ai-studio`**

- Checkpoint `0.8`: chiuso e approvato;
- Checkpoint `0.9`: implementato e verificato, approvazione conclusiva dell’utente da registrare.

La fase resta isolata da `main`, `demo-canonica`, dall’HTML canonico, dall’app ufficiale e dal branch `eve-canonical-integration-v2`.

## Checkpoint realizzati

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
- completamento automatico;
- artefatti redatti;
- SHA-256 dell’output;
- nessuna risposta completa salvata;
- schema valutazioni `2`;
- API e anteprima;
- 29 test specifici.

### 0.7 — Provider, modelli e orchestrazione

- catalogo server-side dei provider e modelli;
- provider mock primario e fallback;
- segnaposto esterno disattivato;
- profili separati;
- timeout;
- retry e backoff;
- fallback ordinato;
- limiti token;
- budget giornalieri;
- stima dei costi;
- telemetria persistente e redatta;
- 28 test specifici.

### 0.8 — Catalogo materiali e preparazione RAG

Stato: **chiuso e approvato**

- servizio `0.8.0`;
- catalogo materiali persistente SQLite;
- isolamento per aula;
- importazione base64 controllata;
- limiti e metadati tipizzati;
- SHA-256 e deduplicazione;
- versioni immutabili;
- versione corrente aggiornata solo dopo successo;
- estrazione TXT, Markdown, CSV, HTML, XHTML e JSON;
- HTML senza script e stili;
- JSON deterministico;
- chunk con offset e SHA-256;
- cronologia redatta;
- nessun embedding o chiamata esterna;
- 20 test specifici;
- 125 test cumulativi `0.1–0.8`;
- 5 scenari browser verificati.

Rapporti:

```text
checkpoints/CHECKPOINT_0.8_UPDATE.txt
checkpoints/CHECKPOINT_0.8_VERIFICATION.md
checkpoints/CHECKPOINT_0.8_CLOSURE.md
```

### 0.9 — Retrieval locale e citazioni verificabili

Stato: **implementato e verificato tecnicamente**

Versione servizio:

```text
0.9.0
```

Implementato:

- package `app/retrieval` separato;
- query e risposte tipizzate;
- normalizzazione Unicode NFKC e casefold;
- ranking deterministico `eve-lexical-v1`;
- copertura e frequenza limitata dei termini;
- priorità per titolo e filename;
- bonus per frase esatta;
- ordinamento stabile;
- ricerca limitata alle versioni correnti `ready`;
- isolamento SQL per `room_id`;
- filtri material_id senza divulgazione tra aule;
- verifica SHA-256 dei chunk;
- esclusione dei chunk alterati;
- estratti limitati;
- locator e citazioni verificabili;
- segnalazione di contenuti simili a prompt injection;
- nessuna esecuzione delle istruzioni presenti nelle fonti;
- API di stato e ricerca;
- anteprima ufficiale aggiornata;
- nessun embedding, provider esterno o chiamata di rete.

Stato retrieval:

```text
lexical_ranked_citations_no_embeddings
```

API:

```text
GET  /v1/retrieval/status
POST /v1/retrieval/search
```

Test:

```text
14 test specifici superati
139 test cumulativi 0.1–0.9 superati
4 scenari browser retrieval superati
0 errori JavaScript
```

Rapporto:

```text
checkpoints/CHECKPOINT_0.9_UPDATE.txt
```

## Verifica automatica

Workflow:

```text
.github/workflows/eve-ai-studio-checks.yml
```

Il workflow esegue:

- installazione delle dipendenze di test;
- compilazione Python;
- suite cumulativa;
- controllo sintattico dei moduli JavaScript eseguibili;
- Chromium su un contenitore DOM controllato;
- 5 scenari materiali;
- 4 scenari retrieval;
- produzione di rapporti e artefatti.

## Escluso dallo stato corrente

- provider AI reale;
- chiavi API;
- embedding;
- indice vettoriale;
- retrieval semantico;
- reranker AI;
- generazione RAG collegata alla chat;
- citazioni automatiche nella chat;
- PDF e Office;
- OCR e trascrizione;
- Supabase;
- autenticazione amministrativa di produzione;
- memoria didattica persistente;
- strumenti che modificano l’app ufficiale;
- merge con la demo canonica.

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
- provider esterni;
- embedding esterni;
- collegamenti alla produzione.

## Passaggio successivo

Il perimetro del checkpoint successivo deve essere definito e approvato dopo la registrazione dell’approvazione conclusiva del Checkpoint 0.9.

Il Checkpoint 0.9 non autorizza automaticamente embedding, database vettoriali, provider reali, RAG collegato alla chat o integrazione nella produzione.
