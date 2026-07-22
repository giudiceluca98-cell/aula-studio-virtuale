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
VERSION = "1.3.0-alpha.8"
MARKER = "MATERIALI E WORKSPACE — TRACKING E RIPRESA 1.3.0-alpha.8"


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
        raise RuntimeError("alpha.8 risulta già applicata")
    if "MATERIALI E WORKSPACE — IMPORT REQUIRED 1.3.0-alpha.7" not in html:
        raise RuntimeError("baseline alpha.7 assente")

    css_anchor = """    /* ==========================================================
       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6
       ========================================================== */"""
    css_block = """    /* ==========================================================
       MATERIALI E WORKSPACE — TRACKING E RIPRESA 1.3.0-alpha.8
       ========================================================== */
    .material-tracking-banner{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;margin-bottom:13px;padding:11px;border:1px solid rgba(82,232,176,.2);border-radius:12px;background:linear-gradient(90deg,rgba(82,232,176,.06),transparent 70%),rgba(255,255,255,.018)}.material-tracking-icon{width:34px;height:34px;display:grid;place-items:center;border:1px solid rgba(82,232,176,.24);border-radius:10px;color:#91f7d3;background:rgba(82,232,176,.05)}.material-tracking-copy strong,.material-tracking-copy span{display:block}.material-tracking-copy strong{font-size:10px}.material-tracking-copy span{margin-top:3px;color:var(--muted);font-size:8px;line-height:1.45}.material-tracking-status{color:#91f7d3;font-size:8px;font-weight:800;text-align:right}.material-tracking-history{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.material-tracking-history span{padding:3px 6px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:7px}.material-tracking-details{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.material-tracking-details span{padding:3px 6px;border:1px solid rgba(82,232,176,.14);border-radius:999px;color:#bff8df;background:rgba(82,232,176,.025);font-size:7px}@media(max-width:620px){.material-tracking-banner{grid-template-columns:auto 1fr}.material-tracking-status{grid-column:1/-1;text-align:left}}


"""
    html = replace_once(html, css_anchor, css_block + css_anchor, "CSS tracking")

    js_anchor = """    /* ==========================================================
       DASHBOARD — STATI DI ERRORE DETERMINISTICI
       ========================================================== */"""
    js_block = '''    /* ==========================================================
       MATERIALI — TRACKING, AUTOSALVATAGGIO E RIPRESA
       ========================================================== */
    const aulaMaterialProgressStorageKey = "aula-demo-material-progress-v2";
    const aulaMaterialTracking = {
      currentId: null,
      openedAt: 0,
      lastInteraction: 0,
      activeSeconds: 0,
      timer: null,
      scrollTimer: null,
      resumed: false
    };

    function aulaMaterialProgressAll() {
      try {
        const parsed = JSON.parse(localStorage.getItem(aulaMaterialProgressStorageKey) || "{}");
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return {};
      }
    }

    function aulaMaterialProgressGet(id) {
      return id ? aulaMaterialProgressAll()[id] || null : null;
    }

    function aulaMaterialProgressWrite(all) {
      try {
        localStorage.setItem(aulaMaterialProgressStorageKey, JSON.stringify(all));
        return true;
      } catch {
        return false;
      }
    }

    function aulaMaterialTrackableView() {
      return ["material-pdf", "material-presentation", "material-video", "material-document", "material-text"].includes(state.currentView);
    }

    function aulaMaterialCurrentDescriptor() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      return material ? aulaMaterialOfficialDescriptor(material) : null;
    }

    function aulaMaterialPresentationTotal(material) {
      try {
        return typeof aulaPresentationSlides === "function" ? Math.max(1, aulaPresentationSlides(material).length) : Math.max(1, material?.slides?.length || 1);
      } catch {
        return Math.max(1, material?.slides?.length || 1);
      }
    }

    function aulaMaterialPosition() {
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (viewer === "pdf") {
        const total = Math.max(1, aulaPdfPages.length);
        return { page: aulaPdfState.page, completion: Math.round((aulaPdfState.page / total) * 100) };
      }
      if (viewer === "presentation") {
        const total = aulaMaterialPresentationTotal(material);
        return { slide: aulaPresentationState.slide, completion: Math.round((aulaPresentationState.slide / total) * 100) };
      }
      if (viewer === "video") {
        const ranges = aulaMergeRanges(aulaVideoState.ranges);
        return {
          videoTime: aulaVideoState.current,
          videoRanges: ranges,
          completion: Math.min(100, Math.round((aulaVideoWatchedSeconds() / Math.max(1, aulaVideoState.duration)) * 100))
        };
      }
      if (viewer === "document" || viewer === "text") {
        const scrollHeight = Math.max(1, pageScroll?.scrollHeight || 1);
        const viewport = Math.max(0, pageScroll?.clientHeight || 0);
        const scrollTop = Math.max(0, pageScroll?.scrollTop || 0);
        const ratio = Math.min(1, (scrollTop + viewport) / scrollHeight);
        return { scrollTop, scrollRatio: ratio, completion: Math.round(ratio * 100) };
      }
      return { completion: Number(material?.progress || 0) };
    }

    function aulaMaterialProgressLabel(material, viewer, completion) {
      if (viewer === "video") return completion >= 90 ? "Completato" : `${completion}% realmente visto`;
      if (viewer === "pdf") return `Pagina ${aulaPdfState.page} di ${Math.max(1, aulaPdfPages.length)}`;
      if (viewer === "presentation") return `Slide ${aulaPresentationState.slide} di ${aulaMaterialPresentationTotal(material)}`;
      if (completion >= 95) return "Completato";
      return completion > 0 ? "Ripresa disponibile" : "Non iniziato";
    }

    function aulaMaterialTrackingStatus(text) {
      const node = document.getElementById("materialTrackingStatus");
      if (node) node.textContent = text;
    }

    function aulaMaterialTrackingSave(eventType = null) {
      if (!aulaMaterialTracking.currentId || !aulaMaterialTrackableView()) return;
      const all = aulaMaterialProgressAll();
      const previous = all[aulaMaterialTracking.currentId] || {};
      const position = aulaMaterialPosition();
      const events = Array.isArray(previous.events) ? [...previous.events] : [];
      if (eventType) events.push({ type: eventType, at: new Date().toISOString() });
      all[aulaMaterialTracking.currentId] = {
        ...previous,
        ...position,
        activeSeconds: aulaMaterialTracking.activeSeconds,
        updatedAt: new Date().toISOString(),
        events: events.slice(-10)
      };
      const saved = aulaMaterialProgressWrite(all);
      const material = aulaMaterialsPanelData.find((item) => item.id === aulaMaterialTracking.currentId);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (material && Number.isFinite(position.completion)) {
        material.progress = position.completion;
        material.progressLabel = aulaMaterialProgressLabel(material, viewer, position.completion);
        saveState();
      }
      aulaMaterialTrackingStatus(saved ? "Salvato automaticamente" : "Salvataggio locale non disponibile");
    }

    function aulaMaterialTrackingStop(eventType = "material_closed") {
      if (aulaMaterialTracking.scrollTimer) clearTimeout(aulaMaterialTracking.scrollTimer);
      aulaMaterialTracking.scrollTimer = null;
      if (aulaMaterialTracking.timer) clearInterval(aulaMaterialTracking.timer);
      aulaMaterialTracking.timer = null;
      if (aulaMaterialTracking.currentId && aulaMaterialTrackableView()) aulaMaterialTrackingSave(eventType);
      aulaMaterialTracking.currentId = null;
    }

    function aulaMaterialTrackingStart(id, saved) {
      aulaMaterialTracking.currentId = id;
      aulaMaterialTracking.openedAt = Date.now();
      aulaMaterialTracking.lastInteraction = Date.now();
      aulaMaterialTracking.activeSeconds = Number(saved?.activeSeconds || 0);
      aulaMaterialTracking.resumed = Boolean(saved);
      aulaMaterialTracking.timer = setInterval(() => {
        const visible = document.visibilityState === "visible";
        const recent = Date.now() - aulaMaterialTracking.lastInteraction < 30000;
        const videoActive = aulaVideoState.materialId === id && aulaVideoState.playing;
        if (visible && (recent || videoActive)) {
          aulaMaterialTracking.activeSeconds += 1;
          if (aulaMaterialTracking.activeSeconds % 5 === 0) aulaMaterialTrackingSave();
        }
      }, 1000);
    }

    function aulaMaterialEventLabel(type) {
      return ({
        material_opened: "Aperto",
        material_resumed: "Ripreso",
        material_closed: "Chiuso",
        position_changed: "Posizione salvata"
      })[type] || type;
    }

    function aulaMaterialSavedPositionText(saved, viewer) {
      if (!saved) return "Nessuna posizione precedente.";
      if (viewer === "pdf" && saved.page) return `Pagina ${saved.page}`;
      if (viewer === "presentation" && saved.slide) return `Slide ${saved.slide}`;
      if (viewer === "video") return `${aulaFormatVideoTime(saved.videoTime || 0)} · ${Math.round(saved.completion || 0)}% visto`;
      if ((viewer === "document" || viewer === "text") && Number.isFinite(saved.scrollRatio)) return `${Math.round(saved.scrollRatio * 100)}% del testo`;
      return `${Math.round(saved.completion || 0)}%`;
    }

    function aulaMaterialTrackingBanner(id, saved) {
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      if (!material || !documentContent || !aulaMaterialTrackableView()) return;
      const viewer = aulaMaterialOfficialDescriptor(material).viewer;
      const history = (saved?.events || []).slice(-4).map((event) => `<span>${aulaMaterialsPanelEscape(aulaMaterialEventLabel(event.type))}</span>`).join("");
      const banner = document.createElement("div");
      banner.className = "material-tracking-banner";
      banner.innerHTML = `
        <div class="material-tracking-icon">↺</div>
        <div class="material-tracking-copy">
          <strong>${saved ? "Materiale ripreso" : "Nuovo materiale aperto"}</strong>
          <span>${saved ? `Posizione e ${Math.round(Number(saved.activeSeconds || 0) / 60)} minuti attivi ripristinati.` : "La posizione e il tempo attivo verranno salvati automaticamente in questo browser."}</span>
          <div class="material-tracking-details"><span>${aulaMaterialsPanelEscape(aulaMaterialSavedPositionText(saved, viewer))}</span><span>Salvataggio ogni 5 secondi attivi</span></div>
          <div class="material-tracking-history">${history}</div>
        </div>
        <div class="material-tracking-status" id="materialTrackingStatus">Salvato automaticamente</div>`;
      documentContent.prepend(banner);
    }

    function aulaMaterialRestoreAfterOpen(id, saved) {
      if (!saved) return;
      const material = aulaMaterialsPanelData.find((item) => item.id === id);
      const viewer = material ? aulaMaterialOfficialDescriptor(material).viewer : null;
      if (viewer === "pdf" && Number.isFinite(saved.page)) {
        aulaPdfState.page = Math.max(1, Math.min(aulaPdfPages.length, Number(saved.page)));
        aulaPdfRender();
      } else if (viewer === "presentation" && Number.isFinite(saved.slide)) {
        const total = aulaMaterialPresentationTotal(material);
        aulaPresentationState.slide = Math.max(1, Math.min(total, Number(saved.slide)));
        aulaPresentationRender();
      } else if (viewer === "video") {
        aulaVideoState.current = Math.max(0, Math.min(aulaVideoState.duration, Number(saved.videoTime || 0)));
        aulaVideoState.ranges = Array.isArray(saved.videoRanges) ? aulaMergeRanges(saved.videoRanges) : [];
        aulaVideoRender();
      } else if ((viewer === "document" || viewer === "text") && Number.isFinite(saved.scrollTop)) {
        pageScroll?.scrollTo({ top: Number(saved.scrollTop), behavior: "auto" });
      }
      if (material && Number.isFinite(saved.completion)) material.progress = Number(saved.completion);
    }

    const aulaMaterialsOpenBeforeTracking = window.aulaMaterialsPanelOpen || aulaMaterialsPanelOpen;
    window.aulaMaterialsPanelOpen = function(id) {
      aulaMaterialTrackingStop();
      const saved = aulaMaterialProgressGet(id);
      const result = aulaMaterialsOpenBeforeTracking(id);
      window.setTimeout(() => {
        if (!aulaMaterialTrackableView()) return;
        aulaMaterialRestoreAfterOpen(id, saved);
        aulaMaterialTrackingBanner(id, saved);
        aulaMaterialTrackingStart(id, saved);
        aulaMaterialTrackingSave(saved ? "material_resumed" : "material_opened");
      }, 40);
      return result;
    };

    const aulaPdfMoveBeforeTracking = window.aulaPdfMove;
    if (typeof aulaPdfMoveBeforeTracking === "function") {
      window.aulaPdfMove = function(direction) {
        const result = aulaPdfMoveBeforeTracking(direction);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaPresentationMoveBeforeTracking = window.aulaPresentationMove;
    if (typeof aulaPresentationMoveBeforeTracking === "function") {
      window.aulaPresentationMove = function(direction) {
        const result = aulaPresentationMoveBeforeTracking(direction);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaVideoSeekBeforeTracking = window.aulaVideoSeek;
    if (typeof aulaVideoSeekBeforeTracking === "function") {
      window.aulaVideoSeek = function(value) {
        const result = aulaVideoSeekBeforeTracking(value);
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave("position_changed");
        return result;
      };
    }

    const aulaVideoToggleBeforeTracking = window.aulaVideoToggle;
    if (typeof aulaVideoToggleBeforeTracking === "function") {
      window.aulaVideoToggle = function() {
        const result = aulaVideoToggleBeforeTracking();
        aulaMaterialTracking.lastInteraction = Date.now();
        aulaMaterialTrackingSave();
        return result;
      };
    }

    document.addEventListener("pointerdown", () => {
      if (aulaMaterialTracking.currentId) aulaMaterialTracking.lastInteraction = Date.now();
    }, { passive: true });

    document.addEventListener("keydown", () => {
      if (aulaMaterialTracking.currentId) aulaMaterialTracking.lastInteraction = Date.now();
    }, { passive: true });

    pageScroll?.addEventListener("scroll", () => {
      if (!aulaMaterialTracking.currentId || !aulaMaterialTrackableView()) return;
      aulaMaterialTracking.lastInteraction = Date.now();
      aulaMaterialTrackingStatus("Salvataggio…");
      if (aulaMaterialTracking.scrollTimer) clearTimeout(aulaMaterialTracking.scrollTimer);
      aulaMaterialTracking.scrollTimer = setTimeout(() => aulaMaterialTrackingSave("position_changed"), 350);
    }, { passive: true });

    window.addEventListener("pagehide", () => aulaMaterialTrackingStop());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && aulaMaterialTracking.currentId) aulaMaterialTrackingSave("material_closed");
    });


'''
    html = replace_once(html, js_anchor, js_block + js_anchor, "JavaScript tracking")

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
        "**Demo 1.3.0-alpha.7 pronta per verifica: importazione simulata, copia interna e comportamento idempotente.**",
        "**Demo 1.3.0-alpha.8 pronta per verifica: tracking, autosalvataggio, tempo attivo e ripresa della posizione.**",
        "stato README",
    )
    readme = replace_once(readme, "- versione: `1.3.0-alpha.7`", f"- versione: `{VERSION}`", "versione README")
    readme = replace_once(readme, "- dimensione: `699358` byte", f"- dimensione: `{size}` byte", "dimensione README")
    readme = replace_once(readme, "- righe: `19340`", f"- righe: `{lines}`", "righe README")
    readme = replace_once(readme, "- SHA-256: `dcd007394aece2c5dde6a134fd7744e5d38ca422d83062ad59664920970cafdb`", f"- SHA-256: `{sha256}`", "sha README")
    readme = replace_once(readme, "- Git blob SHA: `b68bdaa1e5d06e69e1fef7e1c4416156cf9f5af8`", f"- Git blob SHA: `{blob}`", "blob README")
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    changelog_anchor = "## [1.3.0-alpha.7] — 2026-07-23"
    changelog_section = f"""## [{VERSION}] — 2026-07-23

### Materiali: tracking e ripresa

- Salvataggio locale separato per ogni materiale.
- Posizione PDF, slide, video e scroll dei documenti ripristinata dopo l’apertura del viewer.
- Intervalli video realmente visti conservati insieme alla posizione temporale.
- Tempo attivo conteggiato soltanto con scheda visibile e interazione recente, oppure durante la riproduzione video.
- Autosalvataggio ogni cinque secondi attivi e dopo i cambi di posizione.
- Cronologia locale degli eventi aperto, ripreso, chiuso e posizione salvata.
- Banner visibile con stato, ultima posizione e minuti attivi.
- Gli stati `import-required` non vengono conteggiati come consultazione del materiale.

### Identificatori

- Dimensione: `{size}` byte
- Righe: `{lines}`
- SHA-256: `{sha256}`
- Git blob SHA: `{blob}`

---

"""
    changelog = replace_once(changelog, changelog_anchor, changelog_section + changelog_anchor, "changelog alpha.8")
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture += f"""

## Fase 3 · {VERSION}

Il tracking viene applicato solo dopo l’apertura effettiva di un viewer interno o incorporato. La posizione è ripristinata dopo il rendering iniziale, evitando che PDF, presentazioni o video la sovrascrivano. Il tempo attivo richiede visibilità e attività recente, salvo la riproduzione video, e viene conservato localmente insieme agli eventi della sessione.
"""
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    status += f"""

## Materiali: tracking e ripresa

Stato: 🟢 — checkpoint prodotto

Versione: `{VERSION}`

- autosalvataggio per materiale ogni cinque secondi attivi;
- ripresa di pagina PDF, slide, posizione e intervalli video, scroll documento;
- tempo attivo basato su visibilità e interazione;
- cronologia apertura, ripresa, chiusura e posizione;
- nessun tracking durante lo stato import-required;
- checkpoint: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{VERSION}.html`.
"""
    STATUS_PATH.write_text(status, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = replace_once(
        approvals,
        "| Fase 3 | Materiali: import-required | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.7 prodotta e pronta per verifica. |",
        "| Fase 3 | Materiali: import-required | APPROVATO | 2026-07-23 | L’utente ha verificato il funzionamento e autorizzato la prosecuzione. |\n| Fase 3 | Materiali: tracking e ripresa | IN_ATTESA_APPROVAZIONE | 2026-07-23 | Demo HTML 1.3.0-alpha.8 prodotta e pronta per verifica. |",
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
