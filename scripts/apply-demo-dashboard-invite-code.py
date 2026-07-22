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

VERSION = "1.2.0-alpha.3"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — CODICE INVITO 1.2.0-alpha.3"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — CODICE INVITO 1.2.0-alpha.3
       ========================================================== */

    .portal-room-preview-actions {
      display: flex;
      flex: 0 0 auto;
      gap: 6px;
    }

    .portal-room-invite-button {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid rgba(122,124,255,0.20);
      border-radius: 10px;
      color: #c7c8ff;
      background: rgba(122,124,255,0.055);
      font-size: 9px;
      font-weight: 780;
      cursor: pointer;
    }

    .portal-invite-dialog[hidden] {
      display: none !important;
    }

    .portal-invite-dialog {
      position: fixed;
      inset: 0;
      z-index: 12200;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(1,7,12,0.76);
      backdrop-filter: blur(12px) saturate(120%);
    }

    .portal-invite-card {
      width: min(680px, 100%);
      max-height: min(88vh, 760px);
      overflow: auto;
      border: 1px solid rgba(125,235,255,0.22);
      border-radius: 24px;
      color: var(--ink);
      background:
        radial-gradient(circle at 0% 0%, rgba(0,223,242,0.10), transparent 38%),
        linear-gradient(180deg, var(--surface-strong), var(--surface));
      box-shadow: 0 34px 110px rgba(0,0,0,0.50), 0 0 38px rgba(0,223,242,0.08);
    }

    .portal-invite-head {
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

    .portal-invite-head h2 {
      margin: 5px 0 6px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(25px, 4vw, 38px);
      font-weight: 500;
      letter-spacing: -0.03em;
    }

    .portal-invite-head p {
      max-width: 520px;
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .portal-invite-close {
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

    .portal-invite-body {
      padding: 20px 22px 22px;
    }

    .portal-invite-code-box {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding: 12px;
      border: 1px solid rgba(125,235,255,0.19);
      border-radius: 15px;
      background: rgba(0,223,242,0.045);
    }

    .portal-invite-code-copy {
      min-width: 0;
    }

    .portal-invite-code-copy span,
    .portal-invite-code-copy strong {
      display: block;
    }

    .portal-invite-code-copy span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 820;
      letter-spacing: 0.07em;
      text-transform: uppercase;
    }

    .portal-invite-code-copy strong {
      overflow: hidden;
      margin-top: 6px;
      color: #eaffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: clamp(16px, 4vw, 24px);
      letter-spacing: 0.12em;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .portal-invite-copy-button,
    .portal-invite-rotate-button,
    .portal-invite-confirm-button,
    .portal-invite-cancel-button {
      min-height: 42px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-size: 10px;
      font-weight: 780;
      cursor: pointer;
    }

    .portal-invite-copy-button {
      color: var(--green-2);
      border-color: rgba(125,235,255,0.24);
      background: rgba(0,223,242,0.055);
    }

    .portal-invite-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
      margin-top: 12px;
    }

    .portal-invite-meta div {
      padding: 11px 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
    }

    .portal-invite-meta span,
    .portal-invite-meta strong {
      display: block;
    }

    .portal-invite-meta span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .portal-invite-meta strong {
      margin-top: 5px;
      font-size: 11px;
    }

    .portal-invite-owner-actions {
      margin-top: 16px;
      padding: 14px;
      border: 1px solid rgba(255,176,91,0.19);
      border-radius: 14px;
      background: rgba(255,176,91,0.045);
    }

    .portal-invite-owner-actions h3 {
      margin: 0;
      font-size: 12px;
    }

    .portal-invite-owner-actions p {
      margin: 6px 0 12px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.55;
    }

    .portal-invite-rotate-button {
      color: #ffd7a7;
      border-color: rgba(255,176,91,0.25);
      background: rgba(255,176,91,0.07);
    }

    .portal-invite-confirmation[hidden] {
      display: none !important;
    }

    .portal-invite-confirmation {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,176,91,0.16);
    }

    .portal-invite-confirmation strong,
    .portal-invite-confirmation span {
      display: block;
    }

    .portal-invite-confirmation span {
      margin-top: 4px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.5;
    }

    .portal-invite-confirm-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .portal-invite-confirm-button {
      color: #fff0dd;
      border-color: rgba(255,176,91,0.32);
      background: linear-gradient(135deg, rgba(155,82,40,0.88), rgba(146,59,75,0.84));
    }

    .portal-invite-status {
      min-height: 22px;
      margin-top: 12px;
      color: #91f7d3;
      font-size: 10px;
      line-height: 1.45;
    }

    .portal-invite-status[data-tone="error"] {
      color: #ffacb4;
    }

    .portal-invite-privacy {
      margin-top: 12px;
      padding: 11px 12px;
      border: 1px solid rgba(122,124,255,0.17);
      border-radius: 12px;
      color: var(--muted);
      background: rgba(122,124,255,0.05);
      font-size: 9px;
      line-height: 1.55;
    }

    .portal-invite-dialog button:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }

    @media (max-width: 620px) {
      .portal-room-presence-preview {
        flex-wrap: wrap;
      }

      .portal-room-presence-copy {
        flex: 1 1 120px;
      }

      .portal-room-preview-actions {
        width: 100%;
      }

      .portal-room-preview-actions button {
        flex: 1;
      }

      .portal-invite-dialog {
        align-items: end;
        padding: 8px;
      }

      .portal-invite-card {
        max-height: 92vh;
        border-radius: 20px 20px 13px 13px;
      }

      .portal-invite-body {
        padding: 16px;
      }

      .portal-invite-code-box {
        grid-template-columns: 1fr;
      }

      .portal-invite-meta {
        grid-template-columns: 1fr;
      }

      .portal-invite-copy-button,
      .portal-invite-rotate-button,
      .portal-invite-confirm-button,
      .portal-invite-cancel-button {
        width: 100%;
      }
    }
'''

DIALOG_HTML = r'''

  <div class="portal-invite-dialog" id="portalInviteDialog" hidden onclick="portalDashboardInviteBackdrop(event)">
    <section class="portal-invite-card" role="dialog" aria-modal="true" aria-labelledby="portalInviteTitle">
      <header class="portal-invite-head">
        <div>
          <div class="portal-eyebrow">Accesso alla stanza</div>
          <h2 id="portalInviteTitle">Codice invito</h2>
          <p id="portalInviteSubtitle">Condividi il codice soltanto con le persone che vuoi ammettere nella stanza.</p>
        </div>
        <button class="portal-invite-close" type="button" onclick="portalDashboardCloseInvite()" aria-label="Chiudi gestione invito">×</button>
      </header>

      <div class="portal-invite-body">
        <div class="portal-invite-code-box">
          <div class="portal-invite-code-copy">
            <span>Codice attivo</span>
            <strong id="portalInviteCodeValue">••••••••</strong>
          </div>
          <button class="portal-invite-copy-button" id="portalInviteCopyButton" type="button" onclick="portalDashboardCopyInvite()">Copia codice</button>
        </div>

        <div class="portal-invite-meta">
          <div><span>Il tuo ruolo</span><strong id="portalInviteRole">Partecipante</strong></div>
          <div><span>Ultima rigenerazione</span><strong id="portalInviteRotatedAt">Mai</strong></div>
        </div>

        <div class="portal-invite-owner-actions" id="portalInviteOwnerActions" hidden>
          <h3>Revoca il codice attuale</h3>
          <p>Il vecchio codice smetterà immediatamente di funzionare. Le persone già presenti nella stanza non verranno espulse.</p>
          <button class="portal-invite-rotate-button" id="portalInviteRotateButton" type="button" onclick="portalDashboardShowInviteConfirmation()">Revoca e rigenera</button>

          <div class="portal-invite-confirmation" id="portalInviteConfirmation" hidden>
            <strong>Confermi la revoca?</strong>
            <span>Questa azione non può ripristinare il codice precedente.</span>
            <div class="portal-invite-confirm-actions">
              <button class="portal-invite-confirm-button" id="portalInviteConfirmButton" type="button" onclick="portalDashboardRotateInvite()">Sì, genera un nuovo codice</button>
              <button class="portal-invite-cancel-button" type="button" onclick="portalDashboardHideInviteConfirmation()">Annulla</button>
            </div>
          </div>
        </div>

        <div class="portal-invite-status" id="portalInviteStatus" role="status" aria-live="polite"></div>

        <div class="portal-invite-privacy">
          <strong>Demo locale.</strong> Copia, revoca e rigenerazione sono salvate soltanto in questo browser. Nell’app ufficiale la rotazione passa dalla RPC protetta `rotate_room_invite` e il permesso viene verificato dal server.
        </div>
      </div>
    </section>
  </div>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD — CODICE INVITO LOCALE E DETERMINISTICO
       ========================================================== */

    let portalDashboardInviteRoomId = null;
    let portalDashboardInvitePreviousFocus = null;
    let portalDashboardInviteBusy = false;

    function portalDashboardInviteRoleLabel(role) {
      return portalDashboardRoleLabels[role] || "Partecipante";
    }

    function portalDashboardInviteTimestamp(value) {
      if (!value) return "Mai";
      const date = new Date(value);
      if (!Number.isFinite(date.getTime())) return "Mai";
      return new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    }

    function portalDashboardRotatedCode(room) {
      const revision = Math.max(0, Number(room.inviteRevision || 0)) + 1;
      let hash = 2166136261;
      const source = `${room.id}|${room.name}|${revision}`;
      for (const character of source) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
      }
      return {
        revision,
        code: `AULA${(hash >>> 0).toString(36).toUpperCase().padStart(8, "0").slice(0, 8)}`
      };
    }

    function portalDashboardInviteStatus(message = "", tone = "") {
      const status = document.getElementById("portalInviteStatus");
      if (!status) return;
      status.textContent = message;
      if (tone) status.dataset.tone = tone;
      else status.removeAttribute("data-tone");
    }

    function portalDashboardRenderInviteDialog() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardInviteRoomId);
      const title = document.getElementById("portalInviteTitle");
      const subtitle = document.getElementById("portalInviteSubtitle");
      const code = document.getElementById("portalInviteCodeValue");
      const role = document.getElementById("portalInviteRole");
      const rotatedAt = document.getElementById("portalInviteRotatedAt");
      const ownerActions = document.getElementById("portalInviteOwnerActions");
      const copyButton = document.getElementById("portalInviteCopyButton");
      const rotateButton = document.getElementById("portalInviteRotateButton");
      const confirmButton = document.getElementById("portalInviteConfirmButton");
      if (!room) return false;
      if (title) title.textContent = room.name;
      if (subtitle) subtitle.textContent = room.role === "owner"
        ? "Puoi condividere il codice oppure revocarlo e generarne uno nuovo."
        : "Puoi copiare il codice, ma soltanto il proprietario può revocarlo.";
      if (code) code.textContent = room.inviteCode;
      if (role) role.textContent = portalDashboardInviteRoleLabel(room.role);
      if (rotatedAt) rotatedAt.textContent = portalDashboardInviteTimestamp(room.inviteRotatedAt);
      if (ownerActions) ownerActions.hidden = room.role !== "owner";
      if (copyButton) copyButton.disabled = portalDashboardInviteBusy;
      if (rotateButton) rotateButton.disabled = portalDashboardInviteBusy;
      if (confirmButton) confirmButton.disabled = portalDashboardInviteBusy;
      return true;
    }

    function portalDashboardOpenInvite(roomId, trigger) {
      const room = portalDashboardState.rooms.find((item) => item.id === roomId);
      const dialog = document.getElementById("portalInviteDialog");
      if (!room || !dialog) {
        portalDashboardFeedback("La stanza non è più disponibile.", "error");
        return;
      }
      portalDashboardInviteRoomId = roomId;
      portalDashboardInvitePreviousFocus = trigger || document.activeElement;
      portalDashboardInviteBusy = false;
      portalDashboardInviteStatus();
      portalDashboardHideInviteConfirmation();
      portalDashboardRenderInviteDialog();
      dialog.hidden = false;
      document.body.classList.add("portal-invite-open");
      window.setTimeout(() => document.getElementById("portalInviteCopyButton")?.focus(), 30);
    }

    function portalDashboardCloseInvite() {
      const dialog = document.getElementById("portalInviteDialog");
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("portal-invite-open");
      portalDashboardInviteRoomId = null;
      portalDashboardInviteBusy = false;
      portalDashboardInviteStatus();
      portalDashboardHideInviteConfirmation();
      if (portalDashboardInvitePreviousFocus?.focus) portalDashboardInvitePreviousFocus.focus();
      portalDashboardInvitePreviousFocus = null;
    }

    function portalDashboardInviteBackdrop(event) {
      if (event.target?.id === "portalInviteDialog") portalDashboardCloseInvite();
    }

    function portalDashboardShowInviteConfirmation() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardInviteRoomId);
      const confirmation = document.getElementById("portalInviteConfirmation");
      if (!room || room.role !== "owner" || !confirmation) {
        portalDashboardInviteStatus("Solo il proprietario può rigenerare il codice.", "error");
        return;
      }
      confirmation.hidden = false;
      portalDashboardInviteStatus("Controlla l’avviso e conferma la revoca.");
      window.setTimeout(() => document.getElementById("portalInviteConfirmButton")?.focus(), 20);
    }

    function portalDashboardHideInviteConfirmation() {
      const confirmation = document.getElementById("portalInviteConfirmation");
      if (confirmation) confirmation.hidden = true;
    }

    function portalDashboardFallbackCopy(value) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    }

    async function portalDashboardCopyInvite() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardInviteRoomId);
      if (!room || portalDashboardInviteBusy) return;
      portalDashboardInviteBusy = true;
      portalDashboardRenderInviteDialog();
      try {
        let copied = false;
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          await navigator.clipboard.writeText(room.inviteCode);
          copied = true;
        } else {
          copied = portalDashboardFallbackCopy(room.inviteCode);
        }
        if (!copied) throw new Error("Copia non consentita dal browser");
        portalDashboardInviteStatus(`Codice ${room.inviteCode} copiato.`, "success");
        portalNotify("Codice invito copiato");
      } catch {
        portalDashboardInviteStatus("Il browser ha bloccato la copia automatica. Seleziona manualmente il codice.", "error");
      } finally {
        portalDashboardInviteBusy = false;
        portalDashboardRenderInviteDialog();
      }
    }

    async function portalDashboardRotateInvite() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardInviteRoomId);
      if (!room || portalDashboardInviteBusy) return;
      if (room.role !== "owner") {
        portalDashboardInviteStatus("Solo il proprietario può rigenerare il codice.", "error");
        return;
      }
      portalDashboardInviteBusy = true;
      portalDashboardRenderInviteDialog();
      portalDashboardInviteStatus("Revoca del codice precedente in corso…");
      await new Promise((resolve) => window.setTimeout(resolve, 460));
      const next = portalDashboardRotatedCode(room);
      const rotatedAt = new Date().toISOString();
      portalDashboardState.rooms = portalDashboardState.rooms.map((item) => item.id === room.id
        ? {
            ...item,
            inviteCode: next.code,
            inviteRevision: next.revision,
            inviteRotatedAt: rotatedAt,
            lastActivity: "Adesso · Codice invito rigenerato"
          }
        : item);
      portalDashboardSaveRooms();
      portalDashboardRenderRooms();
      portalDashboardInviteBusy = false;
      portalDashboardHideInviteConfirmation();
      portalDashboardRenderInviteDialog();
      portalDashboardInviteStatus(`Nuovo codice attivo: ${next.code}. Il precedente è stato revocato.`, "success");
      portalNotify("Nuovo codice invito creato");
    }

    window.addEventListener("keydown", (event) => {
      const dialog = document.getElementById("portalInviteDialog");
      if (event.key === "Escape" && dialog && !dialog.hidden) {
        event.preventDefault();
        portalDashboardCloseInvite();
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
        "    /* ==========================================================\n       DASHBOARD REALE — RUOLI E PRESENZA 1.2.0-alpha.2",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — RUOLI E PRESENZA 1.2.0-alpha.2",
        "presence CSS marker",
    )

    html = replace_once(
        html,
        '  <div class="portal-presence-dialog" id="portalPresenceDialog" hidden onclick="portalDashboardPresenceBackdrop(event)">',
        DIALOG_HTML + '\n  <div class="portal-presence-dialog" id="portalPresenceDialog" hidden onclick="portalDashboardPresenceBackdrop(event)">',
        "presence dialog",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD — RUOLI E PRESENZA DETERMINISTICI",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD — RUOLI E PRESENZA DETERMINISTICI",
        "presence JS marker",
    )

    html = replace_once(
        html,
        '        lastActivity: String(room.lastActivity || "Nessuna attività recente").slice(0, 120),\n        createdAt: Number(room.createdAt || Date.now())',
        '        lastActivity: String(room.lastActivity || "Nessuna attività recente").slice(0, 120),\n        createdAt: Number(room.createdAt || Date.now()),\n        inviteRevision: Math.max(0, Number(room.inviteRevision || 0)),\n        inviteRotatedAt: room.inviteRotatedAt ? String(room.inviteRotatedAt) : null',
        "room normalization",
    )

    html = replace_once(
        html,
        '''          <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>''',
        '''          <div class="portal-room-preview-actions">
            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>
          </div>''',
        "presence preview actions",
    )

    html = replace_once(
        html,
        "      const invitedRoom = portalDashboardInvites[code];",
        '''      const localRoom = portalDashboardState.rooms.find((room) => room.inviteCode === code);
      if (localRoom) {
        portalDashboardSetWorking("join", false);
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Sei già membro di questa stanza.");
        portalDashboardFeedback(`La stanza “${localRoom.name}” è già presente nella tua scrivania.`, "success");
        portalDashboardRenderRooms();
        return;
      }
      const invitedRoom = portalDashboardInvites[code];''',
        "join local invite check",
    )

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalInviteDialog"',
        'id="portalInviteCodeValue"',
        'id="portalInviteConfirmation"',
        "function portalDashboardCopyInvite(",
        "function portalDashboardRotateInvite(",
        "function portalDashboardRotatedCode(",
        "rotate_room_invite",
        "portal-room-invite-button",
        "inviteRevision",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: gestione del codice invito.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — codice invito\n\n- Aggiunto il pulsante `Invito` su ogni scheda stanza.\n- Aggiunto un dialog accessibile per copiare il codice attivo.\n- Aggiunto fallback di copia per il file HTML aperto fuori da un contesto HTTPS.\n- Aggiunta revoca e rigenerazione riservata al proprietario.\n- Aggiunta conferma esplicita prima della revoca.\n- Il codice precedente smette di corrispondere alla stanza dopo la rotazione.\n- Aggiunti revisione, data dell'ultima rigenerazione e persistenza locale.\n- Aggiunto controllo join per riconoscere una stanza già presente tramite il codice attuale.\n- Conservati create/join, presenza, Catalogo, Aula, Eve, chat e audio.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.2]", entry + "## [1.2.0-alpha.2]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Codice invito Dashboard"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- copia codice con fallback locale;\n- permesso owner-only per rotazione;\n- conferma revoca;\n- nuovo codice deterministico per revisione;\n- invalidazione del codice precedente;\n- persistenza revisione e timestamp;\n- dialog accessibile e responsive;\n- riconoscimento join di stanza già presente.\n\nDa verificare manualmente:\n\n- copia codice;\n- rotazione su stanza proprietaria;\n- impossibilità di rotazione su stanza partecipata;\n- cambio immediato del codice sulla scheda;\n- permanenza dopo ricaricamento;\n- vecchio codice non riconosciuto;\n- Escape, focus e mobile.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Codice invito nella Dashboard demo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} riproduce l'effetto utente di `copyInvite()` e della RPC `rotate_room_invite` usando lo stato locale della Dashboard. La rotazione è disponibile soltanto per `owner`, incrementa `inviteRevision`, sostituisce `inviteCode` e registra `inviteRotatedAt`.\n\nIl codice precedente non viene conservato tra i codici attivi. Nell'app ufficiale autorizzazione, atomicità e revoca sono garantite dal server; la demo mostra soltanto gli stati e il flusso dell'interfaccia.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: ruoli e presenza | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.2 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: ruoli e presenza | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.2. |",
    )
    row = f"| Fase 2 | Dashboard: codice invito | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: codice invito |" not in approvals:
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
