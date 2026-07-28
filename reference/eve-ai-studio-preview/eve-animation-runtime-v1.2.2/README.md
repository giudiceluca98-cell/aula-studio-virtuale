# Eve Animation Library 1.2.2 — integrazione HQ

Questa cartella è stata generata dal pacchetto originale verificato:

- ZIP SHA-256: `b3a83204315c87909895a9f7bc61d69c07771a0bf04571a10baece135d2ee3bf`
- asset: `64`
- politica: `original-final-webp-no-recompression`

## Regole permanenti

1. Non usare `compact` come sostituto di P0/P1/P2.
2. Non ridimensionare, ricomprimere, interpolare o ridisegnare i WebP.
3. Per P0 il runtime usa i master originali 1024 px.
4. Per P1/P2 usa i WebP finali 512 px indicati dal manifesto.
5. Gli asset hero mantengono la variante originale ad alta risoluzione.
6. Il CSS deve usare `object-fit: contain` e `image-rendering: auto`.
7. Ogni copia viene verificata con SHA-256.
8. I checkpoint futuri devono aggiornare soltanto UI e mappatura degli stati.

## File

- `eve-hq-runtime-manifest.json`: manifesto runtime e hash.
- `eve-hq-runtime.js`: API `window.EveAnimationLibrary`.
- `eve-hq-runtime.css`: dimensionamento senza degradazione.
- `assets/`: un WebP originale per ciascuno dei 64 stati.

La sorgente canonica è la preview modulare in `../index.html`; non viene
mantenuta una seconda copia standalone.
