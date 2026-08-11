# DESKTOP-RPI-0.1 — Pacchetto Linux ARM64 per Eve Tab

- Stato: `REVIEW_REQUIRED`
- Responsabile: Codex desktop Raspberry Pi
- Base: `origin/eve-ai-studio @ 8915e4d`
- Branch: `codex/eve-ai-studio-desktop-rpi-arm64`

## Obiettivo

Produrre e collaudare Eve AI Studio nativa Linux ARM64 sul Raspberry Pi 5,
derivandola esclusivamente dalla preview canonica, e predisporre il percorso
stabile usato dal launcher Eve Tab.

## File prenotati

- `eve-desktop/src-tauri/tauri.rpi.conf.json` (nuovo)
- `eve-desktop/scripts/install-rpi-arm64-release.sh` (nuovo)
- `.codex/tasks/active/eve-ai-studio-desktop-rpi-arm64.md`
- `CODEX_COORDINATION.md`, limitatamente alla scheda DESKTOP-RPI-0.1

## Vincoli

- Nessuna modifica alla sorgente canonica o a CORE-2.0.
- Nessuna demo, standalone, copia HTML o seconda infrastruttura desktop.
- Nessuna modifica a main, demo-canonica, Aula Studio, produzione, boot o autostart.
- Nessun merge o rilascio senza approvazione esplicita.

## Verifiche previste

- provenienza frontend canonica;
- build Tauri Linux ARM64;
- rendering e geometria su display 1024x600;
- avvio tramite percorso stabile Eve Tab;
- consumo CPU e memoria;
- preservazione del recupero desktop.

## Esito locale Raspberry Pi 5

- Build Tauri ARM64 dalla sorgente canonica: superata.
- Pacchetto deb `arm64`: generato.
- AppImage `aarch64`: generata e installata in
  `/opt/eve/apps/eve-studio/EV-Studio.AppImage`.
- Avvio tramite API del tile Eve Tab: superato.
- Backend GTK verificato: `GDK_BACKEND=x11`, senza fallback DMABUF software.
- Finestra verificata a `1024x572`, rendering pulito e desktop recuperabile.
- Nessuna modifica a boot o autostart.
