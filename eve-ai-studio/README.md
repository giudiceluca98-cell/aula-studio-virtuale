# Eve AI Studio — Fondazione

Questa directory contiene il primo checkpoint reale di Eve AI Studio, sviluppato sulla branch `eve-ai-studio` e isolato dal resto di Aula Studio Virtuale.

## Ambito del checkpoint

Implementa la Fase 0 del piano:

- servizio Python/FastAPI avviabile;
- provider AI astratto con provider `mock` deterministico;
- richieste e risposte tipizzate;
- contesto di utente, aula, corso, lezione e selezione;
- livelli di permesso verificati dal codice;
- limite del contesto;
- audit minimale senza salvare messaggi o testo selezionato;
- feature flag per disattivare Eve;
- test automatici iniziali.

Non implementa ancora:

- collegamento a un modello AI esterno;
- RAG o indicizzazione dei materiali;
- memoria permanente;
- voce;
- strumenti che modificano l'app;
- integrazione con Supabase o con la produzione.

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

Aprire:

- API: `http://127.0.0.1:8100`
- documentazione interattiva: `http://127.0.0.1:8100/docs`
- stato: `http://127.0.0.1:8100/health`

## Test

```bash
pytest
```

## Regola di sicurezza

Il modello può proporre un risultato, ma identità, permessi, limiti e azioni devono essere verificati dal codice sul server.
