# Eve AI Studio — Stato delle fasi

## Fase 0 — Fondazione

Stato: **checkpoint 0.2 implementato**

Riferimenti del piano:

- struttura separata;
- provider AI astratto;
- permessi;
- contesto;
- privacy e consenso;
- log e limiti;
- test minimi;
- crescita per moduli indipendenti;
- mappa stabile delle future modifiche.

### Checkpoint 0.1 — Fondazione iniziale

Implementato:

- directory isolata `eve-ai-studio/`;
- progetto Python;
- FastAPI;
- endpoint salute e chat simulata;
- provider deterministico `mock`;
- contratti Pydantic;
- contesto didattico;
- livelli di permesso;
- limiti del contesto;
- audit pseudonimizzato;
- feature flag;
- quattro test iniziali.

### Checkpoint 0.2 — Modularità e importatore del piano

Implementato:

- separazione di configurazione, audit, permessi, contesto e provider;
- file `foundation.py` mantenuto soltanto come compatibilità temporanea;
- modulo `app/requirements/`;
- parser deterministico delle sezioni e delle schede;
- validazione dei sei campi operativi obbligatori;
- controllo degli identificativi duplicati;
- controllo opzionale del numero atteso di sezioni e schede;
- calcolo SHA-256 della sorgente;
- routing delle schede verso moduli tecnici;
- registro in memoria;
- ricerca e filtri;
- CLI di importazione;
- API di importazione e consultazione;
- manifesto verificabile dell'importazione ufficiale delle 1.197 schede;
- cinque nuovi test automatici, compresa l'integrità del manifesto ufficiale.

### Verifica del plaintext ufficiale

```text
File: PIANO_EVE_AI_APPROFONDITO_COMPLETO.txt
Sezioni: 36
Schede: 1.197
Avvisi: 0
SHA-256: da527e3a5edb5ccc8b5a436d5eb5873d3fac26ecba10b8402c66414bd75b6313
```

### Verifica automatica

```bash
PYTHONPATH=. pytest -q
```

Risultato locale:

```text
9 passed
```

### Sicurezza confermata

- nessuna chiave API;
- nessun provider esterno;
- nessun accesso a Supabase;
- nessuna modifica dell'app pubblica;
- nessuna azione autonoma;
- nessun contenuto delle chat nei log;
- nessun testo completo del piano duplicato nel repository.

### Escluso dal checkpoint

- persistenza database del catalogo;
- interfaccia amministrativa reale;
- autenticazione;
- modello AI;
- RAG;
- memoria;
- voce;
- strumenti di scrittura;
- integrazione con Aula Studio Virtuale.

### Prossimo checkpoint previsto

**Checkpoint 0.3 — persistenza locale del catalogo requisiti, versionamento delle importazioni e report di differenza tra due versioni del plaintext.**
