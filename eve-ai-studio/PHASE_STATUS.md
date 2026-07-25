# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.6 implementato**

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
- validazione dei campi obbligatori;
- checksum sorgente;
- routing dei requisiti;
- API e CLI;
- manifesto ufficiale;
- anteprima interattiva aggiornata;
- 9 test.

### Checkpoint 0.3 — Persistenza, versioni e rollback dei requisiti

- storage SQLite;
- cronologia delle importazioni;
- snapshot immutabili;
- versione attiva persistente;
- modalità `replace` e `merge`;
- deduplicazione;
- confronto dettagliato;
- rollback non distruttivo;
- 15 test specifici.

### Checkpoint 0.4 — Prompt versionati e workflow di approvazione

- modulo separato `app/prompts`;
- storage SQLite dedicato;
- prompt di sistema versionati;
- revisioni immutabili;
- modalità didattiche tipizzate;
- workflow `draft → in_review → publishable → published → archived`;
- confronto e rollback;
- gate server-side;
- API dedicate;
- anteprima aggiornata;
- 15 test specifici.

### Checkpoint 0.5 — Valutazioni persistenti e gate reale

- modulo separato `app/evaluations`;
- storage SQLite dedicato;
- scenari versionati;
- severità, pesi e soglie;
- scenari obbligatori e opzionali;
- snapshot della suite;
- run collegati alla versione prompt;
- risultati per criterio;
- punteggio ponderato;
- errori critici e fallimenti obbligatori;
- invalidazione dei run quando cambia la suite;
- gate collegato al workflow prompt;
- baseline idempotente;
- API dedicate;
- anteprima aggiornata;
- 18 test specifici.

### Checkpoint 0.6 — Runner automatico e grader deterministici

Implementato:

- servizio versione `0.6.0`;
- runner automatico separato;
- uso del contratto comune `EveProvider`;
- provider deterministico `mock`;
- migrazione degli scenari privi di input verso nuove versioni eseguibili;
- costruzione di `ChatRequest` tipizzate;
- esecuzione sequenziale degli scenari;
- misurazione della durata;
- grader automatici iniziali;
- fallback generico per scenari aggiuntivi;
- completamento automatico dei run;
- ricalcolo del gate;
- artefatti redatti persistenti;
- hash SHA-256 dell'output strutturato;
- nessun output completo salvato;
- codice della classe di errore senza corpo dell'eccezione;
- limite configurabile delle evidenze;
- schema valutazioni aggiornato alla versione `2`;
- API dedicate;
- stessa anteprima approvata aggiornata;
- verifica visuale del flusso automatico;
- 29 test specifici superati.

### Grader automatici

1. `context-correctness`
   - verifica gli identificativi del contesto corrente.

2. `source-grounding`
   - verifica la presenza e la coerenza delle fonti.

3. `room-isolation`
   - cerca valori vietati appartenenti ad altri ambiti.

4. `permission-enforcement`
   - verifica l'assenza di azioni oltre il livello autorizzato.

5. `uncertainty-handling`
   - verifica la dichiarazione dell'incertezza.

6. `pedagogical-quality`
   - verifica modalità e struttura didattica minima.

7. `language-consistency`
   - verifica la coerenza della lingua italiana.

8. `latency-budget`
   - confronta la durata col budget configurato.

9. fallback generico
   - verifica che il provider restituisca una risposta non vuota.

### Protezione dei dati del runner

Per ogni scenario vengono conservati soltanto:

- provider;
- modello;
- durata;
- SHA-256;
- numero di caratteri;
- numero di fonti;
- numero di azioni proposte;
- indicazione di redazione;
- eventuale classe di errore.

Non vengono conservati:

- testo completo della richiesta;
- testo completo della risposta;
- contenuto completo dell'eccezione;
- dati sensibili non necessari alla valutazione.

### API aggiunte

```text
GET  /v1/evaluations/runner/status
POST /v1/evaluations/runs/execute
GET  /v1/evaluations/runs/{run_id}/artifacts
```

L'API manuale di completamento dei run resta disponibile per compatibilità e per risultati provenienti da runner esterni controllati.

### Test del Checkpoint 0.6

```text
29 passed
```

Ultima esecuzione locale:

```text
29 passed in 0.31s
```

Sono test specifici del runner, dei grader, degli artefatti, dell'orchestrazione e delle API. La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata e i conteggi non devono essere sommati automaticamente.

Verificati:

1. stato deterministico e privacy del runner;
2. costruzione degli input predefiniti;
3. override degli input;
4. esito degli otto grader;
5. rilevazione di una perdita tra aule;
6. rilevazione di un'azione non autorizzata;
7. fallimento del budget di latenza;
8. grader generico;
9. redazione degli errori provider;
10. limite delle evidenze;
11. assenza del testo completo negli artefatti;
12. migrazione SQLite alla versione `2`;
13. round trip degli artefatti;
14. copertura esatta dello snapshot;
15. errore per run inesistente;
16. input eseguibili degli scenari;
17. migrazione idempotente;
18. esecuzione automatica completa;
19. consultazione degli artefatti;
20. API di stato runner;
21. API di esecuzione;
22. API degli artefatti;
23. compatibilità con gate e run persistenti.

### Verifica visiva

Provato nell'anteprima:

- apertura di `Revisione e test`;
- visualizzazione del pannello runner;
- provider e modello mock;
- otto input eseguibili;
- indicazione `Output grezzo salvato: No`;
- avanzamento dei cinque stadi;
- esecuzione valida;
- creazione di otto artefatti redatti;
- durata, hash e conteggi visibili;
- ricalcolo del gate;
- simulazione di errore provider redatto;
- simulazione di latenza oltre budget;
- nessun errore JavaScript nel percorso controllato.

### Escluso dal checkpoint

- provider AI reale;
- grader semantico basato su un modello indipendente;
- misurazione di token e costi;
- retry e fallback tra provider;
- RAG;
- Supabase;
- autenticazione;
- memoria didattica;
- voce;
- strumenti che modificano Aula Studio Virtuale;
- integrazione con la produzione;
- avatar e animazioni definitive di Eve, in attesa di consegna e approvazione.

### Prossimo checkpoint previsto

**Checkpoint 0.7 — registro dei provider e dei modelli, profili di esecuzione, timeout, retry controllati, fallback, telemetria di token e costi, mantenendo il provider esterno disattivato per impostazione predefinita.**
