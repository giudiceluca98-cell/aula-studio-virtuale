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

VERSION = "1.2.0-alpha.2"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — RUOLI E PRESENZA 1.2.0-alpha.2"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — RUOLI E PRESENZA 1.2.0-alpha.2
       ========================================================== */

    .portal-room-card-shell {
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: color-mix(in srgb, var(--surface-strong) 94%, transparent);
      box-shadow: 0 15px 36px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.025);
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }

    .portal-room-card-shell:hover,
    .portal-room-card-shell:focus-within {
      transform: translateY(-2px);
      border-color: rgba(125,235,255,0.28);
      box-shadow: 0 20px 42px rgba(0,0,0,0.21), 0 0 20px rgba(0,223,242,0.05);
    }

    .portal-room-card-shell .portal-room-card {
      width: 100%;
      flex: 1;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    .portal-room-card-shell .portal-room-card:hover {
      transform: none;
      box-shadow: none;
    }

    .portal-room-presence-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 11px 16px 14px;
      border-top: 1px solid var(--line);
      background: rgba(255,255,255,0.014);
    }

    .portal-room-avatar-stack {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    .portal-room-avatar {
      position: relative;
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      margin-left: -6px;
      border: 2px solid var(--surface-strong);
      border-radius: 50%;
      color: #eaffff;
      background: linear-gradient(145deg, rgba(14,104,124,0.96), rgba(75,77,178,0.92));
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.02em;
    }

    .portal-room-avatar:first-child {
      margin-left: 0;
    }

    .portal-room-avatar::after {
      content: "";
      position: absolute;
      right: -1px;
      bottom: -1px;
      width: 8px;
      height: 8px;
      border: 2px solid var(--surface-strong);
      border-radius: 50%;
      background: #68717d;
    }

    .portal-room-avatar[data-status="online"]::after,
    .portal-room-avatar[data-status="studying"]::after {
      background: #52e8b0;
    }

    .portal-room-avatar[data-status="break"]::after {
      background: #f3c969;
    }

    .portal-room-avatar[data-status="away"]::after {
      background: #f0a760;
    }

    .portal-room-avatar[data-status="in_call"]::after {
      background: #9a9cff;
    }

    .portal-room-presence-copy {
      min-width: 0;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.35;
    }

    .portal-room-presence-copy strong {
      display: block;
      overflow: hidden;
      color: var(--ink);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .portal-room-details-button {
      min-height: 34px;
      flex: 0 0 auto;
      padding: 0 10px;
      border: 1px solid rgba(125,235,255,0.18);
      border-radius: 10px;
      color: var(--green-2);
      background: rgba(0,223,242,0.045);
      font-size: 9px;
      font-weight: 780;
      cursor: pointer;
    }

    .portal-presence-dialog[hidden] {
      display: none !important;
    }

    .portal-presence-dialog {
      position: fixed;
      inset: 0;
      z-index: 12100;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(1,7,12,0.74);
      backdrop-filter: blur(12px) saturate(120%);
    }

    .portal-presence-card {
      width: min(760px, 100%);
      max-height: min(88vh, 800px);
      overflow: auto;
      border: 1px solid rgba(125,235,255,0.22);
      border-radius: 24px;
      color: var(--ink);
      background:
        radial-gradient(circle at 0% 0%, rgba(0,223,242,0.10), transparent 38%),
        linear-gradient(180deg, var(--surface-strong), var(--surface));
      box-shadow: 0 34px 110px rgba(0,0,0,0.48), 0 0 38px rgba(0,223,242,0.08);
    }

    .portal-presence-head {
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

    .portal-presence-head h2 {
      margin: 5px 0 6px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(25px, 4vw, 38px);
      font-weight: 500;
      letter-spacing: -0.03em;
    }

    .portal-presence-head p {
      max-width: 570px;
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .portal-presence-close {
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

    .portal-presence-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      padding: 17px 22px 0;
    }

    .portal-presence-stat {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 13px;
      background: rgba(255,255,255,0.022);
    }

    .portal-presence-stat span,
    .portal-presence-stat strong {
      display: block;
    }

    .portal-presence-stat span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .portal-presence-stat strong {
      margin-top: 5px;
      font-size: 15px;
    }

    .portal-presence-list {
      display: grid;
      gap: 9px;
      margin: 0;
      padding: 17px 22px 22px;
      list-style: none;
    }

    .portal-presence-person {
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,0.022);
    }

    .portal-presence-person-avatar {
      position: relative;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: #eaffff;
      background: linear-gradient(145deg, rgba(14,104,124,0.96), rgba(75,77,178,0.92));
      font-size: 11px;
      font-weight: 900;
    }

    .portal-presence-person-avatar::after {
      content: "";
      position: absolute;
      right: 1px;
      bottom: 1px;
      width: 10px;
      height: 10px;
      border: 2px solid var(--surface-strong);
      border-radius: 50%;
      background: #68717d;
    }

    .portal-presence-person-avatar[data-status="online"]::after,
    .portal-presence-person-avatar[data-status="studying"]::after { background: #52e8b0; }
    .portal-presence-person-avatar[data-status="break"]::after { background: #f3c969; }
    .portal-presence-person-avatar[data-status="away"]::after { background: #f0a760; }
    .portal-presence-person-avatar[data-status="in_call"]::after { background: #9a9cff; }

    .portal-presence-person-copy {
      min-width: 0;
    }

    .portal-presence-person-copy strong,
    .portal-presence-person-copy span {
      display: block;
    }

    .portal-presence-person-copy span {
      margin-top: 3px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.45;
    }

    .portal-presence-person-meta {
      display: grid;
      justify-items: end;
      gap: 5px;
      color: var(--muted);
      font-size: 8px;
      text-align: right;
    }

    .portal-presence-role,
    .portal-presence-status {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 0 7px;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .portal-presence-role[data-role="owner"] { color: #8df7d1; border-color: rgba(82,232,176,0.20); }
    .portal-presence-role[data-role="admin"] { color: #aeb0ff; border-color: rgba(122,124,255,0.24); }
    .portal-presence-role[data-role="member"] { color: var(--muted); }

    .portal-presence-privacy {
      margin: 0 22px 22px;
      padding: 11px 12px;
      border: 1px solid rgba(122,124,255,0.17);
      border-radius: 12px;
      color: var(--muted);
      background: rgba(122,124,255,0.05);
      font-size: 9px;
      line-height: 1.55;
    }

    @media (max-width: 620px) {
      .portal-presence-dialog {
        align-items: end;
        padding: 8px;
      }

      .portal-presence-card {
        max-height: 92vh;
        border-radius: 20px 20px 13px 13px;
      }

      .portal-presence-summary {
        grid-template-columns: 1fr;
        padding: 14px 16px 0;
      }

      .portal-presence-list {
        padding: 14px 16px 16px;
      }

      .portal-presence-person {
        grid-template-columns: 38px minmax(0, 1fr);
      }

      .portal-presence-person-meta {
        grid-column: 2;
        justify-items: start;
        text-align: left;
      }

      .portal-presence-privacy {
        margin: 0 16px 16px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .portal-room-card-shell {
        transition: none !important;
      }
    }
'''

DIALOG_HTML = r'''

  <div class="portal-presence-dialog" id="portalPresenceDialog" hidden onclick="portalDashboardPresenceBackdrop(event)">
    <section class="portal-presence-card" role="dialog" aria-modal="true" aria-labelledby="portalPresenceTitle">
      <header class="portal-presence-head">
        <div>
          <div class="portal-eyebrow">Ruoli e presenza della stanza</div>
          <h2 id="portalPresenceTitle">Partecipanti</h2>
          <p id="portalPresenceSubtitle">Snapshot locale della demo. Nell’app reale questi dati arrivano da membership, Postgres e Realtime autenticati.</p>
        </div>
        <button class="portal-presence-close" type="button" onclick="portalDashboardClosePresence()" aria-label="Chiudi dettagli partecipanti">×</button>
      </header>

      <div class="portal-presence-summary" id="portalPresenceSummary"></div>
      <ul class="portal-presence-list" id="portalPresenceList"></ul>
      <div class="portal-presence-privacy">
        <strong>Privacy.</strong> La demo usa dati locali deterministici e non comunica una presenza reale. Nell’app ufficiale l’identità e lo stato sono riconciliati da record server autenticati; i payload Realtime non vengono considerati fonte affidabile dell’identità.
      </div>
    </section>
  </div>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD — RUOLI E PRESENZA DETERMINISTICI
       ========================================================== */

    let portalDashboardPresencePreviousFocus = null;

    const portalDashboardPresencePresets = {
      "python-room": [
        { id: "luca", name: "Luca", initials: "LU", role: "owner", status: "studying", activity: "Lezione 0.1 · Che cosa significa programmare?", device: "Desktop", deviceCount: 2, lastSeen: "Adesso" },
        { id: "sofia", name: "Sofia", initials: "SO", role: "admin", status: "online", activity: "Checklist del Modulo 1", device: "Mobile", deviceCount: 1, lastSeen: "Adesso" },
        { id: "marco", name: "Marco", initials: "MA", role: "member", status: "break", activity: "Pausa dalla sessione focus", device: "Tablet", deviceCount: 1, lastSeen: "1 min fa" },
        { id: "giulia", name: "Giulia", initials: "GI", role: "member", status: "offline", activity: "", device: "Mobile", deviceCount: 0, lastSeen: "Ieri, 22:14" }
      ],
      "study-method-room": [
        { id: "elena", name: "Elena", initials: "EL", role: "owner", status: "in_call", activity: "Chiamata audio della stanza", device: "Desktop", deviceCount: 1, lastSeen: "Adesso" },
        { id: "luca", name: "Luca", initials: "LU", role: "member", status: "online", activity: "Dashboard della stanza", device: "Desktop", deviceCount: 1, lastSeen: "Adesso" },
        { id: "paolo", name: "Paolo", initials: "PA", role: "admin", status: "away", activity: "Ripasso attivo", device: "Mobile", deviceCount: 1, lastSeen: "4 min fa" }
      ],
      "math-room": [
        { id: "anna", name: "Anna", initials: "AN", role: "owner", status: "studying", activity: "Equazioni di primo grado", device: "Tablet", deviceCount: 1, lastSeen: "Adesso" },
        { id: "luca", name: "Luca", initials: "LU", role: "member", status: "online", activity: "Dashboard della stanza", device: "Desktop", deviceCount: 1, lastSeen: "Adesso" },
        { id: "davide", name: "Davide", initials: "DA", role: "member", status: "offline", activity: "", device: "Mobile", deviceCount: 0, lastSeen: "2 giorni fa" }
      ]
    };

    const portalDashboardRoleLabels = {
      owner: "Proprietario",
      admin: "Amministratore",
      member: "Partecipante"
    };

    const portalDashboardStatusLabels = {
      online: "Online",
      studying: "Sta studiando",
      break: "In pausa",
      away: "Assente",
      in_call: "In chiamata",
      offline: "Offline"
    };

    function portalDashboardDefaultParticipants(room) {
      const preset = portalDashboardPresencePresets[room.id];
      if (preset) return preset.map((participant) => ({ ...participant }));
      return [
        {
          id: "luca",
          name: "Luca",
          initials: "LU",
          role: room.role === "owner" ? "owner" : "member",
          status: "online",
          activity: "Dashboard della stanza",
          device: "Desktop",
          deviceCount: 1,
          lastSeen: "Adesso"
        }
      ];
    }

    function portalDashboardParticipants(room) {
      const source = Array.isArray(room?.participants) && room.participants.length
        ? room.participants
        : portalDashboardDefaultParticipants(room || {});
      return source.map((participant) => ({
        id: String(participant.id || participant.name || "utente"),
        name: String(participant.name || "Partecipante").slice(0, 80),
        initials: String(participant.initials || participant.name || "UT").slice(0, 2).toUpperCase(),
        role: ["owner", "admin", "member"].includes(participant.role) ? participant.role : "member",
        status: ["online", "studying", "break", "away", "in_call", "offline"].includes(participant.status) ? participant.status : "offline",
        activity: String(participant.activity || "").slice(0, 180),
        device: ["Desktop", "Tablet", "Mobile", "Unknown"].includes(participant.device) ? participant.device : "Unknown",
        deviceCount: Math.max(0, Math.min(9, Number(participant.deviceCount || 0))),
        lastSeen: String(participant.lastSeen || "Non disponibile").slice(0, 80)
      }));
    }

    function portalDashboardOnlineParticipants(room) {
      return portalDashboardParticipants(room).filter((participant) => participant.status !== "offline");
    }

    function portalDashboardPresencePreview(room) {
      const participants = portalDashboardParticipants(room);
      const online = participants.filter((participant) => participant.status !== "offline");
      const preview = participants.slice(0, 4).map((participant) => `
        <span class="portal-room-avatar" data-status="${portalDashboardEscape(participant.status)}" title="${portalDashboardEscape(participant.name)} · ${portalDashboardEscape(portalDashboardStatusLabels[participant.status])}">${portalDashboardEscape(participant.initials)}</span>
      `).join("");
      const active = online.find((participant) => participant.status === "studying" || participant.status === "in_call") || online[0];
      return `
        <div class="portal-room-presence-preview">
          <div class="portal-room-avatar-stack" aria-label="Anteprima partecipanti">${preview}</div>
          <div class="portal-room-presence-copy">
            <strong>${online.length} ${online.length === 1 ? "persona attiva" : "persone attive"}</strong>
            <span>${active ? portalDashboardEscape(active.activity || portalDashboardStatusLabels[active.status]) : "Nessuno online"}</span>
          </div>
          <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
        </div>`;
    }

    function portalDashboardRenderRoomsWithPresence() {
      const grid = document.getElementById("portalRoomGrid");
      const count = document.getElementById("portalRoomCount");
      if (!grid) return;
      const rooms = [...portalDashboardState.rooms].sort((a, b) => b.createdAt - a.createdAt);
      if (count) count.textContent = `${rooms.length} ${rooms.length === 1 ? "attiva" : "attive"}`;
      grid.innerHTML = rooms.length
        ? rooms.map((room) => {
            const participants = portalDashboardParticipants(room);
            const onlineCount = participants.filter((participant) => participant.status !== "offline").length;
            return `
              <article class="portal-room-card-shell">
                <button class="portal-room-card" type="button" onclick="portalDashboardOpenRoom('${portalDashboardEscape(room.id)}')">
                  <div class="portal-room-card-head">
                    <span class="portal-room-icon">${room.role === "owner" ? "♧" : "◎"}</span>
                    <span aria-hidden="true">→</span>
                  </div>
                  <h3>${portalDashboardEscape(room.name)}</h3>
                  <p>Codice ${portalDashboardEscape(room.inviteCode)}</p>
                  <div class="portal-room-card-meta">
                    <span class="role-${portalDashboardEscape(room.role)}">${portalDashboardEscape(portalDashboardRoleLabels[room.role] || "Partecipante")}</span>
                    <span>${onlineCount} online</span>
                    <span>${portalDashboardEscape(room.lastActivity)}</span>
                  </div>
                </button>
                ${portalDashboardPresencePreview(room)}
              </article>`;
          }).join("")
        : `<div class="portal-room-empty"><strong>Nessuna stanza ancora.</strong><br>Crea una stanza oppure entra con un codice di invito.</div>`;
    }

    function portalDashboardOpenPresence(roomId, trigger) {
      const room = portalDashboardState.rooms.find((item) => item.id === roomId);
      const dialog = document.getElementById("portalPresenceDialog");
      const title = document.getElementById("portalPresenceTitle");
      const subtitle = document.getElementById("portalPresenceSubtitle");
      const summary = document.getElementById("portalPresenceSummary");
      const list = document.getElementById("portalPresenceList");
      if (!room || !dialog || !summary || !list) return;
      portalDashboardPresencePreviousFocus = trigger || document.activeElement;
      const participants = portalDashboardParticipants(room);
      const online = participants.filter((participant) => participant.status !== "offline");
      const activeSessions = online.reduce((total, participant) => total + Math.max(1, participant.deviceCount), 0);
      if (title) title.textContent = room.name;
      if (subtitle) subtitle.textContent = `Il tuo ruolo: ${portalDashboardRoleLabels[room.role] || "Partecipante"}. Snapshot locale della demo, non una connessione Realtime.`;
      summary.innerHTML = `
        <div class="portal-presence-stat"><span>Partecipanti</span><strong>${participants.length}</strong></div>
        <div class="portal-presence-stat"><span>Online</span><strong>${online.length}</strong></div>
        <div class="portal-presence-stat"><span>Sessioni attive</span><strong>${activeSessions}</strong></div>`;
      list.innerHTML = participants.map((participant) => `
        <li class="portal-presence-person">
          <span class="portal-presence-person-avatar" data-status="${portalDashboardEscape(participant.status)}">${portalDashboardEscape(participant.initials)}</span>
          <span class="portal-presence-person-copy">
            <strong>${portalDashboardEscape(participant.name)}</strong>
            <span>${participant.activity ? portalDashboardEscape(participant.activity) : "Nessuna attività condivisa"}</span>
          </span>
          <span class="portal-presence-person-meta">
            <span class="portal-presence-role" data-role="${portalDashboardEscape(participant.role)}">${portalDashboardEscape(portalDashboardRoleLabels[participant.role])}</span>
            <span class="portal-presence-status">${portalDashboardEscape(portalDashboardStatusLabels[participant.status])}</span>
            <span>${portalDashboardEscape(participant.device)}${participant.deviceCount > 1 ? ` · ${participant.deviceCount} sessioni` : ""}</span>
            <span>Ultimo accesso: ${portalDashboardEscape(participant.lastSeen)}</span>
          </span>
        </li>`).join("");
      dialog.hidden = false;
      document.body.classList.add("portal-presence-open");
      window.setTimeout(() => dialog.querySelector(".portal-presence-close")?.focus(), 30);
    }

    function portalDashboardClosePresence() {
      const dialog = document.getElementById("portalPresenceDialog");
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("portal-presence-open");
      if (portalDashboardPresencePreviousFocus?.focus) portalDashboardPresencePreviousFocus.focus();
      portalDashboardPresencePreviousFocus = null;
    }

    function portalDashboardPresenceBackdrop(event) {
      if (event.target?.id === "portalPresenceDialog") portalDashboardClosePresence();
    }

    window.addEventListener("keydown", (event) => {
      const dialog = document.getElementById("portalPresenceDialog");
      if (event.key === "Escape" && dialog && !dialog.hidden) {
        event.preventDefault();
        portalDashboardClosePresence();
      }
    });
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
        "    /* ==========================================================\n       DASHBOARD REALE — CREATE E JOIN 1.2.0-alpha.1",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — CREATE E JOIN 1.2.0-alpha.1",
        "dashboard create CSS marker",
    )

    html = replace_once(
        html,
        '<div class="portal-status">Supabase collegato</div>',
        '<div class="portal-status" id="portalDashboardConnection">Demo locale · presenza simulata</div>',
        "dashboard connection label",
    )

    html = replace_once(
        html,
        '  <section class="portal-view catalog-demo-view" id="portalCatalog" hidden data-catalog-demo-version="1.1.0-alpha.1">',
        DIALOG_HTML + '\n  <section class="portal-view catalog-demo-view" id="portalCatalog" hidden data-catalog-demo-version="1.1.0-alpha.1">',
        "catalog section opening",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD REALE — CREATE E JOIN DETERMINISTICI",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — CREATE E JOIN DETERMINISTICI",
        "dashboard create JS marker",
    )

    pattern = re.compile(
        r"    function portalDashboardRenderRooms\(\) \{.*?\n    \}\n\n    function portalDashboardOpenRoom",
        re.DOTALL,
    )
    replacement = "    function portalDashboardRenderRooms() {\n      portalDashboardRenderRoomsWithPresence();\n    }\n\n    function portalDashboardOpenRoom"
    html, count = pattern.subn(replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Render rooms function expected once, found {count}")

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalPresenceDialog"',
        'id="portalPresenceList"',
        "function portalDashboardRenderRoomsWithPresence(",
        "function portalDashboardOpenPresence(",
        "portalDashboardPresencePresets",
        "Demo locale · presenza simulata",
        "in_call",
        "admin",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: ruoli e presenza nella Dashboard.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — ruoli e presenza\n\n- Aggiunti i ruoli proprietario, amministratore e partecipante.\n- Aggiunti stati online, studio, pausa, assente, chiamata e offline.\n- Aggiunta anteprima partecipanti su ogni scheda stanza.\n- Aggiunto pannello dettagli con attività corrente, dispositivo, sessioni e ultimo accesso.\n- Aggiunto conteggio separato di partecipanti, utenti online e sessioni attive.\n- Aggiunti chiusura con Escape, click sullo sfondo e ripristino del focus.\n- Corretto il testo `Supabase collegato`: la demo dichiara ora esplicitamente che la presenza è locale e simulata.\n- Conservati create/join, Catalogo, Aula, Eve, chat e audio.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.1]", entry + "## [1.2.0-alpha.1]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Ruoli e presenza Dashboard"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- ruoli owner/admin/member;\n- sei stati presenza;\n- attività corrente;\n- dispositivo e sessioni multiple;\n- ultimo accesso;\n- anteprima sulle schede stanza;\n- dialog dettagli accessibile;\n- indicazione esplicita di simulazione locale.\n\nDa verificare manualmente:\n\n- apertura dettagli delle tre stanze;\n- resa dei sei stati;\n- conteggi partecipanti/online/sessioni;\n- chiusura Escape e ripristino focus;\n- creazione di una nuova stanza;\n- mobile e tastiera.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Ruoli e presenza nella Dashboard demo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} usa preset locali per mostrare gli effetti utente di membership e Presence. I dati non sono Realtime e l'interfaccia lo dichiara. Nell'app ufficiale restano autorevoli `room_members`, i record server di presenza, heartbeat e grace period prima dell'offline.\n\nLa matrice rappresentata comprende:\n\n- ruoli `owner`, `admin`, `member`;\n- stati `online`, `studying`, `break`, `away`, `in_call`, `offline`;\n- attività, dispositivo, ultimo accesso e numero di sessioni;\n- separazione tra utenti online e sessioni aperte.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: create/join | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.1 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: create/join | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.1. |",
    )
    row = f"| Fase 2 | Dashboard: ruoli e presenza | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: ruoli e presenza |" not in approvals:
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
