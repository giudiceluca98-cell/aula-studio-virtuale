# Eve AI Studio Desktop

Questa cartella contiene soltanto l'infrastruttura del pacchetto installabile. L'interfaccia non è duplicata: ogni build viene generata dalla sorgente canonica:

```text
reference/eve-ai-studio-preview/
```

La directory `frontend-dist/` è temporanea, ignorata da Git e non deve essere modificata manualmente.

## Build locale Windows

```powershell
pnpm --dir eve-desktop install
pnpm --dir eve-desktop test
pnpm --dir eve-desktop build
```

L'installer NSIS viene creato in:

```text
eve-desktop/src-tauri/target/release/bundle/nsis/
```

La build locale è installabile ma non riceve aggiornamenti firmati. L'updater viene attivato nella build di release.

## Aggiornamento da file locale

La build di release offre anche **Scegli dal computer**. Il file selezionato
viene accettato soltanto quando:

- esiste una release online ufficiale più recente per la stessa versione;
- il nome corrisponde all'installer Windows x64 annunciato;
- i byte dell'installer superano la verifica con la firma e la chiave pubblica
  del canale updater ufficiale.

L'installazione riutilizza il plugin Tauri updater esistente. Non è presente
un secondo meccanismo di aggiornamento e un installer arbitrario non viene mai
eseguito.

## Aggiornamenti firmati

Configurare nel repository GitHub:

Variabili:

```text
EVE_RELEASE_OWNER
EVE_RELEASE_REPOSITORY
```

Segreti:

```text
EVE_RELEASE_TOKEN
EVE_TAURI_SIGNING_PRIVATE_KEY
EVE_TAURI_SIGNING_PRIVATE_KEY_PASSWORD
EVE_TAURI_UPDATER_PUBLIC_KEY
```

`EVE_RELEASE_REPOSITORY` deve essere un repository dedicato alle release di Eve AI Studio, per evitare che `latest.json` venga confuso con le release di Aula Studio.

Il workflow `.github/workflows/release-eve-ai-studio-desktop.yml`:

1. legge la sorgente canonica;
2. esegue i test;
3. crea l'installer;
4. firma gli artefatti;
5. pubblica la GitHub Release;
6. pubblica `latest.json`;
7. rende l'aggiornamento visibile all'app installata.

L'identificatore Tauri rimane stabile tra le versioni. Local storage, configurazioni e preferenze WebView compatibili non vengono cancellati dall'aggiornamento.

## Perimetro funzionale

Il pacchetto installa esattamente le funzioni presenti nella sorgente canonica. Non trasforma le simulazioni della preview in servizi reali e non inventa collegamenti al backend. Le integrazioni FastAPI diventano parte dell'app desktop soltanto quando il relativo checkpoint funzionale è stato consegnato con `READY_FOR_HANDOFF`.
