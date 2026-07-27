from __future__ import annotations

import base64
import hashlib
import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INDEX_FILE = BASE_DIR / "index.html"
OUTPUT_FILE = BASE_DIR / "EVE_AI_STUDIO_STANDALONE.html"
HQ_ROOT = BASE_DIR / "eve-animation-runtime-v1.2.2"
HQ_MANIFEST = HQ_ROOT / "eve-hq-runtime-manifest.json"


def read_text(relative_path: str) -> str:
    path = BASE_DIR / relative_path
    if not path.is_file():
        raise FileNotFoundError(f"File richiesto dalla preview non trovato: {relative_path}")
    return path.read_text(encoding="utf-8")


def escape_inline_script(source: str) -> str:
    return re.sub(r"</script", r"<\\/script", source, flags=re.IGNORECASE)


def ordered_runtime_files(index_source: str) -> list[str]:
    entries: list[tuple[int, list[str]]] = []
    for match in re.finditer(r'await\s+loadPreviewScript\("([^"]+)"\)', index_source):
        entries.append((match.start(), [match.group(1)]))
    payload_block = re.search(r"const\s+libraryPayloads\s*=\s*\[(.*?)\];", index_source, flags=re.DOTALL)
    if payload_block:
        entries.append((payload_block.start(), re.findall(r'"([^"]+\.js)"', payload_block.group(1))))
    entries.sort(key=lambda item: item[0])
    ordered: list[str] = []
    for _, files in entries:
        for file_name in files:
            if file_name not in ordered:
                ordered.append(file_name)
    if not ordered:
        raise RuntimeError("Nessun file runtime individuato in index.html")
    return ordered


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def build_hq_embedded_manifest() -> dict | None:
    if not HQ_MANIFEST.is_file():
        return None
    manifest = json.loads(HQ_MANIFEST.read_text(encoding="utf-8"))
    assets = manifest.get("assets") or {}
    if manifest.get("version") != "1.2.2" or len(assets) != 64:
        raise RuntimeError("Manifest Eve HQ non valido")
    for asset_id, asset in assets.items():
        path = HQ_ROOT / asset["file"]
        if not path.is_file():
            raise FileNotFoundError(f"Asset Eve HQ mancante: {asset_id}")
        actual = sha256(path)
        if actual != asset["sha256"]:
            raise RuntimeError(f"SHA-256 non corrispondente per {asset_id}")
        asset["dataUrl"] = "data:image/webp;base64," + base64.b64encode(path.read_bytes()).decode("ascii")
    return manifest


def build() -> None:
    index_source = INDEX_FILE.read_text(encoding="utf-8")
    stylesheet = read_text("styles.css")
    if (HQ_ROOT / "eve-hq-runtime.css").is_file():
        stylesheet += "\n" + (HQ_ROOT / "eve-hq-runtime.css").read_text(encoding="utf-8")

    direct_scripts = re.findall(r'<script\s+src="([^"]+)"\s*></script>', index_source)
    runtime_scripts = ordered_runtime_files(index_source)
    checkpoint_match = re.search(r"Checkpoint\s+([^·<]+)", index_source)
    checkpoint = checkpoint_match.group(1).strip() if checkpoint_match else "corrente"

    script_blocks: list[str] = []
    for file_name in direct_scripts:
        script_blocks.append(f'<script data-eve-source="{file_name}">\n{escape_inline_script(read_text(file_name))}\n</script>')
    script_blocks.append("""<script data-eve-source="standalone-bootstrap">
(() => {
  const parts = window.__EVE_HTML_PARTS || [];
  if (parts.length !== 5) throw new Error(`Markup incompleto: ${parts.length}/5 blocchi incorporati.`);
  document.body.innerHTML = parts.join("");
})();
</script>""")

    hq_manifest = build_hq_embedded_manifest()
    if hq_manifest is not None:
        encoded = json.dumps(hq_manifest, ensure_ascii=False, separators=(",", ":"))
        script_blocks.append(
            '<script data-eve-source="hq-animation-assets">\n'
            f'window.__EVE_HQ_STANDALONE_MANIFEST={escape_inline_script(encoded)};\n'
            '</script>'
        )

    for file_name in runtime_scripts:
        script_blocks.append(f'<script data-eve-source="{file_name}">\n{escape_inline_script(read_text(file_name))}\n</script>')

    quality = "original-hq" if hq_manifest is not None else "legacy-preview"
    generated = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="eve-preview-format" content="standalone">
<meta name="eve-preview-checkpoint" content="{checkpoint}">
<meta name="eve-animation-quality" content="{quality}">
<title>Eve AI Studio — Anteprima standalone</title>
<!-- File autonomo generato automaticamente. Nessuna dipendenza esterna. -->
<style>
{stylesheet}
#loader{{max-width:620px;margin:20vh auto;padding:32px;text-align:center;color:#ecfbff}}
.spinner{{width:42px;height:42px;margin:0 auto 18px;border:4px solid rgba(125,235,255,.16);border-top-color:#00dff2;border-radius:50%;animation:spin .8s linear infinite}}
#loader small{{color:#8aa9b7}}@keyframes spin{{to{{transform:rotate(360deg)}}}}
</style>
</head>
<body>
<main id="loader"><div class="spinner"></div><strong>Caricamento di Eve AI Studio…</strong><br><small>Checkpoint {checkpoint} · Animation Library 1.2.2 · {quality}</small></main>
{chr(10).join(script_blocks)}
</body>
</html>
"""
    if re.search(r"<script\s+[^>]*src=", generated, flags=re.IGNORECASE):
        raise RuntimeError("Lo standalone contiene ancora script esterni")
    if re.search(r"<link\s+[^>]*rel=[\"']stylesheet[\"']", generated, flags=re.IGNORECASE):
        raise RuntimeError("Lo standalone contiene ancora fogli di stile esterni")
    OUTPUT_FILE.write_text(generated, encoding="utf-8", newline="\n")
    print(f"Creato {OUTPUT_FILE.name}: {OUTPUT_FILE.stat().st_size:,} byte · qualità {quality}")


if __name__ == "__main__":
    build()
