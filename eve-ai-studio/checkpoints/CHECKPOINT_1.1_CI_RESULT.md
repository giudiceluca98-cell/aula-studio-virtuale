# Checkpoint 1.1 — Verifica core automatica

- Commit verificato: `cfbe16fb3ef82ff8c1cf4bd6bccb4440e8966871`
- Data UTC: `2026-07-28T00:00:57.631661+00:00`
- Esito: **NON SUPERATO**

- pytest: 0 test, 0 fallimenti, 0 errori, 0 ignorati

## Coda log

```text
Requirement already satisfied: pip in /opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages (26.1.2)
Obtaining file:///home/runner/work/aula-studio-virtuale/aula-studio-virtuale/eve-ai-studio
  Installing build dependencies: started
  Installing build dependencies: finished with status 'done'
  Checking if build backend supports build_editable: started
  Checking if build backend supports build_editable: finished with status 'done'
  Getting requirements to build editable: started
  Getting requirements to build editable: finished with status 'error'
  error: subprocess-exited-with-error
  
  × Getting requirements to build editable did not run successfully.
  │ exit code: 1
  ╰─> [14 lines of output]
      error: Multiple top-level packages discovered in a flat-layout: ['app', 'data', 'checkpoints'].
      
      To avoid accidental inclusion of unwanted files or directories,
      setuptools will not proceed with this build.
      
      If you are trying to create a single distribution with multiple packages
      on purpose, you should not rely on automatic discovery.
      Instead, consider the following options:
      
      1. set up custom discovery (`find` directive with `include` or `exclude`)
      2. use a `src-layout`
      3. explicitly set `py_modules` or `packages` with a list of names
      
      To find more information, look for "package discovery" on setuptools docs.
      [end of output]
  
  note: This error originates from a subprocess, and is likely not a problem with pip.
ERROR: Failed to build 'file:///home/runner/work/aula-studio-virtuale/aula-studio-virtuale/eve-ai-studio' when getting requirements to build editable
```
