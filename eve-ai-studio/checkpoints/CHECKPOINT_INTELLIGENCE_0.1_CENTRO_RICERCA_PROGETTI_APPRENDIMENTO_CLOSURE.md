# INTELLIGENCE-0.1 — Chiusura: centro ricerca e progetti di apprendimento

Data: 28 luglio 2026  
Branch: `eve-ai-studio`

## Esito

Il checkpoint è **chiuso e approvato**.

## Verifiche definitive

- installazione servizio: superata;
- compilazione Python: superata;
- test specifici: 15;
- fallimenti: 0;
- errori: 0;
- build standalone: superata;
- preview modulare Chromium: superata;
- standalone aperto da `file://`: superato.

## Componenti confermati

- database SQLite separato per i progetti di ricerca;
- isolamento tramite `room_id`;
- obiettivi, domini, lingue, livelli e argomenti;
- stati e cronologia delle transizioni;
- query pianificate;
- fonti candidate registrate in quarantena;
- URL limitati a HTTP/HTTPS senza credenziali incorporate;
- revisione umana predefinita;
- API `/v1/intelligence/research`;
- sezione “Ricerca e apprendimento” nella preview e nello standalone.

## Confini preservati

```text
web_search_enabled=false
content_acquisition_enabled=false
model_training_enabled=false
human_review_required_by_default=true
```

Il checkpoint successivo è:

```text
INTELLIGENCE-0.2 — Acquisizione web controllata e quarantena fonti
```
