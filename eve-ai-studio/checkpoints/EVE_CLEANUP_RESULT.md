# Eve AI Studio — Rapporto di pulizia

Data: 28 luglio 2026  
Branch: `eve-ai-studio`

## Branch eliminati

- `eve-canonical-integration`
- `integration/eve-1.2.2-canonical`
- `eve-ai-studio-cleanup-audit`

I branch `main`, `demo-canonica`, `eve-ai-studio` ed `eve-canonical-integration-v2` sono stati preservati.

## File temporanei eliminati

- `reference/eve-ai-studio-preview/_transfer_test_b64.txt`
- `reference/eve-ai-studio-preview/_transfer_test_blob.txt`
- `eve-ai-studio/checkpoints/EVE_REAL_PREVIEW_BROWSER.txt`
- `eve-ai-studio/checkpoints/EVE_STANDALONE_BROWSER_LOG.txt`
- `eve-ai-studio/checkpoints/EVE_STANDALONE_BUILD_LOG.txt`

## Runtime legacy eliminato

- `reference/eve-ai-studio-preview/avatar-workflow.js`
- `reference/eve-ai-studio-preview/assets/eve/eve-idle-soft-runtime.webp`

Il runtime precedente usava una variante statica ridotta. È stato sostituito integralmente dalla libreria HQ 1.2.2 con 64 WebP originali.

## Rapporti duplicati eliminati

- `eve-ai-studio/checkpoints/EVE_REAL_PREVIEW_RESULT.json`
- `eve-ai-studio/checkpoints/EVE_STANDALONE_PREVIEW_RESULT.json`

Il rapporto autorevole unico è ora:

```text
eve-ai-studio/checkpoints/EVE_HQ_FINAL_VERIFICATION.json
```

## Workflow consolidati

Eliminati perché duplicati:

- `.github/workflows/eve-ai-studio-real-preview-check.yml`
- `.github/workflows/eve-ai-studio-standalone-preview.yml`

Workflow autorevoli rimasti:

- `.github/workflows/eve-ai-studio-checks.yml` — installazione, compilazione Python, pytest cumulativo e sintassi JavaScript reale;
- `.github/workflows/eve-hq-final-verification.yml` — build standalone, preview modulare, apertura `file://`, 64 animazioni, galleria e interazioni;
- `.github/workflows/eve-ai-studio-install-hq-animations.yml` — ripristino verificato della libreria HQ dal pacchetto originale.

## Documentazione aggiornata

- `reference/eve-ai-studio-preview/OFFICIAL_PREVIEW_STATUS.txt`
- `eve-ai-studio/checkpoints/EVE_ANIMATION_LIBRARY_1.2.2_STATUS.txt`

Sono stati rimossi i riferimenti obsoleti al checkpoint 0.9, alle miniature 40×40, ai payload compressi e al runtime statico da 192 px.

## Elementi preservati

- codice backend e test dei checkpoint 0.1–1.1;
- documentazione storica dei checkpoint;
- preview modulare;
- standalone HQ;
- 64 WebP originali;
- manifesto e SHA-256;
- archivio runtime originale verificato;
- build e installatore riproducibili.

## Verifiche

Preview e animazioni:

```text
eve-ai-studio/checkpoints/EVE_HQ_FINAL_VERIFICATION.json
```

Core Python e JavaScript:

```text
eve-ai-studio/checkpoints/CHECKPOINT_1.1_CI_RESULT.json
```

La pulizia non ha modificato `main`, `demo-canonica`, il file HTML canonico o `eve-canonical-integration-v2`.
