# CORE-1.5 — Pannello Eve e integrazione visiva sotto feature flag — PLAN

Stato iniziale: `PLANNED`
Dipendenze: `CORE-1.2`, `CORE-1.4`; sequenza coordinata fino a `INTELLIGENCE-0.4`.

## Obiettivo

Integrare una sola superficie Eve nell'app reale senza attivare provider, memoria o
azioni. Il pannello deve potersi aprire da lezione, catalogo e aula, restando
completamente assente quando il flag server è OFF.

## Incluso

- pannello laterale ed espanso;
- ingressi contestuali;
- stati loading, ready, empty, offline ed error;
- focus, tastiera e ripristino del trigger;
- mobile e reduced motion;
- preferenza locale della modalità;
- contratto Animation Library 1.2.6 con fallback;
- endpoint diagnostico senza segreti;
- test dei confini client/server.

## Escluso

- provider AI reale;
- chat di produzione;
- memoria;
- strumenti e scritture;
- pubblicazione automatica;
- integrazione nella canonica ufficiale prima dell'approvazione desktop.
