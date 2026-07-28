# Eve Animation Library 1.2.2 — integrazione originale HQ

## Sorgente approvata

- archivio originale: `eve-animation-library-v1.2.2.zip`
- SHA-256: `b3a83204315c87909895a9f7bc61d69c07771a0bf04571a10baece135d2ee3bf`
- asset: 64
- politica: `original-final-webp-no-recompression`

## Archivio runtime da installare una sola volta

Percorso previsto:

```text
reference/eve-ai-studio-preview/vendor/EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz
```

SHA-256:

```text
c48e41300fea7ce835bb8f7ba3e46531f370d9f56668854861f90e0c01c1583e
```

Dimensione:

```text
7.227.656 byte
```

L'archivio contiene un solo WebP finale originale per ciascuno dei 64 stati:

- P0: master originali 1024 px;
- P1/P2: WebP finali 512 px;
- hero: originali 1536 px;
- compact: originali 256 px, visualizzati senza ingrandimento eccessivo.

## Installazione automatica

Il workflow `Install Eve Animation Library HQ`:

1. verifica SHA-256 dell'archivio;
2. estrae senza accettare path traversal;
3. verifica 64 file, dimensioni, frame e hash;
4. elimina i vecchi payload alleggeriti;
5. sostituisce il ritratto SVG con l'immagine animata originale;
6. collega il runtime modulare;
7. prova tutti i 64 stati nella pagina modulare canonica;
8. salva tutto esclusivamente sul branch `eve-ai-studio`.

## Regola permanente

Non sono ammesse miniature, screenshot, ricostruzioni manuali, interpolazioni o ricompressioni. I checkpoint futuri aggiornano solo interfaccia e mappatura degli stati; la libreria originale resta immutata e verificata.
