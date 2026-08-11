#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "ERROR: questo installer richiede Linux ARM64/aarch64." >&2
  exit 1
fi

SOURCE_APPIMAGE="${1:-}"
if [[ -z "$SOURCE_APPIMAGE" || ! -f "$SOURCE_APPIMAGE" ]]; then
  echo "Uso: $0 /percorso/Eve.AI.Studio_<versione>_aarch64.AppImage" >&2
  exit 1
fi

command -v file >/dev/null 2>&1 || {
  echo "ERROR: comando file non disponibile." >&2
  exit 1
}

FILE_DESC="$(file -b "$SOURCE_APPIMAGE")"
echo "$FILE_DESC"
echo "$FILE_DESC" | grep -Eqi 'aarch64|ARM aarch64' || {
  echo "ERROR: il pacchetto non risulta ARM64/aarch64." >&2
  exit 1
}

APP_DIR='/opt/eve/apps/eve-studio'
APP_PATH="$APP_DIR/EV-Studio.AppImage"

sudo mkdir -p "$APP_DIR"
if sudo test -f "$APP_PATH"; then
  sudo cp -a "$APP_PATH" "$APP_PATH.previous"
fi
sudo install -o "$(id -un)" -g "$(id -gn)" -m 0755 "$SOURCE_APPIMAGE" "$APP_PATH"

test -x "$APP_PATH"
echo "Eve AI Studio ARM64 installata: $APP_PATH"
echo "Eve Tab la avvia tramite il tile Eve AI Studio."
