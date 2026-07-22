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
VERSION = "1.3.0-alpha.9"
MARKER = "MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9"


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
        raise RuntimeError("alpha.9 risulta già applicata")
    if "MATERIALI E WORKSPACE — TRACKING E RIPRESA 1.3.0-alpha.8" not in html:
        raise RuntimeError("baseline alpha.8 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9
       ========================================================== */
    .material-error-state{display:grid;gap:14px;padding:clamp(20px,4vw,36px);border:1px solid rgba(255,107,129,.24);border-radius:17px;background:linear-gradient(90deg,rgba(255,107,129,.065),transparent 68%),rgba(255,255,255,.018)}.material-error-state[data-tone="warning"]{border-color:rgba(255,190,102,.25);background:linear-gradient(90deg,rgba(255,190,102,.065),transparent 68%),rgba(255,255,255,.018)}.material-error-state h1{margin:0;font-family:Georgia,"Times New Roman",serif}.material-error-state>p{margin:0;color:var(--muted);line-height:1.65}.material-error-code{padding:9px 11px;border:1px solid var(--line);border-radius:9px;color:#f2a8b5;background:rgba(0,0,0,.12);font:8px ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.material-error-preserved{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.material-error-preserved>div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-error-preserved span,.material-error-preserved strong{display:block}.material-error-preserved span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-error-preserved strong{margin-top:4px;font-size:9px}.material-error-actions{display:flex;flex-wrap:wrap;gap:8px}.material-error-actions button{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-error-actions button:disabled{opacity:.5;cursor:not-allowed}.material-error-actions .primary{border-color:rgba(82,232,176,.25);color:#caffeb;background:rgba(82,232,176,.055)}.material-alternatives{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.material-alternative{display:grid;gap:7px;padding:11px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.018)}.material-alternative strong{font-size:9px}.material-alternative span{color:var(--muted);font-size:8px;line-height:1.4}.material-alternative button{min-height:34px;border:1px solid rgba(125,235,255,.18);border-radius:8px;color:var(--ink);background:rgba(0,223,242,.035);font-size:8px;font-weight:800;cursor:pointer}.material-error-honesty{padding:10px 11px;border:1px solid rgba(82,232,176,.16);border-radius:10px;color:var(--muted);background:rgba(82,232,176,.03);font-size:8px;line-height:1.55}.material-error-honesty strong{color:var(--ink)}@media(max-width:760px){.material-alternatives{grid-template-columns:1fr}.material-error-preserved{grid-template-columns:1fr}}@media(max-width:480px){.material-error-actions button{width:100%}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS errori materiali")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — ERRORI SICURI E ALTERNATIVE
       ========================================================== */
    [
      {
        id: "material-unsupported-zip",
        title: "Archivio esercizi ZIP",
        description: "Formato non supportato dal workspace didattico.",
        course: "Risorse libere",
        kind: "unsupported",
        kindLabel: "ZIP",
        access: "unsupported",
        accessLabel: "Non supportato",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 0,
        progressLabel: "Non disponibile",
        icon: "!",
        viewerReady: false,
        explicitClassification: true,
        viewer: null,
        importStatus: "failed",
        provider: "none",
        reason: "Gli archivi ZIP non vengono aperti nel workspace."
      },
      {
        id: "material-unavailable",
        title: "Dispensa rimossa dal proprietario",
        description: "La voce è ancora nella cronologia, ma il contenuto non è più disponibile.",
        course: "Programmazione da Zero",
        kind: "unavailable",
        kindLabel: "Non disponibile",
        access: "unsupported",
        accessLabel: "Non disponibile",
        monitoring: "none",
        monitoringLabel: "Non monitorabile",
        progress: 24,
        progressLabel: "Cronologia conservata",
        icon: "×",
        viewerReady: false,
        explicitClassification: true,
        viewer: null,
        importStatus: "failed",
        provider: "none",
        reason: "Il file originale è stato rimosso; progressi e cronologia restano separati."
      },
      {
        id: "material-retry-demo",
        title: "Appunti temporaneamente non caricabili",
        description: "Stato demo per verificare errore, retry e recupero idempotente.",
        course: "Programmazione da Zero",
        kind: "text",
        kindLabel: "Testo",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 12,
        progressLabel: "Ripresa sospesa",
        icon: "↻",
        viewerReady: true,
        explicitClassification: true,
        viewer: "text",
        importStatus: "ready",
        provider: "internal",
        reason: "Errore temporaneo di lettura."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaMaterialErrorAttempts = {};
    const aulaMaterialErrorBusy = new Set();
    const aulaMaterialErrorSnapshots = {};

    function aulaMaterialAlternatives(excludeId) {
      return aulaMaterialsPanelData
        .filter((item) => {
          if (item.id === excludeId) return false;
          const descriptor = aulaMaterialOfficialDescriptor(item);
          return descriptor.access === "internal" && ["lesson", "pdf", "document", "presentation", "text"].includes(descriptor.viewer || item.kind);
        })
        .slice(0, 3);
    }

    function aulaMaterialErrorDefinition(kind) {
      return ({
        unsupported: {
          title: "Formato non supportato",
          text: "Questo formato non dispone di un viewer interno sicuro. Il file non è stato eseguito né aperto esternamente.",
          code: "unsupported_material",
          tone: "warning",
          retry: false
        },
        unavailable: {
          title: "Materiale non disponibile",
          text: "Il contenuto è stato rimosso o non è più raggiungibile. Progressi e cronologia restano conservati separatamente.",
          code: "material_unavailable",
          tone: "error",
          retry: false
        },
        temporary: {
          title: "Caricamento non riuscito",
          text: "La lettura si è interrotta prima di mostrare il contenuto. Nessun progresso parziale è stato sovrascritto.",
          code: "temporary_load_error",
          tone: "error",
          retry: true
        }
      })[kind];
    }

    function aulaMaterialErrorSnapshot(material) {
      if (!aulaMaterialErrorSnapshots[material.id]) {
        aulaMaterialErrorSnapshots[material.id] = {
          progress: Number(material.progress || 0),
          progressLabel: material.progressLabel || "Non iniziato",
          tracking: typeof aulaMaterialProgressGet === "function" ? aulaMaterialProgressGet(material.id) : null
        };
      }
      return aulaMaterialErrorSnapshots[material.id];
    }

    function aulaMaterialErrorRender(material, kind) {
      if (!material || !documentContent) return;
      const definition = aulaMaterialErrorDefinition(kind);
      const alternatives = aulaMaterialAlternatives(material.id);
      const snapshot = aulaMaterialErrorSnapshot(material);
      const savedMinutes = Math.round(Number(snapshot.tracking?.activeSeconds || 0) / 60);
      documentContent.innerHTML = `
        <section class="material-error-state" data-tone="${definition.tone}" aria-label="${aulaMaterialsPanelEscape(definition.title)}">
          <div class="document-section-label">Stato sicuro del workspace</div>
          <h1>${aulaMaterialsPanelEscape(definition.title)}</h1>
          <p>${aulaMaterialsPanelEscape(definition.text)}</p>
          <div class="material-error-code">${aulaMaterialsPanelEscape(definition.code)} · ${aulaMaterialsPanelEscape(material.id)}</div>
          <div class="material-error-preserved">
            <div><span>Progresso conservato</span><strong>${snapshot.progress}%</strong></div>
            <div><span>Stato precedente</span><strong>${aulaMaterialsPanelEscape(snapshot.progressLabel)}</strong></div>
            <div><span>Tempo locale</span><strong>${savedMinutes} min</strong></div>
          </div>
          <div class="material-error-actions">
            ${definition.retry ? `<button class="primary" type="button" onclick="aulaMaterialRetry('${aulaMaterialsPanelEscape(material.id)}')" ${aulaMaterialErrorBusy.has(material.id) ? "disabled" : ""}>${aulaMaterialErrorBusy.has(material.id) ? "Nuovo tentativo…" : "Riprova caricamento"}</button>` : ""}
            <button type="button" onclick="openDrawer('materiali')" ${aulaMaterialErrorBusy.has(material.id) ? "disabled" : ""}>Torna ai materiali</button>
          </div>
          <div>
            <strong>Alternative interne sicure</strong>
            <div class="material-alternatives">
              ${alternatives.map((item) => `<article class="material-alternative"><strong>${aulaMaterialsPanelEscape(item.title)}</strong><span>${aulaMaterialsPanelEscape(item.kindLabel)} · ${aulaMaterialsPanelEscape(item.monitoringLabel)}</span><button type="button" onclick="aulaMaterialsPanelOpen('${aulaMaterialsPanelEscape(item.id)}')">Apri alternativa</button></article>`).join("")}
            </div>
          </div>
          <div class="material-error-honesty"><strong>Stato deterministico della demo.</strong> Nessun file non supportato viene eseguito. Il retry recuperabile modifica lo stesso materiale, conserva il progresso e non crea duplicati.</div>
        </section>`;
      state.currentView = "material-error";
      setEveContext("materiali");
      saveState();
    }

    function aulaMaterialErrorOpen(material, kind) {
      if (!material) return;
      if (typeof aulaMaterialTrackingStop === "function") aulaMaterialTrackingStop();
      if (typeof aulaVideoStop === "function") aulaVideoStop();
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaMaterialErrorSnapshot(material);
      aulaMaterialErrorRender(material, kind);
      closeDrawer();
    }

    async function aulaMaterialRetry(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || aulaMaterialErrorBusy.has(id) || aulaMaterialErrorAttempts[id]) return;
      const snapshot = aulaMaterialErrorSnapshot(material);
      aulaMaterialErrorBusy.add(id);
      aulaMaterialErrorRender(material, "temporary");
      await new Promise((resolve) => setTimeout(resolve, 620));

      aulaMaterialErrorAttempts[id] = 1;
      aulaMaterialErrorBusy.delete(id);
      Object.assign(material, {
        kind: "document",
        kindLabel: "Documento recuperato",
        access: "internal",
        accessLabel: "Interno",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        viewer: "document",
        viewerReady: true,
        importStatus: "ready",
        provider: "internal",
        explicitClassification: true,
        reason: "Contenuto recuperato dopo un errore temporaneo.",
        progress: snapshot.progress,
        progressLabel: snapshot.progressLabel,
        documentSections: [
          {
            title: "Contenuto recuperato",
            paragraphs: [
              "Il secondo tentativo ha recuperato una copia coerente del testo.",
              "La posizione precedente non è stata cancellata e il materiale non è stato duplicato."
            ]
          },
          {
            title: "Verifica del recupero",
            paragraphs: [
              `Progresso precedente conservato: ${snapshot.progress}%.`,
              "Il viewer ora usa una rappresentazione testuale interna sicura."
            ]
          }
        ]
      });
      aulaMaterialApplyDescriptor(material);
      showToast("Materiale recuperato al secondo tentativo");
      window.aulaMaterialsPanelOpen(id);
    }

    const aulaMaterialsOpenBeforeErrors = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material) return aulaMaterialsOpenBeforeErrors(id);
      if (id === "material-unsupported-zip") return aulaMaterialErrorOpen(material, "unsupported");
      if (id === "material-unavailable") return aulaMaterialErrorOpen(material, "unavailable");
      if (id === "material-retry-demo" && !aulaMaterialErrorAttempts[id]) return aulaMaterialErrorOpen(material, "temporary");
      return aulaMaterialsOpenBeforeErrors(id);
    };


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript errori materiali")

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
        "**Demo 1.3.0-alpha.8 pronta per verifica: tracking, autosalvataggio, tempo attivo e ripresa della posizione.**",
        "**Demo 1.3.0-alpha.9 pronta per verifica: errori sicuri, retry recuperabile e alternative interne.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.8`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `714395` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `19627`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `4c08e2c1736bd40d9fc0d971668663487cf5c878a1631d12c53fac19533b1f8f`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `74b81f90f32336c7ac9058c180e3ff0fc8fe2b4d`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.8] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: errori e alternative

- Stato dedicato per formato ZIP non supportato.
- Stato materiale non disponibile con progresso e cronologia conservati.
- Errore temporaneo recuperabile al secondo tentativo.
- Il retry trasforma lo stesso materiale in documento interno e non crea duplicati.
- Progresso e dati locali precedenti vengono mantenuti durante il recupero.
- Tracking interrotto durante le schermate di errore e riavviato soltanto dopo l’apertura del viewer recuperato.
- Alternative limitate a materiali interni con viewer sicuro.
- Nessun file non supportato viene eseguito o aperto esternamente.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.9")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Gli errori dei materiali sono rappresentati come stati separati dal tracking. Formati non supportati e contenuti rimossi non vengono eseguiti; il retry temporaneo modifica in modo idempotente lo stesso oggetto materiale, preservando progresso e dati locali. Le alternative proposte sono esclusivamente risorse interne con viewer sicuro.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: errori e alternative

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- formato ZIP non supportato;
- materiale rimosso con cronologia conservata;
- errore temporaneo recuperabile senza duplicati;
- progresso precedente preservato;
- alternative esclusivamente interne e sicure;
- tracking disattivato durante gli stati di errore;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: tracking e ripresa | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.8 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: tracking e ripresa | APPROVATO | 2026-07-23 | L’utente ha autorizzato la prosecuzione dopo la consegna del checkpoint. |\n| Fase 3 | Materiali: errori e alternative | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.9 prodotta e pronta per verifica. |",
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
