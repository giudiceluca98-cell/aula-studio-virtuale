
const routeUrls = {
  presentation: "/",
  login: "/login",
  register: "/register",
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
  document.body.classList.toggle("dark", preferences.theme === "light");
  document.body.dataset.graphicsMode = ["full", "optimized", "reduced"].includes(preferences.graphicsMode)
    ? preferences.graphicsMode
    : "optimized";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const preferences = readVisualPreferences();
  preferences.theme = document.body.classList.contains("dark") ? "light" : "dark";
  preferences.dark = preferences.theme === "light";
  writeVisualPreferences(preferences);
}

applySharedVisualPreferences();


const portalDashboardRoomsStorageKey = "aula-demo-dashboard-rooms-v1";
const portalDashboardRoleLabels = {
  owner: "Proprietario",
  member: "Partecipante"
};
const portalDashboardDefaultRooms = [
  {
    id: "python-room",
    name: "Programmazione in Python",
    code: "PYTHON-2026",
    members: 2,
    activity: "Lezione 0.1",
    lastActivity: "Lezione 0.1",
    role: "owner",
    inviteRotatedAt: "",
    createdAt: "2026-07-17T14:30:00.000Z"
  }
];
const portalDashboardState = { rooms: [] };

function portalDashboardEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function portalDashboardNormalizeRoom(room) {
  if (!room || typeof room !== "object") return null;
  const name = String(room.name || "").trim().slice(0, 60);
  const id = String(room.id || "").trim().slice(0, 80);
  if (!name || !id) return null;
  return {
    ...room,
    id,
    name,
    code: String(room.code || "").trim().toUpperCase().slice(0, 64),
    members: Math.max(1, Number(room.members || 1)),
    activity: String(room.activity || "Nessuna attività").slice(0, 120),
    role: room.role === "owner" ? "owner" : "member"
  };
}

function portalDashboardLoadRooms() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(portalDashboardRoomsStorageKey) || "null");
  } catch {
    stored = null;
  }
  const rooms = Array.isArray(stored) ? stored : portalDashboardDefaultRooms;
  portalDashboardState.rooms = rooms.map(portalDashboardNormalizeRoom).filter(Boolean);
}

portalDashboardLoadRooms();

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


    const catalogDemoMaterials = [
      {
        id: "programmazione-zero",
        title: "Programmazione da Zero",
        provider: "Aula editoriale",
        format: "corso",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione coding python software development",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Percorso nativo dalle basi assolute: lezioni, esercizi, quiz, glossario, Python Project e criteri di completamento."
      },
      {
        id: "python-docs",
        title: "Documentazione ufficiale Python",
        provider: "Python Software Foundation",
        format: "documentazione",
        level: "base",
        language: "it",
        verified: true,
        topic: "programmazione python sintassi documentazione",
        monitoring: "Apribile nell’aula · monitoraggio parziale",
        description: "Riferimento ufficiale per sintassi, tipi, funzioni, moduli e libreria standard, utile durante gli esercizi."
      },
      {
        id: "python-exercises",
        title: "Esercizi Python con verifica",
        provider: "Aula Practice",
        format: "esercizi",
        level: "base",
        language: "it",
        verified: true,
        topic: "programmazione python esercizi problemi pratica",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Serie progressiva di esercizi con input, output atteso, casi limite e controllo finale del risultato."
      },
      {
        id: "algoritmi-pdf",
        title: "Algoritmi e pensiero computazionale",
        provider: "Open Learning Notes",
        format: "pdf",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione algoritmi pseudocodice logica metodo",
        monitoring: "Richiede importazione del PDF",
        description: "Dispensa introduttiva su scomposizione dei problemi, algoritmi, pseudocodice, test e casi limite."
      },
      {
        id: "python-video",
        title: "Python: prima lezione guidata",
        provider: "Aula Video",
        format: "video",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione python video installazione primo programma",
        monitoring: "Apribile nell’aula · copertura video monitorabile",
        description: "Video introduttivo con installazione, primo programma, terminale e lettura degli errori più comuni."
      },
      {
        id: "math-zero",
        title: "Matematica dalle basi",
        provider: "Aula editoriale",
        format: "corso",
        level: "zero",
        language: "it",
        verified: true,
        topic: "matematica numeri algebra geometria",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Percorso progressivo per recuperare numeri, operazioni, algebra e ragionamento matematico."
      },
      {
        id: "english-work",
        title: "English for Work",
        provider: "Open Skills",
        format: "corso",
        level: "base",
        language: "en",
        verified: false,
        topic: "lingue inglese lavoro conversazione vocabolario",
        monitoring: "Apribile nell’aula · monitoraggio parziale",
        description: "Materiali pratici per email, colloqui, riunioni e lessico professionale. Fonte personale da verificare."
      },
      {
        id: "study-method",
        title: "Metodo di studio e ripasso attivo",
        provider: "Aula Focus",
        format: "documentazione",
        level: "base",
        language: "it",
        verified: true,
        topic: "metodo studio memoria ripasso focus",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Guida a obiettivi, sessioni focus, recupero attivo, domande di controllo e pianificazione settimanale."
      }
    ];

    const catalogDemoState = {
      initialized: false,
      saved: new Set(["programmazione-zero", "python-docs"]),
      selected: new Set(["programmazione-zero", "python-docs", "python-exercises"]),
      importedSignature: ""
    };

    const catalogDemoFormatLabels = {
      corso: "Corso",
      documentazione: "Documentazione",
      video: "Video",
      esercizi: "Esercizi",
      pdf: "PDF"
    };

    const catalogDemoLevelLabels = {
      zero: "Da zero",
      base: "Base",
      intermedio: "Intermedio"
    };

    function catalogDemoEscape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function catalogDemoElements() {
      return {
        search: document.getElementById("catalogDemoSearch"),
        level: document.getElementById("catalogDemoLevel"),
        format: document.getElementById("catalogDemoFormat"),
        language: document.getElementById("catalogDemoLanguage"),
        verified: document.getElementById("catalogDemoVerified"),
        results: document.getElementById("catalogDemoResults"),
        count: document.getElementById("catalogDemoCount"),
        eveTitle: document.getElementById("catalogDemoEveTitle"),
        eveText: document.getElementById("catalogDemoEveText"),
        pathCount: document.getElementById("catalogDemoPathCount"),
        pathList: document.getElementById("catalogDemoPathList"),
        importButton: document.getElementById("catalogDemoImportButton"),
        status: document.getElementById("catalogDemoStatus")
      };
    }



    const catalogDemoManualStorageKey = "aula-demo-catalog-manual-v1";
    let catalogDemoManualPreviousFocus = null;

    const catalogDemoManualTypeMap = {
      page: { format: "documentazione", label: "Pagina web" },
      pdf: { format: "pdf", label: "PDF" },
      document: { format: "documentazione", label: "Documento" },
      dataset: { format: "documentazione", label: "Dataset" },
      notebook: { format: "esercizi", label: "Notebook" },
      archive: { format: "documentazione", label: "Archivio" },
      file: { format: "documentazione", label: "File" },
      video: { format: "video", label: "Video" },
      course: { format: "corso", label: "Corso" },
      book: { format: "documentazione", label: "Libro" },
      podcast: { format: "video", label: "Podcast" }
    };

    function catalogDemoNormalizeManualUrl(rawValue) {
      const url = new URL(String(rawValue || "").trim());
      if (url.protocol !== "https:") throw new Error("Inserisci un collegamento che inizi con https://");
      url.hash = "";
      const hostname = url.hostname.toLocaleLowerCase("en");
      const privateIpv4 = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
      if (!hostname || hostname === "localhost" || hostname === "::1" || hostname.endsWith(".local") || privateIpv4.test(hostname)) {
        throw new Error("Gli indirizzi locali o appartenenti a reti private non sono ammessi.");
      }
      const filename = url.pathname.split("/").pop() || "";
      const extension = filename.includes(".") ? filename.split(".").pop().toLocaleLowerCase("en") : "";
      const blocked = new Set(["exe", "msi", "bat", "cmd", "com", "scr", "ps1", "sh", "jar", "apk"]);
      if (blocked.has(extension)) throw new Error("Questo formato eseguibile non può essere aggiunto al Catalogo.");
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "") || "/";
      return url;
    }

    function catalogDemoManualId(url) {
      let hash = 2166136261;
      for (const character of url) {
        hash ^= character.charCodeAt(0);
        hash = Math.imul(hash, 16777619);
      }
      return `manual-${(hash >>> 0).toString(16)}`;
    }

    function catalogDemoLoadManualMaterials() {
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem(catalogDemoManualStorageKey) || "[]");
      } catch {
        stored = [];
      }
      if (!Array.isArray(stored)) return;
      stored.forEach((material) => {
        if (!material || typeof material !== "object" || !material.id || !material.sourceUrl) return;
        if (!catalogDemoMaterials.some((item) => item.id === material.id || item.sourceUrl === material.sourceUrl)) {
          catalogDemoMaterials.unshift({ ...material, personal: true, verified: false });
        }
        catalogDemoState.saved.add(material.id);
        catalogDemoState.selected.add(material.id);
      });
    }

    function catalogDemoPersistManualMaterials() {
      try {
        const materials = catalogDemoMaterials.filter((material) => material.personal);
        localStorage.setItem(catalogDemoManualStorageKey, JSON.stringify(materials));
      } catch {
        // La demo resta utilizzabile anche quando lo storage del browser è bloccato.
      }
    }

    function catalogDemoOpenManualMaterial() {
      const dialog = document.getElementById("catalogDemoManualDialog");
      const error = document.getElementById("catalogDemoManualError");
      if (!dialog) return;
      catalogDemoManualPreviousFocus = document.activeElement;
      if (error) error.textContent = "";
      dialog.hidden = false;
      document.body.classList.add("catalog-demo-dialog-open");
      window.setTimeout(() => document.getElementById("catalogDemoManualTitleInput")?.focus(), 30);
    }

    function catalogDemoCloseManualMaterial(options = {}) {
      const dialog = document.getElementById("catalogDemoManualDialog");
      const form = document.getElementById("catalogDemoManualForm");
      const error = document.getElementById("catalogDemoManualError");
      if (!dialog) return;
      dialog.hidden = true;
      document.body.classList.remove("catalog-demo-dialog-open");
      if (options.reset !== false) form?.reset();
      if (error) error.textContent = "";
      if (catalogDemoManualPreviousFocus?.focus) catalogDemoManualPreviousFocus.focus();
      catalogDemoManualPreviousFocus = null;
    }

    function catalogDemoManualBackdrop(event) {
      if (event.target?.id === "catalogDemoManualDialog") catalogDemoCloseManualMaterial();
    }

    function catalogDemoAddManualMaterial(event) {
      event.preventDefault();
      const titleInput = document.getElementById("catalogDemoManualTitleInput");
      const urlInput = document.getElementById("catalogDemoManualUrl");
      const typeInput = document.getElementById("catalogDemoManualType");
      const languageInput = document.getElementById("catalogDemoManualLanguage");
      const providerInput = document.getElementById("catalogDemoManualProvider");
      const descriptionInput = document.getElementById("catalogDemoManualDescription");
      const error = document.getElementById("catalogDemoManualError");
      const title = String(titleInput?.value || "").trim();
      if (!title) {
        if (error) error.textContent = "Inserisci il titolo del materiale.";
        titleInput?.focus();
        return;
      }

      let normalizedUrl;
      try {
        normalizedUrl = catalogDemoNormalizeManualUrl(urlInput?.value || "");
      } catch (failure) {
        if (error) error.textContent = failure instanceof Error ? failure.message : "Controlla il collegamento HTTPS.";
        urlInput?.focus();
        return;
      }

      const sourceUrl = normalizedUrl.toString();
      const existing = catalogDemoMaterials.find((material) => material.sourceUrl === sourceUrl);
      if (existing) {
        catalogDemoState.saved.add(existing.id);
        catalogDemoState.selected.add(existing.id);
        catalogDemoCloseManualMaterial();
        catalogDemoRender();
        const elements = catalogDemoElements();
        if (elements.status) elements.status.textContent = "Questo collegamento era già presente: è stato selezionato senza creare duplicati.";
        portalNotify("Materiale già presente nel Catalogo");
        return;
      }

      const resourceType = String(typeInput?.value || "page");
      const typeData = catalogDemoManualTypeMap[resourceType] || catalogDemoManualTypeMap.page;
      const language = String(languageInput?.value || "it");
      const provider = String(providerInput?.value || "").trim() || normalizedUrl.hostname;
      const description = String(descriptionInput?.value || "").trim() || "Materiale aggiunto manualmente al catalogo personale.";
      const id = catalogDemoManualId(sourceUrl);
      const material = {
        id,
        title,
        provider,
        format: typeData.format,
        resourceType,
        resourceTypeLabel: typeData.label,
        level: "base",
        language,
        verified: false,
        personal: true,
        sourceUrl,
        topic: `${title} ${description} ${provider} materiale personale`,
        monitoring: "Aggiunto da te · accesso esterno non monitorato",
        description
      };

      catalogDemoMaterials.unshift(material);
      catalogDemoState.saved.add(id);
      catalogDemoState.selected.add(id);
      catalogDemoState.importedSignature = "";
      catalogDemoPersistManualMaterials();
      catalogDemoCloseManualMaterial();

      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = "";
      if (elements.level) elements.level.value = "all";
      if (elements.format) elements.format.value = "all";
      if (elements.language) elements.language.value = "all";
      if (elements.verified) elements.verified.checked = false;
      catalogDemoRender();
      if (elements.status) elements.status.textContent = "Materiale aggiunto al catalogo personale e selezionato per il percorso.";
      portalNotify("Materiale aggiunto al Catalogo");
    }

    window.addEventListener("keydown", (event) => {
      const dialog = document.getElementById("catalogDemoManualDialog");
      if (event.key === "Escape" && dialog && !dialog.hidden) {
        event.preventDefault();
        catalogDemoCloseManualMaterial();
      }
    });


    function catalogDemoFilteredMaterials() {
      const elements = catalogDemoElements();
      const query = String(elements.search?.value || "").trim().toLocaleLowerCase("it");
      const level = elements.level?.value || "all";
      const format = elements.format?.value || "all";
      const language = elements.language?.value || "all";
      const verifiedOnly = Boolean(elements.verified?.checked);
      const terms = query.split(/\s+/).filter(Boolean);

      return catalogDemoMaterials.filter((material) => {
        const haystack = `${material.title} ${material.provider} ${material.description} ${material.topic}`.toLocaleLowerCase("it");
        return (terms.length === 0 || terms.every((term) => haystack.includes(term)))
          && (level === "all" || material.level === level)
          && (format === "all" || material.format === format)
          && (language === "all" || material.language === language)
          && (!verifiedOnly || material.verified);
      });
    }

    function catalogDemoCard(material) {
      const saved = catalogDemoState.saved.has(material.id);
      const selected = catalogDemoState.selected.has(material.id);
      return `
        <article class="catalog-demo-card ${selected ? "is-selected" : ""}" data-catalog-material="${catalogDemoEscape(material.id)}">
          <div class="catalog-demo-card-badges">
            <span class="catalog-demo-badge">${catalogDemoEscape(catalogDemoFormatLabels[material.format] || material.format)}</span>
            <span class="catalog-demo-badge secondary">${catalogDemoEscape(catalogDemoLevelLabels[material.level] || material.level)}</span>
            <span class="catalog-demo-badge secondary">${material.verified ? "Fonte verificata" : "Da verificare"}</span>
          </div>
          <h3>${catalogDemoEscape(material.title)}</h3>
          <p class="catalog-demo-provider">${catalogDemoEscape(material.provider)} · ${catalogDemoEscape(material.language.toUpperCase())}</p>
          <p class="catalog-demo-description">${catalogDemoEscape(material.description)}</p>
          <div class="catalog-demo-monitoring">${catalogDemoEscape(material.monitoring)}</div>
          <div class="catalog-demo-card-actions">
            <button type="button" onclick="catalogDemoToggleSaved('${catalogDemoEscape(material.id)}')">${saved ? "★ Salvato" : "☆ Salva"}</button>
            <button class="primary" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')">${selected ? "✓ Nel percorso" : "+ Usa nel percorso"}</button>
            ${material.sourceUrl ? `<a class="catalog-demo-external" href="${catalogDemoEscape(material.sourceUrl)}" target="_blank" rel="noopener noreferrer">↗ Apri fonte esterna</a>` : ""}
          </div>
        </article>
      `;
    }

    function catalogDemoRender(announce = false) {
      const elements = catalogDemoElements();
      if (!elements.results) return;
      const materials = catalogDemoFilteredMaterials();
      elements.results.innerHTML = materials.length
        ? materials.map(catalogDemoCard).join("")
        : `<div class="catalog-demo-empty"><strong>Nessun materiale corrisponde ai filtri.</strong><br>Prova ad azzerare i filtri o usa una ricerca più generale.</div>`;
      if (elements.count) elements.count.textContent = `${materials.length} ${materials.length === 1 ? "risultato" : "risultati"}`;

      const query = String(elements.search?.value || "").trim();
      if (elements.eveTitle) {
        elements.eveTitle.textContent = query
          ? `Eve ha organizzato la ricerca “${query}”`
          : "Eve ha preparato una selezione iniziale";
      }
      if (elements.eveText) {
        elements.eveText.textContent = materials.length
          ? `Ho trovato ${materials.length} materiali compatibili. Seleziona quelli utili e controlla il percorso sulla destra.`
          : "Non ho trovato una corrispondenza completa. Riduci i filtri oppure prova un obiettivo più generale.";
      }

      document.querySelectorAll("[data-catalog-topic]").forEach((button) => {
        const topic = button.getAttribute("data-catalog-topic") || "";
        button.classList.toggle("is-active", Boolean(query) && query.toLocaleLowerCase("it").includes(topic));
      });

      catalogDemoRenderPath();
      if (announce && elements.status) elements.status.textContent = `Ricerca completata: ${materials.length} materiali disponibili.`;
    }

    function catalogDemoRenderPath() {
      const elements = catalogDemoElements();
      if (!elements.pathList) return;
      const selected = catalogDemoMaterials.filter((material) => catalogDemoState.selected.has(material.id));
      if (elements.pathCount) elements.pathCount.textContent = String(selected.length);
      elements.pathList.innerHTML = selected.length
        ? selected.map((material, index) => `
            <li class="catalog-demo-path-item">
              <span class="catalog-demo-path-index">${index + 1}</span>
              <span>${catalogDemoEscape(material.title)}</span>
              <button class="catalog-demo-remove" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')" aria-label="Rimuovi ${catalogDemoEscape(material.title)} dal percorso">×</button>
            </li>
          `).join("")
        : `<li class="catalog-demo-empty">Seleziona almeno un materiale dai risultati.</li>`;
      if (elements.importButton) elements.importButton.disabled = selected.length === 0 || !portalCatalogRoom(portalCatalogPreferredRoomId);
      portalCatalogSyncContextUI();
    }

    function catalogDemoToggleSaved(id) {
      if (catalogDemoState.saved.has(id)) catalogDemoState.saved.delete(id);
      else catalogDemoState.saved.add(id);
      const elements = catalogDemoElements();
      if (elements.status) elements.status.textContent = catalogDemoState.saved.has(id)
        ? "Materiale aggiunto ai salvati personali."
        : "Materiale rimosso dai salvati personali.";
      catalogDemoRender();
    }

    function catalogDemoToggleSelected(id) {
      if (catalogDemoState.selected.has(id)) catalogDemoState.selected.delete(id);
      else catalogDemoState.selected.add(id);
      catalogDemoState.importedSignature = "";
      const elements = catalogDemoElements();
      if (elements.status) elements.status.textContent = catalogDemoState.selected.has(id)
        ? "Materiale aggiunto al percorso."
        : "Materiale rimosso dal percorso.";
      catalogDemoRender();
    }

    function catalogDemoUseQuery(query) {
      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = query;
      catalogDemoRender(true);
    }

    function catalogDemoResetFilters() {
      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = "";
      if (elements.level) elements.level.value = "all";
      if (elements.format) elements.format.value = "all";
      if (elements.language) elements.language.value = "all";
      if (elements.verified) elements.verified.checked = false;
      if (elements.status) elements.status.textContent = "Filtri azzerati.";
      catalogDemoRender();
    }

    function catalogDemoImportPath() {
      const selected = catalogDemoMaterials.filter((material) => catalogDemoState.selected.has(material.id));
      const room = portalCatalogRoom(portalCatalogPreferredRoomId);
      const elements = catalogDemoElements();
      if (!selected.length) return;
      if (!room) {
        if (elements.status) elements.status.textContent = "Scegli una stanza di destinazione prima di importare il percorso.";
        portalNotify("Seleziona una stanza per importare");
        document.getElementById("catalogRoomContextSelect")?.focus();
        return;
      }
      const signature = selected.map((material) => material.id).sort().join("|");
      const imports = portalCatalogLoadRoomImports();
      if (imports[room.id] === signature) {
        if (elements.status) elements.status.textContent = `Questo percorso è già presente in “${room.name}”: nessun duplicato creato.`;
        portalNotify(`Percorso già presente in ${room.name}`);
        return;
      }
      imports[room.id] = signature;
      portalCatalogSaveRoomImports(imports);
      catalogDemoState.importedSignature = `${room.id}:${signature}`;
      if (elements.status) elements.status.textContent = `Percorso importato in “${room.name}”: ${selected.length} materiali, un corso e una checklist simulati.`;
      portalNotify(`Percorso importato in ${room.name}`);
    }

    function catalogDemoInit() {
      if (!document.getElementById("portalCatalog")) return;
      const backToAula = document.getElementById("catalogDemoBackToAula");
      if (backToAula) {
        backToAula.hidden = new URLSearchParams(location.search).get("from") !== "aula";
      }
      if (!catalogDemoState.initialized) {
        catalogDemoState.initialized = true;
        catalogDemoLoadManualMaterials();
        const elements = catalogDemoElements();
        if (elements.search && !elements.search.value) elements.search.value = "programmazione";
      }
      catalogDemoRender();
      portalCatalogSyncContextUI();
    }


    /* ==========================================================
       NAVIGAZIONE INTERNA — UN SOLO FILE HTML
       ========================================================== */



catalogDemoInit();


/* API usata dagli attributi interattivi della demo canonica. */
if (typeof catalogDemoAddManualMaterial === "function") window.catalogDemoAddManualMaterial = catalogDemoAddManualMaterial;
if (typeof catalogDemoCloseManualMaterial === "function") window.catalogDemoCloseManualMaterial = catalogDemoCloseManualMaterial;
if (typeof catalogDemoImportPath === "function") window.catalogDemoImportPath = catalogDemoImportPath;
if (typeof catalogDemoManualBackdrop === "function") window.catalogDemoManualBackdrop = catalogDemoManualBackdrop;
if (typeof catalogDemoOpenManualMaterial === "function") window.catalogDemoOpenManualMaterial = catalogDemoOpenManualMaterial;
if (typeof catalogDemoRender === "function") window.catalogDemoRender = catalogDemoRender;
if (typeof catalogDemoResetFilters === "function") window.catalogDemoResetFilters = catalogDemoResetFilters;
if (typeof catalogDemoToggleSaved === "function") window.catalogDemoToggleSaved = catalogDemoToggleSaved;
if (typeof catalogDemoToggleSelected === "function") window.catalogDemoToggleSelected = catalogDemoToggleSelected;
if (typeof catalogDemoUseQuery === "function") window.catalogDemoUseQuery = catalogDemoUseQuery;
if (typeof navigatePortal === "function") window.navigatePortal = navigatePortal;
if (typeof portalCatalogSetRoomContext === "function") window.portalCatalogSetRoomContext = portalCatalogSetRoomContext;
if (typeof toggleDarkMode === "function") window.toggleDarkMode = toggleDarkMode;
