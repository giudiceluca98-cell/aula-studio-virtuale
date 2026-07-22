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

VERSION = "1.2.0-alpha.4"
DATE = "2026-07-22"
MARKER = "DASHBOARD REALE — USCITA E CANCELLAZIONE 1.2.0-alpha.4"

CSS = r'''

    /* ==========================================================
       DASHBOARD REALE — USCITA E CANCELLAZIONE 1.2.0-alpha.4
       ========================================================== */

    .portal-room-manage-button {
      min-height: 34px;
      padding: 0 10px;
      border: 1px solid rgba(255,176,91,0.20);
      border-radius: 10px;
      color: #ffd7a7;
      background: rgba(255,176,91,0.055);
      font-size: 9px;
      font-weight: 780;
      cursor: pointer;
    }

    .portal-room-manage-dialog[hidden] {
      display: none !important;
    }

    .portal-room-manage-dialog {
      position: fixed;
      inset: 0;
      z-index: 12300;
      display: grid;
      place-items: center;
      padding: 18px;
      background: rgba(1,7,12,0.78);
      backdrop-filter: blur(13px) saturate(120%);
    }

    .portal-room-manage-card {
      width: min(720px, 100%);
      max-height: min(90vh, 820px);
      overflow: auto;
      border: 1px solid rgba(125,235,255,0.22);
      border-radius: 24px;
      color: var(--ink);
      background:
        radial-gradient(circle at 0% 0%, rgba(0,223,242,0.09), transparent 36%),
        linear-gradient(180deg, var(--surface-strong), var(--surface));
      box-shadow: 0 36px 120px rgba(0,0,0,0.52), 0 0 40px rgba(0,223,242,0.07);
    }

    .portal-room-manage-head {
      position: sticky;
      top: 0;
      z-index: 3;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 20px 22px 17px;
      border-bottom: 1px solid var(--line);
      background: color-mix(in srgb, var(--surface-strong) 96%, transparent);
      backdrop-filter: blur(16px);
    }

    .portal-room-manage-head h2 {
      margin: 5px 0 6px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(25px, 4vw, 38px);
      font-weight: 500;
      letter-spacing: -0.03em;
    }

    .portal-room-manage-head p {
      max-width: 560px;
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .portal-room-manage-close {
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

    .portal-room-manage-body {
      display: grid;
      gap: 13px;
      padding: 20px 22px 22px;
    }

    .portal-room-manage-summary,
    .portal-room-manage-action {
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 15px;
      background: rgba(255,255,255,0.02);
    }

    .portal-room-manage-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 9px;
    }

    .portal-room-manage-stat {
      min-width: 0;
      padding: 10px;
      border-radius: 11px;
      background: rgba(255,255,255,0.025);
    }

    .portal-room-manage-stat span,
    .portal-room-manage-stat strong {
      display: block;
    }

    .portal-room-manage-stat span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 820;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .portal-room-manage-stat strong {
      overflow: hidden;
      margin-top: 5px;
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .portal-room-manage-action h3 {
      margin: 0;
      font-size: 13px;
    }

    .portal-room-manage-action p {
      margin: 6px 0 12px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.55;
    }

    .portal-room-manage-action[data-kind="leave"] {
      border-color: rgba(255,176,91,0.18);
      background: rgba(255,176,91,0.04);
    }

    .portal-room-manage-action[data-kind="delete"] {
      border-color: rgba(255,108,121,0.22);
      background: rgba(255,92,105,0.045);
    }

    .portal-room-manage-button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .portal-room-leave-button,
    .portal-room-delete-button,
    .portal-room-cancel-button {
      min-height: 42px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
    }

    .portal-room-leave-button {
      color: #ffe4c2;
      border-color: rgba(255,176,91,0.28);
      background: rgba(255,176,91,0.08);
    }

    .portal-room-delete-button {
      color: #ffe8eb;
      border-color: rgba(255,108,121,0.34);
      background: linear-gradient(135deg, rgba(156,54,72,0.92), rgba(111,35,55,0.92));
    }

    .portal-room-manage-confirmation[hidden],
    .portal-room-manage-delete[hidden] {
      display: none !important;
    }

    .portal-room-manage-confirmation,
    .portal-room-manage-delete {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid currentColor;
    }

    .portal-room-manage-confirmation {
      color: rgba(255,176,91,0.30);
    }

    .portal-room-manage-delete {
      color: rgba(255,108,121,0.30);
    }

    .portal-room-manage-confirmation strong,
    .portal-room-manage-confirmation span,
    .portal-room-manage-delete strong,
    .portal-room-manage-delete span {
      display: block;
    }

    .portal-room-manage-confirmation strong,
    .portal-room-manage-delete strong {
      color: var(--ink);
    }

    .portal-room-manage-confirmation span,
    .portal-room-manage-delete span {
      margin-top: 5px;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.55;
    }

    .portal-room-delete-input {
      width: 100%;
      min-height: 44px;
      margin-top: 11px;
      padding: 0 12px;
      border: 1px solid rgba(255,108,121,0.30);
      border-radius: 11px;
      color: var(--ink);
      background: rgba(3,12,19,0.78);
      font: inherit;
      font-size: 11px;
    }

    .portal-room-delete-input[aria-invalid="true"] {
      border-color: rgba(255,108,121,0.75);
      box-shadow: 0 0 0 3px rgba(255,92,105,0.08);
    }

    .portal-room-manage-progress[hidden] {
      display: none !important;
    }

    .portal-room-manage-progress {
      display: grid;
      gap: 7px;
      margin-top: 12px;
      padding: 11px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
    }

    .portal-room-manage-progress div {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      font-size: 9px;
    }

    .portal-room-manage-progress div::before {
      content: "○";
      color: var(--muted);
    }

    .portal-room-manage-progress div[data-state="active"]::before {
      content: "◌";
      color: #ffd7a7;
    }

    .portal-room-manage-progress div[data-state="done"]::before {
      content: "✓";
      color: #91f7d3;
    }

    .portal-room-manage-status {
      min-height: 22px;
      color: #91f7d3;
      font-size: 10px;
      line-height: 1.45;
    }

    .portal-room-manage-status[data-tone="error"] {
      color: #ffacb4;
    }

    .portal-room-manage-privacy {
      padding: 11px 12px;
      border: 1px solid rgba(122,124,255,0.17);
      border-radius: 12px;
      color: var(--muted);
      background: rgba(122,124,255,0.05);
      font-size: 9px;
      line-height: 1.55;
    }

    .portal-room-manage-dialog button:disabled,
    .portal-room-manage-dialog input:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }

    @media (max-width: 620px) {
      .portal-room-manage-dialog {
        align-items: end;
        padding: 8px;
      }

      .portal-room-manage-card {
        max-height: 93vh;
        border-radius: 20px 20px 13px 13px;
      }

      .portal-room-manage-body {
        padding: 16px;
      }

      .portal-room-manage-summary {
        grid-template-columns: 1fr;
      }

      .portal-room-manage-button-row button {
        width: 100%;
      }
    }
'''

DIALOG_HTML = r'''

  <div class="portal-room-manage-dialog" id="portalRoomManageDialog" hidden onclick="portalDashboardRoomManageBackdrop(event)">
    <section class="portal-room-manage-card" role="dialog" aria-modal="true" aria-labelledby="portalRoomManageTitle">
      <header class="portal-room-manage-head">
        <div>
          <div class="portal-eyebrow">Gestione della stanza</div>
          <h2 id="portalRoomManageTitle">Stanza</h2>
          <p id="portalRoomManageSubtitle">Uscita e cancellazione seguono regole diverse.</p>
        </div>
        <button class="portal-room-manage-close" type="button" onclick="portalDashboardCloseRoomManage()" aria-label="Chiudi gestione stanza">×</button>
      </header>

      <div class="portal-room-manage-body">
        <div class="portal-room-manage-summary" id="portalRoomManageSummary"></div>

        <section class="portal-room-manage-action" data-kind="leave">
          <h3>Lascia la stanza</h3>
          <p id="portalRoomLeaveDescription">La stanza verrà rimossa dalla tua Scrivania. I dati personali non vengono cancellati da questa azione.</p>
          <button class="portal-room-leave-button" id="portalRoomLeaveButton" type="button" onclick="portalDashboardShowLeaveConfirmation()">Lascia la stanza</button>
          <div class="portal-room-manage-confirmation" id="portalRoomLeaveConfirmation" hidden>
            <strong id="portalRoomLeaveConfirmationTitle">Confermi l’uscita?</strong>
            <span id="portalRoomLeaveConfirmationCopy">La tua presenza verrà chiusa e la membership non sarà più attiva.</span>
            <div class="portal-room-manage-button-row" style="margin-top:12px">
              <button class="portal-room-leave-button" id="portalRoomLeaveConfirmButton" type="button" onclick="portalDashboardLeaveRoom()">Sì, lascia la stanza</button>
              <button class="portal-room-cancel-button" type="button" onclick="portalDashboardHideLeaveConfirmation()">Annulla</button>
            </div>
          </div>
        </section>

        <section class="portal-room-manage-action" id="portalRoomDeleteSection" data-kind="delete" hidden>
          <h3>Elimina definitivamente la stanza</h3>
          <p>Solo il proprietario può farlo. Inviti, dati condivisi e file della stanza vengono rimossi per tutti.</p>
          <button class="portal-room-delete-button" id="portalRoomDeleteStartButton" type="button" onclick="portalDashboardShowDeleteConfirmation()">Elimina stanza</button>
          <div class="portal-room-manage-delete" id="portalRoomDeleteConfirmation" hidden>
            <strong>Scrivi ELIMINA STANZA per confermare</strong>
            <span>L’eliminazione completa non equivale a lasciare la stanza e non può essere annullata.</span>
            <input class="portal-room-delete-input" id="portalRoomDeletePhrase" type="text" autocomplete="off" spellcheck="false" placeholder="ELIMINA STANZA" aria-describedby="portalRoomDeleteHelp">
            <span id="portalRoomDeleteHelp">La frase deve corrispondere esattamente.</span>
            <div class="portal-room-manage-button-row" style="margin-top:12px">
              <button class="portal-room-delete-button" id="portalRoomDeleteConfirmButton" type="button" onclick="portalDashboardDeleteRoom()">Conferma eliminazione</button>
              <button class="portal-room-cancel-button" type="button" onclick="portalDashboardHideDeleteConfirmation()">Annulla</button>
            </div>
          </div>
          <div class="portal-room-manage-progress" id="portalRoomDeleteProgress" hidden>
            <div id="portalRoomDeleteStepAccess">Blocco nuovi accessi e revoca inviti</div>
            <div id="portalRoomDeleteStepFiles">Pulizia sicura dei file</div>
            <div id="portalRoomDeleteStepData">Eliminazione dei dati condivisi</div>
          </div>
        </section>

        <div class="portal-room-manage-status" id="portalRoomManageStatus" role="status" aria-live="polite"></div>

        <div class="portal-room-manage-privacy">
          <strong>Demo locale.</strong> La stanza viene rimossa solo dal salvataggio di questo browser. Nell’app ufficiale l’uscita usa `leave_study_room`; la cancellazione usa un flusso server owner-only che blocca prima gli accessi, pulisce Storage e poi elimina il database.
        </div>
      </div>
    </section>
  </div>
'''

JS = r'''

    /* ==========================================================
       DASHBOARD — USCITA E CANCELLAZIONE LOCALI
       ========================================================== */

    let portalDashboardManagedRoomId = null;
    let portalDashboardRoomManagePreviousFocus = null;
    let portalDashboardRoomManageBusy = false;

    function portalDashboardRoomManageStatus(message = "", tone = "") {
      const node = document.getElementById("portalRoomManageStatus");
      if (!node) return;
      node.textContent = message;
      if (tone) node.dataset.tone = tone;
      else node.removeAttribute("data-tone");
    }

    function portalDashboardNextOwner(room) {
      const participants = portalDashboardParticipants(room)
        .filter((participant) => participant.id !== "luca" && participant.status !== "offline");
      return participants.find((participant) => participant.role === "admin")
        || participants.find((participant) => participant.role === "member")
        || null;
    }

    function portalDashboardRenderRoomManage() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardManagedRoomId);
      if (!room) return false;
      const title = document.getElementById("portalRoomManageTitle");
      const subtitle = document.getElementById("portalRoomManageSubtitle");
      const summary = document.getElementById("portalRoomManageSummary");
      const leaveDescription = document.getElementById("portalRoomLeaveDescription");
      const leaveCopy = document.getElementById("portalRoomLeaveConfirmationCopy");
      const deleteSection = document.getElementById("portalRoomDeleteSection");
      const controls = document.querySelectorAll("#portalRoomManageDialog button, #portalRoomManageDialog input");
      const participants = portalDashboardParticipants(room);
      const nextOwner = room.role === "owner" ? portalDashboardNextOwner(room) : null;
      if (title) title.textContent = room.name;
      if (subtitle) subtitle.textContent = `Il tuo ruolo: ${portalDashboardRoleLabels[room.role] || "Partecipante"}.`;
      if (summary) summary.innerHTML = `
        <div class="portal-room-manage-stat"><span>Ruolo</span><strong>${portalDashboardEscape(portalDashboardRoleLabels[room.role] || "Partecipante")}</strong></div>
        <div class="portal-room-manage-stat"><span>Partecipanti</span><strong>${participants.length}</strong></div>
        <div class="portal-room-manage-stat"><span>Codice</span><strong>${portalDashboardEscape(room.inviteCode)}</strong></div>`;
      if (leaveDescription) {
        leaveDescription.textContent = room.role === "owner"
          ? nextOwner
            ? `Lasciando la stanza, la proprietà passerà a ${nextOwner.name}. La stanza resterà attiva per gli altri.`
            : "Sei l’unico partecipante: lasciando la stanza verrà archiviata e il codice invito sarà revocato."
          : "La stanza verrà rimossa dalla tua Scrivania e la tua presenza verrà chiusa. I tuoi dati personali non vengono cancellati da questa azione.";
      }
      if (leaveCopy) {
        leaveCopy.textContent = room.role === "owner"
          ? nextOwner
            ? `${nextOwner.name} diventerà proprietario. La tua membership verrà chiusa.`
            : "Non restando altri partecipanti, la stanza verrà archiviata localmente."
          : "La membership e la presenza non saranno più attive.";
      }
      if (deleteSection) deleteSection.hidden = room.role !== "owner";
      controls.forEach((control) => { control.disabled = portalDashboardRoomManageBusy; });
      return true;
    }

    function portalDashboardOpenRoomManage(roomId, trigger) {
      const dialog = document.getElementById("portalRoomManageDialog");
      const room = portalDashboardState.rooms.find((item) => item.id === roomId);
      if (!dialog || !room) {
        portalDashboardFeedback("La stanza non è più disponibile.", "error");
        return;
      }
      portalDashboardManagedRoomId = roomId;
      portalDashboardRoomManagePreviousFocus = trigger || document.activeElement;
      portalDashboardRoomManageBusy = false;
      portalDashboardRoomManageStatus();
      portalDashboardHideLeaveConfirmation();
      portalDashboardHideDeleteConfirmation();
      portalDashboardResetDeleteProgress();
      portalDashboardRenderRoomManage();
      dialog.hidden = false;
      document.body.classList.add("portal-room-manage-open");
      window.setTimeout(() => document.getElementById("portalRoomLeaveButton")?.focus(), 30);
    }

    function portalDashboardCloseRoomManage() {
      if (portalDashboardRoomManageBusy) return;
      const dialog = document.getElementById("portalRoomManageDialog");
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("portal-room-manage-open");
      portalDashboardManagedRoomId = null;
      portalDashboardRoomManageStatus();
      portalDashboardHideLeaveConfirmation();
      portalDashboardHideDeleteConfirmation();
      portalDashboardResetDeleteProgress();
      if (portalDashboardRoomManagePreviousFocus?.focus) portalDashboardRoomManagePreviousFocus.focus();
      portalDashboardRoomManagePreviousFocus = null;
    }

    function portalDashboardRoomManageBackdrop(event) {
      if (event.target?.id === "portalRoomManageDialog") portalDashboardCloseRoomManage();
    }

    function portalDashboardShowLeaveConfirmation() {
      const confirmation = document.getElementById("portalRoomLeaveConfirmation");
      if (!confirmation || portalDashboardRoomManageBusy) return;
      confirmation.hidden = false;
      portalDashboardRoomManageStatus("Controlla gli effetti dell’uscita e conferma.");
      window.setTimeout(() => document.getElementById("portalRoomLeaveConfirmButton")?.focus(), 20);
    }

    function portalDashboardHideLeaveConfirmation() {
      const confirmation = document.getElementById("portalRoomLeaveConfirmation");
      if (confirmation) confirmation.hidden = true;
    }

    function portalDashboardShowDeleteConfirmation() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardManagedRoomId);
      const confirmation = document.getElementById("portalRoomDeleteConfirmation");
      const input = document.getElementById("portalRoomDeletePhrase");
      if (!room || room.role !== "owner" || !confirmation || portalDashboardRoomManageBusy) {
        portalDashboardRoomManageStatus("Solo il proprietario può eliminare la stanza.", "error");
        return;
      }
      portalDashboardHideLeaveConfirmation();
      confirmation.hidden = false;
      if (input) {
        input.value = "";
        input.setAttribute("aria-invalid", "false");
      }
      portalDashboardRoomManageStatus("Scrivi la frase richiesta per abilitare l’eliminazione.");
      window.setTimeout(() => input?.focus(), 20);
    }

    function portalDashboardHideDeleteConfirmation() {
      const confirmation = document.getElementById("portalRoomDeleteConfirmation");
      const input = document.getElementById("portalRoomDeletePhrase");
      if (confirmation) confirmation.hidden = true;
      if (input) {
        input.value = "";
        input.setAttribute("aria-invalid", "false");
      }
    }

    function portalDashboardResetDeleteProgress() {
      const progress = document.getElementById("portalRoomDeleteProgress");
      if (progress) progress.hidden = true;
      ["portalRoomDeleteStepAccess", "portalRoomDeleteStepFiles", "portalRoomDeleteStepData"].forEach((id) => {
        document.getElementById(id)?.removeAttribute("data-state");
      });
    }

    function portalDashboardSetDeleteStep(activeId, doneIds = []) {
      const progress = document.getElementById("portalRoomDeleteProgress");
      if (progress) progress.hidden = false;
      ["portalRoomDeleteStepAccess", "portalRoomDeleteStepFiles", "portalRoomDeleteStepData"].forEach((id) => {
        const node = document.getElementById(id);
        if (!node) return;
        if (doneIds.includes(id)) node.dataset.state = "done";
        else if (id === activeId) node.dataset.state = "active";
        else node.removeAttribute("data-state");
      });
    }

    function portalDashboardRemoveRoomLocally(roomId) {
      portalDashboardState.rooms = portalDashboardState.rooms.filter((room) => room.id !== roomId);
      portalDashboardSaveRooms();
      portalDashboardRenderRooms();
    }

    async function portalDashboardLeaveRoom() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardManagedRoomId);
      if (!room || portalDashboardRoomManageBusy) return;
      const roomId = room.id;
      const nextOwner = room.role === "owner" ? portalDashboardNextOwner(room) : null;
      portalDashboardRoomManageBusy = true;
      portalDashboardRenderRoomManage();
      portalDashboardRoomManageStatus("Chiusura della presenza e della membership…");
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      portalDashboardRemoveRoomLocally(roomId);
      portalDashboardRoomManageBusy = false;
      const message = room.role === "owner"
        ? nextOwner
          ? `Hai lasciato “${room.name}”. ${nextOwner.name} è il nuovo proprietario.`
          : `Hai lasciato “${room.name}”. Non restando altri membri, la stanza è stata archiviata.`
        : `Hai lasciato “${room.name}”.`;
      const dialog = document.getElementById("portalRoomManageDialog");
      if (dialog) dialog.hidden = true;
      document.body.classList.remove("portal-room-manage-open");
      portalDashboardManagedRoomId = null;
      portalDashboardFeedback(message, "success");
      portalNotify("Uscita dalla stanza completata");
    }

    async function portalDashboardDeleteRoom() {
      const room = portalDashboardState.rooms.find((item) => item.id === portalDashboardManagedRoomId);
      const input = document.getElementById("portalRoomDeletePhrase");
      if (!room || portalDashboardRoomManageBusy) return;
      if (room.role !== "owner") {
        portalDashboardRoomManageStatus("Solo il proprietario può eliminare la stanza.", "error");
        return;
      }
      if (String(input?.value || "").trim() !== "ELIMINA STANZA") {
        input?.setAttribute("aria-invalid", "true");
        portalDashboardRoomManageStatus("La frase non corrisponde. Scrivi esattamente ELIMINA STANZA.", "error");
        input?.focus();
        return;
      }

      const roomId = room.id;
      portalDashboardRoomManageBusy = true;
      input?.setAttribute("aria-invalid", "false");
      portalDashboardRenderRoomManage();
      portalDashboardHideDeleteConfirmation();
      portalDashboardRoomManageStatus("Eliminazione sicura in corso…");

      portalDashboardSetDeleteStep("portalRoomDeleteStepAccess");
      await new Promise((resolve) => window.setTimeout(resolve, 360));
      portalDashboardSetDeleteStep("portalRoomDeleteStepFiles", ["portalRoomDeleteStepAccess"]);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      portalDashboardSetDeleteStep("portalRoomDeleteStepData", ["portalRoomDeleteStepAccess", "portalRoomDeleteStepFiles"]);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      portalDashboardSetDeleteStep("", ["portalRoomDeleteStepAccess", "portalRoomDeleteStepFiles", "portalRoomDeleteStepData"]);

      portalDashboardRemoveRoomLocally(roomId);
      portalDashboardRoomManageBusy = false;
      const dialog = document.getElementById("portalRoomManageDialog");
      if (dialog) dialog.hidden = true;
      document.body.classList.remove("portal-room-manage-open");
      portalDashboardManagedRoomId = null;
      portalDashboardFeedback(`La stanza “${room.name}” è stata eliminata dalla demo locale.`, "success");
      portalNotify("Stanza eliminata dalla demo");
    }

    window.addEventListener("keydown", (event) => {
      const dialog = document.getElementById("portalRoomManageDialog");
      if (event.key === "Escape" && dialog && !dialog.hidden && !portalDashboardRoomManageBusy) {
        event.preventDefault();
        portalDashboardCloseRoomManage();
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
        "    /* ==========================================================\n       DASHBOARD REALE — CODICE INVITO 1.2.0-alpha.3",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — CODICE INVITO 1.2.0-alpha.3",
        "invite CSS marker",
    )

    html = replace_once(
        html,
        '  <div class="portal-invite-dialog" id="portalInviteDialog" hidden onclick="portalDashboardInviteBackdrop(event)">',
        DIALOG_HTML + '\n  <div class="portal-invite-dialog" id="portalInviteDialog" hidden onclick="portalDashboardInviteBackdrop(event)">',
        "invite dialog",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD — CODICE INVITO LOCALE E DETERMINISTICO",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD — CODICE INVITO LOCALE E DETERMINISTICO",
        "invite JS marker",
    )

    html = replace_once(
        html,
        '''            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>''',
        '''            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>
            <button class="portal-room-manage-button" type="button" onclick="portalDashboardOpenRoomManage('${portalDashboardEscape(room.id)}', this)">Gestisci</button>''',
        "room preview buttons",
    )

    load_pattern = re.compile(
        r"    function portalDashboardLoadRooms\(\) \{.*?\n    \}\n\n    function portalDashboardSaveRooms",
        re.DOTALL,
    )
    load_replacement = '''    function portalDashboardLoadRooms() {
      const storedRaw = localStorage.getItem(portalDashboardRoomsStorageKey);
      if (storedRaw === null) {
        portalDashboardState.rooms = portalDashboardDefaultRooms.map((room) => ({ ...room }));
        return;
      }
      let stored = [];
      try {
        stored = JSON.parse(storedRaw);
      } catch {
        stored = [];
      }
      portalDashboardState.rooms = Array.isArray(stored)
        ? stored.map(portalDashboardNormalizeRoom).filter(Boolean)
        : [];
    }

    function portalDashboardSaveRooms'''
    html, count = load_pattern.subn(load_replacement, html, count=1)
    if count != 1:
        raise RuntimeError(f"Load rooms function expected once, found {count}")

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        'id="portalRoomManageDialog"',
        'id="portalRoomDeletePhrase"',
        'id="portalRoomDeleteProgress"',
        "function portalDashboardLeaveRoom(",
        "function portalDashboardDeleteRoom(",
        "function portalDashboardNextOwner(",
        "ELIMINA STANZA",
        "leave_study_room",
        "portal-room-manage-button",
        "storedRaw === null",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: uscita e cancellazione stanza.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Dashboard — uscita e cancellazione stanza\n\n- Aggiunto il comando `Gestisci` su ogni stanza.\n- Aggiunta uscita con conferma e chiusura della presenza/membership simulata.\n- Per il proprietario viene mostrato il passaggio di proprietà ad admin o partecipante.\n- Se il proprietario è solo, l'uscita archivia la stanza e revoca l'invito nella rappresentazione demo.\n- Aggiunta cancellazione completa owner-only con frase `ELIMINA STANZA`.\n- Aggiunte fasi visibili: blocco accessi, pulizia file, eliminazione dati condivisi.\n- Corretto il caricamento locale: una Dashboard volutamente vuota resta vuota dopo il refresh.\n- Aggiunti Escape, backdrop, ripristino focus e responsive.\n- Conservati create/join, presenza, inviti, Catalogo, Aula, Eve, chat e audio.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.3]", entry + "## [1.2.0-alpha.3]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Uscita e cancellazione Dashboard"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- uscita per owner/admin/member;\n- trasferimento proprietà simulato;\n- archiviazione stanza senza altri membri;\n- cancellazione owner-only;\n- conferma testuale distruttiva;\n- fasi di cancellazione sicura;\n- persistenza corretta dello stato vuoto;\n- dialog accessibile e responsive.\n\nDa verificare manualmente:\n\n- uscita da stanza partecipata;\n- uscita owner con nuovo proprietario;\n- cancellazione owner-only;\n- frase errata e corretta;\n- permanenza della rimozione dopo refresh;\n- creazione nuova stanza dopo Dashboard vuota;\n- Escape, focus e mobile.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Uscita e cancellazione nella Dashboard demo"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} rappresenta gli effetti utente di `leave_study_room` e del route `DELETE /api/rooms/[roomId]` con stato locale. L'uscita trasferisce simbolicamente la proprietà prima a un admin e poi a un membro; se non resta nessuno, la stanza viene rimossa dalla Scrivania come archiviata.\n\nLa cancellazione è visibile solo agli owner, richiede `ELIMINA STANZA` e mostra le tre fasi del flusso reale: tombstone/revoca inviti, pulizia Storage, cancellazione database. Autorizzazione, transazioni e idempotenza restano responsabilità dell'app ufficiale.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: codice invito | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.3 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: codice invito | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.3. |",
    )
    row = f"| Fase 2 | Dashboard: uscita/cancellazione | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 2 | Dashboard: uscita/cancellazione |" not in approvals:
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
