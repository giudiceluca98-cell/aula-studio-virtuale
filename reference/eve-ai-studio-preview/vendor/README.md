# Vendor — Eve Animation Library 1.2.2 originale

In questa cartella deve essere caricato una sola volta il file binario:

```text
EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz
```

SHA-256 obbligatorio:

```text
c48e41300fea7ce835bb8f7ba3e46531f370d9f56668854861f90e0c01c1583e
```

Dimensione prevista:

```text
7.227.656 byte
```

L'archivio deriva esclusivamente da:

```text
eve-animation-library-v1.2.2.zip
SHA-256 b3a83204315c87909895a9f7bc61d69c07771a0bf04571a10baece135d2ee3bf
```

È stato creato in modo deterministico, senza ricomprimere i WebP interni:

```text
tar --sort=name --mtime="UTC 2026-01-01" --owner=0 --group=0 --numeric-owner -cJf ...
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
