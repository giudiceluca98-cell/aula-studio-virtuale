# INTELLIGENCE-0.2 — Risultato CI e verifiche

Stato: **PENDING REPOSITORY EXECUTION**

Il pacchetto è stato validato staticamente, ma non dichiara una suite verde sul
repository completo.

Codex deve applicare il checkpoint e usare:

```bash
python VERIFICA_CHECKPOINT.py --repo <repository> --stage functional --write-reports
python VERIFICA_CHECKPOINT.py --repo <repository> --stage ui --write-reports
```

I risultati reali devono sostituire questo stato, indicando comandi, conteggi,
warning, commit e limiti. Nessun esito deve essere inventato.

<!-- AUTO-VERIFICATION-START -->
## Verifica automatica 2026-07-29T15:55:29+00:00

- Stage: `functional`
- Stato: **failed_or_incomplete**
- Branch: `codex/eve-ai-studio-intelligence-0-2-functional`
- HEAD: `823b719222abdd2d6d799714e3c59b186a89bd18`
- Browser reale: **NON ESEGUITO DA QUESTO SCRIPT**

### Controlli
- `static_markers`: PASS
- `compileall`: PASS
- `specific_pytest`: PASS
- `full_pytest`: PASS
- `main_wiring_probe`: PASS
- `git_diff_check`: PASS
- `diff_scope`: FAIL/PENDING

Il checkpoint resta aperto finché non sono presenti test browser reali, revisione e approvazione utente.
<!-- AUTO-VERIFICATION-END -->
