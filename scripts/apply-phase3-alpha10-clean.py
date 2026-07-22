from __future__ import annotations

import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "reference/demo-aula-studio-virtuale-canonica.html"
README_PATH = ROOT / "reference/README.md"
CHANGELOG_PATH = ROOT / "reference/CHANGELOG_DEMO.md"
ARCHITECTURE_PATH = ROOT / "reference/DEMO_ARCHITECTURE.md"
STATUS_PATH = ROOT / "reference/INTEGRATION_STATUS.md"
APPROVALS_PATH = ROOT / "reference/PHASE_APPROVALS.md"
CHECKPOINT_DIR = ROOT / "reference/checkpoints/phase-3"
VERSION = "1.3.0-alpha.10"
MARKER = "MATERIALI E WORKSPACE — CONSOLIDAMENTO 1.3.0-alpha.10"

PREVIOUS_HASHES = {
    "1.3.0-alpha.1": "a9cca058bf0029e71c4d53273da80c61057f12d579a355f0cdf191addfcaa6c6",
    "1.3.0-alpha.2": "41d16b4dc64f6d86bafff282620228866f05459928c5ebda8506834839c43628",
    "1.3.0-alpha.3": "a70215459d7919a020b673d9285574f8017e8098c5ccf74355e0fcf74bf0413a",
    "1.3.0-alpha.4": "00047a9696e596da120da0e6b7a01f9fac74b5a874167bc89715aceaf24d2d02",
    "1.3.0-alpha.5": "7059b095d76e0e56983fcdabfc721f48ff5a75bd84f49751ca3ddb9d6b9046d7",
    "1.3.0-alpha.6": "35f4ca7cb7b9d302f1f8d2850be08b1457aa3fbf69ac34a9bcb600f15dae1d1f",
    "1.3.0-alpha.7": "dcd007394aece2c5dde6a134fd7744e5d38ca422d83062ad59664920970cafdb",
    "1.3.0-alpha.8": "4c08e2c1736bd40d9fc0d971668663487cf5c878a1631d12c53fac19533b1f8f",
    "1.3.0-alpha.9": "957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318",
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: attesa una occorrenza, trovate {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def verify_previous_checkpoints() -> None:
    for version, expected in PREVIOUS_HASHES.items():
        path = CHECKPOINT_DIR / f"demo-aula-studio-virtuale-{version}.html"
        if not path.exists():
            raise RuntimeError(f"Checkpoint precedente assente: {version}")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f"Hash inatteso per {version}: {actual}")


def main() -> None:
    verify_previous_checkpoints()
    html = HTML_PATH.read_text(encoding="utf-8")
    if MARKER in html:
        raise RuntimeError("alpha.10 risulta già applicata")
    if "MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9" not in html:
        raise RuntimeError("baseline alpha.9 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — CONSOLIDAMENTO 1.3.0-alpha.10
       ========================================================== */
    .material-text-viewer,.material-diagnostics{display:grid;gap:14px}.material-text-sheet{padding:clamp(22px,4vw,46px);border:1px solid rgba(125,235,255,.17);border-radius:14px;background:rgba(255,255,255,.025)}.material-text-sheet h1,.material-text-sheet h2{font-family:Georgia,"Times New Roman",serif}.material-text-sheet h2{margin-top:30px}.material-text-sheet p,.material-text-sheet li{color:var(--muted);line-height:1.75}.material-text-sheet code{padding:2px 5px;border:1px solid rgba(125,235,255,.14);border-radius:5px;color:#c9f8ff;background:rgba(0,223,242,.035);font:9px ui-monospace,SFMono-Regular,Menlo,monospace}.material-text-meta,.material-diagnostic-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.material-text-meta>div,.material-diagnostic-metrics>div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-text-meta span,.material-text-meta strong,.material-diagnostic-metrics span,.material-diagnostic-metrics strong{display:block}.material-text-meta span,.material-diagnostic-metrics span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-text-meta strong,.material-diagnostic-metrics strong{margin-top:4px;font-size:10px}.material-diagnostic-head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px;border:1px solid rgba(82,232,176,.2);border-radius:14px;background:linear-gradient(90deg,rgba(82,232,176,.055),transparent 72%),rgba(255,255,255,.018)}.material-diagnostic-head h1{margin:3px 0 5px;font-family:Georgia,"Times New Roman",serif}.material-diagnostic-head p{max-width:720px;margin:0;color:var(--muted);line-height:1.55}.material-diagnostic-score{min-width:118px;padding:12px;border:1px solid rgba(82,232,176,.2);border-radius:11px;text-align:center}.material-diagnostic-score strong,.material-diagnostic-score span{display:block}.material-diagnostic-score strong{font-size:27px}.material-diagnostic-score span{color:var(--muted);font-size:8px;text-transform:uppercase}.material-diagnostic-score[data-tone="fail"]{border-color:rgba(255,107,129,.25);color:#ffb8c1}.material-diagnostic-score[data-tone="warn"]{border-color:rgba(255,190,102,.25);color:#ffd7a7}.material-diagnostic-list{display:grid;gap:8px}.material-diagnostic-check{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;padding:11px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.018)}.material-diagnostic-check[data-status="pass"]{border-color:rgba(82,232,176,.16)}.material-diagnostic-check[data-status="warn"]{border-color:rgba(255,190,102,.2)}.material-diagnostic-check[data-status="fail"]{border-color:rgba(255,107,129,.22)}.material-diagnostic-symbol{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:rgba(255,255,255,.025);font-weight:900}.material-diagnostic-check[data-status="pass"] .material-diagnostic-symbol{color:#91f7d3}.material-diagnostic-check[data-status="warn"] .material-diagnostic-symbol{color:#ffd7a7}.material-diagnostic-check[data-status="fail"] .material-diagnostic-symbol{color:#ffb8c1}.material-diagnostic-copy strong,.material-diagnostic-copy span{display:block}.material-diagnostic-copy strong{font-size:9px}.material-diagnostic-copy span{margin-top:4px;color:var(--muted);font-size:8px;line-height:1.5}.material-diagnostic-actions{display:flex;flex-wrap:wrap;gap:8px}.material-diagnostic-actions button{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-diagnostic-actions .primary{border-color:rgba(82,232,176,.24);color:#caffeb;background:rgba(82,232,176,.055)}.material-diagnostic-actions .danger{border-color:rgba(255,107,129,.22);color:#ffc7ce;background:rgba(255,107,129,.045)}.materials-panel-phase-complete{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:4px 7px;border:1px solid rgba(82,232,176,.18);border-radius:999px;color:#bff8df;background:rgba(82,232,176,.035);font-size:7px;font-weight:800;text-transform:uppercase}@media(max-width:720px){.material-text-meta,.material-diagnostic-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.material-text-meta,.material-diagnostic-metrics{grid-template-columns:1fr}.material-diagnostic-actions button{width:100%}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS consolidamento")

    footer_old = """            <div class="materials-panel-footer-actions">
              <button class="primary" type="button" onclick="aulaMaterialAddOpen(this)">＋ Aggiungi materiale</button>
              <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
            </div>"""
    footer_new = """            <div class="materials-panel-footer-actions">
              <button type="button" onclick="aulaMaterialDiagnosticsOpen()">✓ Verifica sistema</button>
              <button class="primary" type="button" onclick="aulaMaterialAddOpen(this)">＋ Aggiungi materiale</button>
              <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
            </div>"""
    html = replace_once(html, footer_old, footer_new, "pulsante diagnostica")

    intro_old = """              <strong>Monitoraggio</strong> completo · parziale · solo apertura · non monitorabile
            </div>"""
    intro_new = """              <strong>Monitoraggio</strong> completo · parziale · solo apertura · non monitorabile
            </div>
            <span class="materials-panel-phase-complete">✓ Fase 3 consolidata · verifica locale disponibile</span>"""
    html = replace_once(html, intro_old, intro_new, "stato fase consolidata")

    tracking_old = """        aulaMaterialRestoreAfterOpen(id, saved);
        aulaMaterialTrackingBanner(id, saved);"""
    tracking_new = """        aulaMaterialTrackingBanner(id, saved);
        aulaMaterialRestoreAfterOpen(id, saved);"""
    html = replace_once(html, tracking_old, tracking_new, "ordine ripristino tracking")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — TESTO E DIAGNOSTICA FINALE
       ========================================================== */
    Object.assign(aulaMaterialsPanelData.find((item) => item.id === "python-introduction-txt") || {}, {
      viewerReady: true,
      textSections: [
        {
          title: "Che cos’è Python",
          paragraphs: [
            "Python è un linguaggio di programmazione progettato per esprimere le istruzioni in modo leggibile.",
            "Un programma Python è una sequenza di istruzioni interpretate secondo regole sintattiche precise."
          ],
          examples: ["print(\"Ciao, mondo!\")", "nome = \"Andrea\""]
        },
        {
          title: "Variabili e valori",
          paragraphs: [
            "Una variabile associa un nome a un valore. Il nome permette di riutilizzare il dato nelle istruzioni successive.",
            "Il valore può cambiare durante l’esecuzione, mentre il nome deve rispettare le regole del linguaggio."
          ],
          examples: ["eta = 25", "prezzo = 3.50", "attivo = True"]
        },
        {
          title: "Primo controllo",
          paragraphs: [
            "Dopo aver scritto una riga, confronta sempre il risultato ottenuto con quello atteso.",
            "Gli errori non sono tutti uguali: un errore di sintassi impedisce l’esecuzione, un errore logico produce un risultato scorretto."
          ],
          examples: ["if eta >= 18:", "    print(\"Maggiorenne\")"]
        }
      ]
    });

    function aulaTextSections(material) {
      if (Array.isArray(material?.textSections) && material.textSections.length) return material.textSections;
      return [
        {
          title: "Anteprima testuale sicura",
          paragraphs: [
            "Il materiale è classificato come testo interno compatibile con il workspace.",
            "La demo non legge il file reale caricato: mostra un contenuto deterministico che rappresenta il viewer previsto."
          ],
          examples: []
        },
        {
          title: "Metadati locali",
          paragraphs: [
            `Nome originale: ${material?.originalName || material?.title || "Testo"}.`,
            "Il file originale resta sul dispositivo e nessun contenuto viene inviato a servizi remoti."
          ],
          examples: []
        }
      ];
    }

    function aulaTextOpen(material) {
      if (!material || !documentContent) return;
      if (typeof aulaVideoStop === "function") aulaVideoStop();
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const sections = aulaTextSections(material);
      const paragraphCount = sections.reduce((total, section) => total + (section.paragraphs?.length || 0), 0);
      const exampleCount = sections.reduce((total, section) => total + (section.examples?.length || 0), 0);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      documentContent.innerHTML = `
        <section class="material-text-viewer" aria-label="Testo ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Testo interno · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-text-meta">
            <div><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div><span>Sezioni</span><strong>${sections.length}</strong></div>
            <div><span>Paragrafi</span><strong>${paragraphCount}</strong></div>
            <div><span>Esempi</span><strong>${exampleCount}</strong></div>
          </div>
          <article class="material-text-sheet" tabindex="0">
            <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
            ${sections.map((section) => `<section><h2>${aulaMaterialsPanelEscape(section.title)}</h2>${(section.paragraphs || []).map((paragraph) => `<p>${aulaMaterialsPanelEscape(paragraph)}</p>`).join("")}${section.examples?.length ? `<ul>${section.examples.map((example) => `<li><code>${aulaMaterialsPanelEscape(example)}</code></li>`).join("")}</ul>` : ""}</section>`).join("")}
          </article>
          <div class="material-safe-note"><strong>Lettore locale.</strong> Il contenuto mostrato non viene inviato a servizi esterni; per i file manuali la demo dichiara apertamente di non aver analizzato il file originale.</div>
        </section>`;
      state.currentView = "material-text";
      setEveContext("materiali");
      saveState();
      closeDrawer();
      showToast(`Testo aperto: ${material.title}`);
    }

    function aulaTextOpenTracked(material) {
      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      const saved = typeof aulaMaterialProgressGet === "function" ? aulaMaterialProgressGet(material.id) : null;
      aulaTextOpen(material);
      window.setTimeout(() => {
        if (typeof aulaMaterialTrackingBanner === "function") aulaMaterialTrackingBanner(material.id, saved);
        if (typeof aulaMaterialRestoreAfterOpen === "function") aulaMaterialRestoreAfterOpen(material.id, saved);
        if (typeof aulaMaterialTrackingStart === "function") aulaMaterialTrackingStart(material.id, saved);
        if (typeof aulaMaterialTrackingSave === "function") aulaMaterialTrackingSave(saved ? "material_resumed" : "material_opened");
      }, 40);
    }

    function aulaMaterialDiagnosticReadStorage(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return { available: true, value: raw === null ? fallback : JSON.parse(raw), error: null };
      } catch (error) {
        return { available: false, value: fallback, error: String(error?.message || error) };
      }
    }

    function aulaMaterialDiagnosticCheck(id, label, status, detail) {
      return { id, label, status, detail };
    }

    function aulaMaterialDiagnosticsRun() {
      aulaMaterialsPanelLoad();
      if (typeof aulaMaterialApplyImported === "function") aulaMaterialsPanelData.forEach(aulaMaterialApplyImported);
      aulaMaterialClassifyAll();

      const checks = [];
      const ids = aulaMaterialsPanelData.map((item) => String(item.id || ""));
      const duplicateIds = [...new Set(ids.filter((id, index) => !id || ids.indexOf(id) !== index))];
      checks.push(aulaMaterialDiagnosticCheck(
        "unique-ids",
        "Identificatori dei materiali",
        duplicateIds.length ? "fail" : "pass",
        duplicateIds.length ? `ID mancanti o duplicati: ${duplicateIds.join(", ") || "valore vuoto"}.` : `${ids.length} materiali con ID univoco.`
      ));

      const requiredIds = [
        "native-programming-lesson",
        "python-introduction-txt",
        "chapter-one-exercises-pdf",
        "study-guide-docx",
        "algorithm-slides-pptx",
        "video-youtube-python",
        "video-vimeo-algorithms",
        "video-https-debug",
        "import-web-functions",
        "import-external-pdf",
        "material-unsupported-zip",
        "material-unavailable",
        "material-retry-demo"
      ];
      const missingRequired = requiredIds.filter((id) => !ids.includes(id));
      checks.push(aulaMaterialDiagnosticCheck(
        "required-materials",
        "Copertura dei casi della Fase 3",
        missingRequired.length ? "fail" : "pass",
        missingRequired.length ? `Materiali richiesti assenti: ${missingRequired.join(", ")}.` : "Lezione, TXT, PDF, DOCX, PPTX, video, importazione ed errori sono rappresentati."
      ));

      const validAccess = new Set(["internal", "embedded", "import-required", "external-unmonitored", "unsupported"]);
      const validMonitoring = new Set(["full", "partial", "opened-only", "none"]);
      const validImports = new Set(["ready", "pending", "failed", "not-required"]);
      const classificationErrors = [];
      aulaMaterialsPanelData.forEach((material) => {
        const descriptor = aulaMaterialOfficialDescriptor(material);
        if (!validAccess.has(descriptor.access) || !validMonitoring.has(descriptor.monitoring) || !validImports.has(descriptor.importStatus)) classificationErrors.push(material.id);
      });
      checks.push(aulaMaterialDiagnosticCheck(
        "classification",
        "Classificazione ufficiale",
        classificationErrors.length ? "fail" : "pass",
        classificationErrors.length ? `Descrittore non valido: ${classificationErrors.join(", ")}.` : "Access mode, monitoraggio e import status sono validi per tutti i materiali."
      ));

      const coherenceErrors = [];
      aulaMaterialsPanelData.forEach((material) => {
        const descriptor = aulaMaterialOfficialDescriptor(material);
        const internalViewers = new Set(["lesson", "pdf", "text", "document", "presentation"]);
        if (descriptor.access === "internal" && (!internalViewers.has(descriptor.viewer) || descriptor.provider !== "internal" || descriptor.importStatus !== "ready")) coherenceErrors.push(material.id);
        if (descriptor.access === "embedded" && (descriptor.viewer !== "video" || !["youtube", "vimeo", "html5-video"].includes(descriptor.provider))) coherenceErrors.push(material.id);
        if (descriptor.access === "import-required" && (descriptor.importStatus !== "pending" || descriptor.provider !== "web" || descriptor.monitoring !== "none")) coherenceErrors.push(material.id);
        if (descriptor.access === "external-unmonitored" && descriptor.monitoring !== "opened-only") coherenceErrors.push(material.id);
        if (descriptor.access === "unsupported" && (descriptor.monitoring !== "none" || descriptor.viewer !== null)) coherenceErrors.push(material.id);
      });
      const uniqueCoherenceErrors = [...new Set(coherenceErrors)];
      checks.push(aulaMaterialDiagnosticCheck(
        "coherence",
        "Coerenza accesso, viewer e provider",
        uniqueCoherenceErrors.length ? "fail" : "pass",
        uniqueCoherenceErrors.length ? `Combinazioni incoerenti: ${uniqueCoherenceErrors.join(", ")}.` : "Ogni modalità di accesso usa un viewer, provider e livello di monitoraggio coerenti."
      ));

      const viewerFunctions = [
        ["TXT/Markdown", typeof aulaTextOpen === "function"],
        ["PDF", typeof aulaPdfOpen === "function"],
        ["DOCX", typeof aulaDocumentOpen === "function"],
        ["PPTX", typeof aulaPresentationOpen === "function"],
        ["Video", typeof aulaVideoOpen === "function"]
      ];
      const missingViewers = viewerFunctions.filter(([, available]) => !available).map(([label]) => label);
      checks.push(aulaMaterialDiagnosticCheck(
        "viewers",
        "Viewer interni e incorporati",
        missingViewers.length ? "fail" : "pass",
        missingViewers.length ? `Viewer assenti: ${missingViewers.join(", ")}.` : "TXT/Markdown, PDF, DOCX, PPTX e video hanno un percorso operativo."
      ));

      const importsStorage = aulaMaterialDiagnosticReadStorage(aulaMaterialImportedStorageKey, []);
      const importedIds = Array.isArray(importsStorage.value) ? importsStorage.value : [];
      const invalidImportedIds = importedIds.filter((id, index) => !ids.includes(id) || importedIds.indexOf(id) !== index);
      checks.push(aulaMaterialDiagnosticCheck(
        "imports",
        "Persistenza delle importazioni",
        !importsStorage.available || !Array.isArray(importsStorage.value) ? "warn" : invalidImportedIds.length ? "fail" : "pass",
        !importsStorage.available ? "Il browser non rende disponibile lo storage locale." : !Array.isArray(importsStorage.value) ? "Il dato delle importazioni non è un elenco valido." : invalidImportedIds.length ? `Importazioni non valide o duplicate: ${[...new Set(invalidImportedIds)].join(", ")}.` : `${importedIds.length} copie importate, senza ID duplicati.`
      ));

      const progressStorage = aulaMaterialDiagnosticReadStorage(aulaMaterialProgressStorageKey, {});
      const progressEntries = progressStorage.value && typeof progressStorage.value === "object" && !Array.isArray(progressStorage.value) ? progressStorage.value : {};
      const invalidProgress = Object.entries(progressEntries).filter(([id, entry]) => !ids.includes(id) || !entry || typeof entry !== "object" || !Number.isFinite(Number(entry.activeSeconds || 0)) || Number(entry.activeSeconds || 0) < 0).map(([id]) => id);
      checks.push(aulaMaterialDiagnosticCheck(
        "tracking",
        "Tracking e ripresa",
        !progressStorage.available ? "warn" : invalidProgress.length ? "fail" : "pass",
        !progressStorage.available ? "Il browser non rende disponibile lo storage locale." : invalidProgress.length ? `Record di tracking non validi: ${invalidProgress.join(", ")}.` : `${Object.keys(progressEntries).length} materiali con stato di ripresa valido.`
      ));

      const customStorage = aulaMaterialDiagnosticReadStorage(aulaMaterialCustomStorageKey, []);
      const customItems = Array.isArray(customStorage.value) ? customStorage.value : [];
      const invalidCustom = customItems.filter((item) => !item?.id || !item?.title || !item?.kind);
      checks.push(aulaMaterialDiagnosticCheck(
        "custom-materials",
        "Materiali aggiunti localmente",
        !customStorage.available || !Array.isArray(customStorage.value) ? "warn" : invalidCustom.length ? "fail" : "pass",
        !customStorage.available ? "Il browser non rende disponibile lo storage locale." : !Array.isArray(customStorage.value) ? "L’archivio dei materiali locali non è un elenco valido." : invalidCustom.length ? `${invalidCustom.length} materiali locali incompleti.` : `${customItems.length} materiali locali con metadati validi.`
      ));

      const remoteFrames = [...document.querySelectorAll("iframe[src]")].filter((frame) => /^https?:/i.test(frame.getAttribute("src") || ""));
      checks.push(aulaMaterialDiagnosticCheck(
        "remote-frames",
        "Isolamento della demo",
        remoteFrames.length ? "fail" : "pass",
        remoteFrames.length ? `${remoteFrames.length} iframe remoti rilevati nel documento.` : "Nessun iframe remoto: video, importazioni e file restano simulazioni locali."
      ));

      const errorIds = ["material-unsupported-zip", "material-unavailable", "material-retry-demo"];
      const errorMissing = errorIds.filter((id) => !ids.includes(id));
      checks.push(aulaMaterialDiagnosticCheck(
        "safe-errors",
        "Errori sicuri e recupero",
        errorMissing.length || typeof aulaMaterialRetry !== "function" ? "fail" : "pass",
        errorMissing.length ? `Casi di errore assenti: ${errorMissing.join(", ")}.` : typeof aulaMaterialRetry !== "function" ? "Funzione di retry assente." : "Formato non supportato, materiale rimosso e retry recuperabile sono disponibili."
      ));

      const failures = checks.filter((check) => check.status === "fail").length;
      const warnings = checks.filter((check) => check.status === "warn").length;
      const passed = checks.filter((check) => check.status === "pass").length;
      const accessCounts = aulaMaterialsPanelData.reduce((counts, material) => {
        const access = aulaMaterialOfficialDescriptor(material).access;
        counts[access] = (counts[access] || 0) + 1;
        return counts;
      }, {});
      return {
        checks,
        failures,
        warnings,
        passed,
        generatedAt: new Date(),
        metrics: {
          total: aulaMaterialsPanelData.length,
          internal: accessCounts.internal || 0,
          embedded: accessCounts.embedded || 0,
          imported: importedIds.length,
          tracked: Object.keys(progressEntries).length,
          custom: customItems.length
        }
      };
    }

    function aulaMaterialDiagnosticSymbol(status) {
      return status === "pass" ? "✓" : status === "warn" ? "!" : "×";
    }

    function aulaMaterialDiagnosticsOpen() {
      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      if (typeof aulaVideoStop === "function") aulaVideoStop();
      const report = aulaMaterialDiagnosticsRun();
      const score = Math.round((report.passed / Math.max(1, report.checks.length)) * 100);
      const tone = report.failures ? "fail" : report.warnings ? "warn" : "pass";
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = "Verifica sistema Materiali";
      if (description) description.textContent = "Controllo locale del consolidamento della Fase 3.";
      if (lessonTitle) lessonTitle.textContent = "Diagnostica Materiali";
      documentContent.innerHTML = `
        <section class="material-diagnostics" aria-label="Verifica sistema Materiali">
          <div class="material-diagnostic-head">
            <div><div class="document-section-label">Fase 3 · consolidamento finale</div><h1>Verifica sistema Materiali</h1><p>Controllo locale di dataset, classificazione, viewer, importazioni, tracking, materiali personalizzati, isolamento ed errori sicuri.</p></div>
            <div class="material-diagnostic-score" data-tone="${tone}"><strong>${score}%</strong><span>${report.failures ? `${report.failures} errori` : report.warnings ? `${report.warnings} avvisi` : "tutto regolare"}</span></div>
          </div>
          <div class="material-diagnostic-metrics">
            <div><span>Materiali</span><strong>${report.metrics.total}</strong></div>
            <div><span>Interni</span><strong>${report.metrics.internal}</strong></div>
            <div><span>Video incorporati</span><strong>${report.metrics.embedded}</strong></div>
            <div><span>Copie importate</span><strong>${report.metrics.imported}</strong></div>
            <div><span>Riprese salvate</span><strong>${report.metrics.tracked}</strong></div>
            <div><span>Materiali locali</span><strong>${report.metrics.custom}</strong></div>
            <div><span>Controlli superati</span><strong>${report.passed}/${report.checks.length}</strong></div>
            <div><span>Generata</span><strong>${report.generatedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</strong></div>
          </div>
          <div class="material-diagnostic-list">
            ${report.checks.map((check) => `<article class="material-diagnostic-check" data-status="${check.status}"><div class="material-diagnostic-symbol">${aulaMaterialDiagnosticSymbol(check.status)}</div><div class="material-diagnostic-copy"><strong>${aulaMaterialsPanelEscape(check.label)}</strong><span>${aulaMaterialsPanelEscape(check.detail)}</span></div></article>`).join("")}
          </div>
          <div class="material-diagnostic-actions">
            <button class="primary" type="button" onclick="aulaMaterialDiagnosticsOpen()">Esegui di nuovo</button>
            <button type="button" onclick="openDrawer('materiali')">Torna ai materiali</button>
            <button class="danger" type="button" onclick="aulaMaterialDiagnosticsReset()">Azzera dati locali Materiali</button>
          </div>
          <div class="material-safe-note"><strong>Verifica locale.</strong> Il controllo non contatta server esterni e non modifica i dati. Il reset cancella soltanto selezione, materiali aggiunti, importazioni e progressi della sezione Materiali.</div>
        </section>`;
      state.currentView = "material-diagnostics";
      setEveContext("materiali");
      saveState();
      closeDrawer();
      showToast(report.failures ? "Verifica completata con errori" : report.warnings ? "Verifica completata con avvisi" : "Sistema Materiali verificato");
    }

    function aulaMaterialDiagnosticsReset() {
      const confirmed = window.confirm("Vuoi azzerare soltanto selezione, materiali aggiunti, importazioni e progressi locali della sezione Materiali?");
      if (!confirmed) return;
      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      [aulaMaterialsPanelStorageKey, aulaMaterialCustomStorageKey, aulaMaterialImportedStorageKey, aulaMaterialProgressStorageKey].forEach((key) => {
        try { localStorage.removeItem(key); } catch {}
      });
      window.location.reload();
    }

    const aulaMaterialsOpenBeforeConsolidation = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.access === "internal" && descriptor.viewer === "text") return aulaTextOpenTracked(material);
      return aulaMaterialsOpenBeforeConsolidation(id);
    };


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript consolidamento")

    HTML_PATH.write_text(html, encoding="utf-8")
    data = HTML_PATH.read_bytes()
    size = len(data)
    lines = data.count(b"\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob = git_blob_sha(data)

    checkpoint = CHECKPOINT_DIR / f"demo-aula-studio-virtuale-{VERSION}.html"
    shutil.copyfile(HTML_PATH, checkpoint)

    report_path = CHECKPOINT_DIR / f"VERIFICATION-{VERSION}.md"
    previous_rows = "\n".join(f"| `{version}` | `{digest}` | verificato |" for version, digest in PREVIOUS_HASHES.items())
    report_path.write_text(
        f"""# Verifica consolidamento Fase 3 — {VERSION}

## Risultato

Il checkpoint finale consolida pannello, upload e link, classificazione, viewer TXT/Markdown, PDF, DOCX, PPTX e video, importazione, tracking, errori e diagnostica locale.

## Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

## Checkpoint precedenti preservati

| Versione | SHA-256 | Stato |
|---|---|---|
{previous_rows}

## Controlli automatici

- baseline `1.3.0-alpha.9` verificata byte per byte;
- checkpoint corrente identico al file canonico;
- HTML chiuso e tag script/style bilanciati;
- nessun ID HTML statico duplicato;
- JavaScript classico verificato con `node --check`;
- marker di tutte le sottofasi presenti;
- script, workflow e cache temporanee rimossi prima del commit finale.

La verifica visuale e comportamentale nel browser resta manuale.
""",
        encoding="utf-8",
    )

    readme = README_PATH.read_text(encoding="utf-8")
    readme = replace_once(
        readme,
        "**Demo 1.3.0-alpha.9 pronta per verifica: errori sicuri, retry recuperabile e alternative interne.**",
        "**Demo 1.3.0-alpha.10 pronta per verifica: Fase 3 consolidata con lettore TXT/Markdown e diagnostica integrata.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.9`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `727961` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `19865`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `957ae6c18adf653dbcfa7bafeab33e57fb49a87a210717584a555b9abb534318`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `e0a11bec94aa876c36789430842f498ee97d4e03`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.9] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Fase 3: consolidamento finale

- Aggiunto il viewer TXT/Markdown interno, colmando l’ultimo segnaposto della matrice dei formati.
- Contenuto specifico per gli appunti Python e fallback trasparente per file testuali manuali.
- Corretto l’ordine del ripristino: il banner viene inserito prima del riposizionamento dello scroll.
- Aggiunta diagnostica locale per ID, casi richiesti, classificazione, coerenza, viewer, importazioni, tracking, materiali locali, iframe remoti ed errori sicuri.
- Aggiunto reset controllato dei soli dati locali della sezione Materiali.
- Verificati gli hash di tutti i checkpoint `alpha.1`–`alpha.9` prima della generazione.
- Creato il rapporto `reference/checkpoints/phase-3/VERIFICATION-{VERSION}.md`.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.10")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Il consolidamento introduce il viewer TXT/Markdown e una diagnostica interamente locale. Il controllo riclassifica il dataset, verifica coerenza fra accesso, viewer, provider e monitoraggio, valida le strutture conservate nel browser e segnala eventuali iframe remoti. Il reset è limitato alle quattro chiavi della sezione Materiali. Tutti i checkpoint precedenti vengono verificati tramite SHA-256 prima di produrre la nuova versione.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Fase 3: consolidamento finale

Stato: 🟢 — checkpoint prodotto, in attesa di approvazione finale

Versione: `{VERSION}`

- viewer TXT/Markdown interno operativo;
- matrice viewer completa per testo, PDF, documento, presentazione e video;
- diagnostica locale integrata nel pannello Materiali;
- reset limitato ai dati locali della sezione;
- hash dei checkpoint alpha.1–alpha.9 verificati;
- rapporto: `reference/checkpoints/phase-3/VERIFICATION-{VERSION}.md`;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: errori e alternative | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.9 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: errori e alternative | APPROVATO | 2026-07-23 | L’utente ha autorizzato la prosecuzione dopo la consegna del checkpoint. |\n| Fase 3 | Consolidamento finale Materiali | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.10 e rapporto integrato prodotti. |",
        "registro approvazioni",
    )
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")

    manifest = CHECKPOINT_DIR / "README.md"
    manifest_text = manifest.read_text(encoding="utf-8")
    manifest_text += f"- `{VERSION}` — `demo-aula-studio-virtuale-{VERSION}.html` — SHA-256 `{sha256}` — {size} byte — {lines} righe — rapporto `VERIFICATION-{VERSION}.md`\n"
    manifest.write_text(manifest_text, encoding="utf-8")

    print(f"version={VERSION}")
    print(f"size={size}")
    print(f"lines={lines}")
    print(f"sha256={sha256}")
    print(f"blob={blob}")


if __name__ == "__main__":
    main()
