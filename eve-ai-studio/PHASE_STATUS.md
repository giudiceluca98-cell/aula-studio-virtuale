# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.1 implementato**

Riferimenti del piano:

- struttura separata;
- provider AI astratto;
- permessi;
- contesto;
- privacy e consenso;
- log e limiti;
- test minimi.

### Implementato

- directory isolata `eve-ai-studio/`;
- progetto Python configurato;
- servizio FastAPI;
- endpoint `GET /health`;
- endpoint `POST /v1/chat`;
- provider deterministico `mock`;
- contratti tipizzati con Pydantic;
- contesto di utente, aula, corso, lezione, sezione e testo selezionato;
- livelli di permesso;
- limite massimo per il testo selezionato;
- audit con identificatori pseudonimizzati;
- feature flag `EVE_ENABLED`;
- quattro test automatici iniziali.

### Verifica eseguita

Comando:

```bash
PYTHONPATH=. pytest -q
```

Risultato locale:

```text
4 passed
```

### Escluso dal checkpoint

- modello AI reale;
- chiavi API;
- RAG;
- Supabase;
- memoria persistente;
- voce;
- strumenti di scrittura;
- integrazione con l'app pubblica.

### Prossimo checkpoint previsto

Checkpoint 0.2 — separazione dei moduli interni e importatore strutturato dei requisiti del plaintext.
