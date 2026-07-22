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

VERSION = "1.2.0-alpha.5"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — COLLEGAMENTO CATALOGO 1.2.0-alpha.5"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — COLLEGAMENTO CATALOGO 1.2.0-alpha.5
       ========================================================== */

    .portal-study-banner {
      align-items: center;
    }

    .portal-study-banner-copy {
      min-width: 0;
      flex: 1;
    }

    .portal-study-banner-actions {
      min-width: min(100%, 310px);
      display: grid;
      gap: 8px;
    }

    .portal-catalog-room-picker {
      min-height: 42px;
      width: 100%;
      padding: 0 38px 0 12px;
      border: 1px solid rgba(125,235,255,0.20);
      border-radius: 12px;
      color: var(--ink);
      background: color-mix(in srgb, var(--surface-strong) 94%, transparent);
      font-size: 10px;
      font-weight: 720;
    }

    .portal-catalog-room-picker:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .portal-study-banner-note {
      min-height: 17px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.4;
    }

    .portal-room-catalog-button {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid rgba(82,232,176,0.22);
      border-radius: 10px;
      color: #91f7d3;
      background: rgba(82,232,176,0.055);
      font-size: 9px;
      font-weight: 780;
      cursor: pointer;
    }

    .catalog-room-context {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) minmax(190px, 280px);
      gap: 14px;
      align-items: center;
      margin: 16px 0 20px;
      padding: 14px;
      border: 1px solid rgba(125,235,255,0.19);
      border-radius: 16px;
      background:
        linear-gradient(90deg, rgba(0,223,242,0.055), transparent 62%),
        rgba(255,255,255,0.018);
    }

    .catalog-room-context-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125,235,255,0.20);
      border-radius: 13px;
      color: var(--green-2);
      background: rgba(0,223,242,0.06);
      font-size: 18px;
    }

    .catalog-room-context-copy {
      min-width: 0;
    }

    .catalog-room-context-copy span,
    .catalog-room-context-copy strong {
      display: block;
    }

    .catalog-room-context-copy span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 820;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .catalog-room-context-copy strong {
      overflow: hidden;
      margin-top: 4px;
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .catalog-room-context-copy small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.4;
    }

    .catalog-room-context-controls {
      display: grid;
      gap: 6px;
    }

    .catalog-room-context-controls label {
      color: var(--muted);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .catalog-room-context-controls select {
      min-height: 40px;
      width: 100%;
      padding: 0 34px 0 10px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: var(--surface-strong);
      font-size: 10px;
      font-weight: 700;
    }

    .catalog-room-context[data-empty="true"] {
      border-style: dashed;
      border-color: rgba(255,176,91,0.22);
      background: rgba(255,176,91,0.035);
    }

    .catalog-room-context[data-empty="true"] .catalog-room-context-icon {
      color: #ffd7a7;
      border-color: rgba(255,176,91,0.22);
      background: rgba(255,176,91,0.055);
    }

    @media (max-width: 760px) {
      .portal-study-banner {
        align-items: stretch;
      }

      .portal-study-banner-actions {
        width: 100%;
        min-width: 0;
      }

      .catalog-room-context {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .catalog-room-context-controls {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 520px) {
      .portal-room-preview-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .catalog-room-context {
        grid-template-columns: 1fr;
      }

      .catalog-room-context-icon {
        width: 38px;
        height: 38px;
      }
    }
'''

DASHBOARD_BANNER = r'''        <section class="portal-study-banner">
          <div class="portal-feature-icon">✦</div>
          <div class="portal-study-banner-copy">
            <div class="portal-eyebrow">Nuovo percorso</div>
            <h2>Cosa vuoi studiare?</h2>
            <p>
              Esplora i materiali e crea con Eve una sequenza ordinata. Scegli la stanza
              di destinazione prima di entrare nel Catalogo.
            </p>
          </div>
          <div class="portal-study-banner-actions">
            <select class="portal-catalog-room-picker" id="portalDashboardCatalogRoom" aria-label="Stanza di destinazione del Catalogo" onchange="portalDashboardCatalogSelectionChanged(this.value)"></select>
            <button class="portal-button primary large" id="portalDashboardCatalogButton" type="button" onclick="portalDashboardOpenCatalogFromBanner()">
              Apri il Catalogo →
            </button>
            <span class="portal-study-banner-note" id="portalDashboardCatalogNote">Il Catalogo userà questa stanza come destinazione preferita.</span>
          </div>
        </section>
'''

CATALOG_CONTEXT = r'''
        <section class="catalog-room-context" id="catalogRoomContext" aria-live="polite">
          <div class="catalog-room-context-icon" aria-hidden="true">⌂</div>
          <div class="catalog-room-context-copy">
            <span>Destinazione del percorso</span>
            <strong id="catalogRoomContextName">Esplorazione senza stanza</strong>
            <small id="catalogRoomContextMeta">Puoi cercare e salvare materiali; scegli una stanza prima dell’importazione.</small>
          </div>
          <div class="catalog-room-context-controls">
            <label for="catalogRoomContextSelect">Cambia stanza</label>
            <select id="catalogRoomContextSelect" onchange="portalCatalogSetRoomContext(this.value, { announce: true })"></select>
          </div>
        </section>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD — COLLEGAMENTO CONTESTUALE AL CATALOGO
       ========================================================== */

    const portalCatalogRoomContextStorageKey = "aula-demo-catalog-room-context-v1";
    const portalCatalogRoomImportsStorageKey = "aula-demo-catalog-room-imports-v1";
    let portalCatalogPreferredRoomId = "";

    function portalCatalogLoadPreferredRoomId() {
      try {
        return String(localStorage.getItem(portalCatalogRoomContextStorageKey) || "");
      } catch {
        return "";
      }
    }

    function portalCatalogSavePreferredRoomId(roomId) {
      try {
        if (roomId) localStorage.setItem(portalCatalogRoomContextStorageKey, roomId);
        else localStorage.removeItem(portalCatalogRoomContextStorageKey);
      } catch {
        // La navigazione resta utilizzabile anche quando lo storage è bloccato.
      }
    }

    function portalCatalogRoom(roomId) {
      return portalDashboardState.rooms.find((room) => room.id === roomId) || null;
    }

    function portalCatalogValidPreferredRoomId(candidate = portalCatalogPreferredRoomId) {
      return portalCatalogRoom(candidate) ? candidate : "";
    }

    function portalCatalogRoomOptions(selectedId = "") {
      const rooms = [...portalDashboardState.rooms].sort((a, b) => b.createdAt - a.createdAt);
      return [
        `<option value=""${selectedId ? "" : " selected"}>Esplora senza stanza</option>`,
        ...rooms.map((room) => `<option value="${portalDashboardEscape(room.id)}"${room.id === selectedId ? " selected" : ""}>${portalDashboardEscape(room.name)} · ${portalDashboardEscape(portalDashboardRoleLabels[room.role] || "Partecipante")}</option>`)
      ].join("");
    }

    function portalCatalogSetRoomContext(roomId, options = {}) {
      const normalized = portalCatalogRoom(roomId) ? roomId : "";
      portalCatalogPreferredRoomId = normalized;
      portalCatalogSavePreferredRoomId(normalized);
      portalCatalogSyncContextUI();
      if (options.announce) {
        const room = portalCatalogRoom(normalized);
        const message = room
          ? `Destinazione Catalogo: ${room.name}.`
          : "Catalogo in modalità esplorazione: nessuna stanza selezionata.";
        const status = document.getElementById("catalogDemoStatus");
        if (status) status.textContent = message;
        portalNotify(message);
      }
    }

    function portalDashboardCatalogSelectionChanged(roomId) {
      portalCatalogSetRoomContext(roomId);
      portalDashboardCatalogSync();
    }

    function portalDashboardCatalogSync() {
      const select = document.getElementById("portalDashboardCatalogRoom");
      const button = document.getElementById("portalDashboardCatalogButton");
      const note = document.getElementById("portalDashboardCatalogNote");
      if (!select) return;
      const stored = portalCatalogLoadPreferredRoomId();
      const current = portalCatalogValidPreferredRoomId(portalCatalogPreferredRoomId || stored)
        || portalDashboardState.rooms[0]?.id
        || "";
      portalCatalogPreferredRoomId = current;
      portalCatalogSavePreferredRoomId(current);
      select.innerHTML = portalCatalogRoomOptions(current);
      select.value = current;
      const room = portalCatalogRoom(current);
      if (button) button.textContent = room ? `Catalogo per ${room.name} →` : "Esplora il Catalogo →";
      if (note) note.textContent = room
        ? `Materiali e percorsi verranno preparati per “${room.name}”.`
        : "Puoi esplorare e salvare materiali; l’importazione richiederà una stanza.";
    }

    function portalDashboardOpenCatalogFromBanner() {
      const select = document.getElementById("portalDashboardCatalogRoom");
      portalDashboardOpenCatalogForRoom(String(select?.value || ""));
    }

    function portalDashboardOpenCatalogForRoom(roomId = "") {
      portalCatalogSetRoomContext(roomId);
      navigatePortal("catalog");
    }

    function portalCatalogSyncContextUI() {
      const valid = portalCatalogValidPreferredRoomId(portalCatalogPreferredRoomId || portalCatalogLoadPreferredRoomId());
      portalCatalogPreferredRoomId = valid;
      const room = portalCatalogRoom(valid);
      const context = document.getElementById("catalogRoomContext");
      const name = document.getElementById("catalogRoomContextName");
      const meta = document.getElementById("catalogRoomContextMeta");
      const select = document.getElementById("catalogRoomContextSelect");
      const importButton = document.getElementById("catalogDemoImportButton");
      if (context) context.dataset.empty = String(!room);
      if (name) name.textContent = room ? room.name : "Esplorazione senza stanza";
      if (meta) meta.textContent = room
        ? `${portalDashboardRoleLabels[room.role] || "Partecipante"} · ${room.lastActivity} · il percorso sarà importato qui.`
        : "Puoi cercare e salvare materiali; scegli una stanza prima dell’importazione.";
      if (select) {
        select.innerHTML = portalCatalogRoomOptions(valid);
        select.value = valid;
      }
      if (importButton) {
        importButton.textContent = room ? `Importa in ${room.name}` : "Scegli una stanza per importare";
      }
    }

    function portalCatalogLoadRoomImports() {
      try {
        const parsed = JSON.parse(localStorage.getItem(portalCatalogRoomImportsStorageKey) || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }

    function portalCatalogSaveRoomImports(imports) {
      try {
        localStorage.setItem(portalCatalogRoomImportsStorageKey, JSON.stringify(imports));
      } catch {
        // Lo stato della sessione corrente continua a funzionare.
      }
    }
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Anchor {label!r} expected once, found {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def update_html(html: str) -> str:
    if MARKER in html:
        return html

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD REALE — USCITA E CANCELLAZIONE 1.2.0-alpha.4",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — USCITA E CANCELLAZIONE 1.2.0-alpha.4",
        "leave/delete CSS marker",
    )

    old_banner = '''        <section class="portal-study-banner">
          <div class="portal-feature-icon">✦</div>
          <div>
            <div class="portal-eyebrow">Nuovo percorso</div>
            <h2>Cosa vuoi studiare?</h2>
            <p>
              Esplora i materiali e crea con Eve una sequenza ordinata da aggiungere alla tua aula.
            </p>
          </div>
          <button class="portal-button primary large" type="button" onclick="portalOpenCatalog()">
            Apri il Catalogo →
          </button>
        </section>
'''
    html = replace_once(html, old_banner, DASHBOARD_BANNER, "dashboard catalog banner")

    html = replace_once(
        html,
        '        <div class="catalog-demo-layout">',
        CATALOG_CONTEXT + '\n        <div class="catalog-demo-layout">',
        "catalog layout",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD — USCITA E CANCELLAZIONE LOCALI",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD — USCITA E CANCELLAZIONE LOCALI",
        "leave/delete JS marker",
    )

    html = replace_once(
        html,
        '''            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>
            <button class="portal-room-manage-button" type="button" onclick="portalDashboardOpenRoomManage('${portalDashboardEscape(room.id)}', this)">Gestisci</button>''',
        '''            <button class="portal-room-catalog-button" type="button" onclick="portalDashboardOpenCatalogForRoom('${portalDashboardEscape(room.id)}')">Catalogo</button>
            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>
            <button class="portal-room-manage-button" type="button" onclick="portalDashboardOpenRoomManage('${portalDashboardEscape(room.id)}', this)">Gestisci</button>''',
        "room catalog action",
    )

    html = replace_once(
        html,
        '<button class="action-button" type="button" onclick="navigatePortal(\'catalog\')">\n          <span>▤</span><span class="label">Catalogo</span>\n        </button>',
        '<button class="action-button" type="button" onclick="portalDashboardOpenCatalogForRoom(\'python-room\')">\n          <span>▤</span><span class="label">Catalogo</span>\n        </button>',
        "aula catalog action",
    )

    html = replace_once(
        html,
        '      portalDashboardRenderRooms();\n      portalDashboardSetWorking("", false);',
        '      portalDashboardRenderRooms();\n      portalDashboardCatalogSync();\n      portalDashboardSetWorking("", false);',
        "dashboard init catalog sync",
    )

    html = replace_once(
        html,
        '      if (elements.importButton) elements.importButton.disabled = selected.length === 0;',
        '      if (elements.importButton) elements.importButton.disabled = selected.length === 0 || !portalCatalogRoom(portalCatalogPreferredRoomId);\n      portalCatalogSyncContextUI();',
        "catalog path button state",
    )

    import_pattern = re.compile(
        r"    function catalogDemoImportPath\(\) \{.*?\n    \}\n\n    function catalogDemoInit",
        re.DOTALL,
    )
    import_replacement = '''    function catalogDemoImportPath() {
      const selected = catalogDemoMaterials.filter((material) => catalogDemoState.selected.has(material.id));
      const room = portalCatalogRoom(portalCatalogPreferredRoomId);
      const elements = catalogDemoElements();
      if (!selected.length) return;
      if (!room) {
        if (elements.status) elements.status.textContent = "Scegli una stanza di destinazione prima di importare il percorso.";
        portalNotify("Seleziona una stanza per importare");
        document.getElementById("catalogRoomContextSelect")?.focus();
        return;
      }
      const signature = selected.map((material) => material.id).sort().join("|");
      const imports = portalCatalogLoadRoomImports();
      if (imports[room.id] === signature) {
        if (elements.status) elements.status.textContent = `Questo percorso è già presente in “${room.name}”: nessun duplicato creato.`;
        portalNotify(`Percorso già presente in ${room.name}`);
        return;
      }
      imports[room.id] = signature;
      portalCatalogSaveRoomImports(imports);
      catalogDemoState.importedSignature = `${room.id}:${signature}`;
      if (elements.status) elements.status.textContent = `Percorso importato in “${room.name}”: ${selected.length} materiali, un corso e una checklist simulati.`;
      portalNotify(`Percorso importato in ${room.name}`);
    }

    function catalogDemoInit'''
    html, count = import_pattern.subn(import_replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Catalog import function expected once, found {count}")

    html = replace_once(
        html,
        '      catalogDemoRender();\n    }\n\n\n    /* ==========================================================\n       NAVIGAZIONE INTERNA',
        '      catalogDemoRender();\n      portalCatalogSyncContextUI();\n    }\n\n\n    /* ==========================================================\n       NAVIGAZIONE INTERNA',
        "catalog init context sync",
    )

    html = replace_once(
        html,
        '    function portalOpenCatalog() {\n      navigatePortal("catalog");\n    }',
        '    function portalOpenCatalog() {\n      portalDashboardOpenCatalogForRoom(portalCatalogPreferredRoomId || portalCatalogLoadPreferredRoomId());\n    }',
        "legacy catalog opener",
    )

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalDashboardCatalogRoom"',
        'id="catalogRoomContext"',
        'id="catalogRoomContextSelect"',
        "function portalDashboardOpenCatalogForRoom(",
        "function portalCatalogSetRoomContext(",
        "function portalCatalogLoadRoomImports(",
        "portal-room-catalog-button",
        "Scegli una stanza di destinazione",
        "portalCatalogRoomImportsStorageKey",
        "preferredRoomId",
    ]
    for marker in required:
        if marker not in html:
            raise RuntimeError(f"Missing marker: {marker}")
    ids = [value for value in re.findall(r'\bid=["\']([^"\']+)["\']', html) if "${" not in value]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if duplicates:
        raise RuntimeError(f"Duplicate IDs: {duplicates}")
    if html.count("<script") != html.count("</script>"):
        raise RuntimeError("Unbalanced script tags")
    if html.count("<style") != html.count("</style>"):
        raise RuntimeError("Unbalanced style tags")
    if not html.rstrip().endswith("</html>"):
        raise RuntimeError("Missing closing html tag")


def update_docs(html: str) -> None:
    data = html.encode("utf-8")
    size = len(data)
    lines = html.count("\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob = git_blob_sha(data)

    readme = README_PATH.read_text(encoding="utf-8")
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: collegamento contestuale Dashboard → Catalogo.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — collegamento contestuale al Catalogo\n\n- Trasformato il banner Catalogo in un ingresso principale con scelta della stanza.\n- Aggiunto il pulsante `Catalogo` su ogni scheda stanza.\n- Aggiunto il contesto stanza nell'header del Catalogo.\n- Aggiunto cambio destinazione direttamente dal Catalogo.\n- Il pulsante importazione mostra la stanza selezionata.\n- L'importazione idempotente è ora separata per stanza.\n- Aggiunta modalità esplorazione senza stanza, con importazione disabilitata e messaggio esplicito.\n- Il Catalogo aperto dall'Aula conserva il contesto della stanza Python.\n- Conservati create/join, presenza, inviti, gestione stanza, Eve, chat e audio.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.4]", entry + "## [1.2.0-alpha.4]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Collegamento Dashboard Catalogo"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- Catalogo come CTA principale Dashboard;\n- scelta stanza prima dell'apertura;\n- accesso Catalogo da ogni stanza;\n- contesto stanza visibile e modificabile;\n- importazione disabilitata senza stanza;\n- idempotenza separata per stanza;\n- persistenza locale della destinazione;\n- accesso contestuale dall'Aula.\n\nDa verificare manualmente:\n\n- selezione stanza nel banner;\n- pulsante Catalogo su ogni scheda;\n- cambio stanza nel Catalogo;\n- importazione in due stanze diverse;\n- seconda importazione idempotente;\n- esplorazione senza stanza;\n- persistenza dopo refresh;\n- mobile e tastiera.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Collegamento contestuale Dashboard → Catalogo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} riproduce il parametro `roomId` della route Catalogo dell'app ufficiale mediante `portalCatalogPreferredRoomId` e `localStorage` (`aula-demo-catalog-room-context-v1`). La destinazione viene impostata dal banner Dashboard, dalla scheda stanza o dall'Aula.\n\nLe firme di importazione sono salvate per stanza in `aula-demo-catalog-room-imports-v1`, così lo stesso percorso può essere importato in stanze diverse ma non duplicato nella stessa. Nell'app ufficiale membership, autorizzazione e importazione restano server-side.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: uscita/cancellazione | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.4 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: uscita/cancellazione | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.4. |",
    )
    row = f"| Fase 2 | Dashboard: collegamento Catalogo | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: collegamento Catalogo |" not in approvals:
        approvals = approvals.replace(
            "| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |",
            row + "\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |",
            1,
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
