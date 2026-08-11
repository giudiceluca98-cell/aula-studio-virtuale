#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "ERROR: this build must run on ARM64/aarch64 (Raspberry Pi 5)." >&2
  exit 1
fi

echo "ATTENZIONE: questa e' una build locale di sviluppo/test."
echo "Non contiene la configurazione release firmata dell'updater Tauri."
echo "Per l'installazione definitiva su Eve Tab usare scripts/install-rpi-arm64-release.sh"
echo

FREE_KB="$(df --output=avail -k / | tail -1 | tr -d ' ')"
if (( FREE_KB < 6291456 )); then
  echo "ERROR: at least 6 GiB free space is required before building." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  build-essential pkg-config curl wget file patchelf \
  libssl-dev libgtk-3-dev libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev librsvg2-dev libxdo-dev

if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck disable=SC1090
  source "$HOME/.cargo/env"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@9 --activate
  else
    npm install -g pnpm@9
  fi
fi

python3 tools/ensure-tauri-icon.py
pnpm install --no-frozen-lockfile
pnpm build:desktop
pnpm tauri build --config src-tauri/tauri.rpi.conf.json --bundles deb,appimage

DEB="$(find src-tauri/target/release/bundle/deb -maxdepth 1 -type f -name '*.deb' | sort | tail -1 || true)"
APPIMAGE="$(find src-tauri/target/release/bundle/appimage -maxdepth 1 -type f -name '*.AppImage' | sort | tail -1 || true)"

mkdir -p "$HOME/Scaricati" "$HOME/Downloads"

if [[ -n "$DEB" ]]; then
  cp -f "$DEB" "$HOME/Scaricati/"
  echo "DEB dev ready: $DEB"
else
  echo "WARNING: DEB bundle not found." >&2
fi

if [[ -n "$APPIMAGE" ]]; then
  chmod +x "$APPIMAGE"
  cp -f "$APPIMAGE" "$HOME/Scaricati/"
  echo "AppImage dev ready: $APPIMAGE"
else
  echo "WARNING: AppImage bundle not found." >&2
fi

echo
echo "Build locale completata (DEV, updater release non incorporato)."
echo "Per installare la versione definitiva auto-aggiornabile:"
echo "  ./scripts/install-rpi-arm64-release.sh"
