# INTELLIGENCE-0.2 — Chiusura acquisizione web controllata

Data preparazione: 29 luglio 2026  
Linea: `INTELLIGENCE`  
Branch canonico: `eve-ai-studio`

## Stato

**NON CHIUSO — IN ATTESA DI APPLICAZIONE, TEST, INTEGRAZIONE UI, REVISIONE E APPROVAZIONE UTENTE.**

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

## Condizioni ancora obbligatorie

1. applicazione su un branch dedicato derivato dall'ultima `origin/eve-ai-studio`;
2. test specifici e cumulativi reali;
3. commit funzionale congelato e `READY_FOR_HANDOFF`;
4. una sola Draft PR per l'attività;
5. integrazione UI sulla stessa preview canonica;
6. test browser reale;
7. stato `REVIEW_REQUIRED`;
8. approvazione esplicita dell'utente;
9. aggiornamento finale di `PHASE_STATUS.md` e `CHECKPOINT_INDEX.md`;
10. nessun merge autonomo.

## Confini finali attesi

```text
web_search_enabled=false
content_acquisition_available=true
content_acquisition_enabled=false  # valore predefinito
model_training_enabled=false
human_review_required_by_default=true
```

Il checkpoint successivo `INTELLIGENCE-0.3` resta bloccato finché queste condizioni
non sono state soddisfatte e documentate con prove reali.
