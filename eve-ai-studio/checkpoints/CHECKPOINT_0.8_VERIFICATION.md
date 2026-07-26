# Checkpoint 0.8 — Verifica conclusiva

Data di avvio: 26 luglio 2026

Branch: `eve-ai-studio`

## Perimetro

Questa verifica chiude tecnicamente il Checkpoint 0.8 senza introdurre funzioni del Checkpoint 0.9.

Devono essere provati:

1. compilazione sintattica dell'intero package Python e dei test;
2. suite cumulativa di tutti i checkpoint `0.1–0.8`;
3. controllo sintattico di tutti i file JavaScript dell'anteprima;
4. caricamento reale dell'anteprima in Chromium senza errori console o `pageerror`;
5. visualizzazione della vista `Materiali e RAG`;
6. scenario di importazione valida;
7. scenario checksum duplicato;
8. scenario nuova versione;
9. scenario formato PDF non supportato;
10. scenario limite dimensione superato;
11. produzione di screenshot e risultati di test come artefatti GitHub Actions.

## Vincoli

- nessuna modifica a `main`;
- nessuna modifica a `demo-canonica`;
- nessuna modifica all'HTML canonico;
- nessuna pull request;
- nessun merge;
- nessun provider AI reale;
- nessun embedding;
- nessuna chiamata documentale esterna nel servizio;
- nessuna dichiarazione di chiusura finché tutti i controlli non risultano superati.

## Automazione

Workflow dedicato:

```text
.github/workflows/eve-ai-studio-checks.yml
```

Il risultato finale e gli eventuali interventi correttivi saranno registrati in questo file soltanto dopo l'esecuzione effettiva dei controlli.
