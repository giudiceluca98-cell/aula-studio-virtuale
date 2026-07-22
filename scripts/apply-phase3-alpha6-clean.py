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
VERSION = "1.3.0-alpha.6"
MARKER = "MATERIALI E WORKSPACE — VIDEO 1.3.0-alpha.6"


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
        raise RuntimeError("alpha.6 risulta già applicata")
    if "MATERIALI E WORKSPACE — DOCX E PPTX 1.3.0-alpha.5" not in html:
        raise RuntimeError("baseline alpha.5 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — VIDEO 1.3.0-alpha.6
       ========================================================== */
    .material-video-viewer{display:grid;gap:13px}.material-video-stage{position:relative;min-height:390px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(125,235,255,.2);border-radius:17px;background:radial-gradient(circle at 50% 40%,rgba(0,223,242,.14),transparent 28%),linear-gradient(135deg,#06111c,#160f2c)}.material-video-stage::before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 60%,rgba(0,0,0,.58))}.material-video-stage[data-playing="true"] .material-video-symbol{box-shadow:0 0 45px rgba(0,223,242,.18)}.material-video-symbol{position:relative;z-index:1;width:88px;height:88px;display:grid;place-items:center;border:1px solid rgba(125,235,255,.28);border-radius:50%;color:#eaffff;background:rgba(0,223,242,.09);font-size:31px;transition:box-shadow .2s ease}.material-video-provider{position:absolute;top:14px;left:14px;z-index:1;padding:5px 8px;border:1px solid rgba(255,255,255,.15);border-radius:999px;color:#dcecff;background:rgba(0,0,0,.25);font-size:8px;font-weight:800;text-transform:uppercase}.material-video-title{position:absolute;right:16px;bottom:14px;left:16px;z-index:1;color:#f3fbff;font-size:10px;font-weight:800;text-shadow:0 2px 10px rgba(0,0,0,.7)}.material-video-controls{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}.material-video-controls button{width:40px;height:40px;border:1px solid rgba(125,235,255,.22);border-radius:50%;color:#eaffff;background:rgba(0,223,242,.07);cursor:pointer}.material-video-controls input{width:100%;accent-color:var(--green)}.material-video-controls span{min-width:92px;color:var(--muted);font:9px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}.material-video-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.material-video-stats div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-video-stats span,.material-video-stats strong{display:block}.material-video-stats span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-video-stats strong{margin-top:4px;font-size:10px}.material-video-ranges{display:flex;flex-wrap:wrap;gap:5px;min-height:22px}.material-video-ranges span{padding:4px 7px;border:1px solid rgba(82,232,176,.18);border-radius:999px;color:#bff8df;background:rgba(82,232,176,.035);font-size:7px}.material-video-ranges-empty{color:var(--muted)!important;border-color:var(--line)!important;background:rgba(255,255,255,.018)!important}@media(max-width:620px){.material-video-stage{min-height:280px}.material-video-controls{grid-template-columns:auto minmax(0,1fr)}.material-video-controls span{grid-column:1/-1;text-align:left}.material-video-stats{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.material-video-symbol{transition:none}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS player video")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — PLAYER VIDEO SIMULATO
       ========================================================== */
    [
      {
        id: "video-youtube-python",
        title: "Python: primo programma",
        description: "Video YouTube rappresentato con un player locale controllabile.",
        course: "Programmazione da Zero",
        kind: "video",
        kindLabel: "Video",
        url: "https://www.youtube.com/watch?v=demoPython01",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "youtube",
        duration: 245,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video YouTube compatibile con il player incorporato."
      },
      {
        id: "video-vimeo-algorithms",
        title: "Algoritmi visuali",
        description: "Video Vimeo simulato senza caricare contenuti remoti.",
        course: "Programmazione da Zero",
        kind: "video",
        kindLabel: "Video",
        url: "https://vimeo.com/123456789",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "vimeo",
        duration: 310,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video Vimeo compatibile con il player incorporato."
      },
      {
        id: "video-https-debug",
        title: "Debug passo per passo",
        description: "File MP4 HTTPS rappresentato dal player HTML5 locale della demo.",
        course: "Risorse libere",
        kind: "video",
        kindLabel: "Video",
        url: "https://example.org/didattica/debug.mp4",
        access: "embedded",
        accessLabel: "Incorporato",
        monitoring: "full",
        monitoringLabel: "Monitoraggio completo",
        progress: 0,
        progressLabel: "Non iniziato",
        icon: "▶",
        viewerReady: true,
        provider: "html5-video",
        duration: 180,
        explicitClassification: true,
        viewer: "video",
        importStatus: "not-required",
        reason: "Video HTTPS compatibile con il player HTML5."
      }
    ].forEach((item) => {
      if (!aulaMaterialsPanelData.some((current) => current.id === item.id)) aulaMaterialsPanelData.push(item);
    });

    const aulaVideoState = {
      materialId: null,
      current: 0,
      duration: 1,
      playing: false,
      ranges: [],
      timer: null
    };

    function aulaFormatVideoTime(value) {
      const seconds = Math.max(0, Math.floor(Number(value) || 0));
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }

    function aulaMergeRanges(ranges) {
      const sorted = (Array.isArray(ranges) ? ranges : [])
        .filter((range) => Number(range.end) > Number(range.start))
        .map((range) => ({ start: Number(range.start), end: Number(range.end) }))
        .sort((a, b) => a.start - b.start);
      const merged = [];
      sorted.forEach((range) => {
        const last = merged[merged.length - 1];
        if (last && range.start <= last.end + 1) last.end = Math.max(last.end, range.end);
        else merged.push({ ...range });
      });
      return merged;
    }

    function aulaVideoWatchedSeconds() {
      return aulaMergeRanges(aulaVideoState.ranges).reduce((sum, range) => sum + range.end - range.start, 0);
    }

    function aulaVideoRangesHtml() {
      const ranges = aulaMergeRanges(aulaVideoState.ranges);
      if (!ranges.length) return '<span class="material-video-ranges-empty">Nessun intervallo ancora riprodotto</span>';
      return ranges.slice(-6).map((range) => `<span>${aulaFormatVideoTime(range.start)}–${aulaFormatVideoTime(range.end)}</span>`).join("");
    }

    function aulaVideoRender() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaVideoState.materialId);
      if (!material || !documentContent) return;
      const watchedSeconds = aulaVideoWatchedSeconds();
      const coverage = Math.min(100, Math.round((watchedSeconds / aulaVideoState.duration) * 100));
      const completed = coverage >= 90;
      material.progress = coverage;
      material.progressLabel = completed ? "Completato" : `${coverage}% realmente visto`;
      documentContent.innerHTML = `
        <section class="material-video-viewer" aria-label="Player video ${aulaMaterialsPanelEscape(material.title)}">
          <div class="document-section-label">Player locale · nessun iframe remoto</div>
          <div class="material-video-stage" data-playing="${String(aulaVideoState.playing)}">
            <span class="material-video-provider">${aulaMaterialsPanelEscape(material.provider)}</span>
            <div class="material-video-symbol" aria-hidden="true">${aulaVideoState.playing ? "Ⅱ" : "▶"}</div>
            <div class="material-video-title">${aulaMaterialsPanelEscape(material.title)}</div>
          </div>
          <div class="material-video-controls">
            <button type="button" onclick="aulaVideoToggle()" aria-label="${aulaVideoState.playing ? "Pausa" : "Riproduci"}">${aulaVideoState.playing ? "Ⅱ" : "▶"}</button>
            <input type="range" min="0" max="${aulaVideoState.duration}" value="${Math.floor(aulaVideoState.current)}" oninput="aulaVideoSeek(this.value)" aria-label="Posizione video">
            <span>${aulaFormatVideoTime(aulaVideoState.current)} / ${aulaFormatVideoTime(aulaVideoState.duration)}</span>
          </div>
          <div class="material-viewer-progress" role="progressbar" aria-label="Copertura video realmente vista" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${coverage}"><span style="width:${coverage}%"></span></div>
          <div class="material-video-stats">
            <div><span>Copertura reale</span><strong>${coverage}%</strong></div>
            <div><span>Secondi unici</span><strong>${Math.round(watchedSeconds)}</strong></div>
            <div><span>Completamento</span><strong>${completed ? "Raggiunto" : "Richiede almeno 90%"}</strong></div>
          </div>
          <div class="material-video-ranges" aria-label="Intervalli riprodotti">${aulaVideoRangesHtml()}</div>
          <div class="material-workspace-honesty"><strong>Demo locale.</strong> Il player simula play, pausa e seek; non scarica né incorpora il video remoto. Gli spostamenti sul cursore non vengono conteggiati come tempo visto.</div>
        </section>`;
      state.currentView = "material-video";
      setEveContext("materiali");
      saveState();
    }

    function aulaVideoTick() {
      if (!aulaVideoState.playing) return;
      const before = aulaVideoState.current;
      aulaVideoState.current = Math.min(aulaVideoState.duration, aulaVideoState.current + 1);
      aulaVideoState.ranges.push({ start: before, end: aulaVideoState.current });
      if (aulaVideoState.current >= aulaVideoState.duration) {
        aulaVideoState.playing = false;
        if (aulaVideoState.timer) clearInterval(aulaVideoState.timer);
        aulaVideoState.timer = null;
      }
      aulaVideoRender();
    }

    function aulaVideoToggle() {
      aulaVideoState.playing = !aulaVideoState.playing;
      if (aulaVideoState.playing && !aulaVideoState.timer) aulaVideoState.timer = setInterval(aulaVideoTick, 1000);
      if (!aulaVideoState.playing && aulaVideoState.timer) {
        clearInterval(aulaVideoState.timer);
        aulaVideoState.timer = null;
      }
      aulaVideoRender();
    }

    function aulaVideoSeek(value) {
      aulaVideoState.current = Math.max(0, Math.min(aulaVideoState.duration, Number(value) || 0));
      aulaVideoRender();
    }

    function aulaVideoStop() {
      aulaVideoState.playing = false;
      if (aulaVideoState.timer) clearInterval(aulaVideoState.timer);
      aulaVideoState.timer = null;
    }

    function aulaVideoOpen(material) {
      if (!material) return;
      aulaVideoStop();
      if (audioLessonState.speaking) stopAudioLesson(false);
      if (exerciseSpeechState.speaking) stopExerciseSpeech(false);
      document.querySelectorAll(".content-tab").forEach((tab) => tab.classList.remove("active"));
      const title = document.getElementById("selectedMaterialTitle");
      const description = document.getElementById("selectedMaterialDescription");
      const lessonTitle = document.getElementById("courseLessonTitle");
      if (title) title.textContent = material.title;
      if (description) description.textContent = material.description;
      if (lessonTitle) lessonTitle.textContent = material.title;
      aulaVideoState.materialId = material.id;
      aulaVideoState.duration = Math.max(1, Number(material.duration) || 180);
      aulaVideoState.current = 0;
      aulaVideoState.ranges = [];
      aulaVideoRender();
      closeDrawer();
      showToast(`Video aperto: ${material.title}`);
    }

    const aulaMaterialsOpenBeforeVideo = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const descriptor = material ? aulaMaterialOfficialDescriptor(material) : null;
      if (material && descriptor?.viewer === "video" && descriptor.access === "embedded") return aulaVideoOpen(material);
      aulaVideoStop();
      return aulaMaterialsOpenBeforeVideo(id);
    };

    window.addEventListener("keydown", (event) => {
      if (state.currentView !== "material-video" || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        aulaVideoToggle();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        aulaVideoSeek(aulaVideoState.current - 5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        aulaVideoSeek(aulaVideoState.current + 5);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && aulaVideoState.playing) aulaVideoToggle();
    });


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript player video")

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
        "**Demo 1.3.0-alpha.5 pronta per verifica: DOCX come testo sicuro e PPTX come slide testuali.**",
        "**Demo 1.3.0-alpha.6 pronta per verifica: player video locale simulato con copertura realmente vista.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.5`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `672684` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `18874`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `7059b095d76e0e56983fcdabfc721f48ff5a75bd84f49751ca3ddb9d6b9046d7`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `0b6e15a09c4d3ec7065734fd859952071a805080`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.5] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: video

- Materiali dimostrativi per YouTube, Vimeo e video MP4 HTTPS.
- Player locale simulato con riproduzione, pausa, seek e controlli da tastiera.
- Nessun iframe, download o incorporamento remoto nella demo canonica.
- Copertura calcolata sugli intervalli unici realmente riprodotti.
- Gli spostamenti con il cursore non vengono conteggiati come tempo visto.
- Completamento attribuito soltanto dopo almeno il 90% di copertura.
- Pausa automatica quando la scheda del browser diventa nascosta.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.6")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Il player video della demo non usa iframe o sorgenti remote. YouTube, Vimeo e file HTTPS condividono una superficie locale deterministica. Il progresso deriva dall’unione degli intervalli effettivamente riprodotti e il completamento richiede una copertura di almeno il 90%; il semplice seek non incrementa la copertura.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: video

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- player locale per provider YouTube, Vimeo e HTML5;
- play, pausa, seek e controlli tastiera;
- copertura basata sui secondi unici realmente riprodotti;
- completamento dopo almeno il 90%;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: DOCX e PPTX | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.5 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: DOCX e PPTX | APPROVATO | 2026-07-23 | L’utente ha approvato il checkpoint e autorizzato la prosecuzione. |\n| Fase 3 | Materiali: video | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.6 prodotta e pronta per verifica. |",
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
