# Aula Studio Virtuale — Raspberry Pi 5 ARM64

Questa variante produce una vera applicazione Linux ARM64 per Eve Tab / Raspberry Pi 5.

## Target

- Raspberry Pi 5
- Raspberry Pi OS 64-bit / Debian ARM64
- display Eve Tab 1024×600
- Tauri 2 + WebKitGTK 4.1
- AppImage ARM64 per installazione Eve e updater
- `.deb` disponibile per test/manual deployment

La configurazione Windows originale resta invariata. La variante Raspberry usa `src-tauri/tauri.rpi.conf.json`.

## Due tipi di build: DEV e RELEASE

### DEV

Il workflow `.github/workflows/aula-rpi-arm64.yml` e lo script `scripts/build-rpi-arm64.sh` servono solo a verificare che Aula compili e funzioni su ARM64.

Questi bundle NON sono la variante definitiva destinata all'auto-update e vengono marcati esplicitamente come `DEV-NO-UPDATER`.

Il runner GitHub ARM64 usato per la validazione è `ubuntu-24.04-arm`.

### RELEASE / updater

L'installazione definitiva viene prodotta da `.github/workflows/release-desktop.yml` insieme alla release Windows.

Per Raspberry la release combina:

- `src-tauri/tauri.rpi.conf.json` per finestra/layout Raspberry;
- `src-tauri/tauri.release.conf.json` generata in CI con endpoint updater e chiave pubblica;
- `TAURI_SIGNING_PRIVATE_KEY` e relativa password solo nei GitHub Secrets;
- AppImage ARM64 + firma updater.

Windows x64 e Linux ARM64 vengono pubblicati nella stessa GitHub Release e nello stesso feed `latest.json`.

L'app installata usa `tauri-plugin-updater` per controllare il feed, scaricare esclusivamente il bundle compatibile e verificare la firma prima dell'installazione.

## Prima installazione definitiva su Eve Tab

Dopo che una release GitHub contiene l'AppImage ARM64 firmata:

```bash
git clone --branch raspberry-pi-arm64 https://github.com/giudiceluca98-cell/aula-studio-virtuale.git
cd aula-studio-virtuale
chmod +x scripts/install-rpi-arm64-release.sh
./scripts/install-rpi-arm64-release.sh
```

Lo script scarica l'ultima AppImage ARM64 dalla repository pubblica delle release e la installa come file di proprieta dell'utente in:

```text
~/.local/share/eve/apps/aula-studio-virtuale/AulaStudioVirtuale.AppImage
```

Crea inoltre i launcher stabili:

```text
/usr/local/bin/eve-aula-native
/opt/eve/apps/aula-studio-virtuale/aula-studio-virtuale
```

Eve Tab continua quindi ad aprire Aula tramite un percorso stabile, mentre l'AppImage resta aggiornabile dall'utente senza dover sostituire manualmente file di sistema.

## Aggiornamenti successivi

Dopo la prima installazione RELEASE non serve piu il terminale per aggiornare Aula.

Flusso previsto:

```text
Codex modifica Aula
  -> nuova versione/tag GitHub
  -> GitHub Actions crea Windows x64 + Linux ARM64
  -> GitHub Release aggiorna latest.json
  -> Aula sul Raspberry rileva linux-aarch64
  -> download + verifica firma + installazione
  -> riavvio Aula
```

Le chiavi private di firma non vengono mai inserite nel repository o nell'app. L'app contiene solo la chiave pubblica necessaria alla verifica.

## Build locale di sviluppo sul Raspberry

Per testare una modifica direttamente su Raspberry:

```bash
chmod +x scripts/build-rpi-arm64.sh
./scripts/build-rpi-arm64.sh
```

Lo script controlla l'architettura, lo spazio libero, installa le dipendenze e crea `.deb` + `.AppImage`, ma stampa chiaramente che si tratta di una build DEV senza configurazione release updater.

## Eve Tab

La finestra Raspberry e configurata per 1024×600, si apre massimizzata senza
decorazioni desktop ed e ridimensionabile. Il launcher nativo forza soltanto per
Aula il backend GTK X11/XWayland: sul Raspberry Pi 5 evita la corruzione del
renderer DMABUF Wayland mantenendo l'accelerazione V3D. Non viene usato
`WEBKIT_DISABLE_DMABUF_RENDERER=1`, che forza un percorso molto piu pesante per
la CPU.

Eve deve preferire `/opt/eve/apps/aula-studio-virtuale/aula-studio-virtuale` e usare il fallback web locale soltanto se la app nativa non e disponibile.

## Sicurezza

Nessuna password, chiave Supabase, token OpenAI, cookie, chiave privata Tauri o sessione utente viene inclusa nel pacchetto. Le credenziali personali restano configurate dall'utente o dai servizi remoti previsti dall'applicazione.
