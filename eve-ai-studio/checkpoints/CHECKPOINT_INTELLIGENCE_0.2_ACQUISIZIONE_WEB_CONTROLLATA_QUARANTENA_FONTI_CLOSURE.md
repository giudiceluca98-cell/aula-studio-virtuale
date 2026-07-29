# INTELLIGENCE-0.2 — Chiusura acquisizione web controllata

Data preparazione: 29 luglio 2026
Linea: `INTELLIGENCE`
Branch canonico: `eve-ai-studio`

## Stato

**CHIUSO E APPROVATO — FUNZIONALE, UI CANONICA, DESKTOP E SICUREZZA VERIFICATI.**

## Condizioni già preparate nel pacchetto

- wiring del modulo esistente;
- configurazione documentata;
- controllo robots su ogni destinazione della catena;
- suite specifica;
- modifica non regressiva del modulo UI canonico;
- applicatore anti-drift;
- verificatore;
- rollback;
- handoff unico;
- documentazione distinta della linea INTELLIGENCE.

## Condizioni completate

1. applicazione sul branch dedicato aggiornato dall'ultima `origin/eve-ai-studio`;
2. test specifici e cumulativi reali superati;
3. commit funzionale e handoff congelati;
4. integrazione UI sulla stessa preview canonica;
5. test browser reale superato;
6. approvazione esplicita dell'utente ricevuta;
7. `PHASE_STATUS.md` e `CHECKPOINT_INDEX.md` aggiornati;
8. pubblicazione desktop autorizzata separatamente dall'utente.

## Confini finali attesi

```text
web_search_enabled=false
content_acquisition_available=true
content_acquisition_enabled=false  # valore predefinito
model_training_enabled=false
human_review_required_by_default=true
```

Il checkpoint successivo `INTELLIGENCE-0.3` può essere pianificato separatamente;
questa chiusura non ne autorizza l'avvio automatico.
