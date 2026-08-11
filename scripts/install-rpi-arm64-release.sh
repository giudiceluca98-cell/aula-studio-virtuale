#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$(uname -m)" != "aarch64" ]]; then
  echo "ERROR: questo installer e' destinato a Linux ARM64/aarch64 (Raspberry Pi 5)." >&2
  exit 1
fi

RELEASE_REPO="${AULA_RELEASE_REPO:-giudiceluca98-cell/aula-studio-virtuale-releases}"
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/eve/apps/aula-studio-virtuale"
APP_PATH="$APP_DIR/AulaStudioVirtuale.AppImage"
API_URL="https://api.github.com/repos/${RELEASE_REPO}/releases/latest"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

command -v curl >/dev/null 2>&1 || { echo "ERROR: curl non disponibile." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 non disponibile." >&2; exit 1; }

printf '[1/6] Cerco l\''ultima release ARM64 di Aula Studio...\n'
curl -fsSL \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$API_URL" > "$TMP_DIR/release.json"

readarray -t RELEASE_INFO < <(python3 - "$TMP_DIR/release.json" <<'PY'
import json, re, sys
from pathlib import Path
payload = json.loads(Path(sys.argv[1]).read_text())
assets = payload.get('assets') or []
appimages = [a for a in assets if str(a.get('name', '')).lower().endswith('.appimage')]
arm = [a for a in appimages if re.search(r'(aarch64|arm64)', str(a.get('name', '')), re.I)]
choices = arm or (appimages if len(appimages) == 1 else [])
if not choices:
    raise SystemExit('Nessuna AppImage ARM64 trovata nella release piu recente.')
asset = choices[0]
print(str(payload.get('tag_name') or payload.get('name') or 'latest'))
print(str(asset.get('name') or 'AulaStudioVirtuale.AppImage'))
print(str(asset.get('browser_download_url') or ''))
PY
)

TAG="${RELEASE_INFO[0]:-latest}"
ASSET_NAME="${RELEASE_INFO[1]:-AulaStudioVirtuale.AppImage}"
DOWNLOAD_URL="${RELEASE_INFO[2]:-}"
[[ "$DOWNLOAD_URL" == https://* ]] || { echo "ERROR: URL AppImage non valida." >&2; exit 1; }

printf '[2/6] Download %s (%s)...\n' "$ASSET_NAME" "$TAG"
curl -fL --retry 3 --retry-delay 2 "$DOWNLOAD_URL" -o "$TMP_DIR/AulaStudioVirtuale.AppImage"
chmod 0755 "$TMP_DIR/AulaStudioVirtuale.AppImage"

printf '[3/6] Verifica architettura AppImage...\n'
if command -v file >/dev/null 2>&1; then
  FILE_DESC="$(file -b "$TMP_DIR/AulaStudioVirtuale.AppImage")"
  echo "$FILE_DESC"
  echo "$FILE_DESC" | grep -Eqi 'aarch64|ARM aarch64' || {
    echo "ERROR: l'asset scaricato non risulta ARM64/aarch64." >&2
    exit 1
  }
fi

printf '[4/6] Installazione AppImage Eve...\n'
mkdir -p "$APP_DIR"
if [[ -f "$APP_PATH" ]]; then
  cp -a "$APP_PATH" "$APP_PATH.previous"
fi
install -m 0755 "$TMP_DIR/AulaStudioVirtuale.AppImage" "$APP_PATH"

printf '[5/6] Creo launcher stabile Eve...\n'
cat > "$TMP_DIR/eve-aula-native" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
APP="${XDG_DATA_HOME:-$HOME/.local/share}/eve/apps/aula-studio-virtuale/AulaStudioVirtuale.AppImage"
if [[ ! -x "$APP" ]]; then
  echo "Aula Studio Virtuale ARM64 non installata: $APP" >&2
  exit 1
fi
# WebKitGTK's native Wayland DMABUF renderer is corrupted on Raspberry Pi 5.
# XWayland keeps V3D acceleration enabled and avoids the CPU-heavy software path.
export GDK_BACKEND=x11
exec "$APP" "$@"
EOF
chmod 0755 "$TMP_DIR/eve-aula-native"
sudo install -m 0755 "$TMP_DIR/eve-aula-native" /usr/local/bin/eve-aula-native
sudo mkdir -p /opt/eve/apps/aula-studio-virtuale
sudo ln -sfn /usr/local/bin/eve-aula-native /opt/eve/apps/aula-studio-virtuale/aula-studio-virtuale

printf '[6/6] Verifica...\n'
test -x "$APP_PATH"
test -x /usr/local/bin/eve-aula-native

echo
echo "Aula Studio Virtuale ARM64 release installata: $TAG"
echo "AppImage: $APP_PATH"
echo "Launcher Eve: /usr/local/bin/eve-aula-native"
echo "Questa e' la variante updater-enabled da usare per gli aggiornamenti Tauri firmati da GitHub."
echo "Avvio manuale: eve-aula-native"
