from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "reference/demo-aula-studio-virtuale-canonica.html"
README_PATH = ROOT / "reference/README.md"
CHANGELOG_PATH = ROOT / "reference/CHANGELOG_DEMO.md"
STATUS_PATH = ROOT / "reference/INTEGRATION_STATUS.md"
ARCHITECTURE_PATH = ROOT / "reference/DEMO_ARCHITECTURE.md"
APPROVALS_PATH = ROOT / "reference/PHASE_APPROVALS.md"

VERSION = "1.1.0-alpha.2"
DATE = "2026-07-22"
MARKER = "CATALOGO — AGGIUNTA MANUALE MATERIALI 1.1.0-alpha.2"

CSS = r'''

    /* ==========================================================
       CATALOGO — AGGIUNTA MANUALE MATERIALI 1.1.0-alpha.2
       ========================================================== */

    .catalog-demo-add-material {
      color: #eaffff;
      border-color: rgba(125, 235, 255, 0.26);
      background: linear-gradient(135deg, rgba(9,107,129,0.92), rgba(75,77,178,0.88));
    }

    .catalog-demo-manual-dialog[hidden] {
      display: none !important;
    }

    .catalog-demo-manual-dialog {
      position: fixed;
      inset: 0;
      z-index: 12000;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(1, 7, 12, 0.72);
      backdrop-filter: blur(12px) saturate(120%);
    }

    .catalog-demo-manual-card {
      width: min(700px, 100%);
      max-height: min(88vh, 780px);
      overflow: auto;
      border: 1px solid rgba(125, 235, 255, 0.22);
      border-radius: 24px;
      color: var(--ink);
      background:
        radial-gradient(circle at 0% 0%, rgba(0,223,242,0.10), transparent 38%),
        linear-gradient(180deg, var(--surface-strong), var(--surface));
      box-shadow: 0 34px 110px rgba(0,0,0,0.48), 0 0 38px rgba(0,223,242,0.08);
    }

    .catalog-demo-manual-head {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 20px 22px 17px;
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--surface-strong) 96%, transparent);
      backdrop-filter: blur(16px);
    }

    .catalog-demo-manual-head h2 {
      margin: 5px 0 6px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(25px, 4vw, 38px);
      font-weight: 500;
      letter-spacing: -0.03em;
    }

    .catalog-demo-manual-head p {
      max-width: 550px;
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .catalog-demo-manual-close {
      width: 36px;
      height: 36px;
      display: grid;
      flex: 0 0 auto;
      place-items: center;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--muted);
      background: rgba(255,255,255,0.025);
      cursor: pointer;
    }

    .catalog-demo-manual-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      padding: 20px 22px 22px;
    }

    .catalog-demo-manual-form label {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
    }

    .catalog-demo-manual-form .wide {
      grid-column: 1 / -1;
    }

    .catalog-demo-manual-form input,
    .catalog-demo-manual-form select,
    .catalog-demo-manual-form textarea {
      width: 100%;
      min-width: 0;
      padding: 10px 11px;
      outline: none;
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 11px;
      background: var(--surface);
    }

    .catalog-demo-manual-form input,
    .catalog-demo-manual-form select {
      min-height: 42px;
    }

    .catalog-demo-manual-form textarea {
      min-height: 96px;
      resize: vertical;
      line-height: 1.5;
    }

    .catalog-demo-manual-form input:focus,
    .catalog-demo-manual-form select:focus,
    .catalog-demo-manual-form textarea:focus {
      border-color: rgba(125,235,255,0.40);
      box-shadow: 0 0 0 3px rgba(0,223,242,0.06);
    }

    .catalog-demo-manual-note {
      grid-column: 1 / -1;
      padding: 11px 12px;
      border: 1px solid rgba(122,124,255,0.17);
      border-radius: 12px;
      color: var(--muted);
      background: rgba(122,124,255,0.05);
      font-size: 9px;
      line-height: 1.55;
    }

    .catalog-demo-manual-error {
      grid-column: 1 / -1;
      min-height: 20px;
      color: #ff9da6;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.45;
    }

    .catalog-demo-manual-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      padding-top: 2px;
    }

    .catalog-demo-manual-actions button {
      min-height: 42px;
      padding: 0 16px;
      border: 1px solid var(--line);
      border-radius: 12px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-weight: 760;
      cursor: pointer;
    }

    .catalog-demo-manual-actions .primary {
      color: #eaffff;
      border-color: rgba(125,235,255,0.26);
      background: linear-gradient(135deg, rgba(9,107,129,0.94), rgba(75,77,178,0.90));
    }

    .catalog-demo-card-actions .catalog-demo-external {
      grid-column: 1 / -1;
      display: inline-flex;
      min-height: 35px;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: var(--green-2);
      border: 1px solid rgba(125,235,255,0.18);
      border-radius: 10px;
      background: rgba(0,223,242,0.045);
      font-size: 9px;
      font-weight: 760;
      text-decoration: none;
    }

    @media (max-width: 620px) {
      .catalog-demo-manual-dialog {
        align-items: end;
        padding: 8px;
      }

      .catalog-demo-manual-card {
        max-height: 92vh;
        border-radius: 20px 20px 13px 13px;
      }

      .catalog-demo-manual-form {
        grid-template-columns: 1fr;
        padding: 16px;
      }

      .catalog-demo-manual-form .wide,
      .catalog-demo-manual-note,
      .catalog-demo-manual-error,
      .catalog-demo-manual-actions {
        grid-column: 1;
      }

      .catalog-demo-manual-actions {
        flex-direction: column-reverse;
      }

      .catalog-demo-manual-actions button {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .catalog-demo-manual-dialog,
      .catalog-demo-manual-card {
        scroll-behavior: auto !important;
      }
    }
'''

BUTTON_HTML = r'''
            <button class="catalog-demo-shortcut catalog-demo-add-material" type="button" onclick="catalogDemoOpenManualMaterial()">＋ Aggiungi materiale</button>
'''

DIALOG_HTML = r'''

    <div class="catalog-demo-manual-dialog" id="catalogDemoManualDialog" hidden onclick="catalogDemoManualBackdrop(event)">
      <section class="catalog-demo-manual-card" role="dialog" aria-modal="true" aria-labelledby="catalogDemoManualTitle">
        <header class="catalog-demo-manual-head">
          <div>
            <div class="portal-eyebrow">Amplia il catalogo personale</div>
            <h2 id="catalogDemoManualTitle">Aggiungi un materiale</h2>
            <p>Incolla un collegamento HTTPS. La risorsa resta privata nella demo finché non la inserisci esplicitamente nel percorso o nella stanza.</p>
          </div>
          <button class="catalog-demo-manual-close" type="button" onclick="catalogDemoCloseManualMaterial()" aria-label="Chiudi aggiunta materiale">×</button>
        </header>

        <form class="catalog-demo-manual-form" id="catalogDemoManualForm" onsubmit="catalogDemoAddManualMaterial(event)" novalidate>
          <label class="wide">
            Titolo *
            <input id="catalogDemoManualTitleInput" name="title" type="text" maxlength="240" required placeholder="Es. Introduzione alla biologia cellulare">
          </label>

          <label class="wide">
            Link HTTPS *
            <input id="catalogDemoManualUrl" name="url" type="url" maxlength="4096" inputmode="url" required placeholder="https://...">
          </label>

          <label>
            Tipo
            <select id="catalogDemoManualType" name="resourceType">
              <option value="page">Pagina web</option>
              <option value="pdf">PDF</option>
              <option value="document">Documento</option>
              <option value="dataset">Dataset</option>
              <option value="notebook">Notebook</option>
              <option value="archive">Archivio</option>
              <option value="file">File</option>
              <option value="video">Video</option>
              <option value="course">Corso</option>
              <option value="book">Libro</option>
              <option value="podcast">Podcast</option>
            </select>
          </label>

          <label>
            Lingua
            <select id="catalogDemoManualLanguage" name="language">
              <option value="it">Italiano</option>
              <option value="en">Inglese</option>
              <option value="und">Altra / non specificata</option>
            </select>
          </label>

          <label class="wide">
            Fonte o autore
            <input id="catalogDemoManualProvider" name="provider" type="text" maxlength="160" placeholder="Facoltativo: useremo il nome del sito">
          </label>

          <label class="wide">
            Descrizione
            <textarea id="catalogDemoManualDescription" name="description" maxlength="4000" placeholder="Cosa contiene e per quale argomento è utile"></textarea>
          </label>

          <div class="catalog-demo-manual-note">
            Sono accettati soltanto URL pubblici <strong>https://</strong>. La demo rifiuta reti locali, indirizzi privati e comuni formati eseguibili. Il collegamento non viene scaricato né analizzato automaticamente.
          </div>

          <div class="catalog-demo-manual-error" id="catalogDemoManualError" role="alert" aria-live="assertive"></div>

          <div class="catalog-demo-manual-actions">
            <button type="button" onclick="catalogDemoCloseManualMaterial()">Annulla</button>
            <button class="primary" type="submit">＋ Aggiungi al catalogo</button>
          </div>
        </form>
      </section>
    </div>
'''

JS = r'''

    const catalogDemoManualStorageKey = "aula-demo-catalog-manual-v1";
    let catalogDemoManualPreviousFocus = null;

    const catalogDemoManualTypeMap = {
      page: { format: "documentazione", label: "Pagina web" },
      pdf: { format: "pdf", label: "PDF" },
      document: { format: "documentazione", label: "Documento" },
      dataset: { format: "documentazione", label: "Dataset" },
      notebook: { format: "esercizi", label: "Notebook" },
      archive: { format: "documentazione", label: "Archivio" },
      file: { format: "documentazione", label: "File" },
      video: { format: "video", label: "Video" },
      course: { format: "corso", label: "Corso" },
      book: { format: "documentazione", label: "Libro" },
      podcast: { format: "video", label: "Podcast" }
    };

    function catalogDemoNormalizeManualUrl(rawValue) {
      const url = new URL(String(rawValue || "").trim());
      if (url.protocol !== "https:") throw new Error("Inserisci un collegamento che inizi con https://");
      url.hash = "";
      const hostname = url.hostname.toLocaleLowerCase("en");
      const privateIpv4 = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
      if (!hostname || hostname === "localhost" || hostname === "::1" || hostname.endsWith(".local") || privateIpv4.test(hostname)) {
        throw new Error("Gli indirizzi locali o appartenenti a reti private non sono ammessi.");
      }
      const filename = url.pathname.split("/").pop() || "";
      const extension = filename.includes(".") ? filename.split(".").pop().toLocaleLowerCase("en") : "";
      const blocked = new Set(["exe", "msi", "bat", "cmd", "com", "scr", "ps1", "sh", "jar", "apk"]);
      if (blocked.has(extension)) throw new Error("Questo formato eseguibile non può essere aggiunto al Catalogo.");
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return url;
    }

    function catalogDemoManualId(url) {
      let hash = 2166136261;
      for (const character of url) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
      }
      return `manual-${(hash >>> 0).toString(16)}`;
    }

    function catalogDemoLoadManualMaterials() {
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem(catalogDemoManualStorageKey) || "[]");
      } catch {
        stored = [];
      }
      if (!Array.isArray(stored)) return;
      stored.forEach((material) => {
        if (!material || typeof material !== "object" || !material.id || !material.sourceUrl) return;
        if (!catalogDemoMaterials.some((item) => item.id === material.id || item.sourceUrl === material.sourceUrl)) {
          catalogDemoMaterials.unshift({ ...material, personal: true, verified: false });
        }
        catalogDemoState.saved.add(material.id);
        catalogDemoState.selected.add(material.id);
      });
    }

    function catalogDemoPersistManualMaterials() {
      try {
        const materials = catalogDemoMaterials.filter((material) => material.personal);
        localStorage.setItem(catalogDemoManualStorageKey, JSON.stringify(materials));
      } catch {
        // La demo resta utilizzabile anche quando lo storage del browser è bloccato.
      }
    }

    function catalogDemoOpenManualMaterial() {
      const dialog = document.getElementById("catalogDemoManualDialog");
      const error = document.getElementById("catalogDemoManualError");
      if (!dialog) return;
      catalogDemoManualPreviousFocus = document.activeElement;
      if (error) error.textContent = "";
      dialog.hidden = false;
      document.body.classList.add("catalog-demo-dialog-open");
      window.setTimeout(() => document.getElementById("catalogDemoManualTitleInput")?.focus(), 30);
    }

    function catalogDemoCloseManualMaterial(options = {}) {
      const dialog = document.getElementById("catalogDemoManualDialog");
      const form = document.getElementById("catalogDemoManualForm");
      const error = document.getElementById("catalogDemoManualError");
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("catalog-demo-dialog-open");
      if (options.reset !== false) form?.reset();
      if (error) error.textContent = "";
      if (catalogDemoManualPreviousFocus?.focus) catalogDemoManualPreviousFocus.focus();
      catalogDemoManualPreviousFocus = null;
    }

    function catalogDemoManualBackdrop(event) {
      if (event.target?.id === "catalogDemoManualDialog") catalogDemoCloseManualMaterial();
    }

    function catalogDemoAddManualMaterial(event) {
      event.preventDefault();
      const titleInput = document.getElementById("catalogDemoManualTitleInput");
      const urlInput = document.getElementById("catalogDemoManualUrl");
      const typeInput = document.getElementById("catalogDemoManualType");
      const languageInput = document.getElementById("catalogDemoManualLanguage");
      const providerInput = document.getElementById("catalogDemoManualProvider");
      const descriptionInput = document.getElementById("catalogDemoManualDescription");
      const error = document.getElementById("catalogDemoManualError");
      const title = String(titleInput?.value || "").trim();
      if (!title) {
        if (error) error.textContent = "Inserisci il titolo del materiale.";
        titleInput?.focus();
        return;
      }

      let normalizedUrl;
      try {
        normalizedUrl = catalogDemoNormalizeManualUrl(urlInput?.value || "");
      } catch (failure) {
        if (error) error.textContent = failure instanceof Error ? failure.message : "Controlla il collegamento HTTPS.";
        urlInput?.focus();
        return;
      }

      const sourceUrl = normalizedUrl.toString();
      const existing = catalogDemoMaterials.find((material) => material.sourceUrl === sourceUrl);
      if (existing) {
        catalogDemoState.saved.add(existing.id);
        catalogDemoState.selected.add(existing.id);
        catalogDemoCloseManualMaterial();
        catalogDemoRender();
        const elements = catalogDemoElements();
        if (elements.status) elements.status.textContent = "Questo collegamento era già presente: è stato selezionato senza creare duplicati.";
        portalNotify("Materiale già presente nel Catalogo");
        return;
      }

      const resourceType = String(typeInput?.value || "page");
      const typeData = catalogDemoManualTypeMap[resourceType] || catalogDemoManualTypeMap.page;
      const language = String(languageInput?.value || "it");
      const provider = String(providerInput?.value || "").trim() || normalizedUrl.hostname;
      const description = String(descriptionInput?.value || "").trim() || "Materiale aggiunto manualmente al catalogo personale.";
      const id = catalogDemoManualId(sourceUrl);
      const material = {
        id,
        title,
        provider,
        format: typeData.format,
        resourceType,
        resourceTypeLabel: typeData.label,
        level: "base",
        language,
        verified: false,
        personal: true,
        sourceUrl,
        topic: `${title} ${description} ${provider} materiale personale`,
        monitoring: "Aggiunto da te · accesso esterno non monitorato",
        description
      };

      catalogDemoMaterials.unshift(material);
      catalogDemoState.saved.add(id);
      catalogDemoState.selected.add(id);
      catalogDemoState.importedSignature = "";
      catalogDemoPersistManualMaterials();
      catalogDemoCloseManualMaterial();

      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = "";
      if (elements.level) elements.level.value = "all";
      if (elements.format) elements.format.value = "all";
      if (elements.language) elements.language.value = "all";
      if (elements.verified) elements.verified.checked = false;
      catalogDemoRender();
      if (elements.status) elements.status.textContent = "Materiale aggiunto al catalogo personale e selezionato per il percorso.";
      portalNotify("Materiale aggiunto al Catalogo");
    }

    window.addEventListener("keydown", (event) => {
      const dialog = document.getElementById("catalogDemoManualDialog");
      if (event.key === "Escape" && dialog && !dialog.hidden) {
        event.preventDefault();
        catalogDemoCloseManualMaterial();
      }
    });
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Anchor {label!r} expected once, found {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(f"blob {len(data)}\0".encode("utf-8") + data).hexdigest()


def update_html(html: str) -> str:
    if MARKER in html:
        return html

    html = replace_once(
        html,
        "    @media (max-width: 1120px) {\n      .catalog-demo-layout {",
        CSS + "\n\n    @media (max-width: 1120px) {\n      .catalog-demo-layout {",
        "catalog responsive CSS",
    )

    shortcut_anchor = '''            <button class="catalog-demo-shortcut" type="button" onclick="catalogDemoUseQuery('Non so da dove iniziare')">✦ Non so da dove iniziare</button>
          </div>'''
    html = replace_once(
        html,
        shortcut_anchor,
        shortcut_anchor.replace("\n          </div>", "\n" + BUTTON_HTML + "          </div>"),
        "catalog shortcuts",
    )

    html = replace_once(
        html,
        "    </main>\n  </section>\n\n  <section class=\"portal-view portal-aula-view\" id=\"portalAula\" hidden>",
        "    </main>\n" + DIALOG_HTML + "  </section>\n\n  <section class=\"portal-view portal-aula-view\" id=\"portalAula\" hidden>",
        "catalog closing section",
    )

    html = replace_once(
        html,
        "    function catalogDemoFilteredMaterials() {",
        JS + "\n\n    function catalogDemoFilteredMaterials() {",
        "catalog JS functions",
    )

    html = replace_once(
        html,
        '          <div class="catalog-demo-card-actions">\n            <button type="button" onclick="catalogDemoToggleSaved',
        '          <div class="catalog-demo-card-actions">\n            <button type="button" onclick="catalogDemoToggleSaved',
        "card actions presence",
    )

    card_end = '''            <button class="primary" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')">${selected ? "✓ Nel percorso" : "+ Usa nel percorso"}</button>
          </div>'''
    card_replacement = '''            <button class="primary" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')">${selected ? "✓ Nel percorso" : "+ Usa nel percorso"}</button>
            ${material.sourceUrl ? `<a class="catalog-demo-external" href="${catalogDemoEscape(material.sourceUrl)}" target="_blank" rel="noopener noreferrer">↗ Apri fonte esterna</a>` : ""}
          </div>'''
    html = replace_once(html, card_end, card_replacement, "catalog external link")

    init_anchor = '''      if (!catalogDemoState.initialized) {
        catalogDemoState.initialized = true;
        const elements = catalogDemoElements();'''
    init_replacement = '''      if (!catalogDemoState.initialized) {
        catalogDemoState.initialized = true;
        catalogDemoLoadManualMaterials();
        const elements = catalogDemoElements();'''
    html = replace_once(html, init_anchor, init_replacement, "catalog initialization")

    language_anchor = '''                  <option value="en">Inglese</option>
                </select>'''
    language_replacement = '''                  <option value="en">Inglese</option>
                  <option value="und">Altra / non specificata</option>
                </select>'''
    html = replace_once(html, language_anchor, language_replacement, "catalog language filter")

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="catalogDemoManualDialog"',
        'id="catalogDemoManualForm"',
        "function catalogDemoAddManualMaterial(",
        "function catalogDemoNormalizeManualUrl(",
        "catalogDemoLoadManualMaterials();",
        "catalog-demo-external",
    ]
    for value in required:
        if value not in html:
            raise RuntimeError(f"Missing marker: {value}")
    ids = [value for value in re.findall(r'\bid=["\']([^"\']+)["\']', html) if "${" not in value]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if duplicates:
        raise RuntimeError(f"Duplicate ids: {duplicates}")
    if html.count("<script") != html.count("</script>"):
        raise RuntimeError("Unbalanced scripts")
    if html.count("<style") != html.count("</style>"):
        raise RuntimeError("Unbalanced styles")
    if not html.rstrip().endswith("</html>"):
        raise RuntimeError("Missing HTML closing tag")


def update_docs(html: str) -> None:
    data = html.encode("utf-8")
    size = len(data)
    lines = html.count("\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob = git_blob_sha(data)

    readme = README_PATH.read_text(encoding="utf-8")
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: aggiunta manuale materiali nel Catalogo.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Catalogo — aggiunta manuale di materiali\n\n- Aggiunto il pulsante `Aggiungi materiale` nella vista Catalogo.\n- Aggiunto un dialog accessibile con titolo, URL HTTPS, tipo, lingua, fonte e descrizione.\n- Aggiunta validazione contro URL non HTTPS, reti locali/private e comuni formati eseguibili.\n- Aggiunta deduplicazione per URL normalizzato.\n- Le risorse personali vengono marcate `da verificare`, salvate e selezionate automaticamente.\n- Aggiunta persistenza locale privata della demo tramite `localStorage`.\n- Aggiunto collegamento esterno sicuro con `noopener noreferrer`.\n- Aggiunti chiusura con `Escape`, click sullo sfondo e ripristino del focus.\n- Aggiunto layout mobile del dialog.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.1.0-alpha.1]", entry + "## [1.1.0-alpha.1]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Aggiunta manuale URL HTTPS"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- form completo;\n- URL HTTPS obbligatorio;\n- blocco reti private e formati eseguibili;\n- deduplicazione URL;\n- materiale personale `da verificare`;\n- selezione automatica nel percorso;\n- persistenza locale privata della demo;\n- apertura esterna sicura;\n- dialog accessibile e responsive.\n\nDa verificare manualmente:\n\n- inserimento valido;\n- messaggi per URL HTTP, locale ed eseguibile;\n- inserimento duplicato;\n- permanenza dopo ricaricamento;\n- chiusura con Escape e ripristino focus.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture_marker = "### Materiali manuali del Catalogo"
    architecture_entry = f'''\n{architecture_marker}\n\nLa demo {VERSION} conserva le risorse inserite dall'utente in `localStorage` con la chiave `aula-demo-catalog-manual-v1`. Questa è esclusivamente una simulazione privata del browser. Nell'app reale la fonte autorevole resta il backend con RLS.\n\nFunzioni:\n\n- `catalogDemoNormalizeManualUrl()` — HTTPS, rete pubblica e formato;\n- `catalogDemoManualId()` — identificatore stabile derivato dall'URL;\n- `catalogDemoLoadManualMaterials()` — ripristino locale;\n- `catalogDemoPersistManualMaterials()` — persistenza locale;\n- `catalogDemoAddManualMaterial()` — validazione, deduplicazione e selezione;\n- `catalogDemoOpenManualMaterial()` / `catalogDemoCloseManualMaterial()` — dialog e focus.\n'''
    if architecture_marker not in architecture:
        architecture += architecture_entry
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: vista, navigazione, ricerca e percorso | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.1.0-alpha.1 pronta da aprire e verificare. |",
        "| Fase 1 | Catalogo: vista, navigazione, ricerca e percorso | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.1.0-alpha.1. |",
    )
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: ricerca e filtri | DA_INIZIARE | — | — |",
        "| Fase 1 | Catalogo: ricerca e filtri | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |",
    )
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: materiali e salvati | DA_INIZIARE | — | — |",
        "| Fase 1 | Catalogo: materiali e salvati | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |",
    )
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: aggiunta URL | DA_INIZIARE | — | — |",
        f"| Fase 1 | Catalogo: aggiunta URL | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |",
    )
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: percorso Eve e importazione | DA_INIZIARE | — | — |",
        "| Fase 1 | Catalogo: percorso Eve e importazione | APPROVATO | 2026-07-22 | Incluso e approvato nel checkpoint 1.1.0-alpha.1. |",
    )
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    updated = update_html(html)
    validate(updated)
    HTML_PATH.write_text(updated, encoding="utf-8")
    update_docs(updated)
    data = updated.encode("utf-8")
    print(f"version={VERSION}")
    print(f"bytes={len(data)}")
    print(f"lines={updated.count(chr(10)) + 1}")
    print(f"sha256={hashlib.sha256(data).hexdigest()}")
    print(f"git_blob_sha={git_blob_sha(data)}")


if __name__ == "__main__":
    main()
