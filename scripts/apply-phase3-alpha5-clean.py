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
VERSION = "1.3.0-alpha.5"
MARKER = "MATERIALI E WORKSPACE — DOCX E PPTX 1.3.0-alpha.5"


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
        raise RuntimeError("alpha.5 risulta già applicata")
    if "MATERIALI E WORKSPACE — VIEWER PDF 1.3.0-alpha.4" not in html:
        raise RuntimeError("baseline alpha.4 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — DOCX E PPTX 1.3.0-alpha.5
       ========================================================== */
    .material-document-viewer,.material-presentation-viewer{display:grid;gap:13px}.material-document-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.material-document-summary>div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-document-summary span,.material-document-summary strong{display:block}.material-document-summary span{color:var(--muted);font-size:7px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.material-document-summary strong{margin-top:4px;font-size:10px}.material-document-page{padding:clamp(20px,4vw,44px);border:1px solid rgba(125,235,255,.17);border-radius:14px;background:rgba(255,255,255,.025)}.material-document-page h1,.material-document-page h2{font-family:Georgia,"Times New Roman",serif}.material-document-page h2{margin-top:30px}.material-document-page p,.material-document-page li{color:var(--muted);line-height:1.72}.material-document-page section:first-of-type h2{margin-top:22px}.material-safe-note{padding:10px 11px;border:1px solid rgba(82,232,176,.17);border-radius:10px;color:var(--muted);background:rgba(82,232,176,.035);font-size:8px;line-height:1.5}.material-safe-note strong{color:var(--ink)}.material-slide-stage{min-height:430px;display:grid;place-items:center;padding:28px;border:1px solid rgba(122,124,255,.24);border-radius:17px;background:radial-gradient(circle at 12% 12%,rgba(0,223,242,.09),transparent 36%),linear-gradient(135deg,rgba(7,18,29,.98),rgba(17,13,33,.98));box-shadow:inset 0 0 70px rgba(122,124,255,.055)}.material-slide{width:min(760px,100%)}.material-slide small{color:var(--green-2);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.material-slide h1{margin:12px 0;font-size:clamp(28px,5vw,54px)}.material-slide p{color:var(--muted);line-height:1.6}.material-slide ul{display:grid;gap:10px;padding-left:20px;color:var(--muted);line-height:1.6}@media(max-width:620px){.material-document-summary{grid-template-columns:1fr}.material-slide-stage{min-height:360px;padding:20px}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS DOCX e PPTX")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — DOCX E PPTX SICURI
       ========================================================== */
    Object.assign(aulaMaterialsPanelData.find((item) => item.id === "study-guide-docx") || {}, {
      documentSections: [
        { title: "Perché usare le funzioni", paragraphs: ["Una funzione raccoglie istruzioni che svolgono un compito riconoscibile.", "Dare un nome chiaro alla funzione rende il programma più leggibile e permette di riutilizzare la stessa logica."] },
        { title: "Parametri e risultato", paragraphs: ["I parametri rappresentano i dati ricevuti dalla funzione.", "Il valore restituito è il risultato che la funzione consegna al resto del programma."] },
        { title: "Controlli finali", paragraphs: ["Verifica input validi, casi limite e nomi comprensibili.", "Una funzione troppo lunga spesso contiene più responsabilità e dovrebbe essere divisa."] }
      ]
    });

    Object.assign(aulaMaterialsPanelData.find((item) => item.id === "algorithm-slides-pptx") || {}, {
      slides: [
        { title: "Algoritmi", subtitle: "Dal problema a una procedura verificabile", points: ["Sequenza finita di passaggi", "Ordine non ambiguo", "Risultato verificabile"] },
        { title: "Pseudocodice", subtitle: "Descrivere prima di programmare", points: ["Indipendente dal linguaggio", "Descrive decisioni e ripetizioni", "Prepara la scrittura del programma"] },
        { title: "Test", subtitle: "Controllare il comportamento", points: ["Caso normale", "Caso al limite", "Input non valido"] },
        { title: "Dalla soluzione al codice", subtitle: "Procedere un passo per volta", points: ["Scomponi il problema", "Implementa un pezzo per volta", "Confronta output atteso e ottenuto"] }
      ]
    });

    const aulaPresentationState = { materialId: null, slide: 1 };

    function aulaDocumentSections(material) {
      if (Array.isArray(material?.documentSections) && material.documentSections.length) return material.documentSections;
      return [
        { title: "Anteprima sicura del documento", paragraphs: ["Il file è stato classificato come documento interno compatibile.", "Questa demo non analizza il contenuto binario reale: mostra una rappresentazione testuale deterministica del flusso previsto."] },
        { title: "Metadati disponibili", paragraphs: [`Nome originale: ${material?.originalName || material?.title || "Documento"}.`, "Macro, oggetti incorporati e contenuti eseguibili non vengono avviati nel workspace."] },
        { title: "Integrazione ufficiale", paragraphs: ["Nell’app reale il documento viene convertito sul server in testo sicuro prima della consultazione.", "Il viewer conserva una superficie leggibile senza eseguire il file originale nel browser."] }
      ];
    }

    function aulaPresentationSlides(material) {
      if (Array.isArray(material?.slides) && material.slides.length) return material.slides;
      return [
        { title: material?.title || "Presentazione", subtitle: "Anteprima testuale sicura", points: ["File classificato come presentazione interna", "Nessun elemento attivo viene eseguito", "Le slide reali richiedono conversione protetta"] },
        { title: "Contenuto non analizzato", subtitle: "Limite dichiarato della demo", points: ["Il file binario resta sul dispositivo", "La demo usa dati deterministici", "Nessuna immagine o macro viene estratta"] },
        { title: "Comportamento dell’app", subtitle: "Percorso previsto", points: ["Conversione server-side", "Slide testuali sicure", "Posizione e avanzamento salvabili"] }
      ];
    }

    function aulaDocumentOpen(material) {
      if (!material || !documentContent) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const sections = aulaDocumentSections(material);
      const paragraphs = sections.reduce((total, section) => total + (section.paragraphs?.length || 0), 0);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      documentContent.innerHTML = `
        <section class="material-document-viewer" aria-label="Documento ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Documento convertito · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-document-summary">
            <div><span>Formato</span><strong>${aulaMaterialsPanelEscape(material.kindLabel)}</strong></div>
            <div><span>Sezioni</span><strong>${sections.length}</strong></div>
            <div><span>Paragrafi</span><strong>${paragraphs}</strong></div>
          </div>
          <article class="material-document-page" tabindex="0">
            <h1>${aulaMaterialsPanelEscape(material.title)}</h1>
            ${sections.map((section) => `<section><h2>${aulaMaterialsPanelEscape(section.title)}</h2>${(section.paragraphs || []).map((text) => `<p>${aulaMaterialsPanelEscape(text)}</p>`).join("")}</section>`).join("")}
          </article>
          <div class="material-safe-note"><strong>Visualizzazione sicura.</strong> La demo mostra esclusivamente testo locale controllato e non esegue macro, oggetti incorporati o il documento originale.</div>
        </section>`;
      state.currentView = "material-document";
      setEveContext("materiali");
      saveState();
      closeDrawer();
      showToast(`Documento aperto: ${material.title}`);
    }

    function aulaPresentationMaterial() {
      return aulaMaterialsPanelData.find((item) => item.id === aulaPresentationState.materialId) || null;
    }

    function aulaPresentationRender() {
      const material = aulaPresentationMaterial();
      const slides = aulaPresentationSlides(material);
      const slide = slides[aulaPresentationState.slide - 1];
      if (!material || !slide || !documentContent) return;
      const percent = Math.round((aulaPresentationState.slide / slides.length) * 100);
      documentContent.innerHTML = `
        <section class="material-presentation-viewer" aria-label="Presentazione ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Presentazione testuale · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-viewer-toolbar">
            <button type="button" onclick="aulaPresentationMove(-1)" ${aulaPresentationState.slide <= 1 ? "disabled" : ""}>← Slide precedente</button>
            <div aria-live="polite"><strong>Slide ${aulaPresentationState.slide} di ${slides.length}</strong><br><span>${percent}% della presentazione</span></div>
            <button type="button" onclick="aulaPresentationMove(1)" ${aulaPresentationState.slide >= slides.length ? "disabled" : ""}>Slide successiva →</button>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Avanzamento presentazione" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
          <div class="material-slide-stage">
            <article class="material-slide" tabindex="0">
              <small>Slide ${aulaPresentationState.slide}</small>
              <h1>${aulaMaterialsPanelEscape(slide.title)}</h1>
              <p>${aulaMaterialsPanelEscape(slide.subtitle || "")}</p>
              <ul>${(slide.points || []).map((point) => `<li>${aulaMaterialsPanelEscape(point)}</li>`).join("")}</ul>
            </article>
          </div>
          <div class="material-safe-note"><strong>Presentazione sicura.</strong> Le slide sono testo locale controllato; immagini, animazioni, macro e contenuti incorporati non vengono eseguiti.</div>
        </section>`;
      material.progress = percent;
      material.progressLabel = `Slide ${aulaPresentationState.slide} di ${slides.length}`;
      state.currentView = "material-presentation";
      setEveContext("materiali");
      saveState();
    }

    function aulaPresentationMove(direction) {
      const material = aulaPresentationMaterial();
      const total = aulaPresentationSlides(material).length || 1;
      aulaPresentationState.slide = Math.max(1, Math.min(total, aulaPresentationState.slide + Number(direction || 0)));
      aulaPresentationRender();
      pageScroll?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    function aulaPresentationOpen(material) {
      if (!material) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const slides = aulaPresentationSlides(material);
      aulaPresentationState.materialId = material.id;
      aulaPresentationState.slide = Math.max(1, Math.min(slides.length, Math.round(((material.progress || 1) / 100) * slides.length)));
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaPresentationRender();
      closeDrawer();
      showToast(`Presentazione aperta: ${material.title}`);
    }

    const aulaMaterialsOpenBeforeDocuments = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.access === "internal" && descriptor.viewer === "document") return aulaDocumentOpen(material);
      if (material && descriptor?.access === "internal" && descriptor.viewer === "presentation") return aulaPresentationOpen(material);
      return aulaMaterialsOpenBeforeDocuments(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-presentation" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaPresentationMove(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaPresentationMove(1);
      }
    });


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript DOCX e PPTX")

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
        "**Demo 1.3.0-alpha.4 pronta per verifica: viewer PDF locale con pagine, navigazione e avanzamento.**",
        "**Demo 1.3.0-alpha.5 pronta per verifica: DOCX come testo sicuro e PPTX come slide testuali.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.4`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `659450` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `18710`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `00047a9696e596da120da0e6b7a01f9fac74b5a874167bc89715aceaf24d2d02`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `7e71848ab8b5fc2e1e04b03154786d43c30d82ff`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.4] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: DOCX e PPTX

- DOCX rappresentato come documento testuale strutturato e sicuro.
- PPTX rappresentato come sequenza di slide testuali navigabili.
- Contenuti demo specifici per i materiali predefiniti e fallback dichiarato per i file caricati manualmente.
- Nessuna macro, animazione, immagine incorporata o contenuto eseguibile viene avviato.
- Navigazione slide con pulsanti e frecce della tastiera.
- Percentuale e avanzamento aggiornati per le presentazioni.
- Attivazione esclusiva per materiali interni classificati `document` o `presentation`.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.5")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

I documenti DOCX vengono presentati come sezioni testuali sicure e le presentazioni PPTX come slide testuali. La demo non apre né analizza realmente i file binari caricati: per i materiali manuali usa fallback deterministici e dichiara chiaramente il limite. I viewer si attivano soltanto per descrittori interni compatibili.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: DOCX e PPTX

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- documento DOCX come sezioni di testo sicuro;
- presentazione PPTX come slide testuali navigabili;
- fallback trasparente per file manuali non realmente analizzati;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: viewer PDF | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.4 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: viewer PDF | APPROVATO | 2026-07-23 | L’utente ha approvato il checkpoint e autorizzato la prosecuzione. |\n| Fase 3 | Materiali: DOCX e PPTX | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.5 prodotta e pronta per verifica. |",
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
