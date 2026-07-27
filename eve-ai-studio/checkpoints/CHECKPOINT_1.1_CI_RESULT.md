# Checkpoint 1.1 — Risultato verifica automatica

- Commit verificato: `fed86a6b38a62df5447aa19d9e73a72e32211cf0`
- Data UTC: `2026-07-27T22:34:57.811342+00:00`
- Esito complessivo: **NON SUPERATO**

## Stati

| Controllo | Esito |
|---|---|
| `python_install` | `success` |
| `python_compile` | `success` |
| `pytest_cumulative` | `success` |
| `javascript_syntax` | `failure` |
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
165 passed, 1 warning in 10.71s
```

## Coda verifica browser

```text
Anteprima controllata verificata: 5 materiali, 4 retrieval, 4 chat RAG e 5 aperture fonte.
```

## Coda JavaScript

```text
node --check reference/eve-ai-studio-preview/evaluation-workflow.js
node --check reference/eve-ai-studio-preview/runner-workflow.js
node --check reference/eve-ai-studio-preview/provider-workflow.js
node --check reference/eve-ai-studio-preview/materials-workflow.js
node --check reference/eve-ai-studio-preview/retrieval-workflow.js
node --check reference/eve-ai-studio-preview/rag-chat-workflow.js
node --check reference/eve-ai-studio-preview/source-opening-workflow.js
node --check reference/eve-ai-studio-preview/official-library-loader.js
node:internal/modules/cjs/loader:1210
  throw err;
  ^

Error: Cannot find module '/home/runner/work/aula-studio-virtuale/aula-studio-virtuale/reference/eve-ai-studio-preview/official-library-loader.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at node:internal/main/check_syntax:33:20 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v20.20.2
```

Il browser usa un contenitore DOM controllato e carica i file ufficiali `materials-workflow.js`, `retrieval-workflow.js`, `rag-chat-workflow.js` e `source-opening-workflow.js`. I payload compressi della galleria non vengono reinterpretati come moduli sorgente.
