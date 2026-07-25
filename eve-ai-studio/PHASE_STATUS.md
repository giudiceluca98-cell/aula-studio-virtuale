# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.5 implementato**

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
- 15 test automatici del checkpoint.

### Checkpoint 0.4 — Prompt versionati e workflow di approvazione

- modulo separato `app/prompts`;
- storage SQLite dedicato;
- schema prompt versione `1`;
- configurazione database tramite `EVE_PROMPTS_DB_PATH`;
- prompt di sistema versionati;
- checksum delle configurazioni;
- revisioni immutabili;
- versione genitore;
- storico delle transizioni;
- configurazione attiva;
- pubblicazione esclusiva per chiave;
- archiviazione automatica della versione pubblicata precedente;
- rollback non distruttivo in una nuova bozza;
- confronto dei campi modificati;
- cinque modalità didattiche tipizzate;
- parametri per tono, profondità, fonti, soluzione, memoria e strumenti;
- API FastAPI dedicate;
- anteprima approvata aggiornata allo stesso URL;
- 15 test specifici.

### Checkpoint 0.5 — Valutazioni persistenti e gate reale

Implementato:

- modulo separato `app/evaluations`;
- storage SQLite dedicato;
- schema valutazioni versione `1`;
- configurazione tramite `EVE_EVALUATIONS_DB_PATH`;
- soglia configurabile tramite `EVE_EVALUATION_PUBLISH_SCORE`;
- scenari versionati e immutabili;
- versione attiva per ogni scenario;
- severità `critical`, `major` e `minor`;
- pesi e soglie minime;
- scenari obbligatori e opzionali;
- snapshot della suite per ogni esecuzione;
- collegamento dei run alla versione prompt;
- risultati separati per criterio;
- punteggio ponderato;
- conteggio degli errori critici;
- conteggio degli scenari obbligatori falliti;
- cronologia persistente delle esecuzioni;
- gate calcolato dall'ultima esecuzione completata;
- invalidazione dei run quando cambia la suite attiva;
- collegamento del gate al passaggio prompt `in_review → publishable`;
- impossibilità di forzare il gate con il solo valore legacy `review_tests_passed`;
- baseline iniziale idempotente per la configurazione pubblicata;
- API FastAPI dedicate;
- stessa anteprima approvata aggiornata;
- verifica visiva del percorso completo;
- 18 test specifici superati.

### Suite iniziale degli scenari

1. contesto didattico corretto;
2. fonti verificabili;
3. isolamento tra aule;
4. permessi delle azioni;
5. gestione dell'incertezza;
6. qualità didattica;
7. coerenza della lingua;
8. budget di latenza.

### Regole del gate

Una versione prompt diventa pubblicabile soltanto quando:

- esiste un'esecuzione completata;
- l'esecuzione usa la suite attiva corrente;
- l'esecuzione risulta `passed`;
- gli errori critici sono `0`;
- i fallimenti obbligatori sono `0`;
- il punteggio ponderato raggiunge la soglia configurata.

Un fallimento opzionale può essere tollerato soltanto quando non è critico, non è obbligatorio e il punteggio resta sopra soglia.

Quando uno scenario viene revisionato, tutti i gate basati sulla precedente suite diventano obsoleti fino a una nuova esecuzione.

### API aggiunte

```text
GET  /v1/evaluations/status
GET  /v1/evaluations/gate/{prompt_version_id}
GET  /v1/evaluations/scenarios
POST /v1/evaluations/scenarios
GET  /v1/evaluations/scenarios/{scenario_version_id}
POST /v1/evaluations/scenarios/{scenario_version_id}/revisions
GET  /v1/evaluations/runs
POST /v1/evaluations/runs
GET  /v1/evaluations/runs/{run_id}
POST /v1/evaluations/runs/{run_id}/complete
```

### Test del Checkpoint 0.5

```text
18 passed
```

Sono test specifici del nuovo modulo di valutazione, delle API e del collegamento con il gate prompt. La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata durante questa chiusura e i conteggi non devono essere sommati automaticamente.

Verificati:

1. schema e tabelle SQLite;
2. otto scenari iniziali;
3. revisione versionata;
4. archiviazione della versione scenario precedente;
5. conflitto su chiave duplicata;
6. snapshot della suite;
7. punteggio ponderato;
8. risultati per criterio;
9. errore critico bloccante;
10. fallimento opzionale non bloccante;
11. copertura incompleta dei risultati bloccata;
12. invalidazione del gate dopo revisione della suite;
13. persistenza tra riaperture;
14. versione prompt inesistente;
15. baseline idempotente;
16. API di stato, scenari e gate;
17. API di esecuzione, completamento e fallimento critico;
18. uso obbligatorio del gate persistente nel workflow prompt.

### Verifica visiva

Provato nell'anteprima:

- apertura di `Revisione e test`;
- visualizzazione degli otto scenari;
- severità, peso, soglia e obbligatorietà;
- run iniziale fallito per isolamento tra aule;
- esecuzione valida sulla versione prompt v3;
- passaggio del gate da bloccato a pubblicabile;
- uso del gate nella schermata prompt;
- passaggio `in_review → publishable` soltanto dopo il run valido;
- pubblicazione del prompt;
- versionamento dello scenario `room-isolation`;
- invalidazione automatica del gate precedente;
- cronologia dei run conservata;
- risultati per criterio visibili;
- nessun errore JavaScript nel percorso controllato.

### Escluso dal checkpoint

- provider AI reale;
- esecuzione automatica dei test contro un modello;
- RAG;
- Supabase;
- autenticazione;
- memoria didattica;
- voce;
- strumenti che modificano Aula Studio Virtuale;
- integrazione con la produzione;
- avatar e animazioni definitive di Eve, in attesa di consegna e approvazione.

### Prossimo checkpoint previsto

**Checkpoint 0.6 — runner di valutazione deterministico con provider mock, definizione degli input degli scenari, grader automatici iniziali e registrazione dell'output valutato senza conservare contenuti sensibili non necessari.**
