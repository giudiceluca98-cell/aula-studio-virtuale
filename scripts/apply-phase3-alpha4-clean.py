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
VERSION = "1.3.0-alpha.4"
MARKER = "MATERIALI E WORKSPACE — VIEWER PDF 1.3.0-alpha.4"


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
        raise RuntimeError("alpha.4 risulta già applicata")
    if "MATERIALI E WORKSPACE — TIPI E CLASSIFICAZIONE 1.3.0-alpha.3" not in html:
        raise RuntimeError("baseline alpha.3 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — VIEWER PDF 1.3.0-alpha.4
       ========================================================== */
    .material-pdf-viewer{display:grid;gap:13px}.material-viewer-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px;padding:11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}.material-viewer-toolbar button{min-height:36px;padding:0 10px;border:1px solid var(--line);border-radius:9px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-viewer-toolbar button:disabled{opacity:.42;cursor:not-allowed}.material-viewer-toolbar strong{font-size:10px}.material-viewer-toolbar span{color:var(--muted);font-size:8px}.material-pdf-sheet{min-height:470px;padding:clamp(22px,5vw,58px);border:1px solid rgba(125,235,255,.18);border-radius:10px;color:#17212a;background:#f4f1e8;box-shadow:0 20px 50px rgba(0,0,0,.24)}.material-pdf-sheet small{color:#53606b;font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.material-pdf-sheet h1{color:#101820;font-family:Georgia,"Times New Roman",serif}.material-pdf-sheet p,.material-pdf-sheet li{color:#25313b;line-height:1.75}.material-pdf-sheet ul{padding-left:21px}.material-viewer-progress{height:6px;overflow:hidden;border-radius:999px;background:rgba(125,235,255,.08)}.material-viewer-progress span{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--violet));transition:width .18s ease}.material-pdf-status{padding:9px 11px;border:1px solid rgba(82,232,176,.17);border-radius:10px;color:var(--muted);background:rgba(82,232,176,.035);font-size:8px;line-height:1.5}.material-pdf-status strong{color:var(--ink)}@media(max-width:620px){.material-pdf-sheet{min-height:390px;padding:22px 18px}.material-viewer-toolbar button{flex:1}.material-viewer-toolbar>div{order:-1;width:100%;text-align:center}}@media(prefers-reduced-motion:reduce){.material-viewer-progress span{transition:none}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS viewer PDF")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — VIEWER PDF LOCALE
       ========================================================== */
    const aulaPdfPages = [
      { title: "Esercizi · Capitolo 1", body: "Obiettivo del fascicolo: trasformare le nozioni iniziali in procedure verificabili. Ogni esercizio richiede input, elaborazione, output e almeno un caso limite.", items: ["Leggere con attenzione la consegna", "Scrivere un esempio valido", "Individuare un errore possibile"] },
      { title: "1. Sequenza di istruzioni", body: "Descrivi un algoritmo quotidiano usando passaggi ordinati. Spiega perché cambiare l’ordine può modificare il risultato.", items: ["Passaggi numerati", "Condizione iniziale", "Risultato atteso"] },
      { title: "2. Input e output", body: "Immagina un programma che chiede il nome e restituisce un saluto. Distingui chiaramente ciò che entra da ciò che esce.", items: ["Input: nome", "Elaborazione: costruzione frase", "Output: saluto"] },
      { title: "3. Tipi di dato", body: "Classifica età, prezzo, nome e risposta vero/falso. Motiva la scelta del tipo più adatto.", items: ["Intero", "Numero decimale", "Stringa", "Booleano"] },
      { title: "4. Casi limite", body: "Un programma calcola la media di una lista. Cosa accade con una lista vuota? Definisci il comportamento corretto prima di scrivere codice.", items: ["Lista vuota", "Valori non numerici", "Un solo valore"] },
      { title: "5. Errori di sintassi", body: "Osserva una riga incompleta e spiega quale parte impedisce al linguaggio di interpretarla.", items: ["Parentesi", "Virgolette", "Indentazione"] },
      { title: "6. Errori logici", body: "Il programma viene eseguito ma produce un risultato sbagliato. Descrivi come useresti esempi piccoli per trovare il passaggio errato.", items: ["Valore atteso", "Valore ottenuto", "Prima divergenza"] },
      { title: "7. Pseudocodice", body: "Scrivi lo pseudocodice di un controllo che stabilisce se una persona è maggiorenne.", items: ["Leggi età", "Confronta con 18", "Mostra il risultato"] },
      { title: "8. Verifica", body: "Prepara tre test: un caso normale, un caso al limite e un caso non valido.", items: ["Età 25", "Età 18", "Testo al posto del numero"] },
      { title: "9. Scomposizione", body: "Dividi un problema più grande in funzioni o sottoproblemi con responsabilità distinte.", items: ["Acquisizione dati", "Validazione", "Calcolo", "Presentazione"] },
      { title: "10. Riflessione", body: "Spiega con parole tue la differenza tra algoritmo e programma, includendo un controesempio.", items: ["Definizione intuitiva", "Definizione tecnica", "Controesempio"] },
      { title: "Soluzioni guidate", body: "Confronta il tuo ragionamento con i criteri: chiarezza, ordine, gestione degli errori e verificabilità.", items: ["Non copiare soltanto il risultato", "Controlla i casi limite", "Spiega le scelte"] }
    ];
    const aulaPdfState = { materialId: null, page: 1 };

    function aulaPdfMaterial(id) {
      return aulaMaterialsPanelData.find((item) => item.id === id) || null;
    }

    function aulaPdfTotalPages() {
      return aulaPdfPages.length;
    }

    function aulaPdfRender() {
      const material = aulaPdfMaterial(aulaPdfState.materialId);
      const total = aulaPdfTotalPages();
      const page = aulaPdfPages[aulaPdfState.page - 1] || aulaPdfPages[0];
      const percent = Math.round((aulaPdfState.page / total) * 100);
      if (!material || !documentContent) return;
      documentContent.innerHTML = `
        <section class="material-pdf-viewer" aria-label="Viewer PDF ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">PDF interno · ${aulaMaterialsPanelEscape(material.course)}</div>
          <div class="material-viewer-toolbar">
            <button type="button" onclick="aulaPdfMove(-1)" ${aulaPdfState.page <= 1 ? "disabled" : ""}>← Pagina precedente</button>
            <div aria-live="polite"><strong>Pagina ${aulaPdfState.page} di ${total}</strong><br><span>${percent}% del documento</span></div>
            <button type="button" onclick="aulaPdfMove(1)" ${aulaPdfState.page >= total ? "disabled" : ""}>Pagina successiva →</button>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Avanzamento PDF" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="width:${percent}%"></span></div>
          <article class="material-pdf-sheet" tabindex="0">
            <small>Pagina ${aulaPdfState.page}</small>
            <h1>${aulaMaterialsPanelEscape(page.title)}</h1>
            <p>${aulaMaterialsPanelEscape(page.body)}</p>
            <ul>${page.items.map((item) => `<li>${aulaMaterialsPanelEscape(item)}</li>`).join("")}</ul>
          </article>
          <div class="material-pdf-status"><strong>Stato reale della demo.</strong> Il PDF è rappresentato con pagine locali deterministiche; nessun documento remoto viene caricato.</div>
        </section>`;
      material.progress = percent;
      material.progressLabel = `Pagina ${aulaPdfState.page} di ${total}`;
      state.currentView = "material-pdf";
      setEveContext("materiali");
      saveState();
    }

    function aulaPdfMove(direction) {
      const total = aulaPdfTotalPages();
      aulaPdfState.page = Math.max(1, Math.min(total, aulaPdfState.page + Number(direction || 0)));
      aulaPdfRender();
      pageScroll?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }

    function aulaPdfOpen(material) {
      if (!material) return;
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      const total = aulaPdfTotalPages();
      aulaPdfState.materialId = material.id;
      aulaPdfState.page = Math.max(1, Math.min(total, Math.round(((material.progress || 1) / 100) * total)));
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaPdfRender();
      closeDrawer();
      showToast(`PDF aperto: ${material.title}`);
    }

    const aulaMaterialsOpenBeforePdf = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.viewer === "pdf" && descriptor.access === "internal") return aulaPdfOpen(material);
      return aulaMaterialsOpenBeforePdf(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-pdf" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaPdfMove(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaPdfMove(1);
      }
    });


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript viewer PDF")

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
        "**Demo 1.3.0-alpha.3 pronta per verifica: tipi, accesso, viewer, provider, importazione e monitoraggio dei materiali.**",
        "**Demo 1.3.0-alpha.4 pronta per verifica: viewer PDF locale con pagine, navigazione e avanzamento.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.3`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `649900` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `18601`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `a70215459d7919a020b673d9285574f8017e8098c5ccf74355e0fcf74bf0413a`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `4a69dd1df5134bfdeba57f91d350156d4a1062b7`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.3] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: viewer PDF

- Viewer PDF locale e deterministico senza iframe o richieste remote.
- Navigazione pagina precedente/successiva e scorciatoie freccia sinistra/destra.
- Percentuale, progressbar accessibile e aggiornamento dell’avanzamento del materiale.
- Ripresa iniziale derivata dal progresso corrente della sessione.
- Attivazione esclusiva per PDF classificati `internal`; i PDF remoti restano `import-required`.
- Rispetto di `prefers-reduced-motion` durante lo spostamento fra pagine.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.4")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Il viewer PDF della demo usa pagine locali deterministiche e aggiorna l’avanzamento del materiale nella sessione. Si attiva soltanto per descrittori `internal` con viewer `pdf`; una sorgente remota classificata `import-required` non viene aperta come se fosse già importata.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: viewer PDF

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- viewer locale a pagine con navigazione e percentuale;
- avanzamento aggiornato nella sessione;
- nessun iframe o caricamento remoto;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: tipi e classificazione | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.3 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: tipi e classificazione | APPROVATO | 2026-07-23 | L’utente ha approvato il checkpoint e autorizzato la prosecuzione. |\n| Fase 3 | Materiali: viewer PDF | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.4 prodotta e pronta per verifica. |",
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
