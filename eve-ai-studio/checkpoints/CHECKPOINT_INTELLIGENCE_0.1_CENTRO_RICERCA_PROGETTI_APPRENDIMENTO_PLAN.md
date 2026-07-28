# INTELLIGENCE-0.1 — Piano: centro ricerca e progetti di apprendimento

Data di avvio: 28 luglio 2026  
Branch: `eve-ai-studio`  
Approvazione: concessa preventivamente dall'utente per l'avanzamento senza pause intermedie.

## Obiettivo

Creare il centro di controllo dal quale Eve può organizzare ciò che dovrà studiare prima di collegare la ricerca online.

## Incluso

- progetti persistenti e isolati per `room_id`;
- obiettivo, dominio, lingua, livelli e argomenti;
- stati `draft`, `active`, `paused`, `completed`, `archived`;
- query pianificate e mai eseguite in questo checkpoint;
- catalogo manuale di URL e metadati;
- quarantena predefinita delle fonti;
- revisione umana predefinita;
- limiti configurabili;
- API dedicate;
- sezione ufficiale nella preview e nello standalone;
- test di persistenza, sicurezza, isolamento e contratti HTTP.

## Escluso

- ricerca web reale;
- download o apertura automatica degli URL;
- estrazione del contenuto online;
- approvazione automatica delle fonti;
- embedding e database vettoriale;
- provider AI reale;
- modifica o addestramento dei pesi del modello.

## Criteri di completamento

1. database SQLite separato;
2. API sotto `/v1/intelligence/research`;
3. nessuna funzione di rete nel modulo;
4. fonti sempre `quarantined` e `content_acquired=false`;
5. isolamento tra aule verificato;
6. almeno 15 test specifici;
7. preview modulare e standalone funzionanti;
8. documentazione e rapporto CI ricercabili tramite parole chiave.
