# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.3 implementato**

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

### Checkpoint 0.3 — Persistenza, versioni e rollback

Implementato:

- storage SQLite separato in `app/requirements/storage.py`;
- migrazione automatica schema `1`;
- percorso database configurabile;
- cronologia di tutte le importazioni;
- registrazione degli errori senza salvare il plaintext completo;
- snapshot immutabili delle versioni;
- versione attiva persistente;
- modalità `replace` e `merge`;
- deduplicazione dei cataloghi identici;
- hash separato della sorgente e del catalogo strutturato;
- elenco e dettaglio delle versioni;
- confronto aggiunte/rimozioni/modifiche/invariati;
- elenco dei campi modificati;
- rollback non distruttivo;
- persistenza verificata dopo riapertura del database;
- anteprima approvata aggiornata allo stesso URL;
- 15 test automatici superati.

### Verifica del piano ufficiale

```text
Sezioni: 36
Schede: 1.197
Avvisi: 0
Versione creata: 1
Seconda importazione: unchanged
Versioni totali dopo il reimport: 1
SHA-256 sorgente: da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313
SHA-256 catalogo: 886e2cd4146431da68a0bb7c86975cc7900ca863370eea29d8bad9ec4555ed9f
```

### Test

```text
15 passed
```

Test nuovi del Checkpoint 0.3:

1. creazione e versione dello schema SQLite;
2. persistenza tra due istanze del servizio;
3. confronto tra versioni;
4. rollback del catalogo attivo;
5. riuso di una versione identica;
6. gestione di versioni inesistenti;
7. registrazione delle importazioni fallite.

### Escluso dal checkpoint

- provider AI reale;
- RAG;
- Supabase;
- autenticazione;
- memoria;
- voce;
- strumenti che modificano Aula Studio Virtuale;
- integrazione con la produzione.

### Prossimo checkpoint previsto

**Checkpoint 0.4 — configurazione versionata dei prompt e delle modalità didattiche, con stato bozza/revisione/pubblicazione e confronto tra configurazioni.**
