from __future__ import annotations

import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INDEX_FILE = BASE_DIR / "index.html"
OUTPUT_FILE = BASE_DIR / "EVE_AI_STUDIO_STANDALONE.html"


def read_text(relative_path: str) -> str:
    path = BASE_DIR / relative_path
    if not path.is_file():
        raise FileNotFoundError(f"File richiesto dalla preview non trovato: {relative_path}")
    return path.read_text(encoding="utf-8")


def escape_inline_script(source: str) -> str:
    # Impedisce a un eventuale testo </script> contenuto nel JavaScript di
    # chiudere prematuramente il tag dello standalone.
    return re.sub(r"</script", r"<\\/script", source, flags=re.IGNORECASE)


def ordered_runtime_files(index_source: str) -> list[str]:
    entries: list[tuple[int, list[str]]] = []

    for match in re.finditer(
        r'await\s+loadPreviewScript\("([^"]+)"\)', index_source
    ):
        entries.append((match.start(), [match.group(1)]))

    payload_block = re.search(
        r"const\s+libraryPayloads\s*=\s*\[(.*?)\];",
        index_source,
        flags=re.DOTALL,
    )
    if payload_block:
        payload_files = re.findall(r'"([^"]+\.js)"', payload_block.group(1))
        entries.append((payload_block.start(), payload_files))

    entries.sort(key=lambda item: item[0])

    ordered: list[str] = []
    for _, files in entries:
        for file_name in files:
            if file_name not in ordered:
                ordered.append(file_name)

    if not ordered:
        raise RuntimeError("Nessun file runtime individuato in index.html")
    return ordered


def build() -> None:
    index_source = INDEX_FILE.read_text(encoding="utf-8")
    stylesheet = read_text("styles.css")

    direct_scripts = re.findall(
        r'<script\s+src="([^"]+)"\s*></script>', index_source
    )
    runtime_scripts = ordered_runtime_files(index_source)

    checkpoint_match = re.search(r"Checkpoint\s+([^·<]+)", index_source)
    checkpoint = checkpoint_match.group(1).strip() if checkpoint_match else "corrente"

    script_blocks: list[str] = []
    for file_name in direct_scripts:
        source = escape_inline_script(read_text(file_name))
        script_blocks.append(
            f'<script data-eve-source="{file_name}">\n{source}\n</script>'
        )

    script_blocks.append(
        """<script data-eve-source="standalone-bootstrap">
(() => {
  const parts = window.__EVE_HTML_PARTS || [];
  if (parts.length !== 5) {
    throw new Error(`Markup incompleto: ${parts.length}/5 blocchi incorporati.`);
  }
  document.body.innerHTML = parts.join("");
})();
</script>"""
    )

    for file_name in runtime_scripts:
        source = escape_inline_script(read_text(file_name))
        script_blocks.append(
            f'<script data-eve-source="{file_name}">\n{source}\n</script>'
        )

    generated = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="eve-preview-format" content="standalone">
<meta name="eve-preview-checkpoint" content="{checkpoint}">
<title>Eve AI Studio — Anteprima standalone</title>
<!--
  FILE AUTONOMO GENERATO AUTOMATICAMENTE.
  Può essere scaricato e aperto direttamente con doppio clic.
  Non richiede altri file della cartella né una connessione Internet.
-->
<style>
{stylesheet}
#loader{{max-width:620px;margin:20vh auto;padding:32px;text-align:center;color:#ecfbff}}
.spinner{{width:42px;height:42px;margin:0 auto 18px;border:4px solid rgba(125,235,255,.16);border-top-color:#00dff2;border-radius:50%;box-shadow:0 0 24px rgba(0,223,242,.16);animation:spin .8s linear infinite}}
#loader small{{color:#8aa9b7}}@keyframes spin{{to{{transform:rotate(360deg)}}}}
</style>
</head>
<body>
<main id="loader"><div class="spinner"></div><strong>Caricamento di Eve AI Studio…</strong><br><small>Checkpoint {checkpoint} · file standalone · Eve Animation Library 1.2.2</small></main>
{chr(10).join(script_blocks)}
</body>
</html>
"""

    if re.search(r"<script\s+[^>]*src=", generated, flags=re.IGNORECASE):
        raise RuntimeError("Lo standalone contiene ancora script esterni")
    if re.search(
        r"<link\s+[^>]*rel=[\"']stylesheet[\"']",
        generated,
        flags=re.IGNORECASE,
    ):
        raise RuntimeError("Lo standalone contiene ancora fogli di stile esterni")

    OUTPUT_FILE.write_text(generated, encoding="utf-8", newline="\n")
    print(
        f"Creato {OUTPUT_FILE.relative_to(BASE_DIR.parent.parent)} "
        f"({OUTPUT_FILE.stat().st_size:,} byte, {len(direct_scripts)} blocchi markup, "
        f"{len(runtime_scripts)} script runtime)."
    )


if __name__ == "__main__":
    build()
