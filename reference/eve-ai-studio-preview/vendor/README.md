# Vendor — Eve Animation Library 1.2.2 originale

In questa cartella deve essere caricato una sola volta il file binario:

```text
EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz
```

SHA-256 obbligatorio:

```text
b1bc4fd866a4d754445977579874f9d8dee0cc17db95d39f48c485008fc3cd32
```

Dimensione prevista:

```text
7.136.668 byte
```

L'archivio deriva esclusivamente da:

```text
eve-animation-library-v1.2.2.zip
SHA-256 b3a83204315c87909895a9f7bc61d69c07771a0bf04571a10baece135d2ee3bf
```

Quando il file viene caricato sul branch `eve-ai-studio`, il workflow `Install Eve Animation Library HQ`:

- verifica l'archivio;
- installa i 64 WebP originali;
- elimina i payload alleggeriti;
- collega il runtime HQ;
- rigenera lo standalone;
- prova tutti i 64 stati sia via HTTP sia tramite `file://`;
- salva il risultato sullo stesso branch.

Non rinominare, ricomprimere o modificare l'archivio.
