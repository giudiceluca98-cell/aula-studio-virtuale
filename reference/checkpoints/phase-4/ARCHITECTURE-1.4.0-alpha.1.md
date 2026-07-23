# Architettura — 1.4.0-alpha.1

Il checkpoint è un singolo documento HTML autonomo. CSS, interfaccia e JavaScript sono incorporati nello stesso file.

## Estensioni rispetto a 1.3.0-alpha.9

- consolidamento del viewer testuale TXT/Markdown;
- pannello diagnostico per i Materiali;
- Checklist con sei attività iniziali;
- ricerca e filtri per stato e assegnatario;
- creazione con titolo, assegnatario, priorità e scadenza;
- completamento, riapertura, cambio stato e rimozione;
- ordinamento deterministico e persistenza locale;
- override circoscritto del drawer `checklist`.

## Vincolo per l'app ufficiale

Il comportamento locale dimostrativo non sostituisce autenticazione, database, autorizzazioni RLS o aggiornamenti Realtime.
