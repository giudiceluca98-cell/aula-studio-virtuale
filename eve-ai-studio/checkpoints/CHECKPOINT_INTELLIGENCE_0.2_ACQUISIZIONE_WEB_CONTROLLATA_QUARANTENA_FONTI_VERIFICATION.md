# INTELLIGENCE-0.2 — Verifica acquisizione web controllata

Data preparazione: 29 luglio 2026
Branch canonico analizzato in sola lettura: `eve-ai-studio`
Commit osservato: `185c08486d56a684a1b095558ab8860feef8bd43`

## Stato corrente

**FUNCTIONAL_TESTING — pacchetto locale preparato, esecuzione sul repository completo richiesta.**

Questa lavorazione non ha scritto su GitHub e non attribuisce esiti a test che non ha
potuto eseguire sul checkout completo.

## Controlli eseguiti sul pacchetto locale

- sintassi Python degli strumenti del pacchetto;
- sintassi Python del nuovo test;
- sintassi JavaScript del modulo UI combinato;
- controllo che la UI non contenga `fetch(` o altre richieste reali;
- controllo che non siano presenti nuovi file HTML;
- controllo che non siano presenti modifiche ai workflow;
- controllo degli anchor e degli SHA Git blob della base osservata;
- prova dell'applicatore e del rollback su fixture locale;
- verifica del manifesto e degli SHA-256 del pacchetto.

Questi controlli verificano l'integrità del pacchetto, non sostituiscono la suite del
repository.

## Verifiche obbligatorie sul repository

Codex deve eseguire, dopo l'applicazione funzionale:

```bash
python VERIFICA_CHECKPOINT.py --repo <repository> --stage functional --write-reports
```

Il verificatore esegue o controlla:

1. branch dedicato e worktree coerente;
2. assenza di modifiche a branch e percorsi vietati;
3. `python -m compileall -q app tests`;
4. `pytest -q tests/test_intelligence_research.py tests/test_intelligence_acquisition.py`;
5. suite Python cumulativa `pytest -q`;
6. import dell'app principale con database temporanei;
7. status `INTELLIGENCE-0.2`;
8. `content_acquisition_available=true`;
9. `content_acquisition_enabled=false` con configurazione predefinita;
10. `web_search_enabled=false`;
11. `model_training_enabled=false`;
12. `git diff --check`;
13. controllo dei file modificati e assenza di workflow toccati.

Dopo `READY_FOR_HANDOFF` e l'applicazione UI:

```bash
python VERIFICA_CHECKPOINT.py --repo <repository> --stage ui --write-reports
```

Controlli UI:

1. `node --check reference/eve-ai-studio-preview/research-center-workflow.js`;
2. presenza dei marker `INTELLIGENCE-0.2`, `untrusted_web_content` e
   `Simulazione UI dichiarata`;
3. assenza di `fetch(` nel modulo;
4. caricamento del solo ingresso canonico tramite server HTTP;
5. nessun nuovo HTML o standalone;
6. verifica browser reale di navigazione, progetto, query, fonte e acquisizione simulata;
7. console senza errori;
8. nessuna regressione delle funzioni di INTELLIGENCE-0.1;
9. compatibilità desktop e responsive.

## Criteri per READY_FOR_HANDOFF funzionale

- suite specifica verde;
- suite cumulativa verde;
- nessuna rete reale usata dai test;
- wiring dell'app principale verificato;
- flag OFF per impostazione predefinita;
- documento sempre `quarantined`;
- `content_trust=untrusted_web_content`;
- `instructions_executable=false`;
- isolamento `room_id` verificato;
- nessun materiale CORE creato automaticamente;
- commit funzionale congelato;
- una sola Draft PR;
- un solo handoff aggiornato con fatti reali.

## Criteri per la chiusura del checkpoint

- parte funzionale in `READY_FOR_HANDOFF`;
- integrazione UI completata sulla preview canonica;
- test browser reali superati;
- stato `REVIEW_REQUIRED`;
- revisione conclusa;
- approvazione esplicita dell'utente;
- documenti di stato aggiornati senza creare duplicati.

Fino ad allora il checkpoint non deve essere indicato come chiuso.

<!-- AUTO-VERIFICATION-START -->
## Verifica automatica 2026-07-29T15:56:26+00:00

- Stage: `ui`
- Stato: **static_and_http_passed_browser_real_pending**
- Branch: `codex/eve-ai-studio-intelligence-0-2-functional`
- HEAD: `2f63fe35816d82b046ad1d4d4b9f1f1091f798a1`
- Browser reale: **NON ESEGUITO DA QUESTO SCRIPT**

### Controlli
- `static_markers`: PASS
- `node_check`: PASS
- `canonical_http_smoke`: PASS
- `no_preview_fetch`: PASS
- `browser_real`: FAIL/PENDING
- `git_diff_check`: PASS
- `diff_scope`: PASS

Il checkpoint resta aperto finché non sono presenti test browser reali, revisione e approvazione utente.
<!-- AUTO-VERIFICATION-END -->
