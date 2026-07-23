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

VERSION = "1.2.0-alpha.6"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */

    .portal-dashboard-state[hidden] {
      display: none !important;
    }

    .portal-dashboard-state {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 14px;
      align-items: center;
      margin: 14px 0 4px;
      padding: 14px;
      border: 1px solid rgba(255,176,91,0.24);
      border-radius: 16px;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgba(255,176,91,0.075), transparent 62%),
        rgba(255,255,255,0.018);
    }

    .portal-dashboard-state[data-state="unauthorized"],
    .portal-dashboard-state[data-state="invalid-code"] {
      border-color: rgba(255,108,121,0.28);
      background:
        linear-gradient(90deg, rgba(255,92,105,0.075), transparent 62%),
        rgba(255,255,255,0.018);
    }

    .portal-dashboard-state[data-state="recovered"] {
      border-color: rgba(82,232,176,0.25);
      background:
        linear-gradient(90deg, rgba(82,232,176,0.07), transparent 62%),
        rgba(255,255,255,0.018);
    }

    .portal-dashboard-state-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid currentColor;
      border-radius: 13px;
      color: #ffd7a7;
      background: rgba(255,176,91,0.055);
      font-size: 17px;
      font-weight: 900;
    }

    .portal-dashboard-state[data-state="unauthorized"] .portal-dashboard-state-icon,
    .portal-dashboard-state[data-state="invalid-code"] .portal-dashboard-state-icon {
      color: #ffb7bf;
      background: rgba(255,92,105,0.06);
    }

    .portal-dashboard-state[data-state="recovered"] .portal-dashboard-state-icon {
      color: #91f7d3;
      background: rgba(82,232,176,0.055);
    }

    .portal-dashboard-state-copy {
      min-width: 0;
    }

    .portal-dashboard-state-copy strong,
    .portal-dashboard-state-copy span,
    .portal-dashboard-state-copy small {
      display: block;
    }

    .portal-dashboard-state-copy strong {
      font-size: 12px;
    }

    .portal-dashboard-state-copy span {
      margin-top: 4px;
      color: var(--muted);
      font-size: 10px;
      line-height: 1.5;
    }

    .portal-dashboard-state-copy small {
      margin-top: 5px;
      color: color-mix(in srgb, var(--muted) 84%, transparent);
      font-size: 8px;
      font-weight: 760;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .portal-dashboard-state-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 7px;
    }

    .portal-dashboard-state-actions button {
      min-height: 36px;
      padding: 0 11px;
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-size: 9px;
      font-weight: 800;
      cursor: pointer;
    }

    .portal-dashboard-state-actions .primary {
      color: #eaffff;
      border-color: rgba(125,235,255,0.25);
      background: rgba(0,223,242,0.07);
    }

    .portal-dashboard-state-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .portal-dashboard-test-codes {
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 8px;
      line-height: 1.55;
    }

    .portal-dashboard-test-codes code {
      display: inline-block;
      margin: 2px 2px 0 0;
      padding: 2px 5px;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--green-2);
      background: rgba(0,223,242,0.04);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 8px;
    }

    .portal-room-loading-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      grid-column: 1 / -1;
    }

    .portal-room-loading-card {
      min-height: 216px;
      padding: 18px;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: rgba(255,255,255,0.018);
    }

    .portal-room-loading-line,
    .portal-room-loading-circle {
      position: relative;
      overflow: hidden;
      background: rgba(125,235,255,0.08);
    }

    .portal-room-loading-line::after,
    .portal-room-loading-circle::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-110%);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      animation: portal-dashboard-shimmer 1.1s ease-in-out infinite;
    }

    .portal-room-loading-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
    }

    .portal-room-loading-line {
      height: 9px;
      margin-top: 13px;
      border-radius: 999px;
    }

    .portal-room-loading-line.wide { width: 78%; margin-top: 34px; }
    .portal-room-loading-line.medium { width: 58%; }
    .portal-room-loading-line.short { width: 38%; }

    @keyframes portal-dashboard-shimmer {
      to { transform: translateX(110%); }
    }

    .portal-dashboard[data-loading="true"] .portal-create-grid,
    .portal-dashboard[data-loading="true"] .portal-study-banner {
      opacity: 0.58;
      pointer-events: none;
    }

    @media (max-width: 900px) {
      .portal-room-loading-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 620px) {
      .portal-dashboard-state {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .portal-dashboard-state-actions {
        grid-column: 1 / -1;
        justify-content: stretch;
      }

      .portal-dashboard-state-actions button {
        flex: 1;
      }

      .portal-room-loading-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .portal-room-loading-line::after,
      .portal-room-loading-circle::after {
        animation: none !important;
      }
    }
'''

STATE_HTML = r'''

        <section class="portal-dashboard-state" id="portalDashboardStatePanel" data-state="" role="alert" aria-live="assertive" hidden>
          <span class="portal-dashboard-state-icon" id="portalDashboardStateIcon" aria-hidden="true">!</span>
          <div class="portal-dashboard-state-copy">
            <strong id="portalDashboardStateTitle">Operazione non completata</strong>
            <span id="portalDashboardStateText"></span>
            <small id="portalDashboardStateCode"></small>
          </div>
          <div class="portal-dashboard-state-actions">
            <button class="primary" id="portalDashboardRetryButton" type="button" onclick="portalDashboardRetryLastAction()" hidden>Riprova</button>
            <button id="portalDashboardDismissButton" type="button" onclick="portalDashboardDismissState()">Chiudi</button>
          </div>
        </section>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */

    const portalDashboardDemoErrorCodes = {
      ARCHIVIATA26: "archived",
      NEGATO2026: "unauthorized",
      OFFLINE2026: "temporary"
    };

    function portalDashboardStateElements() {
      return {
        panel: document.getElementById("portalDashboardStatePanel"),
        icon: document.getElementById("portalDashboardStateIcon"),
        title: document.getElementById("portalDashboardStateTitle"),
        text: document.getElementById("portalDashboardStateText"),
        code: document.getElementById("portalDashboardStateCode"),
        retry: document.getElementById("portalDashboardRetryButton"),
        dismiss: document.getElementById("portalDashboardDismissButton")
      };
    }

    function portalDashboardShowState(state, title, text, options = {}) {
      const elements = portalDashboardStateElements();
      if (!elements.panel) return;
      const icons = {
        archived: "▣",
        unauthorized: "⊘",
        "invalid-code": "×",
        temporary: "↻",
        storage: "!",
        recovered: "✓"
      };
      elements.panel.hidden = false;
      elements.panel.dataset.state = state;
      if (elements.icon) elements.icon.textContent = icons[state] || "!";
      if (elements.title) elements.title.textContent = title;
      if (elements.text) elements.text.textContent = text;
      if (elements.code) elements.code.textContent = options.code ? `Riferimento demo: ${options.code}` : "";
      if (elements.retry) {
        elements.retry.hidden = !options.retry;
        elements.retry.disabled = false;
        elements.retry.textContent = options.retryLabel || "Riprova";
      }
      if (elements.dismiss) elements.dismiss.disabled = false;
      portalDashboardState.retryAction = options.retryAction || null;
      if (options.focus !== false) window.setTimeout(() => (options.retry ? elements.retry : elements.dismiss)?.focus(), 20);
    }

    function portalDashboardDismissState(options = {}) {
      const elements = portalDashboardStateElements();
      if (!elements.panel) return;
      elements.panel.hidden = true;
      elements.panel.dataset.state = "";
      portalDashboardState.retryAction = null;
      if (options.focusInput) document.getElementById(options.focusInput)?.focus();
    }

    function portalDashboardSetLoading(loading, message = "Caricamento delle stanze…") {
      const dashboard = document.getElementById("portalDashboard");
      const grid = document.getElementById("portalRoomGrid");
      const count = document.getElementById("portalRoomCount");
      const controls = document.querySelectorAll("#portalDashboard input, #portalDashboard select, #portalDashboard button");
      portalDashboardState.loading = Boolean(loading);
      if (dashboard) {
        dashboard.dataset.loading = String(Boolean(loading));
        dashboard.setAttribute("aria-busy", String(Boolean(loading)));
      }
      controls.forEach((control) => {
        if (control.id === "portalDashboardDismissButton") return;
        control.disabled = Boolean(loading);
      });
      if (loading && grid) {
        grid.innerHTML = `<div class="portal-room-loading-grid" aria-label="${portalDashboardEscape(message)}">
          ${[1, 2, 3].map(() => `<div class="portal-room-loading-card" aria-hidden="true"><div class="portal-room-loading-circle"></div><div class="portal-room-loading-line wide"></div><div class="portal-room-loading-line medium"></div><div class="portal-room-loading-line short"></div></div>`).join("")}
        </div>`;
      }
      if (loading && count) count.textContent = "Caricamento…";
      if (!loading) controls.forEach((control) => { control.disabled = false; });
    }

    function portalDashboardSafeLoadRooms() {
      try {
        const storedRaw = localStorage.getItem(portalDashboardRoomsStorageKey);
        if (storedRaw === null) {
          portalDashboardState.rooms = portalDashboardDefaultRooms.map((room) => ({ ...room }));
          return { ok: true, restored: false };
        }
        let stored;
        try {
          stored = JSON.parse(storedRaw);
        } catch {
          portalDashboardState.rooms = portalDashboardDefaultRooms.map((room) => ({ ...room }));
          return { ok: false, reason: "invalid-json" };
        }
        portalDashboardState.rooms = Array.isArray(stored)
          ? stored.map(portalDashboardNormalizeRoom).filter(Boolean)
          : portalDashboardDefaultRooms.map((room) => ({ ...room }));
        return { ok: Array.isArray(stored), restored: true };
      } catch {
        portalDashboardState.rooms = portalDashboardDefaultRooms.map((room) => ({ ...room }));
        return { ok: false, reason: "storage-blocked" };
      }
    }

    function portalDashboardHandleDemoJoinError(code, input) {
      const state = portalDashboardDemoErrorCodes[code];
      if (!state) return false;
      portalDashboardSetWorking("join", false);
      if (state === "archived") {
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Questa stanza è stata archiviata e non accetta più ingressi.", "error");
        portalDashboardFeedback("Ingresso bloccato: la stanza non è più attiva.", "error");
        portalDashboardShowState(
          "archived",
          "Stanza archiviata",
          "Il proprietario ha chiuso questa stanza. Il codice è stato revocato e non può essere usato per un nuovo ingresso.",
          { code, focus: false }
        );
      } else if (state === "unauthorized") {
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Non hai l’autorizzazione necessaria per questa stanza.", "error");
        portalDashboardFeedback("Accesso negato: la membership non risulta attiva.", "error");
        portalDashboardShowState(
          "unauthorized",
          "Accesso non autorizzato",
          "La stanza esiste, ma questo account non dispone di una membership attiva. Nessun contenuto è stato mostrato.",
          { code, focus: false }
        );
      } else {
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Il servizio non è raggiungibile. Puoi riprovare senza reinserire il codice.", "error");
        portalDashboardFeedback("Errore temporaneo durante la verifica dell’invito.", "error");
        portalDashboardShowState(
          "temporary",
          "Connessione temporaneamente non disponibile",
          "La richiesta non è stata completata e non ha creato una membership parziale. Riprova quando sei pronto.",
          { code, retry: true, retryLabel: "Riprova accesso", retryAction: { kind: "recover-join", code }, focus: false }
        );
      }
      input?.focus();
      return true;
    }

    async function portalDashboardRetryLastAction() {
      const action = portalDashboardState.retryAction;
      const elements = portalDashboardStateElements();
      if (!action || portalDashboardState.working || portalDashboardState.loading) return;
      if (elements.retry) {
        elements.retry.disabled = true;
        elements.retry.textContent = "Nuovo tentativo…";
      }
      if (elements.dismiss) elements.dismiss.disabled = true;
      portalDashboardSetWorking("join", true);
      await new Promise((resolve) => window.setTimeout(resolve, 620));

      if (action.kind === "recover-join") {
        const existing = portalDashboardState.rooms.find((room) => room.id === "recovery-room");
        if (!existing) {
          portalDashboardState.rooms.unshift({
            id: "recovery-room",
            name: "Stanza di prova ripristinata",
            inviteCode: "OFFLINE2026",
            role: "member",
            online: 2,
            lastActivity: "Adesso · Connessione ripristinata",
            createdAt: Date.now()
          });
          portalDashboardSaveRooms();
        }
        portalDashboardRenderRooms();
        portalDashboardCatalogSync();
        portalDashboardSetWorking("join", false);
        const input = document.getElementById("portalInviteCode");
        if (input) input.value = "";
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Connessione ripristinata. La stanza è stata aggiunta senza duplicati.");
        portalDashboardFeedback("Nuovo tentativo riuscito: ingresso completato.", "success");
        portalDashboardShowState(
          "recovered",
          "Connessione ripristinata",
          "Il secondo tentativo è riuscito. La stanza è stata aggiunta una sola volta alla Scrivania.",
          { code: action.code, focus: false }
        );
        portalNotify("Accesso completato dopo il nuovo tentativo");
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
        "    /* ==========================================================\n       DASHBOARD REALE — COLLEGAMENTO CATALOGO 1.2.0-alpha.5",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — COLLEGAMENTO CATALOGO 1.2.0-alpha.5",
        "catalog link CSS marker",
    )

    html = replace_once(
        html,
        '        <div class="portal-dashboard-feedback" id="portalDashboardFeedback" role="status" aria-live="polite"></div>',
        '        <div class="portal-dashboard-feedback" id="portalDashboardFeedback" role="status" aria-live="polite"></div>' + STATE_HTML,
        "dashboard feedback",
    )

    html = replace_once(
        html,
        '<p class="portal-form-help" id="portalJoinRoomHelp">Il codice non distingue maiuscole e minuscole.</p>',
        '<p class="portal-form-help" id="portalJoinRoomHelp">Il codice non distingue maiuscole e minuscole.</p>\n            <p class="portal-dashboard-test-codes">Stati demo: <code>ARCHIVIATA26</code> <code>NEGATO2026</code> <code>OFFLINE2026</code></p>',
        "join helper",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD — COLLEGAMENTO CONTESTUALE AL CATALOGO",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD — COLLEGAMENTO CONTESTUALE AL CATALOGO",
        "catalog link JS marker",
    )

    html = replace_once(
        html,
        '      portalDashboardFeedback();\n      if (name.length < 3) {',
        '      portalDashboardFeedback();\n      portalDashboardDismissState();\n      if (name.length < 3) {',
        "create clears state",
    )

    html = replace_once(
        html,
        '      portalDashboardFeedback();\n      if (code.length < 8) {',
        '      portalDashboardFeedback();\n      portalDashboardDismissState();\n      if (code.length < 8) {',
        "join clears state",
    )

    html = replace_once(
        html,
        '      await new Promise((resolve) => window.setTimeout(resolve, 420));\n      const localRoom = portalDashboardState.rooms.find((room) => room.inviteCode === code);',
        '      await new Promise((resolve) => window.setTimeout(resolve, 420));\n      if (portalDashboardHandleDemoJoinError(code, input)) return;\n      const localRoom = portalDashboardState.rooms.find((room) => room.inviteCode === code);',
        "join demo states",
    )

    html = replace_once(
        html,
        '        portalDashboardFeedback("Non è stato possibile entrare: il codice non corrisponde a una stanza attiva.", "error");\n        input?.focus();',
        '        portalDashboardFeedback("Non è stato possibile entrare: il codice non corrisponde a una stanza attiva.", "error");\n        portalDashboardShowState("invalid-code", "Codice non valido", "Il codice non corrisponde a una stanza attiva oppure è stato revocato. Nessuna stanza è stata aggiunta.", { code, focus: false });\n        input?.focus();',
        "invalid code state",
    )

    load_pattern = re.compile(
        r"    function portalDashboardLoadRooms\(\) \{.*?\n    \}\n\n    function portalDashboardSaveRooms",
        re.DOTALL,
    )
    load_replacement = '''    function portalDashboardLoadRooms() {
      return portalDashboardSafeLoadRooms();
    }

    function portalDashboardSaveRooms'''
    html, count = load_pattern.subn(load_replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Load rooms function expected once, found {count}")

    init_pattern = re.compile(
        r"    function portalDashboardInit\(\) \{.*?\n    \}\n\n\n    /\* ==========================================================\n       CATALOGO INTELLIGENTE",
        re.DOTALL,
    )
    init_replacement = '''    async function portalDashboardInit() {
      if (!document.getElementById("portalDashboard")) return;
      if (!portalDashboardState.initialized) {
        portalDashboardState.initialized = true;
        portalDashboardSetLoading(true);
        await new Promise((resolve) => window.setTimeout(resolve, 460));
        const loadResult = portalDashboardLoadRooms();
        portalDashboardSetLoading(false);
        if (!loadResult?.ok) {
          const storageBlocked = loadResult?.reason === "storage-blocked";
          portalDashboardShowState(
            "storage",
            storageBlocked ? "Salvataggio locale non disponibile" : "Dati locali ripristinati",
            storageBlocked
              ? "Il browser ha bloccato lo spazio locale. La demo resta utilizzabile, ma le modifiche potrebbero non restare dopo la chiusura."
              : "Il salvataggio precedente non era leggibile. È stata caricata una copia sicura delle stanze iniziali.",
            { focus: false }
          );
        }
      }
      portalDashboardRenderRooms();
      portalDashboardCatalogSync();
      portalDashboardSetWorking("", false);
    }


    /* ==========================================================
       CATALOGO INTELLIGENTE'''
    html, count = init_pattern.subn(init_replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Dashboard init expected once, found {count}")

    html = replace_once(
        html,
        '    const portalDashboardState = {\n      initialized: false,\n      working: null,\n      rooms: []\n    };',
        '    const portalDashboardState = {\n      initialized: false,\n      working: null,\n      loading: false,\n      retryAction: null,\n      rooms: []\n    };',
        "dashboard state object",
    )

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalDashboardStatePanel"',
        'id="portalDashboardRetryButton"',
        "function portalDashboardShowState(",
        "function portalDashboardRetryLastAction(",
        "function portalDashboardSafeLoadRooms(",
        "portalDashboardHandleDemoJoinError",
        "ARCHIVIATA26",
        "NEGATO2026",
        "OFFLINE2026",
        'aria-busy',
        "portal-room-loading-card",
        "invalid-code",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: stati di errore della Dashboard.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — stati di errore e recupero\n\n- Aggiunto caricamento iniziale con schede scheletro e `aria-busy`.\n- Aggiunto stato dedicato per codice errato o revocato.\n- Aggiunto stato stanza archiviata tramite codice demo `ARCHIVIATA26`.\n- Aggiunto accesso non autorizzato tramite codice demo `NEGATO2026`.\n- Aggiunto errore temporaneo recuperabile tramite `OFFLINE2026`.\n- Il pulsante `Riprova accesso` completa il secondo tentativo senza duplicare la stanza.\n- Aggiunto ripristino sicuro quando il salvataggio locale è illeggibile o bloccato.\n- Aggiunti annunci accessibili, focus controllato e responsive.\n- Conservati create/join, presenza, inviti, gestione stanza, Catalogo, Aula, Eve, chat e audio.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.5]", entry + "## [1.2.0-alpha.5]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Stati di errore Dashboard"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- caricamento iniziale accessibile;\n- codice errato/revocato;\n- stanza archiviata;\n- accesso non autorizzato;\n- errore temporaneo;\n- retry idempotente;\n- fallback storage;\n- feedback e focus accessibili.\n\nCodici demo:\n\n- `ARCHIVIATA26`;\n- `NEGATO2026`;\n- `OFFLINE2026`.\n\nDa verificare manualmente:\n\n- scheletri al primo ingresso;\n- messaggio per codice generico errato;\n- tre codici demo;\n- secondo tentativo riuscito;\n- nessun duplicato dopo un altro retry;\n- chiusura degli avvisi;\n- create/join normali dopo gli errori;\n- mobile e tastiera.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Stati di errore della Dashboard demo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} rappresenta gli effetti utente delle risposte RPC e dei controlli membership senza simulare un backend. `ARCHIVIATA26`, `NEGATO2026` e `OFFLINE2026` attivano rispettivamente stanza archiviata, accesso negato ed errore temporaneo.\n\nIl retry dell'errore temporaneo è deterministico e idempotente: aggiunge `recovery-room` una sola volta. Il caricamento iniziale espone `aria-busy`; gli errori di `localStorage` usano una copia sicura delle stanze predefinite e dichiarano la possibile mancata persistenza.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: collegamento Catalogo | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.5 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: collegamento Catalogo | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.5. |",
    )
    row = f"| Fase 2 | Dashboard: stati di errore | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: stati di errore |" not in approvals:
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
