# Aula Studio Virtuale — Raspberry Pi 5 ARM64

Questa variante produce una vera applicazione Linux ARM64 installabile per Eve Tab / Raspberry Pi 5.

## Target

- Raspberry Pi 5
- Raspberry Pi OS 64-bit / Debian ARM64
- display Eve Tab 1024×600
- Tauri 2 + WebKitGTK 4.1
- pacchetto `.deb` installabile
- AppImage ARM64 portabile

La configurazione Windows originale resta invariata. La variante Raspberry usa `src-tauri/tauri.rpi.conf.json`.

## Build automatica GitHub

Il workflow `.github/workflows/aula-rpi-arm64.yml` usa un runner GitHub ARM64 nativo (`ubuntu-22.04-arm`) e genera:

- `*.deb`
- `*.AppImage`

L'artifact si chiama:

`Aula-Studio-Virtuale-RaspberryPi-ARM64`

Il workflow può essere avviato manualmente da **Actions** oppure automaticamente quando cambia il branch `raspberry-pi-arm64`.

## Build direttamente sul Raspberry Pi 5

```bash
git clone --branch raspberry-pi-arm64 https://github.com/giudiceluca98-cell/aula-studio-virtuale.git
cd aula-studio-virtuale
chmod +x scripts/build-rpi-arm64.sh
./scripts/build-rpi-arm64.sh
```

Lo script controlla che l'architettura sia `aarch64`, richiede almeno 6 GiB liberi, installa le dipendenze Linux necessarie a Tauri e crea entrambi i bundle.

I pacchetti vengono anche copiati in `~/Scaricati/`.

## Installazione DEB

Dopo la build:

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

Il pacchetto Debian è la variante consigliata per Eve Tab perché integra l'app con il sistema e non richiede FUSE.

## AppImage

```bash
chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage
```

## Eve Tab

La finestra Raspberry è configurata per 1024×600, senza decorazioni desktop, ridimensionabile e compatibile anche con la modalità portrait gestita da Eve Tab.

In Eve il launcher dovrà preferire l'eseguibile nativo installato e usare la versione web locale soltanto come fallback.

## Sicurezza

Nessuna password, chiave Supabase, token OpenAI, cookie o sessione utente viene inclusa nel pacchetto. Le credenziali restano configurate dall'utente o dal servizio remoto previsto dall'applicazione.
