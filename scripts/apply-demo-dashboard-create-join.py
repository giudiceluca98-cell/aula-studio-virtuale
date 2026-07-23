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

VERSION = "1.2.0-alpha.1"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — CREATE E JOIN 1.2.0-alpha.1"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — CREATE E JOIN 1.2.0-alpha.1
       ========================================================== */

    .portal-dashboard-feedback {
      min-height: 0;
      margin-top: 16px;
      padding: 0;
      border: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
    }

    .portal-dashboard-feedback:not(:empty) {
      min-height: 42px;
      padding: 12px 14px;
      border: 1px solid rgba(125,235,255,0.17);
      border-radius: 12px;
      background: rgba(0,223,242,0.045);
    }

    .portal-dashboard-feedback[data-tone="error"] {
      color: #ffacb4;
      border-color: rgba(255,118,128,0.24);
      background: rgba(255,92,105,0.055);
    }

    .portal-dashboard-feedback[data-tone="success"] {
      color: #91f7d3;
      border-color: rgba(82,232,176,0.22);
      background: rgba(82,232,176,0.05);
    }

    .portal-room-card {
      text-align: left;
    }

    .portal-room-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }

    .portal-room-card-meta span {
      padding: 4px 7px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255,255,255,0.025);
      font-size: 8px;
      font-weight: 760;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    .portal-room-card-meta .role-owner {
      color: #8df7d1;
      border-color: rgba(82,232,176,0.20);
      background: rgba(82,232,176,0.045);
    }

    .portal-room-card-meta .role-member {
      color: #c7c8ff;
      border-color: rgba(122,124,255,0.20);
      background: rgba(122,124,255,0.055);
    }

    .portal-room-empty {
      grid-column: 1 / -1;
      padding: 34px 20px;
      border: 1px dashed var(--line);
      border-radius: 18px;
      color: var(--muted);
      background: rgba(255,255,255,0.018);
      text-align: center;
    }

    .portal-dashboard-panel form,
    form.portal-dashboard-panel {
      margin: 0;
    }

    .portal-input[aria-invalid="true"] {
      border-color: rgba(255,118,128,0.50);
      box-shadow: 0 0 0 3px rgba(255,92,105,0.07);
    }

    .portal-form-help {
      min-height: 18px;
      margin-top: 8px !important;
      color: var(--muted);
      font-size: 9px !important;
      line-height: 1.45;
    }

    .portal-form-help[data-tone="error"] {
      color: #ffacb4;
    }

    .portal-button[data-working="true"] {
      opacity: 0.70;
      pointer-events: none;
    }

    .portal-button[data-working="true"]::before {
      content: "";
      width: 12px;
      height: 12px;
      display: inline-block;
      margin-right: 7px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      vertical-align: -2px;
      animation: portal-dashboard-spin 700ms linear infinite;
    }

    @keyframes portal-dashboard-spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .portal-button[data-working="true"]::before {
        animation: none;
      }
    }
'''

ROOM_SECTION = r'''
        <div class="portal-room-section-title">
          <h2>Le tue stanze</h2>
          <span class="portal-status" id="portalRoomCount">0 attive</span>
        </div>

        <div class="portal-room-grid" id="portalRoomGrid" aria-live="polite"></div>

        <div class="portal-dashboard-feedback" id="portalDashboardFeedback" role="status" aria-live="polite"></div>

        <div class="portal-create-grid">
          <form class="portal-dashboard-panel" id="portalCreateRoomForm" onsubmit="portalDashboardCreateRoom(event)" novalidate>
            <div class="portal-room-icon">＋</div>
            <h3>Crea una stanza</h3>
            <p>
              Assegna un nome al nuovo spazio. La demo genera un codice privato
              e salva la stanza soltanto in questo browser.
            </p>
            <div class="portal-input-row">
              <input class="portal-input" id="portalRoomName" name="roomName" type="text" minlength="3" maxlength="60" autocomplete="off" placeholder="Es. Preparazione esame" aria-describedby="portalCreateRoomHelp">
              <button class="portal-button primary" id="portalCreateRoomButton" type="submit">Crea</button>
            </div>
            <p class="portal-form-help" id="portalCreateRoomHelp">Da 3 a 60 caratteri. Gli spazi iniziali e finali vengono rimossi.</p>
          </form>

          <form class="portal-dashboard-panel" id="portalJoinRoomForm" onsubmit="portalDashboardJoinRoom(event)" novalidate>
            <div class="portal-room-icon">⌑</div>
            <h3>Entra con un invito</h3>
            <p>
              Inserisci il codice ricevuto da chi ha creato la stanza. Per provare il flusso
              usa <strong>STUDY2026</strong> oppure <strong>MATEMATICA24</strong>.
            </p>
            <div class="portal-input-row">
              <input class="portal-input" id="portalInviteCode" name="inviteCode" type="text" minlength="8" maxlength="64" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODICE INVITO" aria-describedby="portalJoinRoomHelp">
              <button class="portal-button" id="portalJoinRoomButton" type="submit">Entra</button>
            </div>
            <p class="portal-form-help" id="portalJoinRoomHelp">Il codice non distingue maiuscole e minuscole.</p>
          </form>
        </div>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD REALE — CREATE E JOIN DETERMINISTICI
       ========================================================== */

    const portalDashboardRoomsStorageKey = "aula-demo-dashboard-rooms-v1";
    const portalDashboardDefaultRooms = [
      {
        id: "python-room",
        name: "Programmazione in Python",
        inviteCode: "98133618C9E8D6CE37",
        role: "owner",
        online: 2,
        lastActivity: "Oggi · Lezione 0.1",
        createdAt: 1763892000000
      }
    ];

    const portalDashboardInvites = {
      STUDY2026: {
        id: "study-method-room",
        name: "Metodo di studio condiviso",
        inviteCode: "STUDY2026",
        role: "member",
        online: 3,
        lastActivity: "Oggi · Sessione focus",
        createdAt: 1764028800000
      },
      MATEMATICA24: {
        id: "math-room",
        name: "Ripasso di matematica",
        inviteCode: "MATEMATICA24",
        role: "member",
        online: 1,
        lastActivity: "Ieri · Equazioni di primo grado",
        createdAt: 1763942400000
      }
    };

    const portalDashboardState = {
      initialized: false,
      working: null,
      rooms: []
    };

    function portalDashboardEscape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function portalDashboardNormalizeRoom(room) {
      if (!room || typeof room !== "object" || !room.id || !room.name || !room.inviteCode) return null;
      return {
        id: String(room.id),
        name: String(room.name).slice(0, 60),
        inviteCode: String(room.inviteCode).toUpperCase().slice(0, 64),
        role: room.role === "owner" ? "owner" : "member",
        online: Math.max(0, Math.min(99, Number(room.online || 0))),
        lastActivity: String(room.lastActivity || "Nessuna attività recente").slice(0, 120),
        createdAt: Number(room.createdAt || Date.now())
      };
    }

    function portalDashboardLoadRooms() {
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem(portalDashboardRoomsStorageKey) || "[]");
      } catch {
        stored = [];
      }
      const normalized = Array.isArray(stored) ? stored.map(portalDashboardNormalizeRoom).filter(Boolean) : [];
      portalDashboardState.rooms = normalized.length
        ? normalized
        : portalDashboardDefaultRooms.map((room) => ({ ...room }));
    }

    function portalDashboardSaveRooms() {
      try {
        localStorage.setItem(portalDashboardRoomsStorageKey, JSON.stringify(portalDashboardState.rooms));
      } catch {
        portalDashboardFeedback("La stanza è disponibile per questa sessione, ma il browser non consente il salvataggio locale.", "error");
      }
    }

    function portalDashboardCodeFromName(name) {
      let hash = 2166136261;
      const source = `${name}-${Date.now()}`;
      for (const character of source) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
      }
      return `AULA${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7)}`;
    }

    function portalDashboardRoomId(name) {
      const slug = name.toLocaleLowerCase("it")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 34) || "stanza";
      return `${slug}-${Date.now().toString(36)}`;
    }

    function portalDashboardFeedback(message = "", tone = "") {
      const node = document.getElementById("portalDashboardFeedback");
      if (!node) return;
      node.textContent = message;
      if (tone) node.dataset.tone = tone;
      else node.removeAttribute("data-tone");
    }

    function portalDashboardFieldFeedback(inputId, helpId, message, tone = "") {
      const input = document.getElementById(inputId);
      const help = document.getElementById(helpId);
      if (input) input.setAttribute("aria-invalid", tone === "error" ? "true" : "false");
      if (help) {
        help.textContent = message;
        if (tone) help.dataset.tone = tone;
        else help.removeAttribute("data-tone");
      }
    }

    function portalDashboardSetWorking(kind, working) {
      portalDashboardState.working = working ? kind : null;
      const createButton = document.getElementById("portalCreateRoomButton");
      const joinButton = document.getElementById("portalJoinRoomButton");
      const inputs = [document.getElementById("portalRoomName"), document.getElementById("portalInviteCode")];
      if (createButton) {
        createButton.disabled = Boolean(portalDashboardState.working);
        createButton.dataset.working = String(working && kind === "create");
        createButton.textContent = working && kind === "create" ? "Creazione…" : "Crea";
      }
      if (joinButton) {
        joinButton.disabled = Boolean(portalDashboardState.working);
        joinButton.dataset.working = String(working && kind === "join");
        joinButton.textContent = working && kind === "join" ? "Accesso…" : "Entra";
      }
      inputs.forEach((input) => { if (input) input.disabled = Boolean(portalDashboardState.working); });
    }

    function portalDashboardRenderRooms() {
      const grid = document.getElementById("portalRoomGrid");
      const count = document.getElementById("portalRoomCount");
      if (!grid) return;
      const rooms = [...portalDashboardState.rooms].sort((a, b) => b.createdAt - a.createdAt);
      if (count) count.textContent = `${rooms.length} ${rooms.length === 1 ? "attiva" : "attive"}`;
      grid.innerHTML = rooms.length
        ? rooms.map((room) => `
            <button class="portal-room-card" type="button" onclick="portalDashboardOpenRoom('${portalDashboardEscape(room.id)}')">
              <div class="portal-room-card-head">
                <span class="portal-room-icon">${room.role === "owner" ? "♧" : "◎"}</span>
                <span aria-hidden="true">→</span>
              </div>
              <h3>${portalDashboardEscape(room.name)}</h3>
              <p>Codice ${portalDashboardEscape(room.inviteCode)}</p>
              <div class="portal-room-card-meta">
                <span class="role-${portalDashboardEscape(room.role)}">${room.role === "owner" ? "Proprietario" : "Partecipante"}</span>
                <span>${room.online} online</span>
                <span>${portalDashboardEscape(room.lastActivity)}</span>
              </div>
            </button>`).join("")
        : `<div class="portal-room-empty"><strong>Nessuna stanza ancora.</strong><br>Crea una stanza oppure entra con un codice di invito.</div>`;
    }

    function portalDashboardOpenRoom(roomId) {
      const room = portalDashboardState.rooms.find((item) => item.id === roomId);
      if (!room) {
        portalDashboardFeedback("La stanza non è più disponibile in questa demo.", "error");
        return;
      }
      portalNotify(`Apertura stanza: ${room.name}`);
      navigatePortal("aula");
    }

    async function portalDashboardCreateRoom(event) {
      event?.preventDefault?.();
      if (portalDashboardState.working) return;
      const input = document.getElementById("portalRoomName");
      const name = String(input?.value || "").trim().replace(/\s+/g, " ");
      portalDashboardFeedback();
      if (name.length < 3) {
        portalDashboardFieldFeedback("portalRoomName", "portalCreateRoomHelp", "Inserisci almeno 3 caratteri.", "error");
        input?.focus();
        return;
      }
      if (name.length > 60) {
        portalDashboardFieldFeedback("portalRoomName", "portalCreateRoomHelp", "Il nome non può superare 60 caratteri.", "error");
        input?.focus();
        return;
      }
      if (portalDashboardState.rooms.some((room) => room.name.toLocaleLowerCase("it") === name.toLocaleLowerCase("it"))) {
        portalDashboardFieldFeedback("portalRoomName", "portalCreateRoomHelp", "Esiste già una stanza con questo nome.", "error");
        input?.focus();
        return;
      }

      portalDashboardFieldFeedback("portalRoomName", "portalCreateRoomHelp", "Creazione della stanza in corso…");
      portalDashboardSetWorking("create", true);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      const room = {
        id: portalDashboardRoomId(name),
        name,
        inviteCode: portalDashboardCodeFromName(name),
        role: "owner",
        online: 1,
        lastActivity: "Adesso · Stanza creata",
        createdAt: Date.now()
      };
      portalDashboardState.rooms.unshift(room);
      portalDashboardSaveRooms();
      portalDashboardRenderRooms();
      if (input) input.value = "";
      portalDashboardFieldFeedback("portalRoomName", "portalCreateRoomHelp", "Da 3 a 60 caratteri. Gli spazi iniziali e finali vengono rimossi.");
      portalDashboardSetWorking("create", false);
      portalDashboardFeedback(`Stanza “${name}” creata. Codice invito: ${room.inviteCode}`, "success");
      portalNotify("Stanza creata nella demo");
    }

    async function portalDashboardJoinRoom(event) {
      event?.preventDefault?.();
      if (portalDashboardState.working) return;
      const input = document.getElementById("portalInviteCode");
      const code = String(input?.value || "").trim().toUpperCase().replace(/\s+/g, "");
      portalDashboardFeedback();
      if (code.length < 8) {
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Il codice deve contenere almeno 8 caratteri.", "error");
        input?.focus();
        return;
      }

      portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Verifica del codice in corso…");
      portalDashboardSetWorking("join", true);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      const invitedRoom = portalDashboardInvites[code];
      if (!invitedRoom) {
        portalDashboardSetWorking("join", false);
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Codice errato o non più valido. Prova STUDY2026.", "error");
        portalDashboardFeedback("Non è stato possibile entrare: il codice non corrisponde a una stanza attiva.", "error");
        input?.focus();
        return;
      }

      const existing = portalDashboardState.rooms.find((room) => room.id === invitedRoom.id || room.inviteCode === code);
      if (existing) {
        portalDashboardSetWorking("join", false);
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Sei già membro di questa stanza.");
        portalDashboardFeedback(`La stanza “${existing.name}” è già presente nella tua scrivania.`, "success");
        portalDashboardRenderRooms();
        return;
      }

      portalDashboardState.rooms.unshift({ ...invitedRoom, createdAt: Date.now() });
      portalDashboardSaveRooms();
      portalDashboardRenderRooms();
      if (input) input.value = "";
      portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Il codice non distingue maiuscole e minuscole.");
      portalDashboardSetWorking("join", false);
      portalDashboardFeedback(`Ingresso completato nella stanza “${invitedRoom.name}”.`, "success");
      portalNotify("Ingresso nella stanza completato");
    }

    function portalDashboardInit() {
      if (!document.getElementById("portalDashboard")) return;
      if (!portalDashboardState.initialized) {
        portalDashboardState.initialized = true;
        portalDashboardLoadRooms();
      }
      portalDashboardRenderRooms();
      portalDashboardSetWorking("", false);
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
        "    /* ==========================================================\n       CATALOGO INTELLIGENTE — CHECKPOINT 1.1.0-alpha.1",
        CSS + "\n\n    /* ==========================================================\n       CATALOGO INTELLIGENTE — CHECKPOINT 1.1.0-alpha.1",
        "catalog CSS marker",
    )

    old_room_block = '''        <div class="portal-room-section-title">
          <h2>Le tue stanze</h2>
          <span class="portal-status">1 attiva</span>
        </div>

        <div class="portal-room-grid">
          <button class="portal-room-card" type="button" onclick="navigatePortal('aula')">
            <div class="portal-room-card-head">
              <span class="portal-room-icon">♧</span>
              <span>→</span>
            </div>
            <h3>Programmazione in Python</h3>
            <p>Codice 98133618C9E8D6CE37</p>
          </button>
        </div>

        <div class="portal-create-grid">
          <section class="portal-dashboard-panel">
            <div class="portal-room-icon">＋</div>
            <h3>Crea una stanza</h3>
            <p>
              Assegna un nome al nuovo spazio. Nella versione reale verrà generato
              un codice privato da condividere.
            </p>
            <div class="portal-input-row">
              <input class="portal-input" id="portalRoomName" type="text" placeholder="Es. Preparazione esame">
              <button class="portal-button primary" type="button" onclick="portalCreateRoom()">Crea</button>
            </div>
          </section>

          <section class="portal-dashboard-panel">
            <div class="portal-room-icon">⌑</div>
            <h3>Entra con un invito</h3>
            <p>
              Inserisci il codice ricevuto da chi ha creato la stanza per aprire
              lo spazio condiviso.
            </p>
            <div class="portal-input-row">
              <input class="portal-input" id="portalInviteCode" type="text" placeholder="CODICE INVITO">
              <button class="portal-button" type="button" onclick="portalJoinRoom()">Entra</button>
            </div>
          </section>
        </div>
'''
    html = replace_once(html, old_room_block, ROOM_SECTION, "dashboard room and forms")

    html = replace_once(
        html,
        "    /* ==========================================================\n       CATALOGO INTELLIGENTE — DATI E INTERAZIONI DETERMINISTICHE",
        JS + "\n\n    /* ==========================================================\n       CATALOGO INTELLIGENTE — DATI E INTERAZIONI DETERMINISTICHE",
        "catalog JS marker",
    )

    html = replace_once(
        html,
        '      if (normalizedRoute === "catalog") catalogDemoInit();',
        '      if (normalizedRoute === "dashboard") portalDashboardInit();\n      if (normalizedRoute === "catalog") catalogDemoInit();',
        "route initialization",
    )
    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalRoomGrid"',
        'id="portalCreateRoomForm"',
        'id="portalJoinRoomForm"',
        "function portalDashboardCreateRoom(",
        "function portalDashboardJoinRoom(",
        "portalDashboardInit();",
        "STUDY2026",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: Dashboard create/join.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — creazione e ingresso stanza\n\n- Sostituita la stanza statica con un elenco renderizzato da stato demo.\n- Aggiunta creazione stanza con validazione 3–60 caratteri, duplicati e caricamento.\n- Aggiunta generazione del codice invito e persistenza locale privata.\n- Aggiunto ingresso tramite codici demo `STUDY2026` e `MATEMATICA24`.\n- Aggiunti errori per codice corto, errato e stanza già presente.\n- Aggiunti ruolo, partecipanti online e ultima attività nelle schede stanza.\n- Aggiunto invio dei form con Enter e feedback accessibili.\n- Conservato il collegamento principale al Catalogo approvato.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.1.0-alpha.2]", entry + "## [1.1.0-alpha.2]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "# Dashboard reale e gestione stanze"
    addition = f'''\n{marker}\n\n## Create e join\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato nella demo:\n\n- elenco stanze dinamico;\n- creazione con validazione;\n- generazione codice;\n- ingresso tramite invito;\n- loading e feedback;\n- errori codice corto/errato;\n- idempotenza su stanza già presente;\n- persistenza locale privata;\n- ruolo, presenza sintetica e ultima attività.\n\nDa verificare manualmente:\n\n- creazione valida e duplicata;\n- ingresso con `STUDY2026`;\n- codice errato;\n- permanenza dopo ricaricamento;\n- apertura della stanza;\n- mobile e tastiera.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Dashboard create/join nella demo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} riproduce gli effetti utente delle RPC reali `create_study_room` e `join_study_room` usando dati locali e `localStorage` (`aula-demo-dashboard-rooms-v1`). Nell'app ufficiale restano autorevoli autenticazione, RPC, RLS e membership server-side.\n\nFunzioni principali:\n\n- `portalDashboardLoadRooms()` / `portalDashboardSaveRooms()`;\n- `portalDashboardRenderRooms()`;\n- `portalDashboardCreateRoom()`;\n- `portalDashboardJoinRoom()`;\n- `portalDashboardSetWorking()`;\n- `portalDashboardFieldFeedback()`.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: aggiunta URL | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.1.0-alpha.2 pronta da aprire e verificare. |",
        "| Fase 1 | Catalogo: aggiunta URL | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.1.0-alpha.2. |",
    )
    phase2_row = f"| Fase 2 | Dashboard: create/join | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: create/join |" not in approvals:
        approvals = approvals.replace(
            "| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |",
            phase2_row + "\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |",
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
