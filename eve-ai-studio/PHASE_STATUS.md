# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **Checkpoint 1.0 implementato e verificato tecnicamente nel branch `eve-ai-studio`**

- Checkpoint `0.8`: chiuso e approvato;
- Checkpoint `0.9`: chiuso e approvato;
- Checkpoint `1.0`: implementato e verificato tecnicamente, in attesa dell’approvazione conclusiva dell’utente.

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
- validazione, checksum e routing;
- API, CLI e manifesto;
- 9 test specifici.

### 0.3 — Persistenza dei requisiti

- SQLite;
- cronologia importazioni;
- snapshot immutabili;
- versione attiva;
- replace e merge;
- confronto e rollback non distruttivo;
- 15 test specifici.

### 0.4 — Prompt versionati

- revisioni immutabili;
- modalità didattiche e parametri tipizzati;
- workflow `draft → in_review → publishable → published → archived`;
- confronto, rollback e gate server-side;
- 15 test specifici.

### 0.5 — Valutazioni persistenti

- scenari versionati;
- severità, pesi e soglie;
- snapshot della suite;
- risultati per criterio e punteggio ponderato;
- invalidazione dei run obsoleti;
- gate reale dei prompt;
- 18 test specifici.

### 0.6 — Runner automatico

- richieste eseguibili;
- provider mock deterministico;
- otto grader;
- durata per scenario;
- artefatti redatti e SHA-256 dell’output;
- schema valutazioni `2`;
- 29 test specifici.

### 0.7 — Provider, modelli e orchestrazione

- catalogo server-side dei provider e modelli;
- provider mock primario e fallback;
- profili separati;
- timeout, retry, backoff e fallback;
- limiti token, budget e stima costi;
- telemetria persistente e redatta;
- provider esterno disattivato;
- 28 test specifici.

### 0.8 — Catalogo materiali e preparazione RAG

Stato: **chiuso e approvato**

- servizio `0.8.0`;
- catalogo materiali SQLite isolato per aula;
- importazione controllata, checksum e deduplicazione;
- versioni immutabili;
- estrazione TXT, Markdown, CSV, HTML, XHTML e JSON;
- chunk con offset e SHA-256;
- cronologia redatta;
- nessun embedding o servizio esterno;
- 20 test specifici;
- 125 test cumulativi;
- 5 scenari browser.

Rapporti:

```text
checkpoints/CHECKPOINT_0.8_UPDATE.txt
checkpoints/CHECKPOINT_0.8_VERIFICATION.md
checkpoints/CHECKPOINT_0.8_CLOSURE.md
```

### 0.9 — Retrieval locale e citazioni verificabili

Stato: **chiuso e approvato**

Versione servizio: `0.9.0`

- package `app/retrieval`;
- normalizzazione Unicode NFKC e casefold;
- ranking deterministico `eve-lexical-v1`;
- ricerca nelle sole versioni correnti `ready`;
- isolamento SQL per `room_id`;
- filtro dei materiali senza divulgazione tra aule;
- verifica SHA-256 ed esclusione dei chunk alterati;
- estratti limitati e locator verificabili;
- segnalazione di prompt injection documentale;
- API `GET /v1/retrieval/status`;
- API `POST /v1/retrieval/search`;
- nessun embedding, provider esterno o rete;
- 14 test specifici;
- 139 test cumulativi;
- 4 scenari browser retrieval.

Rapporti:

```text
checkpoints/CHECKPOINT_0.9_UPDATE.txt
checkpoints/CHECKPOINT_0.9_VERIFICATION.md
checkpoints/CHECKPOINT_0.9_CLOSURE.md
checkpoints/CHECKPOINT_0.9_CI_RESULT.json
checkpoints/CHECKPOINT_0.9_CI_RESULT.md
```

### 1.0 — Chat RAG locale e deterministica

Stato: **implementato e verificato tecnicamente**

Versione servizio:

```text
1.0.0
```

Obiettivo derivato dal piano ufficiale: recuperare passaggi autorizzati, costruire una risposta usando soltanto tali passaggi e mostrare citazioni verificabili, senza introdurre ancora un modello linguistico esterno.

Implementato:

- package `app/rag` separato;
- contratti tipizzati per domanda, risposta, fonti e stato;
- servizio `RagChatService` deterministico;
- provider dichiarato `local-rag`;
- modello dichiarato `eve-grounded-extractive-v1`;
- stato `grounded_extractive_chat_no_embeddings`;
- uso del retrieval `0.9` senza duplicarne le regole;
- obbligo di `room_id` autorizzato;
- uso delle sole versioni correnti `ready`;
- controllo SHA-256 ereditato dal retrieval;
- esclusione delle fonti sospette dalla risposta e dalle citazioni;
- risposta estrattiva con marcatori `[n]`;
- citazioni con materiale, versione, chunk, offset, file e hash;
- hash SHA-256 della risposta;
- risposta esplicita “non trovato” senza conoscenza generale aggiunta;
- rifiuto sicuro quando esistono soltanto fonti sospette;
- rifiuto sicuro quando i chunk non superano l’integrità;
- limite configurabile delle fonti e della risposta;
- nessuna azione proposta;
- API `GET /v1/rag/status`;
- API `POST /v1/rag/chat`;
- rotta generica `/v1/chat` lasciata invariata;
- anteprima ufficiale aggiornata con quattro scenari RAG.

Configurazione:

```text
EVE_RAG_MAX_SOURCES=4
EVE_RAG_MAX_ANSWER_CHARS=4000
```

Test automatici:

```text
13 test specifici Checkpoint 1.0
152 test cumulativi Checkpoint 0.1–1.0
```

Scenari browser:

```text
5 materiali
4 retrieval
4 chat RAG
13 scenari complessivi
```

GitHub Actions:

- commit verificato: `a8ded290eef8983fce87a31a6ef67b02efa4728c`;
- installazione Python: success;
- compilazione Python: success;
- pytest cumulativo: success;
- sintassi JavaScript: success;
- Chromium: success;
- scenari browser: success;
- risultato: `152 passed, 1 warning`.

Il warning è una `StarletteDeprecationWarning` proveniente da `fastapi.testclient`; non è un fallimento del checkpoint.

Rapporti:

```text
checkpoints/CHECKPOINT_1.0_UPDATE.txt
checkpoints/CHECKPOINT_1.0_VERIFICATION.md
checkpoints/CHECKPOINT_1.0_CI_RESULT.json
checkpoints/CHECKPOINT_1.0_CI_RESULT.md
```

## Verifica automatica

Workflow:

```text
.github/workflows/eve-ai-studio-checks.yml
```

Il workflow esegue:

- installazione delle dipendenze;
- compilazione Python;
- suite cumulativa;
- controllo sintattico dei moduli JavaScript eseguibili;
- Chromium su un contenitore DOM controllato;
- scenari materiali, retrieval e chat RAG;
- produzione di rapporti e artefatti.

## Escluso dallo stato corrente

- provider AI reale;
- chiavi API;
- embedding;
- indice o database vettoriale;
- retrieval semantico o ibrido;
- reranker AI;
- generazione libera con modello linguistico;
- conoscenza generale aggiunta alle risposte RAG;
- PDF, Office, OCR e trascrizione;
- Supabase e object storage;
- autenticazione amministrativa di produzione;
- memoria didattica persistente;
- strumenti che modificano l’app ufficiale;
- integrazione nella produzione o nella demo canonica.

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
- embedding;
- collegamenti alla produzione.

## Passaggio successivo

Il Checkpoint 1.0 deve ricevere l’approvazione conclusiva dell’utente prima di definire o implementare il checkpoint successivo.
