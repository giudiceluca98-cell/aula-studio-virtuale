# Eve AI Studio — Verifica conclusiva Checkpoint 1.0

Data: 27 luglio 2026

Branch: `eve-ai-studio`

Versione servizio: `1.0.0`

## Esito tecnico

**CHECKPOINT 1.0 IMPLEMENTATO E VERIFICATO TECNICAMENTE**

L’approvazione conclusiva dell’utente resta necessaria prima di definire o implementare il checkpoint successivo.

## Perimetro

Il Checkpoint 1.0 implementa una chat RAG locale e deterministica che:

- cerca nei materiali autorizzati della stessa aula;
- usa soltanto le versioni correnti `ready`;
- verifica l’integrità SHA-256 dei chunk;
- esclude le fonti sospette;
- costruisce una risposta estrattiva con marcatori `[n]`;
- restituisce citazioni verificabili;
- dichiara “non trovato” quando il supporto manca;
- non aggiunge conoscenza generale;
- non propone azioni.

## Identità tecnica

```text
provider: local-rag
model: eve-grounded-extractive-v1
stage: grounded_extractive_chat_no_embeddings
scope: authorized_room_current_ready_materials_only
```

## API verificate

```text
GET  /v1/rag/status
POST /v1/rag/chat
```

La rotta `POST /v1/chat` non è stata modificata nel comportamento.

## Suite automatica

Commit verificato:

```text
a8ded290eef8983fce87a31a6ef67b02efa4728c
```

Esito GitHub Actions:

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

Risultato pytest:

```text
152 passed, 1 warning in 2.96s
```

Il warning è una `StarletteDeprecationWarning` proveniente da `fastapi.testclient`. Non è un fallimento del checkpoint.

## Test specifici 1.0

```text
13 passed
```

Verificati:

1. stato locale e deterministico;
2. risposta grounded con citazioni;
3. nessun risultato senza invenzioni;
4. isolamento tra aule;
5. filtro `material_ids` senza divulgazione;
6. esclusione della fonte sospetta quando esiste una fonte sicura;
7. rifiuto con sole fonti sospette;
8. limite delle fonti;
9. determinismo della risposta;
10. esclusione del chunk alterato;
11. uso della versione corrente `ready`;
12. API e obbligo dell’aula;
13. query non valida.

## Verifica browser

```text
5 scenari materiali
4 scenari retrieval
4 scenari chat RAG
13/13 scenari complessivi
```

Scenari chat RAG:

1. risposta con fonti;
2. nessuna fonte;
3. solo fonte sospetta;
4. isolamento tra aule.

Il browser ha caricato i file ufficiali:

```text
reference/eve-ai-studio-preview/materials-workflow.js
reference/eve-ai-studio-preview/retrieval-workflow.js
reference/eve-ai-studio-preview/rag-chat-workflow.js
```

Esito:

- nessun errore JavaScript;
- nessuna eccezione pagina;
- nessun overflow orizzontale nel contenitore controllato;
- stati Eve `eve-success`, `eve-error-supportive` ed `eve-confirmation-needed` raggiunti.

## Sicurezza delle fonti

Policy:

```text
exclude_from_answer_and_citations
```

Le istruzioni presenti nei documenti:

- sono trattate come contenuto;
- non possono modificare le regole di Eve;
- non possono autorizzare strumenti;
- non vengono inserite nella risposta quando segnalate come sospette.

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
- integrazione nella produzione.

## Limiti dichiarati

La risposta è estrattiva e deterministica. Non sono ancora presenti:

- generazione con un modello linguistico;
- parafrasi o sintesi semantica;
- conoscenza generale;
- embedding;
- retrieval semantico o ibrido;
- indice vettoriale;
- reranker AI;
- memoria didattica;
- strumenti di scrittura.

## Rapporti

```text
checkpoints/CHECKPOINT_1.0_UPDATE.txt
checkpoints/CHECKPOINT_1.0_VERIFICATION.md
checkpoints/CHECKPOINT_1.0_CI_RESULT.json
checkpoints/CHECKPOINT_1.0_CI_RESULT.md
```

## Stato finale

Il Checkpoint 1.0 dispone di codice, test specifici, suite cumulativa, verifica browser, GitHub Actions verde, documentazione e anteprima ufficiale aggiornati.

È tecnicamente pronto per l’approvazione conclusiva dell’utente.
