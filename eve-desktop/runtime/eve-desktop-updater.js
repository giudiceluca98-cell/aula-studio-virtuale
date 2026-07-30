(() => {
  "use strict";

  const tauri = window.__TAURI__;
  const previewMode =
    ["127.0.0.1", "localhost"].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get("desktopUpdaterPreview") === "1";

  const previewInvoke = async (command) => {
    if (command === "check_for_update") {
      return {
        version: "1.2.0-alpha.7",
        currentVersion: "1.2.0-alpha.6",
        body: "Simulazione locale dell'aggiornamento di Eve AI Studio."
      };
    }
    if (command === "install_pending_update") {
      throw new Error("L'anteprima locale non installa aggiornamenti.");
    }
    if (command === "select_local_update") {
      return {
        version: "1.2.0-alpha.7",
        currentVersion: "1.2.0-alpha.6",
        body: "Installer ufficiale selezionato dal computer.",
        source: "local"
      };
    }
    throw new Error("Comando di anteprima non riconosciuto.");
  };

  const invoke = tauri?.core?.invoke || (previewMode ? previewInvoke : null);
  if (typeof invoke !== "function") return;

  const appVersion =
    document.querySelector('meta[name="eve-desktop-version"]')?.content || "sconosciuta";
  const storageKey = "eve-desktop-update-last-check";
  const checkInterval = 6 * 60 * 60 * 1000;
  const state = {
    checking: false,
    installing: false,
    update: null,
    message: `Versione installata ${appVersion}`
  };

  const actions = document.querySelector(".topbar .actions");
  if (!actions) return;

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "btn eve-desktop-update-button";
  launcher.innerHTML =
    '<span class="eve-desktop-update-dot" aria-hidden="true"></span>' +
    '<span data-update-label>Aggiornamenti</span>';
  launcher.title = `Eve AI Studio ${appVersion}`;

  const backdrop = document.createElement("div");
  backdrop.className = "eve-desktop-update-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <section class="eve-desktop-update-dialog" role="dialog" aria-modal="true"
      aria-labelledby="eveDesktopUpdateTitle">
      <header class="eve-desktop-update-head">
        <div>
          <h2 id="eveDesktopUpdateTitle">Aggiornamenti di Eve AI Studio</h2>
          <p data-update-version>Versione installata: ${appVersion}</p>
        </div>
        <button type="button" class="eve-desktop-update-close"
          aria-label="Chiudi aggiornamenti">×</button>
      </header>
      <div class="eve-desktop-update-body">
        <p data-update-message>${state.message}</p>
        <div class="eve-desktop-update-progress" data-update-progress hidden></div>
        <div class="eve-desktop-update-actions">
          <button type="button" class="btn" data-update-check>Controlla ora</button>
          <button type="button" class="btn" data-update-local>
            Scegli dal computer
          </button>
          <button type="button" class="btn primary" data-update-install hidden>
            Scarica e installa
          </button>
        </div>
      </div>
    </section>
  `;

  actions.prepend(launcher);
  document.body.append(backdrop);

  const label = launcher.querySelector("[data-update-label]");
  const versionElement = backdrop.querySelector("[data-update-version]");
  const messageElement = backdrop.querySelector("[data-update-message]");
  const progressElement = backdrop.querySelector("[data-update-progress]");
  const checkButton = backdrop.querySelector("[data-update-check]");
  const localButton = backdrop.querySelector("[data-update-local]");
  const installButton = backdrop.querySelector("[data-update-install]");
  const closeButton = backdrop.querySelector(".eve-desktop-update-close");

  function render() {
    versionElement.textContent = state.update
      ? `Nuova versione: ${state.update.version} · installata: ${
          state.update.currentVersion || appVersion
        }`
      : `Versione installata: ${appVersion}`;
    messageElement.textContent = state.message;
    launcher.dataset.update = String(Boolean(state.update));
    label.textContent = state.update ? `Aggiorna a ${state.update.version}` : "Aggiornamenti";
    installButton.hidden = !state.update;
    progressElement.hidden = !state.checking && !state.installing;
    checkButton.disabled = state.checking || state.installing;
    localButton.disabled = state.checking || state.installing;
    installButton.disabled = state.checking || state.installing;
  }

  function openDialog() {
    backdrop.hidden = false;
    closeButton.focus();
    render();
  }

  function closeDialog() {
    if (state.installing) return;
    backdrop.hidden = true;
    launcher.focus();
  }

  async function checkForUpdates({ automatic = false } = {}) {
    if (state.checking || state.installing) return;
    state.checking = true;
    state.message = "Controllo della versione disponibile…";
    if (!automatic) openDialog();
    render();

    try {
      const update = await invoke("check_for_update");
      state.update = update;
      state.message = update
        ? update.body || "L'aggiornamento è pronto per il download."
        : "Eve AI Studio è aggiornata.";
      localStorage.setItem(storageKey, String(Date.now()));
      if (update) openDialog();
    } catch (error) {
      state.update = null;
      state.message = String(error).toLowerCase().includes("endpoint")
        ? "Questa build locale non è collegata al canale degli aggiornamenti."
        : `Controllo non riuscito: ${String(error)}`;
      if (!automatic) openDialog();
    } finally {
      state.checking = false;
      render();
    }
  }

  async function installUpdate() {
    if (!state.update || state.installing) return;
    state.installing = true;
    state.message =
      "Download e installazione in corso. Eve AI Studio si riavvierà automaticamente.";
    render();
    try {
      await invoke("install_pending_update");
    } catch (error) {
      state.installing = false;
      state.message = `Installazione non riuscita: ${String(error)}`;
      render();
    }
  }

  async function selectLocalUpdate() {
    if (state.checking || state.installing) return;
    state.checking = true;
    state.message = "Verifica della release ufficiale e scelta del file…";
    openDialog();
    render();
    try {
      const update = await invoke("select_local_update");
      if (!update) {
        state.message = "Selezione annullata.";
        return;
      }
      state.update = update;
      state.message =
        `File ufficiale ${update.version} verificato. ` +
        "Puoi procedere con l'installazione.";
    } catch (error) {
      state.update = null;
      state.message = `File non accettato: ${String(error)}`;
    } finally {
      state.checking = false;
      render();
    }
  }

  launcher.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  checkButton.addEventListener("click", () => checkForUpdates());
  localButton.addEventListener("click", selectLocalUpdate);
  installButton.addEventListener("click", installUpdate);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !backdrop.hidden) closeDialog();
  });

  window.EveDesktopUpdates = {
    check: checkForUpdates,
    selectLocal: selectLocalUpdate,
    install: installUpdate,
    open: openDialog
  };

  render();
  const lastCheck = Number(localStorage.getItem(storageKey) || 0);
  if (Date.now() - lastCheck > checkInterval) {
    window.setTimeout(() => checkForUpdates({ automatic: true }), 2500);
  }
})();
