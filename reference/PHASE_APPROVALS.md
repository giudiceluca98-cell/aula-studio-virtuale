# Checkpoint e approvazioni della roadmap

Questo file impedisce alla roadmap app ufficiale → demo canonica di proseguire lasciando passaggi incompleti.

## Regola obbligatoria

Dopo ogni passaggio o sottofase completata:

1. aggiornare la demo canonica e la documentazione prevista;
2. eseguire tutte le verifiche disponibili;
3. indicare chiaramente ciò che è stato verificato e ciò che non è stato verificato;
4. fornire all'utente il percorso del file HTML aggiornato e le istruzioni per aprirlo;
5. fermarsi con stato `IN_ATTESA_APPROVAZIONE`;
6. non iniziare il passaggio successivo finché l'utente non scrive esplicitamente che il checkpoint è approvato;
7. dopo l'approvazione, registrare data e risultato in questo file e soltanto allora riprendere.

Una verifica automatica o statica non sostituisce l'approvazione visuale e funzionale dell'utente.

## Contenuto minimo di ogni consegna

Ogni rapporto di checkpoint deve contenere:

- fase e sottofase;
- riepilogo delle modifiche;
- commit GitHub;
- versione demo;
- dimensione, righe, SHA-256 e Git blob SHA aggiornati;
- file modificati;
- controlli superati;
- controlli non eseguiti o limiti reali;
- percorso della demo:
  `reference/demo-aula-studio-virtuale-canonica.html`;
- istruzioni per scaricare e aprire il file HTML nel browser;
- elenco breve delle azioni che l'utente deve provare;
- stato finale `IN_ATTESA_APPROVAZIONE`.

## Stati consentiti

- `DA_INIZIARE`
- `IN_LAVORAZIONE`
- `IN_ATTESA_APPROVAZIONE`
- `APPROVATO`
- `BLOCCATO`

## Registro

| Fase | Passaggio | Stato | Data | Note |
|---|---|---|---|---|
| Fase 0 | Baseline documentale e controlli statici | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Creato `BASELINE_VERIFICATION.md`; l'HTML non è stato modificato. |
| Fase 1 | Catalogo: vista e navigazione | DA_INIZIARE | — | Non iniziare prima dell'approvazione della Fase 0. |
| Fase 1 | Catalogo: ricerca e filtri | DA_INIZIARE | — | — |
| Fase 1 | Catalogo: materiali e salvati | DA_INIZIARE | — | — |
| Fase 1 | Catalogo: aggiunta URL | DA_INIZIARE | — | — |
| Fase 1 | Catalogo: percorso Eve e importazione | DA_INIZIARE | — | — |
| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |

## Come approvare

L'utente approva con una frase esplicita, per esempio:

`Approvo il checkpoint Fase 1 — Catalogo: vista e navigazione.`

Dopo l'approvazione, il registro deve essere aggiornato a `APPROVATO` prima di qualsiasi altro cambiamento alla demo.
