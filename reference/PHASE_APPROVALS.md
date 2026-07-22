# Checkpoint e approvazioni della roadmap

Questo file impedisce alla roadmap app ufficiale → demo canonica di proseguire lasciando passaggi incompleti.

## Regola obbligatoria

Dopo ogni passaggio o sottofase completata:

1. aggiornare la demo canonica e la documentazione prevista;
2. eseguire tutte le verifiche disponibili;
3. indicare chiaramente ciò che è stato verificato e ciò che non è stato verificato;
4. fornire all'utente il percorso del file HTML aggiornato e le istruzioni per aprirlo;
5. fermarsi con stato `IN_ATTESA_APPROVAZIONE` soltanto dopo avere modificato realmente l'HTML canonico e avere prodotto una versione apribile;
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
| Fase 0 | Baseline documentale e controlli statici | APPROVATO | 2026-07-22 | Superata su richiesta dell'utente: nessun checkpoint può fermarsi senza una modifica HTML visibile. |
| Fase 1 | Catalogo: vista, navigazione, ricerca e percorso | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.1.0-alpha.1. |
| Fase 1 | Catalogo: ricerca e filtri | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |
| Fase 1 | Catalogo: materiali e salvati | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |
| Fase 1 | Catalogo: aggiunta URL | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.1.0-alpha.2. |
| Fase 1 | Catalogo: percorso Eve e importazione | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |
| Fase 2 | Dashboard: create/join | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.1. |
| Fase 2 | Dashboard: ruoli e presenza | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.2 pronta da aprire e verificare. |
| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |

## Come approvare

L'utente approva con una frase esplicita, per esempio:

`Approvo il checkpoint Fase 1 — Catalogo: vista e navigazione.`

Dopo l'approvazione, il registro deve essere aggiornato a `APPROVATO` prima di qualsiasi altro cambiamento alla demo.
