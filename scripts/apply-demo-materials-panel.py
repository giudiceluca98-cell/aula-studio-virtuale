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

VERSION = "1.3.0-alpha.1"
DATE = "2026-07-22"
MARKER = "MATERIALI E WORKSPACE — PANNELLO MATERIALI 1.3.0-alpha.1"

CSS = r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — PANNELLO MATERIALI 1.3.0-alpha.1
       ========================================================== */

    .materials-panel-shell {
      display: grid;
      gap: 14px;
    }

    .materials-panel-intro {
      padding: 14px;
      border: 1px solid rgba(125,235,255,0.18);
      border-radius: 15px;
      background:
        linear-gradient(90deg, rgba(0,223,242,0.055), transparent 64%),
        rgba(255,255,255,0.018);
    }

    .materials-panel-intro strong,
    .materials-panel-intro span {
      display: block;
    }

    .materials-panel-intro strong {
      font-size: 13px;
    }

    .materials-panel-intro span {
      margin-top: 5px;
      color: var(--muted);
      font-size: 10px;
      line-height: 1.5;
    }

    .materials-panel-toolbar {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(125px, 0.5fr) minmax(125px, 0.5fr);
      gap: 8px;
    }

    .materials-panel-toolbar input,
    .materials-panel-toolbar select {
      min-height: 42px;
      width: 100%;
      padding: 0 11px;
      border: 1px solid var(--line);
      border-radius: 11px;
      color: var(--ink);
      background: var(--surface-strong);
      font-size: 10px;
    }

    .materials-panel-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted);
      font-size: 9px;
    }

    .materials-panel-summary strong {
      color: var(--ink);
      font-size: 10px;
    }

    .materials-panel-list {
      display: grid;
      gap: 9px;
    }

    .materials-panel-card {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 11px;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,0.018);
      transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
    }

    .materials-panel-card:hover {
      transform: translateY(-1px);
      border-color: rgba(125,235,255,0.26);
      background: rgba(0,223,242,0.035);
    }

    .materials-panel-card.is-selected {
      border-color: rgba(82,232,176,0.34);
      background:
        linear-gradient(90deg, rgba(82,232,176,0.075), transparent 70%),
        rgba(255,255,255,0.018);
      box-shadow: inset 3px 0 0 rgba(82,232,176,0.72);
    }

    .materials-panel-icon {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125,235,255,0.18);
      border-radius: 12px;
      color: var(--green-2);
      background: rgba(0,223,242,0.055);
      font-size: 16px;
      font-weight: 900;
    }

    .materials-panel-copy {
      min-width: 0;
    }

    .materials-panel-copy h3 {
      margin: 0;
      overflow: hidden;
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .materials-panel-copy p {
      display: -webkit-box;
      margin: 5px 0 0;
      overflow: hidden;
      color: var(--muted);
      font-size: 9px;
      line-height: 1.45;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .materials-panel-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }

    .materials-panel-badge {
      padding: 3px 6px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255,255,255,0.02);
      font-size: 7px;
      font-weight: 820;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .materials-panel-badge.monitor-full {
      color: #91f7d3;
      border-color: rgba(82,232,176,0.22);
      background: rgba(82,232,176,0.05);
    }

    .materials-panel-badge.monitor-partial {
      color: #ffd7a7;
      border-color: rgba(255,176,91,0.22);
      background: rgba(255,176,91,0.05);
    }

    .materials-panel-badge.monitor-none {
      color: #ffb7bf;
      border-color: rgba(255,108,121,0.22);
      background: rgba(255,92,105,0.05);
    }

    .materials-panel-card-actions {
      display: grid;
      gap: 6px;
      justify-items: end;
    }

    .materials-panel-card-actions button {
      min-height: 34px;
      min-width: 82px;
      padding: 0 9px;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-size: 8px;
      font-weight: 800;
      cursor: pointer;
    }

    .materials-panel-card-actions button.primary {
      color: #eaffff;
      border-color: rgba(125,235,255,0.25);
      background: rgba(0,223,242,0.07);
    }

    .materials-panel-progress {
      min-width: 84px;
      text-align: right;
    }

    .materials-panel-progress strong,
    .materials-panel-progress span {
      display: block;
    }

    .materials-panel-progress strong {
      color: var(--ink);
      font-size: 11px;
    }

    .materials-panel-progress span {
      margin-top: 3px;
      color: var(--muted);
      font-size: 7px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .materials-panel-empty {
      padding: 24px 16px;
      border: 1px dashed var(--line);
      border-radius: 14px;
      color: var(--muted);
      text-align: center;
      font-size: 10px;
      line-height: 1.5;
    }

    .materials-panel-footer {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      padding-top: 4px;
    }

    .materials-panel-footer span {
      color: var(--muted);
      font-size: 8px;
      line-height: 1.45;
    }

    .materials-panel-footer button {
      min-height: 38px;
      padding: 0 11px;
      border: 1px solid rgba(122,124,255,0.22);
      border-radius: 10px;
      color: #c7c8ff;
      background: rgba(122,124,255,0.055);
      font-size: 9px;
      font-weight: 800;
      cursor: pointer;
    }

    .material-workspace-placeholder {
      display: grid;
      gap: 16px;
      padding: 4px 0 12px;
    }

    .material-workspace-placeholder-head {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      padding: 17px;
      border: 1px solid rgba(125,235,255,0.20);
      border-radius: 16px;
      background:
        linear-gradient(90deg, rgba(0,223,242,0.06), transparent 62%),
        rgba(255,255,255,0.018);
    }

    .material-workspace-placeholder-icon {
      width: 48px;
      height: 48px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125,235,255,0.22);
      border-radius: 14px;
      color: var(--green-2);
      background: rgba(0,223,242,0.06);
      font-size: 19px;
      font-weight: 900;
    }

    .material-workspace-placeholder h1 {
      margin: 0;
      font-size: clamp(25px, 3vw, 38px);
    }

    .material-workspace-placeholder p {
      margin: 6px 0 0;
      color: var(--muted);
      line-height: 1.6;
    }

    .material-workspace-facts {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 9px;
    }

    .material-workspace-fact {
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: rgba(255,255,255,0.018);
    }

    .material-workspace-fact span,
    .material-workspace-fact strong {
      display: block;
    }

    .material-workspace-fact span {
      color: var(--muted);
      font-size: 8px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .material-workspace-fact strong {
      margin-top: 5px;
      font-size: 11px;
    }

    .material-workspace-honesty {
      padding: 13px;
      border: 1px solid rgba(255,176,91,0.20);
      border-radius: 13px;
      color: var(--muted);
      background: rgba(255,176,91,0.045);
      font-size: 9px;
      line-height: 1.55;
    }

    @media (max-width: 760px) {
      .materials-panel-toolbar {
        grid-template-columns: 1fr;
      }

      .materials-panel-card {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .materials-panel-card-actions {
        grid-column: 1 / -1;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
      }

      .materials-panel-card-actions button {
        width: 100%;
      }

      .material-workspace-facts {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 480px) {
      .materials-panel-footer {
        grid-template-columns: 1fr;
      }

      .materials-panel-footer button {
        width: 100%;
      }

      .material-workspace-placeholder-head,
      .material-workspace-facts {
        grid-template-columns: 1fr;
      }
    }
'''

JS = r'''

    /* ==========================================================
       MATERIALI — SELETTORE E WORKSPACE LOCALE
       ========================================================== */

    const aulaMaterialsPanelStorageKey = "aula-demo-materials-panel-v1";

    const aulaMaterialsPanelData = [
      {
        id: "native-programming-lesson",
        title: "Che cosa significa programmare?",
        description: "Lezione nativa completa del percorso Programmazione da Zero.",
        course: "Programmazione da Zero",
        kind: "lesson",
        kindLabel: "Lezione nativa",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 36,
        progressLabel: "4 di 11 sezioni",
        icon: "▣",
        viewerReady: true
      },
      {
        id: "python-introduction-txt",
        title: "Introduzione a Python · appunti TXT",
        description: "Testo condiviso con definizioni, esempi e riferimenti alla prima esercitazione.",
        course: "Programmazione da Zero",
        kind: "text",
        kindLabel: "Testo",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 42,
        progressLabel: "Ripresa disponibile",
        icon: "T",
        viewerReady: false
      },
      {
        id: "chapter-one-exercises-pdf",
        title: "Esercizi · Capitolo 1",
        description: "PDF condiviso con esercizi progressivi e casi limite da verificare.",
        course: "Programmazione da Zero",
        kind: "pdf",
        kindLabel: "PDF",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 67,
        progressLabel: "Pagina 8 di 12",
        icon: "P",
        viewerReady: false
      },
      {
        id: "study-guide-docx",
        title: "Guida al ripasso delle funzioni",
        description: "Documento DOCX estratto come testo sicuro, collegato al corso principale.",
        course: "Programmazione da Zero",
        kind: "document",
        kindLabel: "DOCX",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "partial",
        monitoringLabel: "Monitoraggio parziale",
        progress: 18,
        progressLabel: "Lettura iniziata",
        icon: "D",
        viewerReady: false
      },
      {
        id: "algorithm-slides-pptx",
        title: "Algoritmi e pseudocodice",
        description: "Presentazione PPTX disponibile come sequenza di slide testuali.",
        course: "Programmazione da Zero",
        kind: "presentation",
        kindLabel: "PPTX",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "partial",
        monitoringLabel: "Monitoraggio parziale",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "S",
        viewerReady: false
      },
      {
        id: "python-tutor-external",
        title: "Visualizzatore Python",
        description: "Risorsa HTTPS esterna utile per seguire l’esecuzione del codice riga per riga.",
        course: "Risorse libere",
        kind: "link",
        kindLabel: "Link",
        access: "external-unmonitored",
        accessLabel: "Esterno",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Solo apertura",
        icon: "↗",
        viewerReady: false
      }
    ];

    const aulaMaterialsPanelState = {
      initialized: false,
      selectedId: "native-programming-lesson",
      query: "",
      course: "all",
      kind: "all"
    };

    function aulaMaterialsPanelEscape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function aulaMaterialsPanelLoad() {
      if (aulaMaterialsPanelState.initialized) return;
      aulaMaterialsPanelState.initialized = true;
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialsPanelStorageKey) || "{}");
        if (parsed && aulaMaterialsPanelData.some((item) => item.id === parsed.selectedId)) {
          aulaMaterialsPanelState.selectedId = parsed.selectedId;
        }
      } catch {
        // La selezione predefinita resta disponibile se il browser blocca lo storage.
      }
    }

    function aulaMaterialsPanelSave() {
      try {
        localStorage.setItem(aulaMaterialsPanelStorageKey, JSON.stringify({ selectedId: aulaMaterialsPanelState.selectedId }));
      } catch {
        // La selezione resta valida per la sessione corrente.
      }
    }

    function aulaMaterialsPanelSelected() {
      return aulaMaterialsPanelData.find((material) => material.id === aulaMaterialsPanelState.selectedId)
        || aulaMaterialsPanelData[0];
    }

    function aulaMaterialsPanelCourses() {
      return [...new Set(aulaMaterialsPanelData.map((material) => material.course))];
    }

    function aulaMaterialsPanelKinds() {
      return [...new Map(aulaMaterialsPanelData.map((material) => [material.kind, material.kindLabel])).entries()];
    }

    function aulaMaterialsPanelFiltered() {
      const query = aulaMaterialsPanelState.query.trim().toLocaleLowerCase("it");
      return aulaMaterialsPanelData.filter((material) => {
        const haystack = `${material.title} ${material.description} ${material.course} ${material.kindLabel}`.toLocaleLowerCase("it");
        return (!query || haystack.includes(query))
          && (aulaMaterialsPanelState.course === "all" || material.course === aulaMaterialsPanelState.course)
          && (aulaMaterialsPanelState.kind === "all" || material.kind === aulaMaterialsPanelState.kind);
      });
    }

    function aulaMaterialsPanelCard(material) {
      const selected = material.id === aulaMaterialsPanelState.selectedId;
      return `
        <article class="materials-panel-card ${selected ? "is-selected" : ""}" data-material-id="${aulaMaterialsPanelEscape(material.id)}">
          <div class="materials-panel-icon" aria-hidden="true">${aulaMaterialsPanelEscape(material.icon)}</div>
          <div class="materials-panel-copy">
            <h3>${aulaMaterialsPanelEscape(material.title)}</h3>
            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <div class="materials-panel-meta">
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.course)}</span>
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.kindLabel)}</span>
              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.accessLabel)}</span>
              <span class="materials-panel-badge monitor-${aulaMaterialsPanelEscape(material.monitoring)}">${aulaMaterialsPanelEscape(material.monitoringLabel)}</span>
            </div>
          </div>
          <div class="materials-panel-card-actions">
            <div class="materials-panel-progress">
              <strong>${material.progress}%</strong>
              <span>${aulaMaterialsPanelEscape(material.progressLabel)}</span>
            </div>
            <button type="button" onclick="aulaMaterialsPanelSelect('${aulaMaterialsPanelEscape(material.id)}')">${selected ? "Selezionato" : "Seleziona"}</button>
            <button class="primary" type="button" onclick="aulaMaterialsPanelOpen('${aulaMaterialsPanelEscape(material.id)}')">Apri</button>
          </div>
        </article>`;
    }

    function buildMaterialsDrawerHtml() {
      aulaMaterialsPanelLoad();
      const materials = aulaMaterialsPanelFiltered();
      const selected = aulaMaterialsPanelSelected();
      return `
        <div class="materials-panel-shell">
          <section class="materials-panel-intro">
            <strong>Materiale selezionato: ${aulaMaterialsPanelEscape(selected.title)}</strong>
            <span>Scegli cosa aprire nel workspace centrale. La demo distingue accesso interno, esterno e livello di monitorabilità senza fingere servizi remoti.</span>
          </section>

          <div class="materials-panel-toolbar">
            <input id="materialsPanelSearch" type="search" value="${aulaMaterialsPanelEscape(aulaMaterialsPanelState.query)}" placeholder="Cerca titolo, corso o formato" aria-label="Cerca materiali" oninput="aulaMaterialsPanelSetQuery(this.value)">
            <select id="materialsPanelCourse" aria-label="Filtra per corso" onchange="aulaMaterialsPanelSetCourse(this.value)">
              <option value="all">Tutti i corsi</option>
              ${aulaMaterialsPanelCourses().map((course) => `<option value="${aulaMaterialsPanelEscape(course)}"${course === aulaMaterialsPanelState.course ? " selected" : ""}>${aulaMaterialsPanelEscape(course)}</option>`).join("")}
            </select>
            <select id="materialsPanelKind" aria-label="Filtra per formato" onchange="aulaMaterialsPanelSetKind(this.value)">
              <option value="all">Tutti i formati</option>
              ${aulaMaterialsPanelKinds().map(([kind, label]) => `<option value="${aulaMaterialsPanelEscape(kind)}"${kind === aulaMaterialsPanelState.kind ? " selected" : ""}>${aulaMaterialsPanelEscape(label)}</option>`).join("")}
            </select>
          </div>

          <div class="materials-panel-summary">
            <strong>${materials.length} ${materials.length === 1 ? "materiale" : "materiali"}</strong>
            <span>${aulaMaterialsPanelData.length} disponibili nella stanza</span>
          </div>

          <div class="materials-panel-list" id="materialsPanelList">
            ${materials.length ? materials.map(aulaMaterialsPanelCard).join("") : `<div class="materials-panel-empty">Nessun materiale corrisponde ai filtri. Azzera la ricerca oppure scegli un altro corso.</div>`}
          </div>

          <div class="materials-panel-footer">
            <span>Upload, link, limiti file e classificazione completa arrivano nelle prossime sottofasi della Fase 3.</span>
            <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
          </div>
        </div>`;
    }

    function aulaMaterialsPanelRefresh(options = {}) {
      const content = document.getElementById("drawerContent");
      if (!content || document.getElementById("drawerBackdrop")?.classList.contains("hidden")) return;
      content.innerHTML = buildMaterialsDrawerHtml();
      if (options.focusSearch) window.setTimeout(() => document.getElementById("materialsPanelSearch")?.focus(), 20);
    }

    function aulaMaterialsPanelSetQuery(value) {
      aulaMaterialsPanelState.query = String(value || "");
      aulaMaterialsPanelRefresh({ focusSearch: true });
      const input = document.getElementById("materialsPanelSearch");
      if (input) {
        input.value = aulaMaterialsPanelState.query;
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    function aulaMaterialsPanelSetCourse(value) {
      aulaMaterialsPanelState.course = String(value || "all");
      aulaMaterialsPanelRefresh();
    }

    function aulaMaterialsPanelSetKind(value) {
      aulaMaterialsPanelState.kind = String(value || "all");
      aulaMaterialsPanelRefresh();
    }

    function aulaMaterialsPanelSelect(id) {
      if (!aulaMaterialsPanelData.some((material) => material.id === id)) return;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      aulaMaterialsPanelRefresh();
      const material = aulaMaterialsPanelSelected();
      showToast(`Materiale selezionato: ${material.title}`);
    }

    function aulaMaterialsPanelWorkspaceHtml(material) {
      const availability = material.viewerReady
        ? "Viewer nativo già disponibile nella demo."
        : material.access === "external-unmonitored"
          ? "Questa risorsa si apre esternamente e la demo non attribuisce progresso alla consultazione."
          : `Il viewer ${material.kindLabel} verrà integrato nella sottofase dedicata; qui è rappresentata soltanto la selezione nel workspace.`;
      return `
        <section class="material-workspace-placeholder" data-material-workspace-kind="${aulaMaterialsPanelEscape(material.kind)}">
          <div class="document-section-label">Materiale della stanza · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-workspace-placeholder-head">
            <div class="material-workspace-placeholder-icon" aria-hidden="true">${aulaMaterialsPanelEscape(material.icon)}</div>
            <div>
              <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
              <p>${aulaMaterialsPanelEscape(material.description)}</p>
            </div>
          </div>
          <div class="material-workspace-facts">
            <div class="material-workspace-fact"><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Accesso</span><strong>${aulaMaterialsPanelEscape(material.accessLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Monitorabilità</span><strong>${aulaMaterialsPanelEscape(material.monitoringLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Avanzamento</span><strong>${material.progress}% · ${aulaMaterialsPanelEscape(material.progressLabel)}</strong></div>
          </div>
          <div class="material-workspace-honesty"><strong>Stato reale della demo.</strong> ${aulaMaterialsPanelEscape(availability)}</div>
        </section>`;
    }

    function aulaMaterialsPanelOpen(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      if (material.viewerReady) {
        state.currentSection = 0;
        activateLessonTab();
      } else if (documentContent) {
        if (audioLessonState.speaking) stopAudioLesson(false);
        if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
        document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
        documentContent.innerHTML = aulaMaterialsPanelWorkspaceHtml(material);
        state.currentView = "material-preview";
        setEveContext("materiali");
        saveState();
      }
      closeDrawer();
      showToast(`Aperto nel workspace: ${material.title}`);
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
        "    /* ==========================================================\n       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6",
        CSS + "\n\n    /* ==========================================================\n       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6",
        "dashboard error CSS marker",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       DASHBOARD — STATI DI ERRORE DETERMINISTICI",
        JS + "\n\n    /* ==========================================================\n       DASHBOARD — STATI DI ERRORE DETERMINISTICI",
        "dashboard error JS marker",
    )

    html = replace_once(
        html,
        '''      document.getElementById("drawerContent").innerHTML =
        type === "progressi" ? buildProgressDrawerHtml() : template.html;''',
        '''      document.getElementById("drawerContent").innerHTML =
        type === "progressi"
          ? buildProgressDrawerHtml()
          : type === "materiali"
            ? buildMaterialsDrawerHtml()
            : template.html;''',
        "drawer material builder",
    )

    return html


def validate(html: str) -> None:
    required = [
        MARKER,
        "const aulaMaterialsPanelData = [",
        "function buildMaterialsDrawerHtml(",
        "function aulaMaterialsPanelOpen(",
        "function aulaMaterialsPanelWorkspaceHtml(",
        "materials-panel-card",
        "material-workspace-placeholder",
        'type === "materiali"',
        "Monitoraggio completo",
        "Non monitorabile",
        "viewerReady",
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
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {VERSION} pronta per verifica: pannello Materiali e selezione workspace.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Materiali e workspace — pannello Materiali\n\n- Sostituito il contenuto statico del drawer Materiali con un selettore realistico.\n- Aggiunti ricerca, filtro corso e filtro formato.\n- Aggiunte schede con formato, corso, accesso, monitorabilità e avanzamento.\n- Aggiunta selezione persistente del materiale.\n- Aggiunta apertura nel workspace centrale.\n- La lezione nativa conserva il lettore completo già approvato.\n- I viewer TXT/PDF/DOCX/PPTX sono rappresentati onestamente come sottofasi successive, senza simulare servizi già operativi.\n- Le risorse esterne sono dichiarate non monitorabili.\n- Conservati Dashboard, Catalogo, Eve, audio, esercizi, chat e responsive.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.2.0-alpha.6]", entry + "## [1.2.0-alpha.6]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    marker = "## Pannello Materiali e workspace"
    addition = f'''\n{marker}\n\nStato: 🟡 — checkpoint HTML {VERSION} in attesa di approvazione\n\nIntegrato:\n\n- drawer Materiali dinamico;\n- ricerca e filtri;\n- corso, formato e accesso;\n- monitorabilità;\n- avanzamento;\n- materiale selezionato persistente;\n- apertura nel workspace;\n- distinzione onesta tra viewer pronto e sottofase futura.\n\nDa verificare manualmente:\n\n- apertura drawer Materiali;\n- ricerca;\n- filtri corso/formato;\n- selezione persistente;\n- apertura lezione nativa;\n- apertura anteprima PDF/DOCX/PPTX;\n- risorsa esterna non monitorabile;\n- ritorno alla lezione;\n- mobile e tastiera.\n\n---\n'''
    if marker not in status:
        status = status.replace("# Regola per Codex", addition + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    marker_arch = "## Pannello Materiali della Fase 3"
    addition_arch = f'''\n{marker_arch}\n\nLa demo {VERSION} introduce un modello locale di `UiMaterial` coerente con l'app ufficiale: corso, formato, `access_mode`, `monitoring_level`, viewer previsto e avanzamento. La selezione viene salvata in `aula-demo-materials-panel-v1`.\n\nLa lezione nativa riusa il workspace completo esistente. Per TXT, PDF, DOCX, PPTX e link esterni questa sottofase mostra soltanto selezione, metadati e stato di disponibilità. I viewer e il tracking specifico vengono integrati separatamente nelle sottofasi successive della Fase 3.\n'''
    if marker_arch not in architecture:
        architecture += addition_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "| Fase 2 | Dashboard: stati di errore | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.2.0-alpha.6 pronta da aprire e verificare. |",
        "| Fase 2 | Dashboard: stati di errore | APPROVATO | 2026-07-22 | Approvato dall'utente dopo verifica della demo HTML 1.2.0-alpha.6. |",
    )
    row = f"| Fase 3 | Materiali: pannello e selezione | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |"
    if "| Fase 3 | Materiali: pannello e selezione |" not in approvals:
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
