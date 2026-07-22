from __future__ import annotations

import hashlib
import re
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
VERSION = "1.3.0-alpha.3"
MARKER = "MATERIALI E WORKSPACE — TIPI E CLASSIFICAZIONE 1.3.0-alpha.3"


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
        raise RuntimeError("alpha.3 risulta già applicata")
    if "MATERIALI E WORKSPACE — UPLOAD E LINK 1.3.0-alpha.2" not in html:
        raise RuntimeError("baseline alpha.2 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — TIPI E CLASSIFICAZIONE 1.3.0-alpha.3
       ========================================================== */
    .material-classification-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}.material-classification-grid>div{display:grid;gap:3px;min-width:0;padding:9px;border:1px solid rgba(125,235,255,.14);border-radius:10px;background:rgba(0,223,242,.025)}.material-classification-grid span{color:var(--muted);font-size:7px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.material-classification-grid strong{overflow-wrap:anywhere;color:var(--ink);font-size:9px;font-weight:700}.materials-panel-reason{display:block;margin-top:7px;color:var(--muted);font-size:8px;line-height:1.5}.materials-panel-taxonomy{display:grid;gap:5px;margin-top:9px;padding:10px;border:1px solid rgba(122,124,255,.16);border-radius:11px;background:rgba(122,124,255,.035);color:var(--muted);font-size:8px;line-height:1.55}.materials-panel-taxonomy strong{color:var(--ink)}@media(max-width:760px){.material-classification-grid{grid-template-columns:1fr 1fr}}@media(max-width:480px){.material-classification-grid{grid-template-columns:1fr}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "blocco CSS alpha.3")

    classifier_anchor = "    function aulaMaterialsPanelCard(material) {"
    classifier_js = '''    function aulaMaterialAccessLabel(value) {
      return ({
        internal: "Interno",
        embedded: "Incorporato",
        "import-required": "Importazione richiesta",
        "external-unmonitored": "Esterno non monitorato",
        unsupported: "Non supportato"
      })[value] || "Non supportato";
    }

    function aulaMaterialMonitoringLabel(value) {
      return ({
        full: "Monitoraggio completo",
        partial: "Monitoraggio parziale",
        "opened-only": "Solo apertura",
        none: "Non monitorabile"
      })[value] || "Non monitorabile";
    }

    function aulaMaterialOfficialDescriptor(material) {
      const accessModes = new Set(["internal", "embedded", "import-required", "external-unmonitored", "unsupported"]);
      const monitoringLevels = new Set(["full", "partial", "opened-only", "none"]);
      const viewers = new Set(["pdf", "text", "document", "presentation", "video", "web-article", "exercise", "lesson"]);
      const importStatuses = new Set(["ready", "pending", "failed", "not-required"]);
      const providers = new Set(["youtube", "vimeo", "html5-video", "internal", "web", "none"]);
      const ext = aulaMaterialExtension(material.storageName || material.originalName || material.url || material.title);
      const sourceUrl = String(material.url || "");
      const stored = Boolean(material.storageName || material.sourceType === "file");
      const internalSeed = material.access === "internal" && !sourceUrl;
      const type = material.materialType || material.kind;
      const youtube = /^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(sourceUrl);
      const vimeo = /^https:\/\/(?:www\.)?vimeo\.com\//i.test(sourceUrl);
      const directVideo = aulaMaterialSafeHttps(sourceUrl) && ["mp4", "webm", "ogg"].includes(ext);
      let derived;

      if (type === "lesson") {
        derived = { access: "internal", monitoring: "full", viewer: "lesson", importStatus: "ready", provider: "internal", reason: "Lezione nativa del workspace." };
      } else if ((stored || internalSeed) && (type === "text" || ["txt", "md"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "text", importStatus: "ready", provider: "internal", reason: "Testo privato pronto nel lettore interno." };
      } else if ((stored || internalSeed) && (type === "pdf" || ext === "pdf")) {
        derived = { access: "internal", monitoring: "partial", viewer: "pdf", importStatus: "ready", provider: "internal", reason: "PDF consultabile nel workspace con posizione salvata." };
      } else if ((stored || internalSeed) && (type === "document" || ["doc", "docx"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "document", importStatus: "ready", provider: "internal", reason: "Documento convertito in testo sicuro." };
      } else if ((stored || internalSeed) && (type === "presentation" || ["ppt", "pptx"].includes(ext))) {
        derived = { access: "internal", monitoring: "full", viewer: "presentation", importStatus: "ready", provider: "internal", reason: "Presentazione renderizzata come slide testuali sicure." };
      } else if (youtube) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "youtube", reason: "Video YouTube compatibile con il player incorporato." };
      } else if (vimeo) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "vimeo", reason: "Video Vimeo compatibile con il player incorporato." };
      } else if (directVideo) {
        derived = { access: "embedded", monitoring: "full", viewer: "video", importStatus: "not-required", provider: "html5-video", reason: "Video HTTPS compatibile con il player HTML5." };
      } else if (sourceUrl && (type === "pdf" || ext === "pdf")) {
        derived = { access: "import-required", monitoring: "none", viewer: "pdf", importStatus: "pending", provider: "web", reason: "Il PDF remoto deve essere importato nello spazio protetto prima del monitoraggio." };
      } else if (type === "exercise" || type === "quiz") {
        derived = { access: "import-required", monitoring: "none", viewer: "exercise", importStatus: "pending", provider: "web", reason: "L’esercizio deve essere importato o ricreato prima del monitoraggio." };
      } else if (sourceUrl && aulaMaterialSafeHttps(sourceUrl)) {
        derived = { access: "import-required", monitoring: "none", viewer: "web-article", importStatus: "pending", provider: "web", reason: "La pagina richiede una copia leggibile autorizzata o un file compatibile." };
      } else {
        derived = { access: "unsupported", monitoring: "none", viewer: null, importStatus: "failed", provider: "none", reason: "La risorsa non dispone di un formato interno sicuro." };
      }

      if (material.explicitClassification === true) {
        if (accessModes.has(material.access)) derived.access = material.access;
        if (monitoringLevels.has(material.monitoring)) derived.monitoring = material.monitoring;
        if (viewers.has(material.viewer)) derived.viewer = material.viewer;
        if (importStatuses.has(material.importStatus)) derived.importStatus = material.importStatus;
        if (providers.has(material.provider)) derived.provider = material.provider;
        if (material.reason) derived.reason = material.reason;
      }
      return derived;
    }

    function aulaMaterialApplyDescriptor(material) {
      const descriptor = aulaMaterialOfficialDescriptor(material);
      material.access = descriptor.access;
      material.accessLabel = aulaMaterialAccessLabel(descriptor.access);
      material.monitoring = descriptor.monitoring;
      material.monitoringLabel = aulaMaterialMonitoringLabel(descriptor.monitoring);
      material.viewer = descriptor.viewer;
      material.importStatus = descriptor.importStatus;
      material.provider = descriptor.provider;
      material.reason = descriptor.reason;
      return material;
    }

    function aulaMaterialClassifyAll() {
      const pythonTutor = aulaMaterialsPanelData.find((item) => item.id === "python-tutor-external");
      if (pythonTutor) Object.assign(pythonTutor, {
        url: "https://pythontutor.com/",
        access: "external-unmonitored",
        monitoring: "opened-only",
        viewer: "web-article",
        importStatus: "not-required",
        provider: "web",
        reason: "Risorsa esterna: la demo registra soltanto l’apertura, senza osservare il contenuto.",
        explicitClassification: true
      });
      aulaMaterialsPanelData.forEach(aulaMaterialApplyDescriptor);
    }

'''
    html = replace_once(html, classifier_anchor, classifier_js + classifier_anchor, "classificatore materiali")

    build_old = """    function buildMaterialsDrawerHtml() {
      aulaMaterialsPanelLoad();
      const materials = aulaMaterialsPanelFiltered();"""
    build_new = """    function buildMaterialsDrawerHtml() {
      aulaMaterialsPanelLoad();
      aulaMaterialClassifyAll();
      const materials = aulaMaterialsPanelFiltered();"""
    html = replace_once(html, build_old, build_new, "classificazione nel drawer")

    card_old = """            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <div class="materials-panel-meta">"""
    card_new = """            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <small class="materials-panel-reason">${aulaMaterialsPanelEscape(material.reason || "Classificazione locale della demo.")}</small>
            <div class="material-classification-grid">
              <div><span>Access mode</span><strong>${aulaMaterialsPanelEscape(material.access || "unsupported")}</strong></div>
              <div><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
              <div><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "none")}</strong></div>
              <div><span>Import status</span><strong>${aulaMaterialsPanelEscape(material.importStatus || "not-required")}</strong></div>
            </div>
            <div class="materials-panel-meta">"""
    html = replace_once(html, card_old, card_new, "dettagli scheda materiale")

    intro_old = """          <section class="materials-panel-intro">
            <strong>Materiale selezionato: ${aulaMaterialsPanelEscape(selected.title)}</strong>
            <span>Scegli cosa aprire nel workspace centrale. La demo distingue accesso interno, esterno e livello di monitorabilità senza fingere servizi remoti.</span>
          </section>"""
    intro_new = """          <section class="materials-panel-intro">
            <strong>Materiale selezionato: ${aulaMaterialsPanelEscape(selected.title)}</strong>
            <span>Scegli cosa aprire nel workspace centrale. Ogni risorsa mostra accesso, viewer previsto, provider, importazione e monitorabilità.</span>
            <div class="materials-panel-taxonomy">
              <strong>Access mode</strong> internal · embedded · import-required · external-unmonitored · unsupported
              <strong>Monitoraggio</strong> completo · parziale · solo apertura · non monitorabile
            </div>
          </section>"""
    html = replace_once(html, intro_old, intro_new, "tassonomia introduttiva")

    workspace_facts_old = """          <div class="material-workspace-facts">
            <div class="material-workspace-fact"><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Accesso</span><strong>${aulaMaterialsPanelEscape(material.accessLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Monitorabilità</span><strong>${aulaMaterialsPanelEscape(material.monitoringLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Avanzamento</span><strong>${material.progress}% · ${aulaMaterialsPanelEscape(material.progressLabel)}</strong></div>
          </div>"""
    workspace_facts_new = """          <div class="material-workspace-facts">
            <div class="material-workspace-fact"><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Access mode</span><strong>${aulaMaterialsPanelEscape(material.access)}</strong></div>
            <div class="material-workspace-fact"><span>Viewer previsto</span><strong>${aulaMaterialsPanelEscape(material.viewer || "nessuno")}</strong></div>
            <div class="material-workspace-fact"><span>Provider</span><strong>${aulaMaterialsPanelEscape(material.provider || "none")}</strong></div>
            <div class="material-workspace-fact"><span>Import status</span><strong>${aulaMaterialsPanelEscape(material.importStatus || "not-required")}</strong></div>
            <div class="material-workspace-fact"><span>Monitorabilità</span><strong>${aulaMaterialsPanelEscape(material.monitoringLabel)}</strong></div>
            <div class="material-workspace-fact"><span>Avanzamento</span><strong>${material.progress}% · ${aulaMaterialsPanelEscape(material.progressLabel)}</strong></div>
          </div>"""
    html = replace_once(html, workspace_facts_old, workspace_facts_new, "fatti workspace")

    availability_old = """      const availability = material.viewerReady
        ? "Viewer nativo già disponibile nella demo."
        : material.access === "external-unmonitored"
          ? "Questa risorsa si apre esternamente e la demo non attribuisce progresso alla consultazione."
          : `Il viewer ${material.kindLabel} verrà integrato nella sottofase dedicata; qui è rappresentata soltanto la selezione nel workspace.`;"""
    availability_new = """      const availability = material.viewerReady
        ? "Viewer nativo già disponibile nella demo."
        : material.access === "embedded"
          ? `Il provider ${material.provider} è compatibile con un player incorporato; il viewer completo arriva nella sottofase dedicata.`
          : material.access === "import-required"
            ? "La risorsa deve essere importata o convertita prima di poter attribuire progresso."
            : material.access === "external-unmonitored"
              ? "La risorsa si apre esternamente e la demo registra soltanto l’apertura."
              : material.access === "unsupported"
                ? "Il formato non dispone ancora di un percorso sicuro nella demo."
                : `Viewer interno previsto: ${material.viewer || "nessuno"}.`;"""
    html = replace_once(html, availability_old, availability_new, "stato workspace")

    preliminary_pattern = re.compile(r'^    function aulaMaterialPreliminary\(\)\{.*$', re.M)
    preliminary_new = '''    function aulaMaterialPreliminary(){const url=String(document.getElementById("materialAddUrl")?.value||"").trim(),file=document.getElementById("materialAddFile")?.files?.[0]||null,ext=aulaMaterialAddMode==="file"?aulaMaterialExtension(file?.name):aulaMaterialExtension(url),kind=aulaMaterialBasicKind(ext),draft={title:file?.name||url||"Materiale",kind,url:aulaMaterialAddMode==="link"?url:null,sourceType:aulaMaterialAddMode,storageName:aulaMaterialAddMode==="file"?file?.name:null,originalName:aulaMaterialAddMode==="file"?file?.name:null};return{url,file,ext,kind,kindLabel:aulaMaterialKindLabel(kind),descriptor:aulaMaterialOfficialDescriptor(draft)}}'''
    html, count = preliminary_pattern.subn(preliminary_new, html, count=1)
    if count != 1:
        raise RuntimeError(f"anteprima preliminare: attesa una occorrenza, trovate {count}")

    preview_pattern = re.compile(r'^    function aulaMaterialUpdateClassificationPreview\(\)\{.*$', re.M)
    preview_new = '''    function aulaMaterialUpdateClassificationPreview(){const data=aulaMaterialPreliminary(),node=document.getElementById("materialAddClassification");if(!node)return;if(aulaMaterialAddMode==="file"&&!data.file){node.innerHTML="<strong>Classificazione preliminare</strong><br>Seleziona un file compatibile.";return}if(aulaMaterialAddMode==="link"&&!data.url){node.innerHTML="<strong>Classificazione preliminare</strong><br>Inserisci un URL HTTPS pubblico.";return}const d=data.descriptor;node.innerHTML=`<strong>${aulaMaterialsPanelEscape(data.kindLabel)}</strong><br>Access mode: ${aulaMaterialsPanelEscape(d.access)} · Viewer: ${aulaMaterialsPanelEscape(d.viewer||"nessuno")} · Provider: ${aulaMaterialsPanelEscape(d.provider)} · Import: ${aulaMaterialsPanelEscape(d.importStatus)} · Monitoraggio: ${aulaMaterialsPanelEscape(d.monitoring)}`}'''
    html, count = preview_pattern.subn(preview_new, html, count=1)
    if count != 1:
        raise RuntimeError(f"anteprima classificazione: attesa una occorrenza, trovate {count}")

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
        "**Demo 1.3.0-alpha.2 pronta per verifica: upload locale simulato e collegamenti HTTPS con validazione.**",
        "**Demo 1.3.0-alpha.3 pronta per verifica: tipi, accesso, viewer, provider, importazione e monitoraggio dei materiali.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.2`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `639741` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `18474`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `41d16b4dc64f6d86bafff282620228866f05459928c5ebda8506834839c43628`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `31dcbe51fa53adabf16f339d3738268de9706fbe`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.2] — 2026-07-22"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: tipi e classificazione

- Tassonomia coerente con `src/lib/material-access.ts`.
- Access mode, viewer previsto, provider e import status visibili in ogni scheda.
- Monitoraggio distinto fra completo, parziale, solo apertura e non monitorabile.
- Classificazione inferita per materiali interni, video incorporabili, pagine da importare e formati non supportati.
- I valori espliciti hanno precedenza soltanto quando `explicitClassification` è dichiarato.
- Python Tutor classificato come risorsa esterna con sola apertura.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.3")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

La demo usa la stessa tassonomia dell’app ufficiale per descrivere ogni materiale: access mode, livello di monitoraggio, viewer interno previsto, provider e stato di importazione. La classificazione viene inferita dal formato e dalla provenienza; gli override sono applicati solo alle risorse marcate esplicitamente.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: tipi e classificazione

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- tassonomia allineata a `src/lib/material-access.ts`;
- classificazione visibile nel pannello e nel workspace;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`;
- verifica statica e sintattica affidata al workflow dedicato.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: upload e collegamenti | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Demo HTML 1.3.0-alpha.2 prodotta; prosecuzione automatica autorizzata. |",
        "| Fase 3 | Materiali: upload e collegamenti | APPROVATO | 2026-07-23 | L’utente ha autorizzato la prosecuzione dopo la consegna del checkpoint 1.3.0-alpha.2. |\n| Fase 3 | Materiali: tipi e classificazione | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.3 prodotta e pronta per verifica. |",
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
