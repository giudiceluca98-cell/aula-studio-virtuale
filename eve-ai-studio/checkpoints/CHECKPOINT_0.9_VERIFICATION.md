# Eve AI Studio — Verifica conclusiva Checkpoint 0.9

Data: 26 luglio 2026

Branch: `eve-ai-studio`

Versione servizio: `0.9.0`

## Esito tecnico

**CHECKPOINT 0.9 IMPLEMENTATO E VERIFICATO TECNICAMENTE**

L’approvazione conclusiva dell’utente resta da registrare prima di definire o implementare il checkpoint successivo.

## Verifica locale

### Test specifici retrieval

```text
14 passed in 0.57s
```

### Suite cumulativa 0.1–0.9

```text
139 passed in 2.22s
```

### Chromium locale

```text
4/4 scenari retrieval
0 errori JavaScript
0 eccezioni pagina
nessun overflow orizzontale
```

Scenari:

1. risultati pertinenti;
2. nessun risultato;
3. fonte con istruzioni sospette;
4. isolamento tra aule.

Durante la prima prova, lo scenario normale includeva anche la fonte sospetta perché condivideva il termine `funzione`. La query dimostrativa è stata corretta in `parametri valore` e il test è stato ripetuto con esito positivo. Il backend non è stato modificato per adattarsi alla demo.

## GitHub Actions

Commit verificato automaticamente:

```text
ded899f36cd7cfa9832a984e7b3b916ddcce9f1c
```

Esito:

```text
SUPERATO
```

Stati:

| Controllo | Esito |
|---|---|
| installazione Python | success |
| compilazione Python | success |
| pytest cumulativo | success |
| sintassi JavaScript | success |
| installazione Chromium | success |
| scenari browser | success |

Suite GitHub Actions:

```text
139 passed, 1 warning in 2.39s
```

Il warning è una `StarletteDeprecationWarning` proveniente da `fastapi.testclient` sull’uso futuro di `httpx2`. Non è un fallimento dei test e non modifica il comportamento del checkpoint.

Verifica browser automatica:

```text
5 scenari materiali
4 scenari retrieval
9/9 scenari complessivi
```

Il browser automatico usa un contenitore DOM controllato e carica i file ufficiali:

```text
reference/eve-ai-studio-preview/materials-workflow.js
reference/eve-ai-studio-preview/retrieval-workflow.js
```

I payload compressi della galleria delle 64 animazioni non vengono reinterpretati come moduli sorgente durante questo controllo.

Rapporti automatici:

```text
checkpoints/CHECKPOINT_0.9_CI_RESULT.json
checkpoints/CHECKPOINT_0.9_CI_RESULT.md
```

## Funzioni verificate

- ricerca lessicale locale;
- ranking deterministico `eve-lexical-v1`;
- isolamento per `room_id`;
- uso delle sole versioni correnti `ready`;
- mancata sostituzione della fonte pronta dopo una revisione fallita;
- filtro `material_ids` senza divulgazione tra aule;
- verifica SHA-256 del chunk;
- esclusione dei chunk alterati;
- citazioni con materiale, versione, chunk, offset e hash;
- limite dei risultati;
- query hash;
- risposta vuota senza fonti inventate;
- segnalazione di contenuti simili a prompt injection;
- API `/v1/retrieval/status` e `/v1/retrieval/search`;
- assenza di embedding, provider esterni e rete.

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
- provider AI reali;
- embedding;
- database vettoriali;
- collegamento del retrieval alla chat;
- integrazione nella produzione.

## Stato finale

Il Checkpoint 0.9 dispone di codice, test specifici, suite cumulativa, controllo browser locale, controllo browser GitHub Actions, documentazione e anteprima aggiornati.

Il checkpoint è tecnicamente pronto per l’approvazione conclusiva dell’utente.
