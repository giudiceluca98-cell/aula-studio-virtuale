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
