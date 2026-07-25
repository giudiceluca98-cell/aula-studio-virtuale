# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.4 implementato**

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

Implementato:

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
- interazioni visuali per bozza, revisione, test, pubblicazione, confronto e rollback.

### Stati e transizioni

```text
draft → in_review → publishable → published → archived
```

Ritorni consentiti:

```text
in_review → draft
publishable → draft
```

Gate implementati:

- pubblicazione diretta dalla bozza bloccata;
- passaggio a `publishable` bloccato senza test superati;
- una sola versione pubblicata attiva per configurazione;
- le versioni precedenti non vengono eliminate;
- il rollback genera una nuova bozza.

### Modalità didattiche

1. spiegazione adattiva;
2. metodo socratico;
3. quiz e interrogazione;
4. correzione guidata;
5. pianificazione dello studio.

### API aggiunte

```text
GET  /v1/prompts/status
GET  /v1/prompts/modes
GET  /v1/prompts/compare
POST /v1/prompts/rollback
GET  /v1/prompts
POST /v1/prompts
GET  /v1/prompts/{version_id}
POST /v1/prompts/{version_id}/revisions
POST /v1/prompts/{version_id}/transition
```

### Test del Checkpoint 0.4

```text
15 passed
```

Sono i test specifici del nuovo modulo prompt e delle sue API. La suite completa cumulativa dei checkpoint precedenti non è stata rilanciata durante questa chiusura e i conteggi non devono essere sommati automaticamente.

Verificati:

1. schema e tabelle SQLite;
2. configurazione iniziale pubblicata;
3. creazione delle bozze;
4. conflitto su chiave duplicata;
5. revisioni immutabili;
6. blocco delle transizioni illegali;
7. obbligo dei test per `publishable`;
8. archiviazione della precedente configurazione attiva;
9. confronto di prompt, modalità e parametri;
10. rollback non distruttivo;
11. persistenza tra riaperture;
12. versioni inesistenti;
13. creazione, elenco e dettaglio API;
14. gate API;
15. confronto, modalità e rollback API.

### Verifica visiva

Provato nell'anteprima:

- apertura di `Prompt e comportamento`;
- selezione delle versioni;
- salvataggio di una nuova bozza;
- passaggio bozza → revisione;
- passaggio revisione → pubblicabile dopo test;
- pubblicazione;
- cambio della versione attiva;
- archiviazione della precedente;
- confronto tra configurazioni;
- rollback verso una nuova bozza;
- storico conservato;
- nessun errore JavaScript nel percorso controllato.

### Escluso dal checkpoint

- provider AI reale;
- RAG;
- Supabase;
- autenticazione;
- memoria didattica;
- voce;
- strumenti che modificano Aula Studio Virtuale;
- integrazione con la produzione;
- avatar e animazioni definitive di Eve, in attesa di consegna e approvazione.

### Prossimo checkpoint previsto

**Checkpoint 0.5 — scenari di valutazione persistenti, risultati delle esecuzioni e collegamento reale tra test superati e gate di pubblicazione dei prompt.**
