# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.7 implementato**

### Checkpoint 0.1 — Fondazione iniziale

- FastAPI;
- provider `mock`;
- contratti tipizzati;
- contesto didattico;
- permessi;
- limiti;
- audit pseudonimizzato;
- feature flag;
- 4 test.

### Checkpoint 0.2 — Modularità e importatore

- separazione di core, contesto e provider;
- parser delle 36 sezioni e 1.197 schede;
- validazione;
- checksum;
- routing dei requisiti;
- API e CLI;
- manifesto;
- anteprima aggiornata;
- 9 test.

### Checkpoint 0.3 — Persistenza dei requisiti

- SQLite;
- cronologia importazioni;
- snapshot immutabili;
- versione attiva;
- replace e merge;
- deduplicazione;
- confronto;
- rollback non distruttivo;
- 15 test specifici.

### Checkpoint 0.4 — Prompt versionati

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

### Checkpoint 0.5 — Valutazioni persistenti

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

### Checkpoint 0.6 — Runner automatico

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

### Checkpoint 0.7 — Provider, modelli e orchestrazione

Implementato:

- servizio versione `0.7.0`;
- catalogo server-side dei provider;
- catalogo server-side dei modelli;
- provider mock primario;
- modello mock di fallback;
- segnaposto esterno disattivato;
- provider esterni disattivati per impostazione predefinita;
- profili di esecuzione separati;
- profilo chat;
- profilo valutazioni;
- profilo esterno disattivato;
- timeout per target;
- retry controllati;
- backoff;
- fallback ordinato;
- controllo dello scopo del profilo;
- controllo dei provider esterni;
- limite token input;
- limite token output;
- limite token totale;
- budget token giornaliero;
- costo massimo per esecuzione;
- budget costi giornaliero;
- stima deterministica dei token;
- stima del costo dai dati del modello;
- telemetria persistente;
- hash della richiesta;
- hash della risposta;
- numero di tentativi;
- indicazione del fallback;
- durata totale;
- classe di errore redatta;
- chat instradata tramite orchestratore;
- runner delle valutazioni instradato tramite profilo dedicato;
- API di gestione;
- stessa anteprima approvata aggiornata;
- 28 test specifici superati.

### Provider registrati

1. `mock`
   - attivo;
   - deterministico;
   - nessuna rete;
   - nessuna chiave;
   - costo zero.

2. `external-template`
   - esterno;
   - disattivato;
   - nessuna factory;
   - nessuna credenziale;
   - non utilizzabile.

### Modelli registrati

1. `eve-foundation-mock-v2`
   - primario;
   - attivo;
   - contesto dichiarato 128.000 token;
   - costo zero.

2. `eve-foundation-mock-fallback-v1`
   - fallback;
   - attivo;
   - contesto dichiarato 64.000 token;
   - costo zero.

3. `external-model-placeholder`
   - disattivato;
   - nessun provider reale collegato.

### Profili

#### chat-development

- scopo `chat`;
- mock v2;
- timeout 2.000 ms;
- massimo 2 tentativi;
- massimo 12.000 token;
- provider esterni vietati.

#### evaluation-safe

- scopo `evaluation`;
- mock v2 primario;
- mock fallback v1 secondario;
- timeout 1.500 ms;
- massimo 2 tentativi per target;
- massimo 16.000 token;
- provider esterni vietati.

#### external-review

- disattivato;
- non selezionabile;
- richiederebbe implementazione e approvazione esplicite.

### Telemetria

Database:

```text
data/eve-provider-telemetry.sqlite3
```

Schema:

```text
1
```

Tabella:

```text
provider_execution_events
```

Dati registrati:

- data;
- scopo;
- profilo;
- provider;
- modello;
- stato;
- tentativi;
- fallback;
- durata;
- token input, output e totali;
- costo stimato;
- hash richiesta;
- hash risposta;
- classe errore.

Dati non registrati:

- messaggio;
- testo selezionato;
- risposta completa;
- corpo dell'eccezione;
- chiavi API.

### API aggiunte

```text
GET /v1/providers/status
GET /v1/providers/catalog
GET /v1/providers/models
GET /v1/providers/profiles
GET /v1/providers/telemetry
```

### Test del Checkpoint 0.7

```text
28 passed in 0.43s
```

Sono test specifici del nuovo modulo provider. La suite cumulativa completa dei checkpoint precedenti non è stata rilanciata e i conteggi non devono essere sommati automaticamente.

Verificati:

1. catalogo provider predefinito;
2. provider esterno disattivato;
3. modelli mock attivi;
4. creazione modello primario;
5. appartenenza modello-provider;
6. modello disattivato;
7. tre profili;
8. fallback del profilo valutazioni;
9. retry e timeout della chat;
10. profilo esterno disattivato;
11. schema telemetria;
12. scrittura e lettura;
13. aggregazione giornaliera;
14. persistenza dopo riapertura;
15. stima token;
16. esecuzione e telemetria;
17. ManagedEveProvider;
18. blocco budget input;
19. blocco scopo profilo;
20. retry e successo;
21. timeout e fallback;
22. fallimento di tutti i target;
23. redazione dell'errore;
24. budget token giornaliero;
25. API stato;
26. API catalogo e modelli;
27. API profili;
28. API telemetria.

### Verifica visiva

Provato nell'anteprima:

- apertura `Provider e modelli`;
- due provider;
- tre modelli;
- tre profili;
- provider esterno disattivato;
- esecuzione valida;
- retry;
- timeout e fallback;
- blocco budget prima della chiamata;
- blocco provider esterno prima della chiamata;
- token giornalieri;
- telemetria redatta;
- azzeramento dati demo;
- nessun errore JavaScript nel percorso controllato.

### Escluso dal checkpoint

- provider AI reale;
- chiavi API;
- tokenizer ufficiale del modello;
- circuit breaker distribuito;
- code e concorrenza dei run;
- RAG;
- Supabase;
- autenticazione amministrativa;
- memoria didattica;
- voce;
- strumenti che modificano Aula Studio Virtuale;
- integrazione con la produzione;
- avatar e animazioni definitive in attesa di consegna e approvazione.

### Prossimo checkpoint previsto

**Checkpoint 0.8 — catalogo dei materiali, importazione documentale controllata, estrazione testuale, stato di elaborazione, checksum, deduplicazione e preparazione della pipeline RAG senza embeddings esterni.**
