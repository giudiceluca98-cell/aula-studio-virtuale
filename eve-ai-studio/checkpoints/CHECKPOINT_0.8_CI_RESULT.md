# Checkpoint 0.8 — Risultato verifica automatica

- Commit verificato: `d7826adc709a5651f3b34ca6dc167eedd947023b`
- Data UTC: `2026-07-26T21:09:10.092844+00:00`
- Esito complessivo: **NON SUPERATO**

## Stati

| Controllo | Esito |
|---|---|
| `python_install` | `failure` |
| `python_compile` | `success` |
| `pytest_cumulative` | `failure` |
| `javascript_syntax` | `failure` |
| `browser_install` | `success` |
| `preview_server` | `success` |
| `browser_scenarios` | `failure` |


## Coda pytest

```text
/home/runner/work/_temp/d7f4d576-c31a-4877-ae18-12bd7c9a3de7.sh: line 2: pytest: command not found
```

## Coda verifica browser

```text
node:internal/modules/esm/resolve:873
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
        ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from /tmp/eve-preview-check.mjs
    at packageResolve (node:internal/modules/esm/resolve:873:9)
    at moduleResolve (node:internal/modules/esm/resolve:946:18)
    at defaultResolve (node:internal/modules/esm/resolve:1188:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:708:12)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:657:25)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:640:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:264:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:168:49) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v20.20.2
```

## Coda JavaScript

```text
node --check reference/eve-ai-studio-preview/particles.js
node --check reference/eve-ai-studio-preview/avatar-workflow.js
node --check reference/eve-ai-studio-preview/official-payload-05.js
node --check reference/eve-ai-studio-preview/official-library-workflow-payload-a.js
node --check reference/eve-ai-studio-preview/app.js
node --check reference/eve-ai-studio-preview/markup-01.js
node --check reference/eve-ai-studio-preview/markup-02.js
node --check reference/eve-ai-studio-preview/evaluation-workflow.js
node --check reference/eve-ai-studio-preview/official-payload-09.js
node --check reference/eve-ai-studio-preview/official-payload-11.js
node --check reference/eve-ai-studio-preview/official-library-workflow-payload-b.js
/home/runner/work/aula-studio-virtuale/aula-studio-virtuale/reference/eve-ai-studio-preview/official-library-workflow-payload-b.js:1
window.__EVE_OFFICIAL_WORKFLOW_GZIP_B64=(window.__EVE_OFFICIAL_WORKFLOW_GZIP_B64||"")+"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
                                                                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

SyntaxError: Invalid or unexpected token
    at wrapSafe (node:internal/modules/cjs/loader:1464:18)
    at checkSyntax (node:internal/main/check_syntax:78:3)

Node.js v20.20.2
```

Questo rapporto è generato dal workflow `.github/workflows/eve-ai-studio-checks.yml`. Un checkpoint non è chiuso quando l'esito complessivo è `NON SUPERATO`.
