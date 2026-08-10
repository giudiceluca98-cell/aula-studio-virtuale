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

# Tauri generate_context! richiede un'icona valida anche quando il bundle
# Linux non ha ancora asset grafici dedicati nel repository.
if [[ ! -f src-tauri/icons/icon.png ]]; then
  echo "Genero src-tauri/icons/icon.png per la build ARM64..."
  mkdir -p src-tauri/icons
  python3 - <<'PY'
from pathlib import Path
import struct, zlib
w = h = 128
# RGBA: sfondo Eve/Aula blu notte con bordo ciano semplice.
rows = []
for y in range(h):
    row = bytearray([0])
    for x in range(w):
        border = x < 6 or y < 6 or x >= w-6 or y >= h-6
        if border:
            rgba = (65, 200, 255, 255)
        else:
            rgba = (5, 11, 20, 255)
        row.extend(rgba)
    rows.append(bytes(row))
raw = b''.join(rows)
def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
Path('src-tauri/icons/icon.png').write_bytes(png)
PY
fi

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
