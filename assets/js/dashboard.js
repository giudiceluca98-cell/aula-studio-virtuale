
const routeUrls = {
  presentation: "/",
  dashboard: "/dashboard",
  catalog: "/catalog",
  aula: "/room/"
};

function navigatePortal(route) {
  const destination = routeUrls[route] || routeUrls.presentation;
  window.location.assign(destination);
}

function portalNotify(message) {
  const toast = document.getElementById("portalToast") || document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(portalNotify.timeout);
  portalNotify.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function portalScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function readVisualPreferences() {
  try {
    return JSON.parse(localStorage.getItem("aula-demo-layout-reale") || "{}") || {};
  } catch {
    return {};
  }
}

function writeVisualPreferences(next) {
  try {
    localStorage.setItem("aula-demo-layout-reale", JSON.stringify(next));
  } catch {
    // La pagina resta utilizzabile anche quando la persistenza locale è bloccata.
  }
}

function applySharedVisualPreferences() {
  const preferences = readVisualPreferences();
  document.body.classList.toggle("dark", Boolean(preferences.dark));
  document.body.dataset.graphicsMode = ["full", "optimized", "reduced"].includes(preferences.graphicsMode)
    ? preferences.graphicsMode
    : "optimized";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const preferences = readVisualPreferences();
  preferences.dark = document.body.classList.contains("dark");
  writeVisualPreferences(preferences);
}

applySharedVisualPreferences();

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
          <div class="portal-room-preview-actions">
            <button class="portal-room-catalog-button" type="button" onclick="portalDashboardOpenCatalogForRoom('${portalDashboardEscape(room.id)}')">Catalogo</button>
            <button class="portal-room-details-button" type="button" onclick="portalDashboardOpenPresence('${portalDashboardEscape(room.id)}', this)">Dettagli</button>
            <button class="portal-room-invite-button" type="button" onclick="portalDashboardOpenInvite('${portalDashboardEscape(room.id)}', this)">Invito</button>
            <button class="portal-room-manage-button" type="button" onclick="portalDashboardOpenRoomManage('${portalDashboardEscape(room.id)}', this)">Gestisci</button>
          </div>
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
      loading: false,
      retryAction: null,
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
        createdAt: Number(room.createdAt || Date.now()),
        inviteRevision: Math.max(0, Number(room.inviteRevision || 0)),
        inviteRotatedAt: room.inviteRotatedAt ? String(room.inviteRotatedAt) : null
      };
    }

    function portalDashboardLoadRooms() {
      return portalDashboardSafeLoadRooms();
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
      portalDashboardRenderRoomsWithPresence();
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
      portalDashboardDismissState();
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
      portalDashboardDismissState();
      if (code.length < 8) {
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Il codice deve contenere almeno 8 caratteri.", "error");
        input?.focus();
        return;
      }

      portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Verifica del codice in corso…");
      portalDashboardSetWorking("join", true);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      if (portalDashboardHandleDemoJoinError(code, input)) return;
      const localRoom = portalDashboardState.rooms.find((room) => room.inviteCode === code);
      if (localRoom) {
        portalDashboardSetWorking("join", false);
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Sei già membro di questa stanza.");
        portalDashboardFeedback(`La stanza “${localRoom.name}” è già presente nella tua scrivania.`, "success");
        portalDashboardRenderRooms();
        return;
      }
      const invitedRoom = portalDashboardInvites[code];
      if (!invitedRoom) {
        portalDashboardSetWorking("join", false);
        portalDashboardFieldFeedback("portalInviteCode", "portalJoinRoomHelp", "Codice errato o non più valido. Prova STUDY2026.", "error");
        portalDashboardFeedback("Non è stato possibile entrare: il codice non corrisponde a una stanza attiva.", "error");
        portalDashboardShowState("invalid-code", "Codice non valido", "Il codice non corrisponde a una stanza attiva oppure è stato revocato. Nessuna stanza è stata aggiunta.", { code, focus: false });
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

    async function portalDashboardInit() {
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
       CATALOGO INTELLIGENTE — DATI E INTERAZIONI DETERMINISTICHE
       ========================================================== */



portalDashboardInit();


/* API usata dagli attributi interattivi della demo canonica. */
if (typeof aulaMaterialAddBackdrop === "function") window.aulaMaterialAddBackdrop = aulaMaterialAddBackdrop;
if (typeof aulaMaterialAddClose === "function") window.aulaMaterialAddClose = aulaMaterialAddClose;
if (typeof aulaMaterialAddSetMode === "function") window.aulaMaterialAddSetMode = aulaMaterialAddSetMode;
if (typeof aulaMaterialAddSubmit === "function") window.aulaMaterialAddSubmit = aulaMaterialAddSubmit;
if (typeof aulaMaterialUpdateClassificationPreview === "function") window.aulaMaterialUpdateClassificationPreview = aulaMaterialUpdateClassificationPreview;
if (typeof navigatePortal === "function") window.navigatePortal = navigatePortal;
if (typeof portalDashboardCatalogSelectionChanged === "function") window.portalDashboardCatalogSelectionChanged = portalDashboardCatalogSelectionChanged;
if (typeof portalDashboardCloseInvite === "function") window.portalDashboardCloseInvite = portalDashboardCloseInvite;
if (typeof portalDashboardClosePresence === "function") window.portalDashboardClosePresence = portalDashboardClosePresence;
if (typeof portalDashboardCloseRoomManage === "function") window.portalDashboardCloseRoomManage = portalDashboardCloseRoomManage;
if (typeof portalDashboardCopyInvite === "function") window.portalDashboardCopyInvite = portalDashboardCopyInvite;
if (typeof portalDashboardCreateRoom === "function") window.portalDashboardCreateRoom = portalDashboardCreateRoom;
if (typeof portalDashboardDeleteRoom === "function") window.portalDashboardDeleteRoom = portalDashboardDeleteRoom;
if (typeof portalDashboardDismissState === "function") window.portalDashboardDismissState = portalDashboardDismissState;
if (typeof portalDashboardHideDeleteConfirmation === "function") window.portalDashboardHideDeleteConfirmation = portalDashboardHideDeleteConfirmation;
if (typeof portalDashboardHideInviteConfirmation === "function") window.portalDashboardHideInviteConfirmation = portalDashboardHideInviteConfirmation;
if (typeof portalDashboardHideLeaveConfirmation === "function") window.portalDashboardHideLeaveConfirmation = portalDashboardHideLeaveConfirmation;
if (typeof portalDashboardInviteBackdrop === "function") window.portalDashboardInviteBackdrop = portalDashboardInviteBackdrop;
if (typeof portalDashboardJoinRoom === "function") window.portalDashboardJoinRoom = portalDashboardJoinRoom;
if (typeof portalDashboardLeaveRoom === "function") window.portalDashboardLeaveRoom = portalDashboardLeaveRoom;
if (typeof portalDashboardOpenCatalogForRoom === "function") window.portalDashboardOpenCatalogForRoom = portalDashboardOpenCatalogForRoom;
if (typeof portalDashboardOpenCatalogFromBanner === "function") window.portalDashboardOpenCatalogFromBanner = portalDashboardOpenCatalogFromBanner;
if (typeof portalDashboardOpenInvite === "function") window.portalDashboardOpenInvite = portalDashboardOpenInvite;
if (typeof portalDashboardOpenPresence === "function") window.portalDashboardOpenPresence = portalDashboardOpenPresence;
if (typeof portalDashboardOpenRoom === "function") window.portalDashboardOpenRoom = portalDashboardOpenRoom;
if (typeof portalDashboardOpenRoomManage === "function") window.portalDashboardOpenRoomManage = portalDashboardOpenRoomManage;
if (typeof portalDashboardPresenceBackdrop === "function") window.portalDashboardPresenceBackdrop = portalDashboardPresenceBackdrop;
if (typeof portalDashboardRetryLastAction === "function") window.portalDashboardRetryLastAction = portalDashboardRetryLastAction;
if (typeof portalDashboardRoomManageBackdrop === "function") window.portalDashboardRoomManageBackdrop = portalDashboardRoomManageBackdrop;
if (typeof portalDashboardRotateInvite === "function") window.portalDashboardRotateInvite = portalDashboardRotateInvite;
if (typeof portalDashboardShowDeleteConfirmation === "function") window.portalDashboardShowDeleteConfirmation = portalDashboardShowDeleteConfirmation;
if (typeof portalDashboardShowInviteConfirmation === "function") window.portalDashboardShowInviteConfirmation = portalDashboardShowInviteConfirmation;
if (typeof portalDashboardShowLeaveConfirmation === "function") window.portalDashboardShowLeaveConfirmation = portalDashboardShowLeaveConfirmation;
if (typeof toggleDarkMode === "function") window.toggleDarkMode = toggleDarkMode;
