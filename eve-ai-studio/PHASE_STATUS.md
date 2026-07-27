# Eve AI Studio — Stato delle fasi

## Stato corrente

Branch operativo: `eve-ai-studio`

Versione servizio: `1.1.0`

Stato: **Checkpoint 1.1 implementato e verificato tecnicamente**

- Checkpoint `0.8`: chiuso e approvato;
- Checkpoint `0.9`: chiuso e approvato;
- Checkpoint `1.0`: chiuso e approvato;
- Checkpoint `1.1`: implementato e verificato, in attesa dell’approvazione conclusiva dell’utente.

Il progetto resta isolato da `main`, `demo-canonica`, dall’HTML canonico, dall’app ufficiale e dal branch `eve-canonical-integration-v2`.

## Checkpoint realizzati

### 0.1 — Fondazione iniziale

FastAPI, provider mock, contratti tipizzati, contesto, permessi, limiti, audit e feature flag. 4 test specifici.

### 0.2 — Modularità e importatore

Moduli separati, parser delle 36 sezioni e 1.197 schede, validazione, checksum, routing, API, CLI e manifesto. 9 test specifici.

### 0.3 — Persistenza dei requisiti

SQLite, cronologia, snapshot immutabili, versione attiva, replace, merge, confronto e rollback non distruttivo. 15 test specifici.

### 0.4 — Prompt versionati

Revisioni immutabili, modalità didattiche, parametri tipizzati, workflow di approvazione, confronto, rollback e gate server-side. 15 test specifici.

### 0.5 — Valutazioni persistenti

Scenari versionati, severità, pesi, soglie, risultati per criterio, punteggio ponderato, invalidazione e gate reale. 18 test specifici.

### 0.6 — Runner automatico

Richieste eseguibili, provider mock deterministico, grader, durata, artefatti redatti, SHA-256 dell’output e schema valutazioni `2`. 29 test specifici.

### 0.7 — Provider, modelli e orchestrazione

Catalogo server-side, profili, timeout, retry, backoff, fallback, budget, stima costi e telemetria redatta. Provider esterno disattivato. 28 test specifici.

### 0.8 — Catalogo materiali e preparazione RAG

Stato: **chiuso e approvato**

- servizio `0.8.0`;
- catalogo SQLite isolato per aula;
- importazione controllata, checksum, deduplicazione e versioni immutabili;
- estrazione TXT, Markdown, CSV, HTML, XHTML e JSON;
- chunk con offset e SHA-256;
- nessun embedding o servizio esterno;
- 20 test specifici;
- 125 test cumulativi;
- 5 scenari browser.

### 0.9 — Retrieval locale e citazioni verificabili

Stato: **chiuso e approvato**

- servizio `0.9.0`;
- ranking deterministico `eve-lexical-v1`;
- sole versioni correnti `ready`;
- isolamento SQL per `room_id`;
- controllo SHA-256 ed esclusione dei chunk alterati;
- locator verificabili e segnalazione di contenuti sospetti;
- API `GET /v1/retrieval/status` e `POST /v1/retrieval/search`;
- 14 test specifici;
- 139 test cumulativi;
- 4 scenari browser retrieval.

### 1.0 — Chat RAG locale e deterministica

Stato: **chiuso e approvato**

- servizio `1.0.0`;
- package `app/rag`;
- provider dichiarato `local-rag`;
- modello dichiarato `eve-grounded-extractive-v1`;
- stato `grounded_extractive_chat_no_embeddings`;
- risposta estrattiva con marcatori `[n]` e citazioni verificabili;
- risposta `non trovato` senza conoscenza generale aggiunta;
- esclusione delle fonti sospette;
- nessuna azione proposta;
- API `GET /v1/rag/status` e `POST /v1/rag/chat`;
- 13 test specifici;
- 152 test cumulativi;
- 4 scenari browser RAG;
- GitHub Actions superato sul commit `a8ded290eef8983fce87a31a6ef67b02efa4728c`.

### 1.1 — Apertura verificabile della fonte

Stato: **implementato e verificato tecnicamente**

Versione servizio: `1.1.0`

Obiettivo della roadmap: rendere ogni risposta documentale apribile fino al passaggio autorizzato che l’ha supportata.

Implementato:

- package `app/sources` separato;
- parser rigido dei locator;
- formato `material:{material_id}:v{version_number}:chunk:{chunk_index}:{start_char}-{end_char}`;
- risoluzione limitata alla stessa aula;
- stesso `404 source_not_found` per fonte assente o appartenente a un’altra aula;
- verifica delle coordinate del chunk;
- verifica SHA-256 del testo del chunk;
- verifica del chunk contro la porzione corrispondente del testo estratto;
- verifica opzionale dello SHA-256 ricevuto dalla citazione;
- apertura delle versioni storiche `ready` con indicazione `stale`;
- opzione `require_current` per bloccare versioni non correnti;
- contesto precedente e successivo limitato;
- destinazione navigabile con resource path, anchor e pagina quando disponibile;
- contenuti sospetti mostrati come dati non fidati;
- `instructions_executable=false` sempre;
- API `GET /v1/sources/status`;
- API `POST /v1/sources/open`;
- configurazione `EVE_SOURCE_MAX_CONTEXT_CHARS=2000`;
- anteprima ufficiale aggiornata con cinque scenari.

Errori tipizzati:

```text
invalid_source_locator
source_not_found
source_integrity_failed
source_hash_mismatch
source_coordinates_mismatch
source_outdated
```

Test automatici:

```text
13 test specifici Checkpoint 1.1
165 test cumulativi Checkpoint 0.1–1.1
```

Scenari browser:

```text
5 materiali
4 retrieval
4 chat RAG
5 aperture fonte
18 scenari complessivi
```

GitHub Actions:

- commit verificato: `19fcd0e4ac55df862eb0131e6546f37a69746959`;
- installazione Python: success;
- compilazione Python: success;
- pytest cumulativo: success;
- sintassi JavaScript: success;
- Chromium: success;
- scenari browser: success;
- risultato: `165 passed, 1 warning in 2.59s`.

Il warning è una `StarletteDeprecationWarning` proveniente da `fastapi.testclient`; non è un fallimento del checkpoint.

Rapporti:

```text
checkpoints/CHECKPOINT_1.1_CI_RESULT.json
checkpoints/CHECKPOINT_1.1_CI_RESULT.md
checkpoints/CHECKPOINT_1.1_UPDATE.txt
checkpoints/CHECKPOINT_1.1_VERIFICATION.md
```

## Verifica automatica

Workflow:

```text
.github/workflows/eve-ai-studio-checks.yml
```

Il workflow verifica installazione, compilazione, suite cumulativa, sintassi JavaScript e 18 scenari in Chromium, quindi registra un rapporto ripetibile nel branch.

## Escluso dallo stato corrente

- provider AI reale;
- chiavi API;
- embedding;
- indice o database vettoriale;
- retrieval semantico o ibrido;
- reranker AI;
- generazione libera con modello linguistico;
- PDF, Office, OCR e trascrizione;
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

Il Checkpoint 1.1 deve ricevere l’approvazione conclusiva dell’utente prima di definire o implementare il checkpoint successivo.
