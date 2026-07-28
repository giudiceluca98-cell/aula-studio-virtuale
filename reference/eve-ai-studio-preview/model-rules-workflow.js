(() => {
  const view = document.getElementById("prompts");
  const grid = view?.querySelector(":scope > .grid");
  const systemPrompt = document.getElementById("systemPrompt");
  const editorPanel = systemPrompt?.closest(".panel");
  const form = editorPanel?.querySelector(".form-grid");
  if (!view || !grid || !editorPanel || !form || document.getElementById("behaviorRulesGuide")) return;

  const profilesKey = "eve-studio-model-profiles-v1";
  const ruleLibraryKey = "eve-studio-rule-library-v1";
  const activeModelKey = "eve-studio-active-model-v1";
  const customModelsKey = "eve-studio-custom-models-v1";
  const ruleLibraryVersion = 3;
  const modes = ["adaptive_explanation", "socratic", "quiz", "correction", "planning"];
  const modeLabels = {
    adaptive_explanation: "Spiegazione adattiva",
    socratic: "Metodo socratico",
    quiz: "Quiz e interrogazione",
    correction: "Correzione guidata",
    planning: "Pianificazione",
  };
  const defaultRules = {
    adaptive_explanation: "Spiega in modo adattivo usando il contesto autorizzato. Distingui fatti e ipotesi, dichiara l’incertezza e verifica la comprensione dello studente.",
    socratic: "Guida lo studente con domande progressive e indizi graduati. Non fornire immediatamente la soluzione e usa soltanto il contesto autorizzato.",
    quiz: "Formula una domanda per volta, attendi la risposta e fornisci feedback formativo. Non modificare i progressi senza conferma.",
    correction: "Individua l’errore, spiegane il motivo e guida un nuovo tentativo senza sostituirti allo studente.",
    planning: "Trasforma obiettivi, disponibilità e difficoltà in un piano realistico, verificabile e modificabile dallo studente.",
  };
  const defaultObjectives = {
    adaptive_explanation: "Aiutare lo studente a comprendere un argomento adattando linguaggio, esempi e profondità al suo livello.",
    socratic: "Guidare lo studente a costruire autonomamente la risposta attraverso domande e indizi progressivi.",
    quiz: "Verificare la comprensione con domande mirate e feedback formativo sul ragionamento.",
    correction: "Far riconoscere l’errore, comprenderne la causa e completare un nuovo tentativo consapevole.",
    planning: "Trasformare obiettivi, tempo disponibile e difficoltà in un percorso di studio realistico e verificabile.",
  };
  const customModelDefinitions = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem(customModelsKey) || "[]");
      return Array.isArray(stored)
        ? stored.filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && typeof item.objective === "string")
        : [];
    } catch {
      return [];
    }
  })();
  customModelDefinitions.forEach((definition) => {
    if (!modes.includes(definition.id)) modes.push(definition.id);
    modeLabels[definition.id] = definition.name;
    defaultObjectives[definition.id] = definition.objective;
    defaultRules[definition.id] = "";
  });
  const defaultRuleItems = modes.filter((mode) => defaultRules[mode]).map((mode) => ({
    id: `default-${mode}`,
    text: defaultRules[mode],
    originMode: mode,
    createdAt: null,
    isDefault: true,
  }));

  const makeStableId = (prefix, text) => {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${prefix}-${(hash >>> 0).toString(36)}`;
  };

  const defaultProfile = (mode) => {
    const custom = customModelDefinitions.find((definition) => definition.id === mode);
    if (custom) {
      const customRuleIds = Array.isArray(custom.ruleIds) ? custom.ruleIds : [];
      return {
        mode,
        objective: custom.objective,
        tone: custom.tone || "calm_direct",
        depth: Number(custom.depth || 2),
        sources: custom.sources || "required",
        solution: custom.solution || "guided",
        memory: custom.memory || "session_only",
        tools: custom.tools || "propose",
        ruleLibraryVersion,
        allowEmptyRules: customRuleIds.length === 0,
        ruleIds: customRuleIds,
        rules: "",
        savedAt: custom.createdAt || null,
      };
    }
    return {
      mode,
      objective: defaultObjectives[mode],
      tone: mode === "quiz" ? "friendly" : "calm_direct",
      depth: mode === "socratic" ? 3 : 2,
      sources: "required",
      solution: ["socratic", "quiz", "correction"].includes(mode) ? "never_immediate" : "guided",
      memory: "session_only",
      tools: mode === "quiz" ? "confirm" : "propose",
      ruleLibraryVersion,
      allowEmptyRules: false,
      ruleIds: [`default-${mode}`],
      rules: defaultRules[mode],
      savedAt: null,
    };
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };
  const loadRuleLibrary = () => {
    const stored = readJson(ruleLibraryKey, []);
    const safeStored = Array.isArray(stored)
      ? stored.filter((item) => item && typeof item.id === "string" && typeof item.text === "string" && item.text.trim())
      : [];
    const byId = new Map(defaultRuleItems.map((item) => [item.id, item]));
    safeStored.forEach((item) => byId.set(item.id, {...item, text: item.text.trim()}));
    return [...byId.values()];
  };
  let ruleLibrary = loadRuleLibrary();
  const ensureRuleInLibrary = (text, originMode) => {
    const normalized = String(text || "").trim();
    if (!normalized) return null;
    const existing = ruleLibrary.find((item) => item.text.toLocaleLowerCase("it-IT") === normalized.toLocaleLowerCase("it-IT"));
    if (existing) return existing.id;
    const id = makeStableId(`rule-${originMode || "shared"}`, normalized);
    ruleLibrary.push({
      id,
      text: normalized,
      originMode: originMode || "shared",
      createdAt: new Date().toISOString(),
      isDefault: false,
    });
    return id;
  };
  const rulesTextForIds = (ruleIds = []) => ruleIds
    .map((id) => ruleLibrary.find((item) => item.id === id)?.text)
    .filter(Boolean)
    .join("\n\n");
  const loadProfiles = () => {
    const stored = readJson(profilesKey, {});
    return Object.fromEntries(modes.map((mode) => {
      const storedProfile = stored[mode] || {};
      const baseProfile = defaultProfile(mode);
      const allowEmptyRules = Object.hasOwn(storedProfile, "allowEmptyRules")
        ? Boolean(storedProfile.allowEmptyRules)
        : Boolean(baseProfile.allowEmptyRules);
      let ruleIds = Array.isArray(storedProfile.ruleIds)
        ? storedProfile.ruleIds.filter((id) => ruleLibrary.some((item) => item.id === id))
        : baseProfile.ruleIds.filter((id) => ruleLibrary.some((item) => item.id === id));
      if (!ruleIds.length && !allowEmptyRules && typeof storedProfile.rules === "string" && storedProfile.rules.trim()) {
        const migratedId = ensureRuleInLibrary(storedProfile.rules, mode);
        if (migratedId) ruleIds = [migratedId];
      }
      if (!ruleIds.length && !allowEmptyRules && defaultRules[mode]) ruleIds = [`default-${mode}`];
      const profile = {
        ...baseProfile,
        ...storedProfile,
        mode,
        ruleLibraryVersion,
        allowEmptyRules,
        ruleIds,
        rules: rulesTextForIds(ruleIds),
      };
      return [mode, profile];
    }));
  };

  const originalPanels = [...grid.querySelectorAll(":scope > .panel")];
  originalPanels.forEach((panel) => {
    if (panel !== editorPanel) panel.hidden = true;
  });
  editorPanel.classList.remove("span-7", "span-8", "span-6", "span-5", "span-4");
  editorPanel.classList.add("span-12", "model-config-panel");

  const versionField = document.getElementById("promptVersionSelect")?.closest(".field");
  const nameField = document.getElementById("promptName")?.closest(".field");
  const modeField = document.getElementById("promptMode")?.closest(".field");
  const promptField = systemPrompt.closest(".field");
  let nameInput = document.getElementById("promptName");
  const objectiveField = document.createElement("div");
  objectiveField.className = "field full";
  objectiveField.innerHTML = `
    <label for="modelObjective">Obiettivo di questo modello</label>
    <textarea id="modelObjective" maxlength="360" rows="3" placeholder="Descrivi il risultato didattico che questo modello deve aiutare a raggiungere."></textarea>
  `;
  form.appendChild(objectiveField);
  const addModelField = document.createElement("div");
  addModelField.className = "field model-add-field";
  addModelField.innerHTML = `
    <label for="startNewTeachingModel">Aggiungi modello didattico</label>
    <button class="model-add-trigger" type="button" id="startNewTeachingModel">＋ Crea un nuovo modello</button>
  `;
  const creationNameField = nameField || document.createElement("div");
  if (!nameField) {
    creationNameField.className = "field full";
    creationNameField.innerHTML = `
      <label for="promptName">Nome del nuovo modello</label>
      <input id="promptName" maxlength="60" placeholder="Per esempio: Ripasso rapido">
    `;
    form.appendChild(creationNameField);
    nameInput = creationNameField.querySelector("#promptName");
  }
  const editableIds = ["promptMode", "promptName", "modelObjective", "promptTone", "promptDepth", "promptSources", "promptSolution", "promptMemory", "promptTools"];
  const editableFields = editableIds
    .map((id) => document.getElementById(id)?.closest(".field"))
    .filter(Boolean);

  [...form.querySelectorAll(".field")].forEach((field) => {
    field.hidden = !editableFields.includes(field) && field !== promptField;
  });
  if (versionField) versionField.hidden = true;
  creationNameField.hidden = true;
  editableFields.forEach((field) => form.appendChild(field));
  if (modeField) {
    modeField.classList.remove("full");
    form.insertBefore(modeField, form.firstElementChild);
    modeField.after(addModelField);
  }
  if (creationNameField) {
    creationNameField.classList.add("full");
    const nameLabel = creationNameField.querySelector("label");
    if (nameLabel) nameLabel.textContent = "Nome del nuovo modello";
    if (nameInput) {
      nameInput.maxLength = 60;
      nameInput.placeholder = "Per esempio: Ripasso rapido";
      nameInput.value = "";
    }
    addModelField.after(creationNameField);
    creationNameField.after(objectiveField);
  } else {
    addModelField.after(objectiveField);
  }
  promptField?.classList.add("full");
  form.appendChild(promptField);

  const editorTitle = editorPanel.querySelector(".panel-head h3");
  const editorDescription = editorPanel.querySelector(".panel-head p");
  const statusBadge = document.getElementById("promptStatusBadge");
  if (editorTitle) editorTitle.textContent = "Configura il modello didattico";
  if (editorDescription) editorDescription.textContent = "Definisci obiettivo, tratti, limiti e regole applicati quando lo studente sceglie questo modello.";
  if (statusBadge) statusBadge.hidden = true;

  const promptLabel = promptField?.querySelector("label");
  const modeLabel = modeField?.querySelector("label");
  if (promptLabel) promptLabel.textContent = "Aggiungi una nuova regola alla libreria";
  if (modeLabel) modeLabel.textContent = "Modello didattico da configurare";
  systemPrompt.value = "";
  systemPrompt.placeholder = "Scrivi una regola autonoma, per esempio: dichiara quando le fonti non sono sufficienti.";
  systemPrompt.rows = 3;

  const newRuleActions = document.createElement("div");
  newRuleActions.className = "new-rule-actions";
  newRuleActions.innerHTML = `
    <button class="btn primary" type="button" id="addBehaviorRule">Aggiungi e attiva la regola</button>
    <span>La nuova regola resta disponibile anche per gli altri modelli.</span>
  `;
  promptField?.appendChild(newRuleActions);

  const ruleLibraryPanel = document.createElement("section");
  ruleLibraryPanel.id = "ruleLibraryPanel";
  ruleLibraryPanel.className = "field full rule-library-panel";
  ruleLibraryPanel.tabIndex = 0;
  ruleLibraryPanel.setAttribute("aria-describedby", "modelContextHelp");
  ruleLibraryPanel.innerHTML = `
    <div class="rule-library-panel__head">
      <div>
        <span class="rule-library-panel__eyebrow">Libreria condivisa</span>
        <h4>Regole disponibili</h4>
        <p>Spunta le regole che questo modello deve applicare. Togliendo la spunta la regola viene scollegata, ma non cancellata.</p>
      </div>
      <span class="tag violet" id="activeRuleCount">0 attive</span>
    </div>
    <div class="rule-library-list" id="ruleLibraryList"></div>
  `;
  form.appendChild(ruleLibraryPanel);

  const legacyActions = document.getElementById("savePromptDraft")?.parentElement;
  legacyActions?.remove();
  const legacyMessage = document.getElementById("promptWorkflowMessage");
  legacyMessage?.remove();

  const guide = document.createElement("section");
  guide.id = "behaviorRulesGuide";
  guide.className = "panel prompt-guide";
  guide.innerHTML = `
    <div class="panel-body">
      <div class="prompt-guide__top">
        <div>
          <h3>Un’Eve, cinque modelli didattici</h3>
          <p>Seleziona il modello da configurare. I parametri salvati verranno applicati quando lo studente sceglierà quel modello dentro Aula.</p>
        </div>
        <span class="tag violet">5 modelli configurabili</span>
      </div>
      <div class="prompt-guide__steps" aria-label="Percorso di configurazione">
        <div class="prompt-guide__step"><span>1</span><strong>Scegli il modello</strong><small>Spiegazione, socratico, quiz, correzione o pianificazione.</small></div>
        <div class="prompt-guide__step"><span>2</span><strong>Imposta i parametri</strong><small>Tono, profondità, fonti, memoria, soluzioni e permessi.</small></div>
        <div class="prompt-guide__step"><span>3</span><strong>Salva il modello</strong><small>Obiettivo, tratti, limiti e regole restano associati al modello scelto.</small></div>
        <div class="prompt-guide__step"><span>4</span><strong>Provalo in chat</strong><small>Dalla chat potrai poi inviare l’insieme dei modelli a Pubblica.</small></div>
      </div>
      <p class="prompt-technical-note">“Modello didattico” indica il comportamento scelto dall’utente; il provider AI viene configurato separatamente in Connessione AI.</p>
    </div>
  `;
  grid.insertBefore(guide, editorPanel);
  guide.querySelector(".tag.violet").textContent = `${modes.length} modelli configurabili`;

  const help = document.createElement("p");
  help.className = "prompt-primary-help";
  help.textContent = "Le modifiche valgono soltanto per il modello selezionato. Passando a un altro modello ritroverai i suoi parametri e le sue regole.";
  form.insertBefore(help, promptField);

  const contextHelp = document.createElement("aside");
  contextHelp.id = "modelContextHelp";
  contextHelp.className = "model-context-help";
  contextHelp.setAttribute("role", "tooltip");
  contextHelp.setAttribute("aria-live", "polite");
  contextHelp.setAttribute("aria-hidden", "true");
  contextHelp.innerHTML = `
    <span class="model-context-help__eyebrow">A cosa serve</span>
    <h4 id="modelContextHelpTitle">Modello didattico</h4>
    <p id="modelContextHelpText">Scegli il comportamento che Eve userà quando lo studente selezionerà questo modello dentro Aula.</p>
    <div class="model-context-help__value" id="modelContextHelpValue">Passa sopra un parametro oppure selezionalo per leggerne la spiegazione.</div>
  `;

  const configLayout = document.createElement("div");
  configLayout.className = "model-config-layout";
  const editorBody = editorPanel.querySelector(".panel-body");
  editorBody?.insertBefore(configLayout, form);
  configLayout.append(form);
  document.body.appendChild(contextHelp);

  const actions = document.createElement("div");
  actions.className = "build-eve-actions behavior-rules-actions";
  actions.innerHTML = `
    <button class="btn primary" id="saveBehaviorRules">Salva modello</button>
    <button class="btn green" id="tryBehaviorRules">Prova modello</button>
  `;
  editorPanel.querySelector(".panel-body")?.appendChild(actions);

  const workingStatus = document.createElement("p");
  workingStatus.id = "behaviorRulesStatus";
  workingStatus.className = "prompt-next-action";
  workingStatus.setAttribute("aria-live", "polite");
  editorPanel.querySelector(".panel-body")?.appendChild(workingStatus);

  let profiles = loadProfiles();
  const storedActiveModel = localStorage.getItem(activeModelKey);
  let currentMode = modes.includes(storedActiveModel) ? storedActiveModel : "adaptive_explanation";
  let isCreatingModel = false;
  let draftRuleIds = [];
  const modeSelect = document.getElementById("promptMode");
  customModelDefinitions.forEach((definition) => {
    if (!modeSelect?.querySelector(`option[value="${definition.id}"]`)) {
      modeSelect?.add(new Option(definition.name, definition.id));
    }
  });

  const profileFieldIds = {
    objective: "modelObjective",
    tone: "promptTone",
    depth: "promptDepth",
    sources: "promptSources",
    solution: "promptSolution",
    memory: "promptMemory",
    tools: "promptTools",
  };

  const modelDescriptions = {
    adaptive_explanation: "Adatta linguaggio, profondità ed esempi al livello e alle difficoltà rilevate nello studente.",
    socratic: "Accompagna lo studente con domande e indizi progressivi, evitando di anticipare la soluzione.",
    quiz: "Formula domande, attende la risposta e restituisce una valutazione formativa del ragionamento.",
    correction: "Analizza l’errore, ne spiega la causa e guida un nuovo tentativo controllato.",
    planning: "Trasforma obiettivi, tempo disponibile e lacune in un percorso di studio realistico.",
  };
  customModelDefinitions.forEach((definition) => {
    modelDescriptions[definition.id] = definition.objective;
  });
  const helpDefinitions = {
    promptMode: {
      title: "Modello didattico",
      text: "Stabilisce il tipo di aiuto che l’utente potrà scegliere in Aula. Ogni modello conserva una configurazione indipendente.",
      detail: (node) => modelDescriptions[node.value] || "",
    },
    promptName: {
      title: "Nome del nuovo modello",
      text: "È il nome con cui il nuovo comportamento comparirà tra i modelli disponibili in Aula.",
      detail: (node) => node.value.trim()
        ? `${node.value.trim().length} caratteri. Usa un nome breve e riconoscibile.`
        : "Inserisci un nome diverso da quelli già presenti.",
    },
    modelObjective: {
      title: "Obiettivo del modello",
      text: "Definisce il risultato didattico che Eve deve perseguire quando l’utente sceglie questo modello.",
      detail: (node) => node.value.trim()
        ? `${node.value.trim().length} caratteri. Deve descrivere il risultato, non il nome o l’identità di Eve.`
        : "Inserisci un obiettivo concreto e verificabile.",
    },
    promptTone: {
      title: "Tono della risposta",
      text: "Definisce lo stile con cui Eve comunica, senza cambiare la correttezza o il contenuto delle spiegazioni.",
      detail: (node) => `Scelta attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    promptDepth: {
      title: "Profondità",
      text: "Controlla quanto Eve deve essere sintetica o approfondita. Un livello maggiore produce più passaggi, dettagli ed esempi.",
      detail: (node) => `Livello attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    promptSources: {
      title: "Uso delle fonti",
      text: "Stabilisce quando Eve deve basare la risposta sui materiali autorizzati e mostrare riferimenti verificabili.",
      detail: (node) => `Regola attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    promptSolution: {
      title: "Gestione delle soluzioni",
      text: "Decide se Eve deve guidare il ragionamento, evitare la soluzione immediata oppure rispondere direttamente.",
      detail: (node) => `Comportamento attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    promptMemory: {
      title: "Memoria",
      text: "Controlla se il modello può ricordare informazioni tra i messaggi o tra sessioni diverse, sempre nel rispetto del consenso.",
      detail: (node) => `Memoria attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    promptTools: {
      title: "Permessi nell’app",
      text: "Definisce se Eve può soltanto proporre un’azione, leggere dati autorizzati oppure eseguire dopo una conferma esplicita.",
      detail: (node) => `Permesso attuale: ${node.selectedOptions[0]?.textContent || node.value}.`,
    },
    systemPrompt: {
      title: "Nuova regola",
      text: "Scrivi una sola istruzione autonoma. Premendo “Aggiungi” entrerà nella libreria e verrà attivata per il modello selezionato senza sostituire le regole precedenti.",
      detail: (node) => node.value.trim()
        ? `${node.value.trim().length} caratteri pronti per essere aggiunti.`
        : "La regola può definire un obiettivo, un limite, una priorità o quando Eve deve chiedere conferma.",
    },
    ruleLibraryPanel: {
      title: "Libreria delle regole",
      text: "Contiene tutte le regole create per ogni modello. Le caselle permettono di riutilizzarle e combinarle liberamente.",
      detail: () => {
        const active = profiles[currentMode]?.ruleIds?.length || 0;
        return `${active} regole attive per ${modeLabels[currentMode]}. Togliere una spunta non elimina la regola dalla libreria.`;
      },
    },
  };
  const optionHelpDefinitions = {
    promptMode: {
      adaptive_explanation: ["Spiegazione adattiva", "Adatta linguaggio, esempi e profondità al livello e alle difficoltà rilevate nello studente."],
      socratic: ["Metodo socratico", "Guida con domande e indizi progressivi, aiutando lo studente a costruire autonomamente la risposta."],
      quiz: ["Quiz e interrogazione", "Propone una domanda alla volta, attende la risposta e restituisce un feedback formativo."],
      correction: ["Correzione guidata", "Individua l’errore, ne chiarisce la causa e accompagna lo studente in un nuovo tentativo."],
      planning: ["Pianificazione", "Trasforma obiettivi, tempo e difficoltà in un percorso di studio realistico e verificabile."],
    },
    promptTone: {
      calm_direct: ["Calmo e diretto", "Usa un linguaggio tranquillo, chiaro e concreto, evitando giri di parole non necessari."],
      friendly: ["Amichevole", "Comunica in modo caloroso e incoraggiante, mantenendo precisione e rispetto."],
      technical: ["Tecnico", "Usa terminologia specialistica e formulazioni rigorose adatte a chi conosce già le basi."],
    },
    promptDepth: {
      1: ["1 · Essenziale", "Mostra soltanto i concetti indispensabili con una risposta breve e immediata."],
      2: ["2 · Normale", "Spiega i passaggi principali e include un esempio quando è utile alla comprensione."],
      3: ["3 · Approfondita", "Aggiunge motivazioni, collegamenti ed esempi per rendere chiaro il ragionamento completo."],
      4: ["4 · Massima", "Fornisce una spiegazione estesa, passo per passo, includendo varianti, limiti e casi particolari."],
    },
    promptSources: {
      required: ["Obbligatorie", "Eve deve basarsi sui materiali autorizzati e dichiarare quando le fonti non sono sufficienti."],
      when_available: ["Quando disponibili", "Eve usa e cita i materiali presenti; se mancano, distingue chiaramente le conoscenze generali."],
      disabled: ["Disattivate", "Il modello non consulta i materiali collegati e non utilizza il sistema delle fonti."],
    },
    promptSolution: {
      guided: ["Guidata", "Eve accompagna verso la soluzione con passaggi e indizi graduati."],
      direct: ["Diretta", "Eve fornisce subito la risposta richiesta, aggiungendo la spiegazione necessaria."],
      never_immediate: ["Mai immediata", "Eve chiede prima un tentativo o propone un indizio, senza anticipare immediatamente la soluzione."],
    },
    promptMemory: {
      consent: ["Con consenso", "Può ricordare informazioni tra sessioni diverse soltanto dopo un consenso esplicito."],
      session_only: ["Solo sessione", "Ricorda il contesto durante la conversazione corrente e lo interrompe alla fine della sessione."],
      off: ["Disattivata", "Non conserva informazioni tra i messaggi oltre a ciò che è strettamente necessario alla risposta corrente."],
    },
    promptTools: {
      propose: ["Solo proposta", "Eve descrive l’azione consigliata, ma non modifica alcun dato dell’app."],
      read_only: ["Sola lettura", "Può consultare i dati autorizzati, senza creare, modificare o eliminare contenuti."],
      confirm: ["Con conferma", "Può eseguire un’azione soltanto dopo una conferma esplicita dell’utente."],
    },
  };
  customModelDefinitions.forEach((definition) => {
    optionHelpDefinitions.promptMode[definition.id] = [definition.name, definition.objective];
  });

  let activeHelpId = "";
  let pointerFrame = 0;
  let helpDelayTimer = 0;
  let pendingHelpId = "";
  let pendingHelpPoint = null;
  const helpDelayMs = 2000;

  const positionFieldHelp = (clientX, clientY) => {
    const gap = 14;
    const margin = 12;
    const rect = contextHelp.getBoundingClientRect();
    let left = clientX + gap;
    let top = clientY + gap;

    if (left + rect.width > window.innerWidth - margin) left = clientX - rect.width - gap;
    if (top + rect.height > window.innerHeight - margin) top = clientY - rect.height - gap;

    contextHelp.style.left = `${Math.max(margin, left)}px`;
    contextHelp.style.top = `${Math.max(margin, top)}px`;
  };

  const positionHelpBesideField = (field) => {
    const rect = field.getBoundingClientRect();
    positionFieldHelp(Math.min(rect.right, window.innerWidth - 24), Math.max(rect.top, 12));
  };

  const positionHelpBesideMenu = (menu, clientY) => {
    const gap = 14;
    const margin = 12;
    const menuRect = menu.getBoundingClientRect();
    const helpRect = contextHelp.getBoundingClientRect();
    let left = menuRect.right + gap;
    if (left + helpRect.width > window.innerWidth - margin) left = menuRect.left - helpRect.width - gap;
    const top = Math.min(
      Math.max(margin, clientY - 24),
      Math.max(margin, window.innerHeight - helpRect.height - margin),
    );
    contextHelp.style.left = `${Math.max(margin, left)}px`;
    contextHelp.style.top = `${top}px`;
  };

  const clearActiveHelpField = () => {
    editableFields.forEach((field) => field.classList.remove("is-help-active"));
    promptField?.classList.remove("is-help-active");
    ruleLibraryPanel.classList.remove("is-help-active");
  };

  const clearPendingHelpField = () => {
    editableFields.forEach((field) => field.classList.remove("is-help-pending"));
    promptField?.classList.remove("is-help-pending");
    ruleLibraryPanel.classList.remove("is-help-pending");
  };

  const cancelPendingFieldHelp = () => {
    if (helpDelayTimer) clearTimeout(helpDelayTimer);
    helpDelayTimer = 0;
    pendingHelpId = "";
    pendingHelpPoint = null;
    clearPendingHelpField();
  };

  const hideFieldHelp = () => {
    cancelPendingFieldHelp();
    activeHelpId = "";
    if (pointerFrame) {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
    }
    contextHelp.classList.remove("is-visible");
    contextHelp.setAttribute("aria-hidden", "true");
    clearActiveHelpField();
  };

  const showFieldHelp = (id, pointerEvent = null) => {
    const definition = helpDefinitions[id];
    const node = document.getElementById(id);
    if (!definition || !node) return;
    const field = node.closest(".field");
    clearPendingHelpField();
    activeHelpId = id;
    document.getElementById("modelContextHelpTitle").textContent = definition.title;
    document.getElementById("modelContextHelpText").textContent = definition.text;
    document.getElementById("modelContextHelpValue").textContent = definition.detail(node);
    editableFields.forEach((field) => field.classList.toggle("is-help-active", field.contains(node)));
    promptField?.classList.toggle("is-help-active", id === "systemPrompt");
    ruleLibraryPanel.classList.toggle("is-help-active", id === "ruleLibraryPanel");
    contextHelp.classList.add("is-visible");
    contextHelp.setAttribute("aria-hidden", "false");

    if (pointerEvent && Number.isFinite(pointerEvent.clientX) && Number.isFinite(pointerEvent.clientY)) {
      positionFieldHelp(pointerEvent.clientX, pointerEvent.clientY);
    } else if (field) {
      positionHelpBesideField(field);
    }
  };

  const scheduleFieldHelp = (id, pointerEvent = null) => {
    const point = pointerEvent && Number.isFinite(pointerEvent.clientX) && Number.isFinite(pointerEvent.clientY)
      ? {clientX: pointerEvent.clientX, clientY: pointerEvent.clientY}
      : null;

    if (activeHelpId === id) {
      if (point) positionFieldHelp(point.clientX, point.clientY);
      return;
    }

    pendingHelpPoint = point;
    if (pendingHelpId === id && helpDelayTimer) return;

    cancelPendingFieldHelp();
    pendingHelpId = id;
    pendingHelpPoint = point;
    document.getElementById(id)?.closest(".field")?.classList.add("is-help-pending");
    helpDelayTimer = setTimeout(() => {
      const delayedPoint = pendingHelpPoint;
      helpDelayTimer = 0;
      pendingHelpId = "";
      pendingHelpPoint = null;
      showFieldHelp(id, delayedPoint);
    }, helpDelayMs);
  };

  const showOptionHelp = (select, optionButton, pointerPoint = null) => {
    const definition = optionHelpDefinitions[select.id]?.[optionButton.dataset.value];
    if (!definition) return;
    clearPendingHelpField();
    clearActiveHelpField();
    activeHelpId = `option:${select.id}:${optionButton.dataset.value}`;
    document.getElementById("modelContextHelpTitle").textContent = definition[0];
    document.getElementById("modelContextHelpText").textContent = definition[1];
    document.getElementById("modelContextHelpValue").textContent = `Valore disponibile per ${select.closest(".field")?.querySelector("label")?.textContent || "questo parametro"}.`;
    contextHelp.classList.add("is-visible");
    contextHelp.setAttribute("aria-hidden", "false");
    const optionRect = optionButton.getBoundingClientRect();
    const menu = optionButton.closest(".studio-select__menu");
    if (menu) positionHelpBesideMenu(menu, pointerPoint?.clientY || optionRect.top + optionRect.height / 2);
  };

  const scheduleOptionHelp = (select, optionButton, pointerEvent = null) => {
    const key = `option:${select.id}:${optionButton.dataset.value}`;
    const point = pointerEvent && Number.isFinite(pointerEvent.clientX) && Number.isFinite(pointerEvent.clientY)
      ? {clientX: pointerEvent.clientX, clientY: pointerEvent.clientY}
      : null;
    if (activeHelpId === key) {
      const menu = optionButton.closest(".studio-select__menu");
      if (menu) positionHelpBesideMenu(menu, point?.clientY || optionButton.getBoundingClientRect().top);
      return;
    }
    pendingHelpPoint = point;
    if (pendingHelpId === key && helpDelayTimer) return;
    cancelPendingFieldHelp();
    pendingHelpId = key;
    pendingHelpPoint = point;
    helpDelayTimer = setTimeout(() => {
      const delayedPoint = pendingHelpPoint;
      helpDelayTimer = 0;
      pendingHelpId = "";
      pendingHelpPoint = null;
      showOptionHelp(select, optionButton, delayedPoint);
    }, helpDelayMs);
  };

  const customSelects = new Map();
  const closeCustomSelect = (select, {restoreFocus = false} = {}) => {
    const custom = customSelects.get(select);
    if (!custom || custom.menu.hidden) return;
    custom.menu.hidden = true;
    custom.trigger.setAttribute("aria-expanded", "false");
    custom.root.classList.remove("is-open");
    hideFieldHelp();
    if (restoreFocus) custom.trigger.focus();
  };
  const closeOtherCustomSelects = (currentSelect) => {
    customSelects.forEach((_custom, select) => {
      if (select !== currentSelect) closeCustomSelect(select);
    });
  };

  const buildCustomSelect = (select) => {
    const root = document.createElement("div");
    root.className = "studio-select";
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = `${select.id}Trigger`;
    trigger.className = "studio-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const menu = document.createElement("div");
    menu.className = "studio-select__menu";
    menu.id = `${select.id}Menu`;
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    trigger.setAttribute("aria-controls", menu.id);

    const optionButtons = [];
    const addOptionButton = (option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "studio-select__option";
      button.dataset.value = option.value;
      button.setAttribute("role", "option");
      button.textContent = option.textContent;
      button.addEventListener("pointerenter", (event) => scheduleOptionHelp(select, button, event));
      button.addEventListener("pointermove", (event) => {
        const key = `option:${select.id}:${button.dataset.value}`;
        if (pendingHelpId === key) pendingHelpPoint = {clientX: event.clientX, clientY: event.clientY};
        if (activeHelpId === key) positionHelpBesideMenu(menu, event.clientY);
      });
      button.addEventListener("pointerleave", hideFieldHelp);
      button.addEventListener("focusin", () => scheduleOptionHelp(select, button));
      button.addEventListener("focusout", () => {
        setTimeout(() => {
          if (!button.matches(":focus")) hideFieldHelp();
        }, 0);
      });
      button.addEventListener("click", () => {
        select.value = button.dataset.value;
        select.dispatchEvent(new Event("change", {bubbles: true}));
        closeCustomSelect(select, {restoreFocus: true});
      });
      button.addEventListener("keydown", (event) => {
        const currentIndex = optionButtons.indexOf(button);
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          optionButtons[(currentIndex + direction + optionButtons.length) % optionButtons.length].focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          closeCustomSelect(select, {restoreFocus: true});
        }
      });
      menu.appendChild(button);
      optionButtons.push(button);
      return button;
    };
    [...select.options].forEach(addOptionButton);

    const sync = () => {
      const selected = select.selectedOptions[0];
      trigger.textContent = selected?.textContent || "";
      optionButtons.forEach((button) => {
        const isSelected = button.dataset.value === select.value;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-selected", String(isSelected));
      });
    };

    trigger.addEventListener("pointerdown", hideFieldHelp);
    trigger.addEventListener("click", () => {
      const willOpen = menu.hidden;
      closeOtherCustomSelects(select);
      hideFieldHelp();
      menu.hidden = !willOpen;
      trigger.setAttribute("aria-expanded", String(willOpen));
      root.classList.toggle("is-open", willOpen);
      if (willOpen) {
        const selectedButton = optionButtons.find((button) => button.dataset.value === select.value);
        selectedButton?.focus();
      }
    });
    trigger.addEventListener("keydown", (event) => {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key) && menu.hidden) {
        event.preventDefault();
        trigger.click();
      } else if (event.key === "Escape" && !menu.hidden) {
        event.preventDefault();
        closeCustomSelect(select, {restoreFocus: true});
      }
    });

    const label = select.closest(".field")?.querySelector(`label[for="${select.id}"]`);
    if (label) label.htmlFor = trigger.id;
    select.classList.add("native-select-source");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    root.append(trigger, menu);
    select.after(root);
    const addOption = (option) => {
      const button = addOptionButton(option);
      sync();
      return button;
    };
    customSelects.set(select, {root, trigger, menu, optionButtons, sync, addOption});
    select._syncStudioSelect = sync;
    select.addEventListener("change", sync);
    sync();
  };

  editableIds
    .map((id) => document.getElementById(id))
    .filter((node) => node?.matches("select"))
    .forEach(buildCustomSelect);

  const createModelPanel = document.createElement("aside");
  createModelPanel.className = "model-create-panel";
  createModelPanel.innerHTML = `
    <div class="model-create-panel__head">
      <div>
        <span class="model-create-panel__eyebrow">Nuovo comportamento</span>
        <h3>Aggiungi modello didattico</h3>
        <p>Crea un nuovo metodo di assistenza. Dopo il salvataggio potrai modificarlo e provarlo come tutti gli altri modelli.</p>
      </div>
      <span class="tag violet">Personalizzato</span>
    </div>
    <div class="model-create-form">
      <div class="field full">
        <label for="newModelName">Nome del modello</label>
        <input id="newModelName" maxlength="60" placeholder="Per esempio: Ripasso rapido">
      </div>
      <div class="field full">
        <label for="newModelObjective">Obiettivo</label>
        <textarea id="newModelObjective" maxlength="360" rows="3" placeholder="Descrivi il risultato didattico che il nuovo modello deve perseguire."></textarea>
      </div>
      <div class="field">
        <label for="newModelTone">Tono</label>
        <select id="newModelTone">
          <option value="calm_direct">Calmo e diretto</option>
          <option value="friendly">Amichevole</option>
          <option value="technical">Tecnico</option>
        </select>
      </div>
      <div class="field">
        <label for="newModelDepth">Profondità</label>
        <select id="newModelDepth">
          <option value="1">1 · Essenziale</option>
          <option value="2" selected>2 · Normale</option>
          <option value="3">3 · Approfondita</option>
          <option value="4">4 · Massima</option>
        </select>
      </div>
      <div class="field">
        <label for="newModelSources">Fonti</label>
        <select id="newModelSources">
          <option value="required">Obbligatorie</option>
          <option value="when_available">Quando disponibili</option>
          <option value="disabled">Disattivate</option>
        </select>
      </div>
      <div class="field">
        <label for="newModelSolution">Politica soluzione</label>
        <select id="newModelSolution">
          <option value="guided">Guidata</option>
          <option value="direct">Diretta</option>
          <option value="never_immediate">Mai immediata</option>
        </select>
      </div>
      <div class="field">
        <label for="newModelMemory">Memoria</label>
        <select id="newModelMemory">
          <option value="consent">Con consenso</option>
          <option value="session_only" selected>Solo sessione</option>
          <option value="off">Disattivata</option>
        </select>
      </div>
      <div class="field">
        <label for="newModelTools">Strumenti</label>
        <select id="newModelTools">
          <option value="propose">Solo proposta</option>
          <option value="read_only">Sola lettura</option>
          <option value="confirm">Con conferma</option>
        </select>
      </div>
      <fieldset class="model-create-rules full">
        <legend>Regole da applicare subito</legend>
        <p>Puoi selezionare regole già presenti. Dopo la creazione potrai aggiungerne o rimuoverne altre nella libreria condivisa.</p>
        <div class="model-create-rules__list" id="newModelRules"></div>
      </fieldset>
      <button class="btn primary full" type="button" id="createTeachingModel">Crea e configura il modello</button>
      <p class="model-create-status full" id="createTeachingModelStatus" aria-live="polite"></p>
    </div>
  `;
  const newModelSelectIds = ["newModelTone", "newModelDepth", "newModelSources", "newModelSolution", "newModelMemory", "newModelTools"];
  newModelSelectIds
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .forEach(buildCustomSelect);

  const renderCreateModelRules = () => {
    const list = document.getElementById("newModelRules");
    if (!list) return;
    const checked = new Set([...list.querySelectorAll("input:checked")].map((input) => input.value));
    list.innerHTML = "";
    ruleLibrary.forEach((rule) => {
      const label = document.createElement("label");
      label.className = "model-create-rule";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = rule.id;
      checkbox.checked = checked.has(rule.id);
      const copy = document.createElement("span");
      copy.textContent = rule.text;
      label.append(checkbox, copy);
      list.appendChild(label);
    });
  };
  renderCreateModelRules();

  const resetCreateModelForm = () => {
    document.getElementById("newModelName").value = "";
    document.getElementById("newModelObjective").value = "";
    const defaults = {
      newModelTone: "calm_direct",
      newModelDepth: "2",
      newModelSources: "required",
      newModelSolution: "guided",
      newModelMemory: "session_only",
      newModelTools: "propose",
    };
    Object.entries(defaults).forEach(([id, value]) => {
      const select = document.getElementById(id);
      select.value = value;
      select._syncStudioSelect?.();
    });
    document.querySelectorAll("#newModelRules input").forEach((checkbox) => {
      checkbox.checked = false;
    });
  };

  document.getElementById("createTeachingModel")?.addEventListener("click", () => {
    const name = document.getElementById("newModelName").value.trim().replace(/\s+/g, " ");
    const objective = document.getElementById("newModelObjective").value.trim().replace(/\s+/g, " ");
    const status = document.getElementById("createTeachingModelStatus");
    if (name.length < 3) {
      status.textContent = "Inserisci un nome di almeno 3 caratteri.";
      document.getElementById("newModelName").focus();
      return;
    }
    if (objective.length < 12) {
      status.textContent = "Descrivi l’obiettivo con almeno 12 caratteri.";
      document.getElementById("newModelObjective").focus();
      return;
    }
    if (Object.values(modeLabels).some((label) => label.toLocaleLowerCase("it-IT") === name.toLocaleLowerCase("it-IT"))) {
      status.textContent = "Esiste già un modello con questo nome.";
      document.getElementById("newModelName").focus();
      return;
    }

    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it-IT")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "modello";
    let id = `custom-${slug}`;
    let suffix = 2;
    while (modes.includes(id)) {
      id = `custom-${slug}-${suffix}`;
      suffix += 1;
    }
    const ruleIds = [...document.querySelectorAll("#newModelRules input:checked")].map((input) => input.value);
    const createdAt = new Date().toISOString();
    const definition = {
      id,
      name,
      objective,
      tone: document.getElementById("newModelTone").value,
      depth: Number(document.getElementById("newModelDepth").value),
      sources: document.getElementById("newModelSources").value,
      solution: document.getElementById("newModelSolution").value,
      memory: document.getElementById("newModelMemory").value,
      tools: document.getElementById("newModelTools").value,
      ruleIds,
      createdAt,
    };

    customModelDefinitions.push(definition);
    localStorage.setItem(customModelsKey, JSON.stringify(customModelDefinitions));
    modes.push(id);
    modeLabels[id] = name;
    defaultObjectives[id] = objective;
    defaultRules[id] = "";
    modelDescriptions[id] = objective;
    optionHelpDefinitions.promptMode[id] = [name, objective];
    profiles[id] = {
      mode: id,
      objective,
      tone: definition.tone,
      depth: definition.depth,
      sources: definition.sources,
      solution: definition.solution,
      memory: definition.memory,
      tools: definition.tools,
      ruleLibraryVersion,
      allowEmptyRules: ruleIds.length === 0,
      ruleIds,
      rules: rulesTextForIds(ruleIds),
      savedAt: createdAt,
    };
    localStorage.setItem(profilesKey, JSON.stringify(profiles));

    const option = new Option(name, id);
    modeSelect.add(option);
    customSelects.get(modeSelect)?.addOption(option);
    modeSelect.value = id;
    modeSelect.dispatchEvent(new Event("change", {bubbles: true}));
    guide.querySelector(".tag.violet").textContent = `${modes.length} modelli configurabili`;
    resetCreateModelForm();
    status.textContent = `${name} creato e aperto nella colonna di configurazione.`;
    if (typeof notify === "function") notify(`${name} creato`);
  });

  document.addEventListener("pointerdown", (event) => {
    customSelects.forEach((custom, select) => {
      if (!custom.root.contains(event.target)) closeCustomSelect(select);
    });
  });

  [...editableIds, "systemPrompt", "ruleLibraryPanel"].forEach((id) => {
    const node = document.getElementById(id);
    const field = node?.closest(".field");
    if (!node || !field) return;
    node.setAttribute("aria-describedby", "modelContextHelp");
    field.addEventListener("pointerenter", (event) => scheduleFieldHelp(id, event));
    field.addEventListener("pointermove", (event) => {
      const {clientX, clientY} = event;
      if (pendingHelpId === id) pendingHelpPoint = {clientX, clientY};
      if (activeHelpId !== id || pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        positionFieldHelp(clientX, clientY);
      });
    });
    field.addEventListener("pointerleave", hideFieldHelp);
    field.addEventListener("focusin", (event) => {
      if (event.target instanceof Element && event.target.closest(".studio-select, select")) return;
      scheduleFieldHelp(id);
    });
    field.addEventListener("focusout", () => {
      setTimeout(() => {
        if (!field.contains(document.activeElement)) hideFieldHelp();
      }, 0);
    });
    field.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest(".studio-select, select")) return;
      scheduleFieldHelp(id, event);
    });
    if (node.matches("select")) {
      node.addEventListener("pointerdown", hideFieldHelp);
      node.addEventListener("keydown", (event) => {
        if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) hideFieldHelp();
      });
    }
    node.addEventListener("change", () => {
      if (activeHelpId === id) showFieldHelp(id);
    });
    node.addEventListener("input", () => {
      if (activeHelpId === id) showFieldHelp(id);
    });
  });

  window.addEventListener("scroll", hideFieldHelp, {passive: true});
  window.addEventListener("resize", hideFieldHelp);

  const persistRuleLibrary = () => {
    localStorage.setItem(ruleLibraryKey, JSON.stringify(ruleLibrary));
  };
  const persistProfiles = () => {
    localStorage.setItem(profilesKey, JSON.stringify(profiles));
  };
  persistRuleLibrary();
  persistProfiles();
  const getActiveRuleIds = (mode = currentMode) => {
    if (isCreatingModel) return draftRuleIds;
    const ids = profiles[mode]?.ruleIds;
    return Array.isArray(ids) ? ids : [];
  };
  const updateProfileRules = (mode = currentMode) => {
    const profile = profiles[mode] || defaultProfile(mode);
    const ruleIds = [...new Set(getActiveRuleIds(mode))].filter((id) => ruleLibrary.some((item) => item.id === id));
    profiles[mode] = {
      ...profile,
      mode,
      ruleIds,
      rules: rulesTextForIds(ruleIds),
    };
  };
  const countRuleUsage = (ruleId) => modes.filter((mode) => {
    const ids = profiles[mode]?.ruleIds;
    return Array.isArray(ids) && ids.includes(ruleId);
  }).length;
  const renderRuleLibrary = () => {
    const list = document.getElementById("ruleLibraryList");
    const count = document.getElementById("activeRuleCount");
    if (!list || !count) return;
    const selected = new Set(getActiveRuleIds());
    count.textContent = `${selected.size} ${selected.size === 1 ? "attiva" : "attive"}`;
    list.innerHTML = "";

    ruleLibrary.forEach((rule) => {
      const row = document.createElement("label");
      row.className = `rule-library-row${selected.has(rule.id) ? " is-active" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.className = "rule-library-check";
      checkbox.type = "checkbox";
      checkbox.value = rule.id;
      checkbox.checked = selected.has(rule.id);
      const content = document.createElement("span");
      content.className = "rule-library-row__content";
      const text = document.createElement("strong");
      text.textContent = rule.text;
      const meta = document.createElement("small");
      const usage = countRuleUsage(rule.id);
      meta.textContent = `Creata per ${modeLabels[rule.originMode] || "uso condiviso"} · usata in ${usage} ${usage === 1 ? "modello" : "modelli"}`;
      content.append(text, meta);
      row.append(checkbox, content);
      checkbox.addEventListener("change", () => {
        const next = new Set(getActiveRuleIds());
        if (checkbox.checked) next.add(rule.id);
        else next.delete(rule.id);
        if (isCreatingModel) {
          draftRuleIds = [...next];
          renderRuleLibrary();
          return;
        }
        profiles[currentMode] = {
          ...(profiles[currentMode] || defaultProfile(currentMode)),
          ruleIds: [...next],
          allowEmptyRules: next.size === 0,
        };
        updateProfileRules(currentMode);
        persistProfiles();
        renderRuleLibrary();
      });
      list.appendChild(row);
    });
  };

  const readVisibleProfile = (mode = currentMode, {markSaved = false} = {}) => ({
    mode,
    ...Object.fromEntries(Object.entries(profileFieldIds).map(([key, id]) => [key, document.getElementById(id)?.value])),
    depth: Number(document.getElementById("promptDepth")?.value || 2),
    ruleIds: [...getActiveRuleIds(mode)],
    rules: rulesTextForIds(getActiveRuleIds(mode)),
    ruleLibraryVersion,
    allowEmptyRules: Boolean(profiles[mode]?.allowEmptyRules),
    savedAt: markSaved ? new Date().toISOString() : profiles[mode]?.savedAt || null,
  });

  const setCreationUi = (active) => {
    isCreatingModel = active;
    editorPanel.classList.toggle("is-creating-model", active);
    creationNameField.hidden = !active;
    if (editorTitle) editorTitle.textContent = active ? "Aggiungi modello didattico" : "Configura il modello didattico";
    if (editorDescription) {
      editorDescription.textContent = active
        ? "Inserisci il nome e usa gli stessi parametri già presenti per costruire il nuovo modello."
        : "Definisci obiettivo, tratti, limiti e regole applicati quando lo studente sceglie questo modello.";
    }
    const saveButton = document.getElementById("saveBehaviorRules");
    if (saveButton) saveButton.textContent = active ? "Crea modello" : "Salva modello";
    const addButton = document.getElementById("startNewTeachingModel");
    if (addButton) addButton.textContent = active ? "Nuovo modello in compilazione" : "＋ Crea un nuovo modello";
  };

  const fillVisibleFields = (profile) => {
    Object.entries(profileFieldIds).forEach(([key, id]) => {
      const node = document.getElementById(id);
      if (node) {
        node.value = String(profile[key] ?? "");
        node._syncStudioSelect?.();
      }
    });
  };

  const fillProfile = (mode) => {
    const profile = profiles[mode] || defaultProfile(mode);
    setCreationUi(false);
    if (modeSelect) modeSelect.value = mode;
    fillVisibleFields(profile);
    modeSelect?._syncStudioSelect?.();
    systemPrompt.value = "";
    updateProfileRules(mode);
    renderRuleLibrary();
    workingStatus.textContent = profile.savedAt
      ? `${modeLabels[mode]} · salvato ${new Date(profile.savedAt).toLocaleString("it-IT")}.`
      : `${modeLabels[mode]} · usa ancora i parametri iniziali e non è stato personalizzato.`;
  };

  const beginModelCreation = () => {
    if (!isCreatingModel) {
      profiles[currentMode] = readVisibleProfile(currentMode);
      persistProfiles();
    }
    draftRuleIds = [];
    setCreationUi(true);
    if (nameInput) nameInput.value = "";
    fillVisibleFields({
      objective: "",
      tone: "calm_direct",
      depth: 2,
      sources: "required",
      solution: "guided",
      memory: "session_only",
      tools: "propose",
    });
    systemPrompt.value = "";
    renderRuleLibrary();
    workingStatus.textContent = "Compila il nome e i parametri, poi premi “Crea modello”.";
    nameInput?.focus();
  };

  const createModelFromVisibleFields = ({notifyUser = true} = {}) => {
    const name = nameInput?.value.trim().replace(/\s+/g, " ") || "";
    const objective = document.getElementById("modelObjective")?.value.trim().replace(/\s+/g, " ") || "";
    if (name.length < 3) {
      workingStatus.textContent = "Inserisci un nome di almeno 3 caratteri.";
      nameInput?.focus();
      return null;
    }
    if (objective.length < 12) {
      workingStatus.textContent = "Descrivi l’obiettivo con almeno 12 caratteri.";
      document.getElementById("modelObjective")?.focus();
      return null;
    }
    if (Object.values(modeLabels).some((label) => label.toLocaleLowerCase("it-IT") === name.toLocaleLowerCase("it-IT"))) {
      workingStatus.textContent = "Esiste già un modello con questo nome.";
      nameInput?.focus();
      return null;
    }

    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it-IT")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "modello";
    let id = `custom-${slug}`;
    let suffix = 2;
    while (modes.includes(id)) {
      id = `custom-${slug}-${suffix}`;
      suffix += 1;
    }

    const createdAt = new Date().toISOString();
    const visible = readVisibleProfile(id, {markSaved: true});
    const ruleIds = [...new Set(draftRuleIds)].filter((ruleId) => ruleLibrary.some((rule) => rule.id === ruleId));
    const definition = {
      id,
      name,
      objective,
      tone: visible.tone,
      depth: visible.depth,
      sources: visible.sources,
      solution: visible.solution,
      memory: visible.memory,
      tools: visible.tools,
      ruleIds,
      createdAt,
    };

    customModelDefinitions.push(definition);
    localStorage.setItem(customModelsKey, JSON.stringify(customModelDefinitions));
    modes.push(id);
    modeLabels[id] = name;
    defaultObjectives[id] = objective;
    defaultRules[id] = "";
    modelDescriptions[id] = objective;
    optionHelpDefinitions.promptMode[id] = [name, objective];
    profiles[id] = {
      ...visible,
      mode: id,
      objective,
      ruleLibraryVersion,
      allowEmptyRules: ruleIds.length === 0,
      ruleIds,
      rules: rulesTextForIds(ruleIds),
      savedAt: createdAt,
    };
    persistRuleLibrary();
    persistProfiles();

    const option = new Option(name, id);
    modeSelect?.add(option);
    customSelects.get(modeSelect)?.addOption(option);
    currentMode = id;
    localStorage.setItem(activeModelKey, currentMode);
    guide.querySelector(".tag.violet").textContent = `${modes.length} modelli configurabili`;
    fillProfile(currentMode);
    workingStatus.textContent = `${name} creato e pronto per essere modificato o provato.`;
    if (notifyUser && typeof notify === "function") notify(`${name} creato`);
    return {profiles: structuredClone(profiles), selectedModel: currentMode, savedAt: createdAt};
  };

  const saveCurrentModel = ({notifyUser = true} = {}) => {
    if (isCreatingModel) return createModelFromVisibleFields({notifyUser});
    profiles[currentMode] = readVisibleProfile(currentMode, {markSaved: true});
    persistRuleLibrary();
    persistProfiles();

    localStorage.setItem(activeModelKey, currentMode);
    window.dispatchEvent(new CustomEvent("eve:model-profile-updated", {
      detail: {selectedModel: currentMode, profile: structuredClone(profiles[currentMode]), profiles: structuredClone(profiles)},
    }));

    const configured = Object.values(profiles).filter((profile) => profile.savedAt).length;
    workingStatus.textContent = `${modeLabels[currentMode]} salvato · ${configured}/${modes.length} modelli personalizzati.`;
    if (notifyUser && typeof notify === "function") notify(`${modeLabels[currentMode]} salvato`);
    return {profiles: structuredClone(profiles), selectedModel: currentMode, savedAt: profiles[currentMode].savedAt};
  };

  modeSelect?.addEventListener("change", () => {
    if (!isCreatingModel) {
      profiles[currentMode] = readVisibleProfile(currentMode);
      persistProfiles();
    }
    currentMode = modeSelect.value;
    fillProfile(currentMode);
  });

  const addNewRule = () => {
    const text = systemPrompt.value.trim().replace(/\s+/g, " ");
    if (text.length < 8) {
      workingStatus.textContent = "Scrivi una regola di almeno 8 caratteri prima di aggiungerla.";
      systemPrompt.focus();
      return;
    }
    if (text.length > 500) {
      workingStatus.textContent = "La regola è troppo lunga: usa al massimo 500 caratteri e separa le istruzioni diverse.";
      systemPrompt.focus();
      return;
    }
    const id = ensureRuleInLibrary(text, isCreatingModel ? "__new__" : currentMode);
    const next = new Set(getActiveRuleIds());
    next.add(id);
    if (isCreatingModel) {
      draftRuleIds = [...next];
      persistRuleLibrary();
      systemPrompt.value = "";
      renderRuleLibrary();
      workingStatus.textContent = "Regola aggiunta al nuovo modello e resa disponibile nella libreria condivisa.";
      if (typeof notify === "function") notify("Regola aggiunta alla libreria");
      return;
    }
    profiles[currentMode] = {
      ...(profiles[currentMode] || defaultProfile(currentMode)),
      ruleIds: [...next],
      allowEmptyRules: false,
    };
    updateProfileRules(currentMode);
    persistRuleLibrary();
    persistProfiles();
    systemPrompt.value = "";
    renderRuleLibrary();
    workingStatus.textContent = `Regola aggiunta e attivata per ${modeLabels[currentMode]}. Ora è disponibile anche per gli altri modelli.`;
    if (typeof notify === "function") notify("Regola aggiunta alla libreria");
  };

  document.getElementById("addBehaviorRule")?.addEventListener("click", addNewRule);
  systemPrompt.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      addNewRule();
    }
  });
  document.getElementById("startNewTeachingModel")?.addEventListener("click", beginModelCreation);
  document.getElementById("saveBehaviorRules")?.addEventListener("click", () => saveCurrentModel());
  document.getElementById("tryBehaviorRules")?.addEventListener("click", () => {
    const saved = saveCurrentModel();
    if (!saved) return;
    localStorage.setItem(activeModelKey, currentMode);
    document.querySelector('[data-view="laboratory"]')?.click();
    document.querySelector(".chat-layout")?.scrollIntoView({behavior: "smooth", block: "start"});
    document.getElementById("chatInput")?.focus();
  });

  fillProfile(currentMode);

  const promptNav = document.querySelector('[data-view="prompts"]');
  if (promptNav) promptNav.lastChild.textContent = "Modelli e comportamento";
  promptNav?.addEventListener("click", () => {
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Modelli e comportamento";
    if (subtitle) subtitle.textContent = "Crea e modifica ogni modello definendone obiettivo, tratti, limiti e regole di comportamento.";
  });
})();
