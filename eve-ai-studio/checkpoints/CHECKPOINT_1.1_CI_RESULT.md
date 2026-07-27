# Checkpoint 1.1 — Risultato verifica automatica

- Commit verificato: `19fcd0e4ac55df862eb0131e6546f37a69746959`
- Data UTC: `2026-07-27T16:50:45.973312+00:00`
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
........................................................................ [ 43%]
........................................................................ [ 87%]
.....................                                                    [100%]
=============================== warnings summary ===============================
../../../../../../opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1
  /opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
- generated xml file: /home/runner/work/aula-studio-virtuale/aula-studio-virtuale/eve-ai-studio/pytest-results.xml -
165 passed, 1 warning in 2.59s
```

## Coda verifica browser

```text
Anteprima controllata verificata: 5 materiali, 4 retrieval, 4 chat RAG e 5 aperture fonte.
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
node --check reference/eve-ai-studio-preview/rag-chat-workflow.js
node --check reference/eve-ai-studio-preview/source-opening-workflow.js
node --check reference/eve-ai-studio-preview/official-library-loader.js
```

Il browser usa un contenitore DOM controllato e carica i file ufficiali `materials-workflow.js`, `retrieval-workflow.js`, `rag-chat-workflow.js` e `source-opening-workflow.js`. I payload compressi della galleria non vengono reinterpretati come moduli sorgente.
