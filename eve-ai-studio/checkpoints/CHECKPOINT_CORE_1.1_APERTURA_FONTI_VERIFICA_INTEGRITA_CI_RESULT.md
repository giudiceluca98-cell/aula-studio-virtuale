# Checkpoint 1.1 — Verifica core automatica

- Commit verificato: `05e5c6a71652f4cfacbc43c22cedb9db5d6c3dd2`
- Data UTC: `2026-07-28T00:05:02.849361+00:00`
- Esito: **SUPERATO**

- pytest: 165 test, 0 fallimenti, 0 errori, 0 ignorati

## Coda log

```text
  Downloading httptools-0.8.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl.metadata (3.5 kB)
Collecting pyyaml>=5.1 (from uvicorn[standard]<1,>=0.30->eve-ai-studio==1.1.0)
  Downloading pyyaml-6.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (2.4 kB)
Collecting uvloop>=0.15.1 (from uvicorn[standard]<1,>=0.30->eve-ai-studio==1.1.0)
  Downloading uvloop-0.22.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl.metadata (4.9 kB)
Collecting watchfiles>=0.20 (from uvicorn[standard]<1,>=0.30->eve-ai-studio==1.1.0)
  Downloading watchfiles-1.2.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (4.9 kB)
Collecting websockets>=13.0 (from uvicorn[standard]<1,>=0.30->eve-ai-studio==1.1.0)
  Downloading websockets-16.1.1-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl.metadata (6.8 kB)
Collecting annotated-types>=0.6.0 (from pydantic>=2.9.0->fastapi<1,>=0.115->eve-ai-studio==1.1.0)
  Downloading annotated_types-0.8.0-py3-none-any.whl.metadata (15 kB)
Collecting pydantic-core==2.46.4 (from pydantic>=2.9.0->fastapi<1,>=0.115->eve-ai-studio==1.1.0)
  Downloading pydantic_core-2.46.4-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl.metadata (6.6 kB)
Downloading fastapi-0.140.7-py3-none-any.whl (131 kB)
Downloading httpx-0.28.1-py3-none-any.whl (73 kB)
Downloading httpcore-1.0.9-py3-none-any.whl (78 kB)
Downloading pydantic_settings-2.14.2-py3-none-any.whl (61 kB)
Downloading pluggy-1.6.0-py3-none-any.whl (20 kB)
Downloading pytest_asyncio-0.26.0-py3-none-any.whl (19 kB)
Downloading pytest-8.4.2-py3-none-any.whl (365 kB)
Downloading uvicorn-0.51.0-py3-none-any.whl (73 kB)
Downloading annotated_doc-0.0.4-py3-none-any.whl (5.3 kB)
Downloading click-8.4.2-py3-none-any.whl (119 kB)
Downloading h11-0.16.0-py3-none-any.whl (37 kB)
Downloading httptools-0.8.0-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl (464 kB)
Downloading iniconfig-2.3.0-py3-none-any.whl (7.5 kB)
Using cached packaging-26.2-py3-none-any.whl (100 kB)
Downloading pydantic-2.13.4-py3-none-any.whl (472 kB)
Downloading pydantic_core-2.46.4-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (2.1 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 2.1/2.1 MB 93.6 MB/s  0:00:00
Downloading annotated_types-0.8.0-py3-none-any.whl (13 kB)
Downloading pygments-2.20.0-py3-none-any.whl (1.2 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 1.2/1.2 MB 205.5 MB/s  0:00:00
Downloading python_dotenv-1.2.2-py3-none-any.whl (22 kB)
Downloading pyyaml-6.0.3-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (806 kB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 806.6/806.6 kB 170.7 MB/s  0:00:00
Downloading starlette-1.3.1-py3-none-any.whl (73 kB)
Downloading anyio-4.14.2-py3-none-any.whl (125 kB)
Downloading idna-3.18-py3-none-any.whl (65 kB)
Downloading typing_extensions-4.16.0-py3-none-any.whl (45 kB)
Downloading typing_inspection-0.4.2-py3-none-any.whl (14 kB)
Downloading uvloop-0.22.1-cp311-cp311-manylinux2014_x86_64.manylinux_2_17_x86_64.manylinux_2_28_x86_64.whl (3.8 MB)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 3.8/3.8 MB 71.3 MB/s  0:00:00
Downloading watchfiles-1.2.0-cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64.whl (456 kB)
Downloading websockets-16.1.1-cp311-cp311-manylinux1_x86_64.manylinux_2_28_x86_64.manylinux_2_5_x86_64.whl (186 kB)
Downloading certifi-2026.7.22-py3-none-any.whl (136 kB)
Building wheels for collected packages: eve-ai-studio
  Building editable for eve-ai-studio (pyproject.toml): started
  Building editable for eve-ai-studio (pyproject.toml): finished with status 'done'
  Created wheel for eve-ai-studio: filename=eve_ai_studio-1.1.0-0.editable-py3-none-any.whl size=2933 sha256=2ab4ff83b568f8e8e06419cadf29175ecf04a046b7c3776f52e3e594129b9974
  Stored in directory: /tmp/pip-ephem-wheel-cache-v9y_jir8/wheels/db/68/46/85edef7bb0f020c9d68653c11a675d4e622c412e0335cd7038
Successfully built eve-ai-studio
Installing collected packages: websockets, uvloop, typing-extensions, pyyaml, python-dotenv, pygments, pluggy, packaging, iniconfig, idna, httptools, h11, click, certifi, annotated-types, annotated-doc, uvicorn, typing-inspection, pytest, pydantic-core, httpcore, anyio, watchfiles, starlette, pytest-asyncio, pydantic, httpx, pydantic-settings, fastapi, eve-ai-studio

Successfully installed annotated-doc-0.0.4 annotated-types-0.8.0 anyio-4.14.2 certifi-2026.7.22 click-8.4.2 eve-ai-studio-1.1.0 fastapi-0.140.7 h11-0.16.0 httpcore-1.0.9 httptools-0.8.0 httpx-0.28.1 idna-3.18 iniconfig-2.3.0 packaging-26.2 pluggy-1.6.0 pydantic-2.13.4 pydantic-core-2.46.4 pydantic-settings-2.14.2 pygments-2.20.0 pytest-8.4.2 pytest-asyncio-0.26.0 python-dotenv-1.2.2 pyyaml-6.0.3 starlette-1.3.1 typing-extensions-4.16.0 typing-inspection-0.4.2 uvicorn-0.51.0 uvloop-0.22.1 watchfiles-1.2.0 websockets-16.1.1
........................................................................ [ 43%]
........................................................................ [ 87%]
.....................                                                    [100%]
=============================== warnings summary ===============================
../../../../../../opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1
  /opt/hostedtoolcache/Python/3.11.15/x64/lib/python3.11/site-packages/fastapi/testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
- generated xml file: /home/runner/work/aula-studio-virtuale/aula-studio-virtuale/eve-ai-studio/pytest-results.xml -
165 passed, 1 warning in 3.21s
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
node --check reference/eve-ai-studio-preview/navigation-compat.js
node --check reference/eve-ai-studio-preview/animation-library-gallery.js
node --check reference/eve-ai-studio-preview/eve-animation-runtime-v1.2.2/eve-hq-runtime.js
```
