# Checkpoint 0.9 — Risultato verifica automatica

- Commit verificato: `37432a54ed46d26969c5bf29815618ee2c0d41e6`
- Data UTC: `2026-07-27T16:22:47.189265+00:00`
- Esito complessivo: **SUPERATO**

## Stati

| Controllo | Esito |
|---|---|
| `python_install` | `success` |
| `python_compile` | `success` |
| `pytest_cumulative` | `success` |
| `javascript_syntax` | `success` |
| `browser_install` | `success` |
| `browser_scenarios` | `success` |


## Coda pytest

```text
........................................................................ [ 47%]
........................................................................ [ 94%]
........                                                                 [100%]
=============================== warnings summary ===============================
../../../../../../opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1
  /opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
- generated xml file: /home/runner/work/aula-studio-virtuale/aula-studio-virtuale/eve-ai-studio/pytest-results.xml -
152 passed, 1 warning in 2.86s
```

## Coda verifica browser

```text
Anteprima controllata verificata: 5 scenari materiali e 4 scenari retrieval.
```

## Coda JavaScript

```text
node --check reference/eve-ai-studio-preview/checkpoint-04-patch.js
node --check reference/eve-ai-studio-preview/prompt-compat.js
node --check reference/eve-ai-studio-preview/app.js
node --check reference/eve-ai-studio-preview/prompt-workflow.js
node --check reference/eve-ai-studio-preview/evaluation-workflow.js
node --check reference/eve-ai-studio-preview/runner-workflow.js
node --check reference/eve-ai-studio-preview/provider-workflow.js
node --check reference/eve-ai-studio-preview/materials-workflow.js
node --check reference/eve-ai-studio-preview/retrieval-workflow.js
node --check reference/eve-ai-studio-preview/official-library-loader.js
```

Il browser usa un contenitore DOM controllato e carica i file ufficiali `materials-workflow.js` e `retrieval-workflow.js`. I payload compressi della galleria non vengono reinterpretati come moduli sorgente.
