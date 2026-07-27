(() => {
  "use strict";

  const tauri = window.__TAURI__;
  const previewMode =
    ["127.0.0.1", "localhost"].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get("desktopUpdaterPreview") === "1";
  const previewInvoke = async (command) => {
    if (command === "check_for_update") {
      return {
        version: "1.4.0-alpha.3",
        currentVersion: "1.4.0-alpha.2",
        body: "Simulazione locale: pannello aggiornamenti funzionante."
      };
    }
    if (command === "install_pending_update") {
      throw new Error("L'anteprima locale non installa aggiornamenti.");
    }
    throw new Error("Comando di anteprima non riconosciuto.");
  };
  const invoke = tauri?.core?.invoke || (previewMode ? previewInvoke : null);
  if (typeof invoke !== "function") return;

  document.querySelectorAll("[data-web-install]").forEach((element) => element.remove());

  const appVersion =
    document.querySelector('meta[name="aula-demo-version"]')?.content || "sconosciuta";
  const storageKey = "aula-desktop-update-last-check";
  const checkInterval = 6 * 60 * 60 * 1000;

  const state = {
    checking: false,
    installing: false,
    update: null,
    message: `Versione installata ${appVersion}`
  };

  const style = document.createElement("style");
  style.textContent = `
    .aula-desktop-update-launcher {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 99990;
      min-height: 38px;
      padding: 9px 13px;
      border: 1px solid rgba(90, 220, 255, .48);
      border-radius: 999px;
      color: #dffaff;
      background: rgba(5, 15, 28, .94);
      box-shadow: 0 10px 35px rgba(0, 0, 0, .34), 0 0 18px rgba(42, 201, 255, .14);
      font: 700 12px/1.2 Inter, system-ui, sans-serif;
      cursor: pointer;
    }
    .aula-desktop-update-launcher[data-update="true"] {
      border-color: #55f1c0;
      color: #8fffdc;
      animation: aula-update-pulse 2.4s ease-in-out infinite;
    }
    .aula-desktop-update-panel {
      position: fixed;
      right: 18px;
      bottom: 66px;
      z-index: 99991;
      width: min(390px, calc(100vw - 36px));
      padding: 18px;
      border: 1px solid rgba(90, 220, 255, .42);
      border-radius: 18px;
      color: #eefcff;
      background: rgba(5, 14, 27, .98);
      box-shadow: 0 24px 70px rgba(0, 0, 0, .55);
      font: 14px/1.5 Inter, system-ui, sans-serif;
    }
    .aula-desktop-update-panel[hidden] { display: none; }
    .aula-desktop-update-panel h2 { margin: 0 0 6px; font-size: 18px; }
    .aula-desktop-update-panel p { margin: 7px 0; color: #b9d5df; }
    .aula-desktop-update-panel .aula-update-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
      margin-top: 14px;
    }
    .aula-desktop-update-panel button,
    .aula-desktop-settings-update button {
      min-height: 36px;
      padding: 8px 12px;
      border: 1px solid rgba(90, 220, 255, .42);
      border-radius: 10px;
      color: #ecfbff;
      background: rgba(36, 91, 117, .44);
      cursor: pointer;
    }
    .aula-desktop-update-panel button[data-primary="true"] {
      color: #04151b;
      border-color: #63f0c4;
      background: #63f0c4;
      font-weight: 800;
    }
    .aula-desktop-update-panel button:disabled { opacity: .55; cursor: wait; }
    .aula-update-progress {
      height: 5px;
      margin-top: 12px;
      overflow: hidden;
      border-radius: 999px;
      background: rgba(255, 255, 255, .12);
    }
    .aula-update-progress::after {
      content: "";
      display: block;
      width: 42%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #3fcfff, #71f5c8);
      animation: aula-update-loading 1.1s ease-in-out infinite alternate;
    }
    .aula-desktop-settings-update { margin-top: 14px; }
    @keyframes aula-update-loading {
      from { transform: translateX(-15%); }
      to { transform: translateX(155%); }
    }
    @keyframes aula-update-pulse {
      50% { box-shadow: 0 0 0 5px rgba(85, 241, 192, .10), 0 0 24px rgba(85, 241, 192, .22); }
    }
    @media (prefers-reduced-motion: reduce) {
      .aula-desktop-update-launcher,
      .aula-update-progress::after { animation: none; }
    }
  `;
  document.head.append(style);

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "aula-desktop-update-launcher";
  launcher.textContent = "Aggiornamenti";
  launcher.title = `Aula Studio Virtuale ${appVersion}`;

  const panel = document.createElement("section");
  panel.className = "aula-desktop-update-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Aggiornamenti dell'applicazione");
  panel.innerHTML = `
    <h2>Aggiornamenti</h2>
    <p data-update-version></p>
    <p data-update-message></p>
    <div class="aula-update-progress" data-update-progress hidden></div>
    <div class="aula-update-actions">
      <button type="button" data-update-check>Controlla ora</button>
      <button type="button" data-update-install data-primary="true" hidden>Scarica e installa</button>
      <button type="button" data-update-close>Chiudi</button>
    </div>
  `;

  document.body.append(panel, launcher);

  const versionElement = panel.querySelector("[data-update-version]");
  const messageElement = panel.querySelector("[data-update-message]");
  const progressElement = panel.querySelector("[data-update-progress]");
  const checkButton = panel.querySelector("[data-update-check]");
  const installButton = panel.querySelector("[data-update-install]");

  function render() {
    versionElement.textContent = state.update
      ? `Nuova versione: ${state.update.version} · installata: ${state.update.currentVersion || appVersion}`
      : `Versione installata: ${appVersion}`;
    messageElement.textContent = state.message;
    launcher.dataset.update = String(Boolean(state.update));
    launcher.textContent = state.update ? `Aggiorna a ${state.update.version}` : "Aggiornamenti";
    installButton.hidden = !state.update;
    progressElement.hidden = !state.checking && !state.installing;
    checkButton.disabled = state.checking || state.installing;
    installButton.disabled = state.checking || state.installing;
  }

  function openPanel() {
    panel.hidden = false;
    render();
  }

  function closePanel() {
    panel.hidden = true;
  }

  async function checkForUpdates({ automatic = false } = {}) {
    if (state.checking || state.installing) return;
    state.checking = true;
    state.message = "Controllo della versione disponibile…";
    if (!automatic) openPanel();
    render();

    try {
      const update = await invoke("check_for_update");
      state.update = update;
      state.message = update
        ? (update.body || "L'aggiornamento è pronto per il download.")
        : "L'app è aggiornata.";
      localStorage.setItem(storageKey, String(Date.now()));
      if (update) openPanel();
    } catch (error) {
      state.update = null;
      state.message = String(error).includes("endpoint")
        ? "Gli aggiornamenti automatici non sono configurati in questa build di prova."
        : `Controllo non riuscito: ${String(error)}`;
      if (!automatic) openPanel();
    } finally {
      state.checking = false;
      render();
    }
  }

  async function installUpdate() {
    if (!state.update || state.installing) return;
    state.installing = true;
    state.message = "Download e installazione in corso. L'app si riavvierà automaticamente.";
    render();
    try {
      await invoke("install_pending_update");
    } catch (error) {
      state.installing = false;
      state.message = `Installazione non riuscita: ${String(error)}`;
      render();
    }
  }

  launcher.addEventListener("click", openPanel);
  panel.querySelector("[data-update-close]").addEventListener("click", closePanel);
  checkButton.addEventListener("click", () => checkForUpdates());
  installButton.addEventListener("click", installUpdate);

  function addSettingsSection() {
    const modalContent = document.getElementById("modalContent");
    if (!modalContent || modalContent.querySelector(".aula-desktop-settings-update")) return;
    modalContent.querySelectorAll("[data-web-install]").forEach((element) => element.remove());
    const section = document.createElement("div");
    section.className = "drawer-section aula-desktop-settings-update";
    section.innerHTML = `
      <h3>Applicazione desktop</h3>
      <p>Versione installata ${appVersion}. Gli aggiornamenti vengono scaricati soltanto dopo la tua conferma.</p>
      <button type="button">Controlla aggiornamenti</button>
    `;
    section.querySelector("button").addEventListener("click", () => checkForUpdates());
    modalContent.append(section);
  }

  function connectSettingsModal() {
    if (typeof window.openModal !== "function" || window.openModal.__aulaDesktopWrapped) {
      return;
    }
    const originalOpenModal = window.openModal;
    const wrappedOpenModal = function aulaDesktopOpenModal(type, ...args) {
      const result = originalOpenModal.call(this, type, ...args);
      if (type === "impostazioni") addSettingsSection();
      return result;
    };
    wrappedOpenModal.__aulaDesktopWrapped = true;
    window.openModal = wrappedOpenModal;
  }

  connectSettingsModal();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectSettingsModal, { once: true });
  } else {
    window.setTimeout(connectSettingsModal, 0);
  }

  window.AulaDesktopUpdates = {
    check: checkForUpdates,
    install: installUpdate,
    open: openPanel
  };

  render();
  const lastCheck = Number(localStorage.getItem(storageKey) || 0);
  if (Date.now() - lastCheck > checkInterval) {
    window.setTimeout(() => checkForUpdates({ automatic: true }), 2500);
  }
})();
