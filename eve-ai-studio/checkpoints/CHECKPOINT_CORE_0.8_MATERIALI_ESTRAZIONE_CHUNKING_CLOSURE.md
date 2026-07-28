# Eve AI Studio — Chiusura Checkpoint 0.8

Data: 26 luglio 2026

Branch verificato: `eve-ai-studio`

Versione servizio: `0.8.0`

## Esito

**CHECKPOINT 0.8 CHIUSO E APPROVATO**

L'utente ha autorizzato esplicitamente la conclusione del Checkpoint 0.8 e l'avanzamento al Checkpoint 0.9.

## Verifiche eseguite

### Suite specifica materiali

```text
20 passed
```

Verificati importazione, limiti, checksum, deduplicazione per aula, versioni, fallimenti, isolamento, estrazione HTML/JSON, UTF-8, chunk deterministici, persistenza, API e cronologia redatta.

### Suite cumulativa Checkpoint 0.1–0.8

```text
125 passed in 1.90s
```

La suite cumulativa ha individuato una sola aspettativa storica non più coerente: `test_evaluations.py` richiedeva ancora lo schema valutazioni `1`, mentre dal Checkpoint 0.6 lo schema reale è `2` e comprende `evaluation_run_artifacts`. Il test è stato aggiornato per verificare lo schema e la tabella effettivamente in uso. Nessuna funzione di produzione è stata ridotta o rimossa.

### Verifica browser della vista Materiali e RAG

Browser: Chromium headless

Scenari verificati:

1. importazione valida;
2. checksum duplicato;
3. nuova versione;
4. PDF non supportato;
5. dimensione superata.

Esito:

```text
5/5 scenari superati
0 errori JavaScript
0 eccezioni pagina
nessun overflow orizzontale a 1440 × 1200
```

Sono stati inoltre osservati gli stati Eve:

- `eve-success`;
- `eve-error-supportive`;
- `eve-confirmation-needed`.

La verifica browser ha eseguito il file ufficiale `reference/eve-ai-studio-preview/materials-workflow.js` in un contenitore DOM controllato. L'ambiente applica una policy che blocca `localhost` e `file://`; per questo il markup è stato caricato direttamente in una pagina `about:blank` tramite Chrome DevTools Protocol. Il codice del workflow non è stato riscritto durante la verifica.

## GitHub Actions

È stato aggiunto il workflow:

```text
.github/workflows/eve-ai-studio-checks.yml
```

I commit effettuati tramite il connettore GitHub non hanno generato un'esecuzione interrogabile di GitHub Actions. La chiusura non dichiara quindi una run Actions eseguita: i risultati sopra provengono dal banco locale ricostruito dai contenuti del branch e da Chromium reale.

## Protezioni rispettate

Non sono stati modificati:

- `main`;
- `demo-canonica`;
- `reference/demo-aula-studio-virtuale-canonica.html`;
- l'app ufficiale;
- `eve-canonical-integration-v2`;
- il pacchetto master Eve Animation Library 1.2.2.

Non sono stati eseguiti:

- merge;
- pull request;
- provider AI reali;
- embedding esterni;
- database vettoriali;
- chiamate documentali esterne.

## Stato finale del Checkpoint 0.8

Il catalogo materiali, l'importazione controllata, l'estrazione testuale iniziale, il versionamento e la preparazione dei chunk sono verificati e utilizzabili come base del Checkpoint 0.9.

Il Checkpoint 0.8 non implementa ancora embedding, ricerca semantica o generazione collegata ai chunk.
