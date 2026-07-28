(() => {
  const laboratory = document.getElementById("laboratory");
  const chatLayout = laboratory?.querySelector(".chat-layout");
  if (!laboratory || !chatLayout || document.getElementById("modelTestWorkspace")) return;

  const profilesKey = "eve-studio-model-profiles-v1";
  const activeModelKey = "eve-studio-active-model-v1";
  const modes = ["adaptive_explanation", "socratic", "quiz", "correction", "planning"];
  const modeLabels = {
    adaptive_explanation: "Spiegazione adattiva",
    socratic: "Metodo socratico",
    quiz: "Quiz e interrogazione",
    correction: "Correzione guidata",
    planning: "Pianificazione",
  };
  const sessionModeLabels = {
    adaptive_explanation: "Spiegazione adattiva",
    socratic: "Metodo socratico",
    quiz: "Interrogazione",
    correction: "Correzione",
    planning: "Pianificazione",
  };
  const parameterLabels = {
    tone: {
      calm_direct: "Calmo e diretto",
      friendly: "Amichevole",
      technical: "Tecnico",
    },
    sources: {
      required: "Obbligatorie",
      when_available: "Quando disponibili",
      disabled: "Disattivate",
    },
    solution: {
      guided: "Guida prima della soluzione",
      direct: "Risposta diretta",
      never_immediate: "Mai immediata",
    },
    memory: {
      consent: "Con consenso",
      session_only: "Solo sessione",
      off: "Disattivata",
    },
    tools: {
      propose: "Solo proposta",
      read_only: "Sola lettura",
      confirm: "Con conferma",
    },
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };
  const loadProfiles = () => readJson(profilesKey, {});
  const loadActiveMode = () => {
    const stored = localStorage.getItem(activeModelKey);
    return modes.includes(stored) ? stored : "adaptive_explanation";
  };

  const workspace = document.createElement("section");
  workspace.id = "modelTestWorkspace";
  workspace.className = "panel model-test-panel";
  workspace.innerHTML = `
    <div class="panel-head">
      <div>
        <h3>Modello in prova</h3>
        <p>Qui non modifichi Eve: scegli un modello salvato, provalo nella chat e poi invialo a Pubblica.</p>
      </div>
      <span class="tag warn" id="modelTestStatus">Da verificare</span>
    </div>
    <div class="panel-body model-test-layout">
      <div class="field">
        <label for="modelTestSelect">Modello da provare</label>
        <select id="modelTestSelect">
          ${modes.map((mode) => `<option value="${mode}">${modeLabels[mode]}</option>`).join("")}
        </select>
      </div>
      <div class="model-test-summary" id="modelTestSummary"></div>
      <button class="btn primary" id="sendTestedModelToPublish" type="button">Invia a Pubblica</button>
    </div>
    <p class="model-test-note" id="modelTestNote">Le modifiche permanenti si effettuano esclusivamente in “Modelli e comportamento”.</p>
  `;
  laboratory.insertBefore(workspace, laboratory.firstElementChild);

  const modelSelect = document.getElementById("modelTestSelect");
  const sendButton = document.getElementById("sendTestedModelToPublish");
  let activeMode = loadActiveMode();

  const setSwitch = (selector, enabled) => {
    const node = document.querySelector(selector);
    if (!node) return;
    node.classList.toggle("on", enabled);
    node.disabled = true;
    node.setAttribute("aria-disabled", "true");
  };

  const applyProfileToChat = (profile) => {
    if (!profile) return;
    const modeSelect = document.getElementById("modeSelect");
    const wantedMode = sessionModeLabels[profile.mode];
    if (modeSelect) {
      const option = [...modeSelect.options].find((item) => item.textContent === wantedMode);
      if (option) modeSelect.value = option.value;
      modeSelect.disabled = true;
    }

    const depthRange = document.getElementById("depthRange");
    if (depthRange) {
      depthRange.value = String(profile.depth || 2);
      depthRange.dispatchEvent(new Event("input", {bubbles: true}));
      depthRange.disabled = true;
    }

    setSwitch('[data-toggle="sources"]', profile.sources === "required");
    setSwitch('[data-toggle="memory"]', profile.memory === "consent");

    const actionSelect = document.querySelector(".chat-side .control:last-of-type select");
    if (actionSelect) {
      actionSelect.selectedIndex = {propose: 0, read_only: 1, confirm: 2}[profile.tools] ?? 0;
      actionSelect.disabled = true;
    }

    const sidePanel = document.querySelector(".chat-side");
    if (sidePanel && !document.getElementById("modelTestReadOnlyNote")) {
      const note = document.createElement("p");
      note.id = "modelTestReadOnlyNote";
      note.className = "model-test-readonly-note";
      note.textContent = "Parametri applicati dal modello salvato. Per modificarli torna a “Modelli e comportamento”.";
      sidePanel.insertBefore(note, sidePanel.querySelector(".btn"));
    }
  };

  const render = () => {
    const profiles = loadProfiles();
    const profile = profiles[activeMode];
    modelSelect.value = activeMode;
    localStorage.setItem(activeModelKey, activeMode);

    const status = document.getElementById("modelTestStatus");
    const summary = document.getElementById("modelTestSummary");
    const note = document.getElementById("modelTestNote");
    const activeRules = Array.isArray(profile?.ruleIds) ? profile.ruleIds.length : 0;
    const isSaved = Boolean(profile?.savedAt);

    status.textContent = isSaved ? "Modello salvato" : "Da salvare";
    status.className = isSaved ? "tag" : "tag warn";
    sendButton.disabled = !isSaved;
    summary.textContent = profile
      ? [
          `${modeLabels[activeMode]} · profondità ${profile.depth || 2}/4 · ${activeRules} ${activeRules === 1 ? "regola" : "regole"}`,
          `Obiettivo: ${profile.objective || "Non definito"}`,
          `Tono: ${parameterLabels.tone[profile.tone] || profile.tone} · Soluzioni: ${parameterLabels.solution[profile.solution] || profile.solution}`,
          `Fonti: ${parameterLabels.sources[profile.sources] || profile.sources} · Memoria: ${parameterLabels.memory[profile.memory] || profile.memory} · Azioni: ${parameterLabels.tools[profile.tools] || profile.tools}`,
        ].join("\n")
      : `${modeLabels[activeMode]} non è ancora stato configurato.`;
    note.textContent = isSaved
      ? `Configurazione salvata ${new Date(profile.savedAt).toLocaleString("it-IT")}. Le modifiche permanenti si effettuano in “Modelli e comportamento”.`
      : "Salva prima questo modello in “Modelli e comportamento”; poi potrai provarlo e inviarlo a Pubblica.";
    applyProfileToChat(profile);
  };

  modelSelect.addEventListener("change", () => {
    activeMode = modelSelect.value;
    render();
  });

  sendButton.addEventListener("click", () => {
    const profiles = loadProfiles();
    const profile = profiles[activeMode];
    if (!profile?.savedAt) {
      if (typeof notify === "function") notify("Salva il modello prima di inviarlo a Pubblica");
      return;
    }
    const payload = {
      profiles,
      selectedModel: activeMode,
      savedAt: profile.savedAt,
    };
    if (typeof window.__EVE_SEND_TO_PUBLISH__ === "function") {
      window.__EVE_SEND_TO_PUBLISH__(payload);
    } else {
      window.dispatchEvent(new CustomEvent("eve:send-to-publish", {detail: payload}));
    }
    document.querySelector('[data-view="publish"]')?.click();
  });

  window.addEventListener("eve:model-profile-updated", (event) => {
    const selected = event.detail?.selectedModel;
    if (modes.includes(selected)) activeMode = selected;
    render();
  });

  const laboratoryNav = document.querySelector('[data-view="laboratory"]');
  laboratoryNav?.addEventListener("click", () => {
    activeMode = loadActiveMode();
    render();
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Configura e prova";
    if (subtitle) subtitle.textContent = "Prova in chat un modello salvato e, quando è pronto, invialo a Pubblica.";
  });

  render();
})();
