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
VERSION = "1.3.0-alpha.7"
MARKER = "MATERIALI E WORKSPACE — IMPORT REQUIRED 1.3.0-alpha.7"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: attesa una occorrenza, trovate {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    if MARKER in html:
        raise RuntimeError("alpha.7 risulta già applicata")
    if "MATERIALI E WORKSPACE — VIDEO 1.3.0-alpha.6" not in html:
        raise RuntimeError("baseline alpha.6 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — IMPORT REQUIRED 1.3.0-alpha.7
       ========================================================== */
    .material-import-state{display:grid;gap:14px;padding:clamp(18px,4vw,34px);border:1px solid rgba(255,176,91,.24);border-radius:17px;background:linear-gradient(90deg,rgba(255,176,91,.07),transparent 65%),rgba(255,255,255,.018)}.material-import-state h1{margin:0;font-family:Georgia,"Times New Roman",serif}.material-import-state p{margin:0;color:var(--muted);line-height:1.6}.material-import-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.material-import-meta>div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-import-meta span,.material-import-meta strong{display:block}.material-import-meta span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-import-meta strong{margin-top:4px;overflow-wrap:anywhere;font-size:9px}.material-import-steps{display:grid;gap:7px}.material-import-steps div{padding:10px;border:1px solid var(--line);border-radius:10px;color:var(--muted);background:rgba(255,255,255,.018);font-size:9px}.material-import-steps div::before{content:"○";margin-right:8px;color:#ffd7a7}.material-import-steps div[data-state="active"]{color:var(--ink);border-color:rgba(255,176,91,.26);background:rgba(255,176,91,.055)}.material-import-steps div[data-state="active"]::before{content:"…"}.material-import-steps div[data-state="done"]::before{content:"✓";color:#91f7d3}.material-import-actions{display:flex;flex-wrap:wrap;gap:8px}.material-import-actions button{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-import-actions button:disabled{opacity:.5;cursor:not-allowed}.material-import-actions .primary{color:#fff0dd;border-color:rgba(255,176,91,.3);background:rgba(255,176,91,.08)}.material-import-status{min-height:20px;color:#91f7d3;font-size:9px}.material-import-idempotent{padding:10px 11px;border:1px solid rgba(82,232,176,.18);border-radius:10px;color:var(--muted);background:rgba(82,232,176,.035);font-size:8px;line-height:1.5}.material-import-idempotent strong{color:var(--ink)}@media(max-width:720px){.material-import-meta{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.material-import-meta{grid-template-columns:1fr}.material-import-actions button{width:100%}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS import-required")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — IMPORTAZIONE RICHIESTA
       ========================================================== */
    [
      {
        id: "import-web-functions",
        title: "Articolo web sulle funzioni",
        description: "Pagina HTTPS da trasformare in copia leggibile autorizzata.",
        course: "Programmazione da Zero",
        kind: "link",
        kindLabel: "Pagina web",
        url: "https://example.org/didattica/funzioni",
        access: "import-required",
        accessLabel: "Importazione richiesta",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Importazione necessaria",
        icon: "⇩",
        viewerReady: false,
        importStatus: "pending",
        explicitClassification: true,
        viewer: "web-article",
        provider: "web",
        reason: "La pagina richiede una copia leggibile autorizzata."
      },
      {
        id: "import-external-pdf",
        title: "Scheda esterna sui tipi di dato",
        description: "PDF remoto che richiede importazione nello spazio protetto.",
        course: "Programmazione da Zero",
        kind: "pdf",
        kindLabel: "PDF",
        url: "https://example.org/didattica/tipi-dato.pdf",
        access: "import-required",
        accessLabel: "Importazione richiesta",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Importazione necessaria",
        icon: "⇩",
        viewerReady: false,
        importStatus: "pending",
        explicitClassification: true,
        viewer: "pdf",
        provider: "web",
        reason: "Il PDF deve essere importato prima del monitoraggio."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaMaterialImportedStorageKey = "aula-demo-material-imports-v1";
    const aulaMaterialImportPhase = {};
    let aulaMaterialImportBusy = false;

    function aulaMaterialImportedIds() {
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialImportedStorageKey) || "[]");
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set();
      }
    }

    function aulaMaterialSaveImported(set) {
      try {
        localStorage.setItem(aulaMaterialImportedStorageKey, JSON.stringify([...set]));
      } catch {
        showToast("Il browser non consente di ricordare l’importazione");
      }
    }

    function aulaMaterialApplyImported(material) {
      if (!material || !aulaMaterialImportedIds().has(material.id)) return material;
      const isPdf = material.id === "import-external-pdf";
      material.sourceType = "file";
      material.storageName = isPdf ? `${material.id}.pdf` : `${material.id}.docx`;
      material.originalName = isPdf ? "tipi-dato.pdf" : "funzioni-copia-leggibile.docx";
      material.access = "internal";
      material.monitoring = isPdf ? "partial" : "full";
      material.importStatus = "ready";
      material.provider = "internal";
      material.viewerReady = true;
      material.explicitClassification = false;
      if (!isPdf) {
        material.kind = "document";
        material.kindLabel = "Documento";
        material.documentSections = [
          {
            title: "Copia leggibile autorizzata",
            paragraphs: [
              "Le funzioni permettono di assegnare un nome a un comportamento riutilizzabile.",
              "Parametri e valori restituiti definiscono il confine tra la funzione e il resto del programma."
            ]
          },
          {
            title: "Origine e privacy",
            paragraphs: [
              "Questa è una copia locale deterministica usata esclusivamente per rappresentare il flusso di importazione.",
              "La demo non ha scaricato né analizzato la pagina remota indicata nel materiale."
            ]
          }
        ];
      }
      aulaMaterialApplyDescriptor(material);
      material.progressLabel = material.progress > 0 ? material.progressLabel : "Pronto da aprire";
      return material;
    }

    aulaMaterialsPanelData.forEach(aulaMaterialApplyImported);

    function aulaMaterialImportStepState(material, step) {
      const imported = aulaMaterialImportedIds().has(material.id);
      if (imported) return ["done", "done", "done"];
      if (step <= 0) return ["", "", ""];
      if (step === 1) return ["active", "", ""];
      if (step === 2) return ["done", "active", ""];
      if (step === 3) return ["done", "done", "active"];
      return ["done", "done", "done"];
    }

    function aulaMaterialImportRender(material, status = "") {
      if (!material || !documentContent) return;
      const imported = aulaMaterialImportedIds().has(material.id);
      const phase = Number(aulaMaterialImportPhase[material.id] || 0);
      const states = aulaMaterialImportStepState(material, phase);
      documentContent.innerHTML = `
        <section class="material-import-state" aria-label="Importazione richiesta per ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Importazione richiesta</div>
          <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
          <p>${aulaMaterialsPanelEscape(material.reason || "Questa risorsa deve essere importata prima dell’uso interno.")}</p>
          <div class="material-import-meta">
            <div><span>Sorgente</span><strong>HTTPS pubblico</strong></div>
            <div><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "web")}</strong></div>
            <div><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
            <div><span>Stato</span><strong>${imported ? "Copia interna pronta" : "Importazione necessaria"}</strong></div>
          </div>
          <div class="material-import-steps" aria-live="polite">
            <div data-state="${states[0]}">Verifica della sorgente HTTPS</div>
            <div data-state="${states[1]}">Creazione della copia protetta</div>
            <div data-state="${states[2]}">Classificazione e monitorabilità</div>
          </div>
          <div class="material-import-actions">
            <button class="primary" type="button" onclick="aulaMaterialImport('${aulaMaterialsPanelEscape(material.id)}')" ${aulaMaterialImportBusy ? "disabled" : ""}>${imported ? "Apri copia importata" : "Importa copia autorizzata"}</button>
            <button type="button" onclick="openDrawer('materiali')" ${aulaMaterialImportBusy ? "disabled" : ""}>Scegli un altro materiale</button>
          </div>
          <div class="material-import-status" id="materialImportStatus" role="status" aria-live="polite">${aulaMaterialsPanelEscape(status)}</div>
          <div class="material-import-idempotent"><strong>Operazione idempotente.</strong> Se la stessa risorsa risulta già importata, la demo riutilizza la copia interna e non crea duplicati.</div>
          <div class="material-workspace-honesty"><strong>Demo locale.</strong> Nessun contenuto remoto viene scaricato; la procedura rappresenta soltanto gli stati dell’app ufficiale.</div>
        </section>`;
      state.currentView = "material-import";
      setEveContext("materiali");
      saveState();
    }

    function aulaMaterialImportOpen(material) {
      if (!material) return;
      aulaVideoStop();
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaMaterialImportRender(material);
      closeDrawer();
    }

    async function aulaMaterialImport(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || aulaMaterialImportBusy) return;
      const imported = aulaMaterialImportedIds();
      if (imported.has(id)) {
        aulaMaterialApplyImported(material);
        showToast("Copia interna già presente: nessun duplicato creato");
        return window.aulaMaterialsPanelOpen(id);
      }

      aulaMaterialImportBusy = true;
      aulaMaterialImportPhase[id] = 1;
      aulaMaterialImportRender(material, "Verifica della sorgente HTTPS…");
      await new Promise((resolve) => setTimeout(resolve, 420));

      aulaMaterialImportPhase[id] = 2;
      aulaMaterialImportRender(material, "Creazione della copia protetta…");
      await new Promise((resolve) => setTimeout(resolve, 460));

      aulaMaterialImportPhase[id] = 3;
      aulaMaterialImportRender(material, "Classificazione del viewer e del monitoraggio…");
      await new Promise((resolve) => setTimeout(resolve, 420));

      imported.add(id);
      aulaMaterialSaveImported(imported);
      aulaMaterialApplyImported(material);
      aulaMaterialImportPhase[id] = 4;
      aulaMaterialImportBusy = false;
      aulaMaterialsPanelState.selectedId = id;
      aulaMaterialsPanelSave();
      aulaMaterialImportRender(material, "Importazione completata. Apertura della copia interna…");
      showToast("Importazione completata senza duplicati");
      await new Promise((resolve) => setTimeout(resolve, 260));
      window.aulaMaterialsPanelOpen(id);
    }

    const aulaMaterialsOpenBeforeImport = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return aulaMaterialsOpenBeforeImport(id);
      aulaMaterialApplyImported(material);
      const descriptor = aulaMaterialOfficialDescriptor(material);
      if (descriptor.access === "import-required" && !aulaMaterialImportedIds().has(id)) return aulaMaterialImportOpen(material);
      return aulaMaterialsOpenBeforeImport(id);
    };


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript import-required")

    HTML_PATH.write_text(html, encoding="utf-8")
    data = HTML_PATH.read_bytes()
    size = len(data)
    lines = data.count(b"\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob = git_blob_sha(data)

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint = CHECKPOINT_DIR / f"demo-aula-studio-virtuale-{VERSION}.html"
    shutil.copyfile(HTML_PATH, checkpoint)

    readme = README_PATH.read_text(encoding="utf-8")
    readme = replace_once(
        readme,
        "**Demo 1.3.0-alpha.6 pronta per verifica: player video locale simulato con copertura realmente vista.**",
        "**Demo 1.3.0-alpha.7 pronta per verifica: importazione simulata, copia interna e comportamento idempotente.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.6`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `686506` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `19117`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `35f4ca7cb7b9d302f1f8d2850be08b1457aa3fbf69ac34a9bcb600f15dae1d1f`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `4d1c3b88b51cdead868ab228f06efbb264d918ac`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.6] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: import-required

- Aggiunti una pagina web HTTPS e un PDF remoto che richiedono importazione.
- Flusso visuale in tre passaggi: verifica sorgente, copia protetta, classificazione e monitorabilità.
- Nessun contenuto remoto viene scaricato dalla demo.
- Gli ID importati vengono conservati localmente nel browser.
- Dopo l’importazione la pagina web diventa documento interno e il PDF diventa PDF interno.
- La seconda richiesta riutilizza la copia già presente e non crea duplicati.
- Stato e messaggi dichiarano esplicitamente il carattere simulato dell’operazione.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.7")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Le risorse `import-required` passano attraverso tre stati locali deterministici. La demo non effettua fetch remoti: persiste soltanto l’identificatore dell’importazione e converte la risorsa in una copia interna coerente con il viewer previsto. La procedura è idempotente: richieste successive riutilizzano la copia già presente.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: import-required

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- pagina web e PDF remoto in stato import-required;
- importazione simulata in tre passaggi;
- persistenza locale degli ID importati;
- conversione coerente a materiale interno;
- seconda richiesta idempotente e senza duplicati;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: video | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.6 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: video | APPROVATO | 2026-07-23 | L’utente ha approvato il checkpoint e autorizzato la prosecuzione. |\n| Fase 3 | Materiali: import-required | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.7 prodotta e pronta per verifica. |",
        "registro approvazioni",
    )
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")

    manifest = CHECKPOINT_DIR / "README.md"
    manifest_text = manifest.read_text(encoding="utf-8")
    manifest_text += f"- `{VERSION}` — `demo-aula-studio-virtuale-{VERSION}.html` — SHA-256 `{sha256}` — {size} byte — {lines} righe\n"
    manifest.write_text(manifest_text, encoding="utf-8")

    print(f"version={VERSION}")
    print(f"size={size}")
    print(f"lines={lines}")
    print(f"sha256={sha256}")
    print(f"blob={blob}")


if __name__ == "__main__":
    main()
