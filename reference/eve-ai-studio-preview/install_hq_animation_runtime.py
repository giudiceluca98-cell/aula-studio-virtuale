from __future__ import annotations

import hashlib
import json
import re
import shutil
import tarfile
import tempfile
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent
ARCHIVE = BASE / "vendor" / "EVE_ANIMATION_RUNTIME_V1.2.2_ORIGINAL.tar.xz"
EXPECTED_ARCHIVE_SHA256 = "c48e41300fea7ce835bb8f7ba3e46531f370d9f56668854861f90e0c01c1583e"
RUNTIME = BASE / "eve-animation-runtime-v1.2.2"
INDEX = BASE / "index.html"
MARKUP = BASE / "markup-01.js"
REPORT = BASE / "EVE_HQ_INSTALLATION_RESULT.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_extract(archive: tarfile.TarFile, target: Path) -> None:
    root = target.resolve()
    for member in archive.getmembers():
        resolved = (target / member.name).resolve()
        if root not in resolved.parents and resolved != root:
            raise RuntimeError(f"Percorso non sicuro nell'archivio: {member.name}")
    archive.extractall(target)


def validate_runtime(root: Path) -> dict:
    manifest_path = root / "eve-hq-runtime-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("version") != "1.2.2" or manifest.get("totalAssets") != 64:
        raise RuntimeError("Versione o numero asset non valido")
    if manifest.get("sourceZipSha256") != "b3a83204315c87909895a9f7bc61d69c07771a0bf04571a10baece135d2ee3bf":
        raise RuntimeError("Il runtime non deriva dallo ZIP originale approvato")
    for asset_id, asset in manifest["assets"].items():
        path = root / asset["file"]
        if not path.is_file() or sha256(path) != asset["sha256"]:
            raise RuntimeError(f"Asset assente o alterato: {asset_id}")
        with Image.open(path) as image:
            if image.size != (asset["width"], asset["height"]):
                raise RuntimeError(f"Dimensione incoerente: {asset_id}")
            if getattr(image, "n_frames", 1) != asset["frames"]:
                raise RuntimeError(f"Frame incoerenti: {asset_id}")
    return manifest


def patch_markup() -> None:
    source = MARKUP.read_text(encoding="utf-8")
    replacement = '<img id="eveHqPortrait" class="eve-portrait eve-hq-portrait" alt="Eve, assistente AI animata" draggable="false">'
    source, count = re.subn(r'<svg class="eve-portrait".*?</svg>', replacement, source, count=1, flags=re.DOTALL)
    if count == 0 and 'id="eveHqPortrait"' not in source:
        raise RuntimeError("Ritratto Eve non individuato nel markup")
    MARKUP.write_text(source, encoding="utf-8")


def patch_index() -> None:
    source = INDEX.read_text(encoding="utf-8")
    css = '<link rel="stylesheet" href="eve-animation-runtime-v1.2.2/eve-hq-runtime.css">'
    if css not in source:
        source = source.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="styles.css">\n' + css)

    source = re.sub(
        r'\n\s*const libraryPayloads=\[.*?for\(const file of libraryPayloads\) await loadPreviewScript\(file\);\s*',
        '\n', source, count=1, flags=re.DOTALL,
    )
    source = re.sub(r'\n\s*await loadPreviewScript\("official-library-workflow-payload-a\.js"\);', '', source)
    source = re.sub(r'\n\s*await loadPreviewScript\("official-library-workflow-payload-b\.js"\);', '', source)
    source = re.sub(r'\n\s*await loadPreviewScript\("official-library-loader\.js"\);', '', source)

    runtime_line = '  await loadPreviewScript("eve-animation-runtime-v1.2.2/eve-hq-runtime.js");'
    if runtime_line not in source:
        source = source.replace('  await loadPreviewScript("app.js");', '  await loadPreviewScript("app.js");\n' + runtime_line)
    INDEX.write_text(source, encoding="utf-8")


def remove_legacy_payloads() -> int:
    paths = list(BASE.glob("official-payload-*.js"))
    paths += list(BASE.glob("official-library-workflow-payload-*.js"))
    paths += [BASE / "official-library-loader.js"]
    removed = 0
    for path in paths:
        if path.is_file():
            path.unlink()
            removed += 1
    return removed


def main() -> None:
    if not ARCHIVE.is_file():
        raise FileNotFoundError(ARCHIVE)
    actual_archive_sha = sha256(ARCHIVE)
    if actual_archive_sha != EXPECTED_ARCHIVE_SHA256:
        raise RuntimeError(f"Archivio runtime non approvato: {actual_archive_sha}")
    with tempfile.TemporaryDirectory() as temporary:
        extracted = Path(temporary) / "runtime"
        extracted.mkdir()
        with tarfile.open(ARCHIVE, "r:xz") as archive:
            safe_extract(archive, extracted)
        manifest = validate_runtime(extracted)
        if RUNTIME.exists():
            shutil.rmtree(RUNTIME)
        shutil.copytree(extracted, RUNTIME)
    patch_markup()
    patch_index()
    removed = remove_legacy_payloads()
    result = {
        "passed": True,
        "libraryVersion": manifest["version"],
        "assets": len(manifest["assets"]),
        "archiveSha256": actual_archive_sha,
        "sourceZipSha256": manifest["sourceZipSha256"],
        "qualityPolicy": manifest["qualityPolicy"],
        "legacyPayloadFilesRemoved": removed,
    }
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
