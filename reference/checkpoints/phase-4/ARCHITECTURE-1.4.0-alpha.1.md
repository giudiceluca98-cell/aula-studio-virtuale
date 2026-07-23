# Architettura Checklist 1.4.0-alpha.1

## Strato demo

Il checkpoint parte dalla base verificata `1.3.0-alpha.9`, applica il consolidamento Materiali e intercetta esclusivamente `openDrawer("checklist")`.

La Checklist mantiene uno stato locale normalizzato composto da:

- `id`;
- `title`;
- `cat`;
- `who`;
- `p`;
- `due`;
- `s`.

La chiave locale è `aula-demo-checklist-v2`. Ricerca e filtri sono solo preferenze della sessione; le attività vengono persistite.

## Destinazione app reale

Nell'app Next.js non va copiato il modello `localStorage`. Le operazioni devono usare:

- record Checklist del database;
- identità autenticata;
- permessi e RLS;
- timestamp server;
- Realtime per aggiornare gli altri partecipanti;
- validazione server-side di assegnatari e membership.

Il drawer React deve conservare la stessa esperienza visiva e funzionale, ma ricevere dati tipizzati e autorizzati.
