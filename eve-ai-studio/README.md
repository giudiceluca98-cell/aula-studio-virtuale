# Eve AI Studio — Fondazione modulare

Questa directory contiene il servizio isolato di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` senza modificare `main`, `demo-canonica` o l'app pubblica.

## Stato

Versione del servizio: `0.2.0`

Checkpoint implementati:

- `0.1` — fondazione FastAPI, provider mock, contesto, permessi, limiti e audit;
- `0.2` — separazione dei moduli e importatore strutturato del piano approfondito.

## Struttura

```text
eve-ai-studio/
├── app/
│   ├── core/                 # configurazione, permessi e audit
│   ├── context/              # validazione del contesto didattico
│   ├── providers/            # astrazione e provider mock
│   ├── requirements/         # parser, routing, registro, CLI e modelli
│   ├── main.py               # API FastAPI
│   └── models.py             # contratti chat condivisi
├── data/
│   └── requirements-import-manifest.json
├── tests/
├── checkpoints/
├── .env.example
├── PHASE_STATUS.md
└── pyproject.toml
```

La separazione segue il principio del piano: l'interfaccia non contiene la logica del modello, il modello non accede direttamente al database e permessi/azioni sono verificati dal codice server.

## Importatore del plaintext

L'importatore riconosce:

- le 36 sezioni numerate;
- gli identificativi `SCHEDA X.Y`;
- titolo;
- obiettivo operativo;
- esperienza dell'utente;
- implementazione proposta;
- dati, permessi e tracciabilità;
- casi limite e rischi;
- verifica e criterio di completamento;
- indicazione di ownership;
- modulo tecnico suggerito.

Il piano ufficiale usato per la verifica ha prodotto:

```text
36 sezioni
1.197 schede
0 avvisi
SHA-256: da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313
```

Il manifesto `data/requirements-import-manifest.json` registra conteggi, checksum, sezioni e distribuzione dei moduli. L'indice completo viene generato dalla CLI e non è duplicato nel repository.

### Utilizzo da riga di comando

```bash
cd eve-ai-studio
python -m app.requirements.cli PIANO_EVE_AI_APPROFONDITO_COMPLETO.txt \
  --output data/requirements-index.generated.json \
  --expected-sections 36 \
  --expected-cards 1197
```

Aggiungere `--full` soltanto quando serve esportare anche tutti i campi testuali.

## API

```http
GET /health
POST /v1/chat
GET /v1/requirements/status
POST /v1/requirements/import
GET /v1/requirements/sections
GET /v1/requirements
GET /v1/requirements/{requirement_id}
```

La lista supporta filtri per sezione, modulo, testo, offset e limite.

## Avvio locale

```bash
cd eve-ai-studio
python -m venv .venv
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8100
```

Indirizzi:

- API: `http://127.0.0.1:8100`
- documentazione: `http://127.0.0.1:8100/docs`
- stato: `http://127.0.0.1:8100/health`

## Test

```bash
pytest
```

Risultato del checkpoint 0.2:

```text
9 passed
```

## Limiti attuali

Non sono ancora implementati:

- modello AI reale;
- RAG;
- database persistente;
- Supabase;
- memoria;
- voce;
- strumenti di scrittura;
- integrazione con l'app ufficiale.

## Regola di sicurezza

Il modello può proporre un risultato. Identità, contesto, permessi, limiti, memoria e azioni devono essere verificati da codice server indipendente dal modello.
