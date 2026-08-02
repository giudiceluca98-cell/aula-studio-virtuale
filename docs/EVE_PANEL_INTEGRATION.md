# CORE-1.5 — Pannello Eve

Il pannello è montato una sola volta nel `RootLayout` e viene aperto da eventi tipizzati.
Il server passa al provider una configurazione serializzabile; non esiste un flag
`NEXT_PUBLIC_*` indipendente che possa divergere dall'autorizzazione server.

## Ingressi

- lezione: room, materiale, lezione e sezione;
- catalogo: room selezionata e query corrente;
- aula: room corrente.

Gli identificativi sono proposte di contesto. CORE-1.4 continua a essere responsabile
della verifica reale di identità, appartenenza, ruoli e materiali.

## Accessibilità

- focus portato al pulsante Chiudi;
- focus ripristinato al trigger;
- Escape chiude;
- Ctrl/Command + Shift + E apre o chiude;
- trap del focus soltanto nella modalità espansa modale;
- layout mobile come bottom sheet;
- `prefers-reduced-motion` rispettato.

## Esclusioni

Nessun provider AI, memoria, scrittura o strumento viene attivato da CORE-1.5.
