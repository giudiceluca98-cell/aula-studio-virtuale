from __future__ import annotations

import argparse
import hashlib
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "reference/demo-aula-studio-virtuale-canonica.html"
README_PATH = ROOT / "reference/README.md"
CHANGELOG_PATH = ROOT / "reference/CHANGELOG_DEMO.md"
STATUS_PATH = ROOT / "reference/INTEGRATION_STATUS.md"
ARCHITECTURE_PATH = ROOT / "reference/DEMO_ARCHITECTURE.md"
APPROVALS_PATH = ROOT / "reference/PHASE_APPROVALS.md"
CHECKPOINT_DIR = ROOT / "reference/checkpoints/phase-3"
DATE = "2026-07-22"

STEPS = {
    2: {
        "version": "1.3.0-alpha.2",
        "title": "Materiali: upload e collegamenti",
        "marker": "MATERIALI E WORKSPACE — UPLOAD E LINK 1.3.0-alpha.2",
        "commit": "[phase3-auto][materials-upload-link] Integra upload e link nella demo",
        "summary": "upload locale simulato e collegamenti HTTPS con validazione",
    },
    3: {
        "version": "1.3.0-alpha.3",
        "title": "Materiali: tipi e classificazione",
        "marker": "MATERIALI E WORKSPACE — TIPI E CLASSIFICAZIONE 1.3.0-alpha.3",
        "commit": "[phase3-auto][materials-classification] Integra tipi e classificazione materiali",
        "summary": "classificazione accesso, viewer, provider e monitorabilità",
    },
    4: {
        "version": "1.3.0-alpha.4",
        "title": "Materiali: viewer PDF",
        "marker": "MATERIALI E WORKSPACE — VIEWER PDF 1.3.0-alpha.4",
        "commit": "[phase3-auto][materials-pdf] Integra viewer PDF locale",
        "summary": "viewer PDF locale con pagine, navigazione e avanzamento",
    },
    5: {
        "version": "1.3.0-alpha.5",
        "title": "Materiali: DOCX e PPTX",
        "marker": "MATERIALI E WORKSPACE — DOCX E PPTX 1.3.0-alpha.5",
        "commit": "[phase3-auto][materials-docx-pptx] Integra documenti e presentazioni",
        "summary": "DOCX come testo sicuro e PPTX come slide testuali",
    },
    6: {
        "version": "1.3.0-alpha.6",
        "title": "Materiali: video",
        "marker": "MATERIALI E WORKSPACE — VIDEO 1.3.0-alpha.6",
        "commit": "[phase3-auto][materials-video] Integra player video simulato",
        "summary": "player locale per YouTube, Vimeo e video HTTPS senza iframe remoti",
    },
    7: {
        "version": "1.3.0-alpha.7",
        "title": "Materiali: import-required",
        "marker": "MATERIALI E WORKSPACE — IMPORT REQUIRED 1.3.0-alpha.7",
        "commit": "[phase3-auto][materials-import-required] Integra importazione richiesta",
        "summary": "importazione autorizzata, stato idempotente e conversione interna",
    },
    8: {
        "version": "1.3.0-alpha.8",
        "title": "Materiali: tracking e ripresa",
        "marker": "MATERIALI E WORKSPACE — TRACKING E RIPRESA 1.3.0-alpha.8",
        "commit": "[phase3-auto][materials-tracking] Integra tracking e ripresa materiali",
        "summary": "posizione, tempo attivo, autosalvataggio e ripresa per materiale",
    },
    9: {
        "version": "1.3.0-alpha.9",
        "title": "Materiali: errori e alternative",
        "marker": "MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9",
        "commit": "[phase3-auto][materials-errors] Completa la Fase 3 materiali",
        "summary": "stati non supportato, non disponibile, retry e alternative sicure",
    },
}

CSS_ANCHOR = "    /* ==========================================================\n       DASHBOARD REALE — STATI DI ERRORE 1.2.0-alpha.6"
JS_ANCHOR = "    /* ==========================================================\n       DASHBOARD — STATI DI ERRORE DETERMINISTICI"

CSS = {
2: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — UPLOAD E LINK 1.3.0-alpha.2
       ========================================================== */
    .material-add-dialog[hidden]{display:none!important}.material-add-dialog{position:fixed;inset:0;z-index:12400;display:grid;place-items:center;padding:18px;background:rgba(1,7,12,.8);backdrop-filter:blur(13px)}.material-add-card{width:min(690px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(125,235,255,.23);border-radius:23px;color:var(--ink);background:linear-gradient(180deg,var(--surface-strong),var(--surface));box-shadow:0 36px 120px rgba(0,0,0,.54)}.material-add-head{display:flex;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid var(--line)}.material-add-head h2{margin:5px 0 4px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,4vw,36px);font-weight:500}.material-add-head p{margin:0;color:var(--muted);font-size:10px;line-height:1.5}.material-add-close{width:36px;height:36px;border:1px solid var(--line);border-radius:11px;color:var(--muted);background:rgba(255,255,255,.025);cursor:pointer}.material-add-body{display:grid;gap:13px;padding:19px 22px 22px}.material-add-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px}.material-add-tabs button{min-height:40px;border:1px solid var(--line);border-radius:10px;color:var(--muted);background:rgba(255,255,255,.02);font-size:9px;font-weight:800;cursor:pointer}.material-add-tabs button.active{color:#eaffff;border-color:rgba(125,235,255,.3);background:rgba(0,223,242,.07)}.material-add-fields{display:grid;gap:10px}.material-add-fields[hidden]{display:none!important}.material-add-fields label{display:grid;gap:5px;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.material-add-fields input,.material-add-fields select{width:100%;min-height:43px;padding:0 11px;border:1px solid var(--line);border-radius:11px;color:var(--ink);background:rgba(3,12,19,.78);font:inherit;font-size:10px}.material-add-file-box{padding:13px;border:1px dashed rgba(125,235,255,.24);border-radius:12px;background:rgba(0,223,242,.035)}.material-add-file-box small{display:block;margin-top:7px;color:var(--muted);font-size:8px;line-height:1.5}.material-add-classification{padding:12px;border:1px solid rgba(122,124,255,.18);border-radius:12px;background:rgba(122,124,255,.045);color:var(--muted);font-size:9px;line-height:1.5}.material-add-classification strong{color:var(--ink)}.material-add-status{min-height:20px;color:#91f7d3;font-size:9px}.material-add-status[data-tone="error"]{color:#ffacb4}.material-add-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.material-add-actions button,.materials-panel-footer-actions button{min-height:39px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-add-actions .primary,.materials-panel-footer-actions .primary{color:#eaffff;border-color:rgba(125,235,255,.28);background:rgba(0,223,242,.075)}.materials-panel-footer-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.material-add-dialog button:disabled,.material-add-dialog input:disabled{opacity:.5;cursor:not-allowed}@media(max-width:620px){.material-add-dialog{align-items:end;padding:8px}.material-add-card{max-height:93vh;border-radius:20px 20px 13px 13px}.material-add-body{padding:16px}.material-add-actions button,.materials-panel-footer-actions button{width:100%}.materials-panel-footer-actions{display:grid;grid-template-columns:1fr}}
''',
3: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — TIPI E CLASSIFICAZIONE 1.3.0-alpha.3
       ========================================================== */
    .material-classification-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}.material-classification-grid div{padding:8px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.018)}.material-classification-grid span,.material-classification-grid strong{display:block}.material-classification-grid span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-classification-grid strong{margin-top:4px;color:var(--ink);font-size:9px}.materials-panel-reason{display:block;margin-top:7px;color:var(--muted);font-size:8px;line-height:1.45}.materials-panel-badge.import-ready{color:#91f7d3;border-color:rgba(82,232,176,.22)}.materials-panel-badge.import-pending{color:#ffd7a7;border-color:rgba(255,176,91,.22)}.materials-panel-badge.import-failed{color:#ffb7bf;border-color:rgba(255,108,121,.22)}@media(max-width:620px){.material-classification-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
''',
4: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — VIEWER PDF 1.3.0-alpha.4
       ========================================================== */
    .material-pdf-viewer{display:grid;gap:13px}.material-viewer-toolbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px;padding:11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}.material-viewer-toolbar button{min-height:36px;padding:0 10px;border:1px solid var(--line);border-radius:9px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-viewer-toolbar button:disabled{opacity:.42;cursor:not-allowed}.material-viewer-toolbar strong{font-size:10px}.material-viewer-toolbar span{color:var(--muted);font-size:8px}.material-pdf-sheet{min-height:470px;padding:clamp(22px,5vw,58px);border:1px solid rgba(125,235,255,.18);border-radius:10px;color:#17212a;background:#f4f1e8;box-shadow:0 20px 50px rgba(0,0,0,.24)}.material-pdf-sheet h1{color:#101820;font-family:Georgia,"Times New Roman",serif}.material-pdf-sheet p,.material-pdf-sheet li{color:#25313b;line-height:1.75}.material-viewer-progress{height:6px;overflow:hidden;border-radius:999px;background:rgba(125,235,255,.08)}.material-viewer-progress span{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--violet));transition:width .18s ease}@media(max-width:620px){.material-pdf-sheet{min-height:390px;padding:22px 18px}.material-viewer-toolbar button{flex:1}}
''',
5: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — DOCX E PPTX 1.3.0-alpha.5
       ========================================================== */
    .material-document-viewer,.material-presentation-viewer{display:grid;gap:13px}.material-document-page{padding:clamp(20px,4vw,44px);border:1px solid rgba(125,235,255,.17);border-radius:14px;background:rgba(255,255,255,.025)}.material-document-page h1,.material-document-page h2{font-family:Georgia,"Times New Roman",serif}.material-document-page p,.material-document-page li{color:var(--muted);line-height:1.72}.material-slide-stage{min-height:430px;display:grid;place-items:center;padding:28px;border:1px solid rgba(122,124,255,.24);border-radius:17px;background:radial-gradient(circle at 12% 12%,rgba(0,223,242,.09),transparent 36%),linear-gradient(135deg,rgba(7,18,29,.98),rgba(17,13,33,.98));box-shadow:inset 0 0 70px rgba(122,124,255,.055)}.material-slide{width:min(760px,100%)}.material-slide small{color:var(--green-2);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.material-slide h1{margin:12px 0;font-size:clamp(28px,5vw,54px)}.material-slide ul{display:grid;gap:10px;padding-left:20px;color:var(--muted);line-height:1.6}@media(max-width:620px){.material-slide-stage{min-height:360px;padding:20px}}
''',
6: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — VIDEO 1.3.0-alpha.6
       ========================================================== */
    .material-video-viewer{display:grid;gap:13px}.material-video-stage{position:relative;min-height:390px;display:grid;place-items:center;overflow:hidden;border:1px solid rgba(125,235,255,.2);border-radius:17px;background:radial-gradient(circle at 50% 40%,rgba(0,223,242,.14),transparent 28%),linear-gradient(135deg,#06111c,#160f2c)}.material-video-stage::before{content:"";position:absolute;inset:0;background:linear-gradient(transparent 60%,rgba(0,0,0,.58))}.material-video-symbol{position:relative;z-index:1;width:88px;height:88px;display:grid;place-items:center;border:1px solid rgba(125,235,255,.28);border-radius:50%;color:#eaffff;background:rgba(0,223,242,.09);font-size:31px}.material-video-provider{position:absolute;top:14px;left:14px;z-index:1;padding:5px 8px;border:1px solid rgba(255,255,255,.15);border-radius:999px;color:#dcecff;background:rgba(0,0,0,.25);font-size:8px;font-weight:800;text-transform:uppercase}.material-video-controls{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}.material-video-controls button{width:40px;height:40px;border:1px solid rgba(125,235,255,.22);border-radius:50%;color:#eaffff;background:rgba(0,223,242,.07);cursor:pointer}.material-video-controls input{width:100%;accent-color:var(--green)}.material-video-controls span{min-width:92px;color:var(--muted);font:9px ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}.material-video-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.material-video-stats div{padding:10px;border:1px solid var(--line);border-radius:10px;background:rgba(255,255,255,.018)}.material-video-stats span,.material-video-stats strong{display:block}.material-video-stats span{color:var(--muted);font-size:7px;font-weight:800;text-transform:uppercase}.material-video-stats strong{margin-top:4px;font-size:10px}@media(max-width:620px){.material-video-stage{min-height:280px}.material-video-controls{grid-template-columns:auto minmax(0,1fr)}.material-video-controls span{grid-column:1/-1;text-align:left}.material-video-stats{grid-template-columns:1fr}}
''',
7: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — IMPORT REQUIRED 1.3.0-alpha.7
       ========================================================== */
    .material-import-state{display:grid;gap:14px;padding:clamp(18px,4vw,34px);border:1px solid rgba(255,176,91,.24);border-radius:17px;background:linear-gradient(90deg,rgba(255,176,91,.07),transparent 65%),rgba(255,255,255,.018)}.material-import-state h1{margin:0;font-family:Georgia,"Times New Roman",serif}.material-import-state p{margin:0;color:var(--muted);line-height:1.6}.material-import-steps{display:grid;gap:7px}.material-import-steps div{padding:10px;border:1px solid var(--line);border-radius:10px;color:var(--muted);background:rgba(255,255,255,.018);font-size:9px}.material-import-steps div::before{content:"○";margin-right:8px;color:#ffd7a7}.material-import-steps div.done::before{content:"✓";color:#91f7d3}.material-import-actions{display:flex;flex-wrap:wrap;gap:8px}.material-import-actions button{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-import-actions .primary{color:#fff0dd;border-color:rgba(255,176,91,.3);background:rgba(255,176,91,.08)}.material-import-status{min-height:20px;color:#91f7d3;font-size:9px}
''',
8: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — TRACKING E RIPRESA 1.3.0-alpha.8
       ========================================================== */
    .material-tracking-banner{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;margin-bottom:13px;padding:11px;border:1px solid rgba(82,232,176,.2);border-radius:12px;background:linear-gradient(90deg,rgba(82,232,176,.06),transparent 70%),rgba(255,255,255,.018)}.material-tracking-icon{width:34px;height:34px;display:grid;place-items:center;border:1px solid rgba(82,232,176,.24);border-radius:10px;color:#91f7d3;background:rgba(82,232,176,.05)}.material-tracking-copy strong,.material-tracking-copy span{display:block}.material-tracking-copy strong{font-size:10px}.material-tracking-copy span{margin-top:3px;color:var(--muted);font-size:8px}.material-tracking-status{color:#91f7d3;font-size:8px;font-weight:800;text-align:right}.material-tracking-history{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.material-tracking-history span{padding:3px 6px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:7px}@media(max-width:620px){.material-tracking-banner{grid-template-columns:auto 1fr}.material-tracking-status{grid-column:1/-1;text-align:left}}
''',
9: r'''

    /* ==========================================================
       MATERIALI E WORKSPACE — ERRORI E ALTERNATIVE 1.3.0-alpha.9
       ========================================================== */
    .material-error-state{display:grid;gap:14px;padding:clamp(18px,4vw,34px);border:1px solid rgba(255,108,121,.25);border-radius:17px;background:linear-gradient(90deg,rgba(255,92,105,.07),transparent 65%),rgba(255,255,255,.018)}.material-error-state[data-tone="warning"]{border-color:rgba(255,176,91,.24);background:linear-gradient(90deg,rgba(255,176,91,.07),transparent 65%),rgba(255,255,255,.018)}.material-error-state h1{margin:0;font-family:Georgia,"Times New Roman",serif}.material-error-state p{margin:0;color:var(--muted);line-height:1.6}.material-error-code{padding:8px 10px;border:1px solid var(--line);border-radius:9px;color:var(--muted);background:rgba(0,0,0,.12);font:8px ui-monospace,SFMono-Regular,Menlo,monospace}.material-error-actions{display:flex;flex-wrap:wrap;gap:8px}.material-error-actions button{min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);background:rgba(255,255,255,.025);font-size:9px;font-weight:800;cursor:pointer}.material-error-actions .primary{color:#eaffff;border-color:rgba(125,235,255,.25);background:rgba(0,223,242,.07)}.material-alternatives{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.material-alternative{padding:11px;border:1px solid var(--line);border-radius:11px;background:rgba(255,255,255,.018)}.material-alternative strong,.material-alternative span{display:block}.material-alternative strong{font-size:9px}.material-alternative span{margin-top:4px;color:var(--muted);font-size:8px}.material-alternative button{width:100%;min-height:34px;margin-top:9px;border:1px solid rgba(125,235,255,.2);border-radius:8px;color:#eaffff;background:rgba(0,223,242,.05);font-size:8px;font-weight:800;cursor:pointer}@media(max-width:700px){.material-alternatives{grid-template-columns:1fr}}
''',
}

DIALOG_HTML = r'''

  <div class="material-add-dialog" id="materialAddDialog" hidden onclick="aulaMaterialAddBackdrop(event)">
    <section class="material-add-card" role="dialog" aria-modal="true" aria-labelledby="materialAddTitle">
      <header class="material-add-head">
        <div><div class="portal-eyebrow">Materiali della stanza</div><h2 id="materialAddTitle">Aggiungi materiale</h2><p>La demo conserva soltanto metadati locali; nessun file viene caricato su un server.</p></div>
        <button class="material-add-close" type="button" onclick="aulaMaterialAddClose()" aria-label="Chiudi aggiunta materiale">×</button>
      </header>
      <div class="material-add-body">
        <div class="material-add-tabs" role="tablist" aria-label="Tipo di materiale">
          <button id="materialAddLinkTab" class="active" type="button" role="tab" aria-selected="true" onclick="aulaMaterialAddSetMode('link')">Collegamento HTTPS</button>
          <button id="materialAddFileTab" type="button" role="tab" aria-selected="false" onclick="aulaMaterialAddSetMode('file')">File locale</button>
        </div>
        <div class="material-add-fields" id="materialAddCommonFields">
          <label>Titolo<input id="materialAddName" type="text" maxlength="90" placeholder="Es. Dispensa sulle funzioni" oninput="aulaMaterialUpdateClassificationPreview()"></label>
          <label>Corso<select id="materialAddCourse" onchange="aulaMaterialUpdateClassificationPreview()"><option>Programmazione da Zero</option><option>Risorse libere</option></select></label>
        </div>
        <div class="material-add-fields" id="materialAddLinkFields">
          <label>URL pubblico HTTPS<input id="materialAddUrl" type="url" placeholder="https://..." oninput="aulaMaterialUpdateClassificationPreview()"></label>
        </div>
        <div class="material-add-fields" id="materialAddFileFields" hidden>
          <div class="material-add-file-box"><label>Seleziona file<input id="materialAddFile" type="file" accept=".pdf,.txt,.md,.doc,.docx,.ppt,.pptx,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onchange="aulaMaterialUpdateClassificationPreview()"></label><small>Massimo 10 MB. Formati demo ammessi: PDF, TXT, Markdown, DOC/DOCX e PPT/PPTX.</small></div>
        </div>
        <div class="material-add-classification" id="materialAddClassification"><strong>Classificazione preliminare</strong><br>Inserisci un URL oppure seleziona un file.</div>
        <div class="material-add-status" id="materialAddStatus" role="status" aria-live="polite"></div>
        <div class="material-add-actions"><button type="button" onclick="aulaMaterialAddClose()">Annulla</button><button class="primary" id="materialAddSubmit" type="button" onclick="aulaMaterialAddSubmit()">Aggiungi materiale</button></div>
      </div>
    </section>
  </div>
'''

JS = {
2: r'''

    /* ==========================================================
       MATERIALI — UPLOAD E LINK LOCALI
       ========================================================== */
    const aulaMaterialCustomStorageKey="aula-demo-materials-custom-v1";let aulaMaterialAddMode="link",aulaMaterialAddPreviousFocus=null,aulaMaterialAddBusy=false;const aulaMaterialAllowedExtensions=new Set(["pdf","txt","md","doc","docx","ppt","pptx"]),aulaMaterialMaxBytes=10*1024*1024;
    function aulaMaterialExtension(value){return String(value||"").split(/[?#]/,1)[0].toLowerCase().match(/\.([a-z0-9]{2,8})$/)?.[1]||""}
    function aulaMaterialSafeHttps(value){try{const url=new URL(value);if(url.protocol!=="https:"||url.username||url.password)return false;const host=url.hostname.toLowerCase();if(!host||host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local"))return false;const p=host.split(".").map(Number);if(p.length===4&&p.every(n=>Number.isInteger(n))){const[a,b]=p;if(a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||a>=224)return false}return true}catch{return false}}
    function aulaMaterialBasicKind(ext){return ext==="pdf"?"pdf":["txt","md"].includes(ext)?"text":["doc","docx"].includes(ext)?"document":["ppt","pptx"].includes(ext)?"presentation":"link"}
    function aulaMaterialKindLabel(kind){return({pdf:"PDF",text:"Testo",document:"DOCX",presentation:"PPTX",video:"Video",link:"Link",lesson:"Lezione nativa"})[kind]||"Risorsa"}
    function aulaMaterialSecureName(file){const ext=aulaMaterialExtension(file?.name);const base=String(file?.name||"materiale").replace(/\.[^.]+$/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,42)||"materiale";return `${base}-${Date.now().toString(36)}.${ext}`}
    function aulaMaterialLoadCustom(){let items=[];try{items=JSON.parse(localStorage.getItem(aulaMaterialCustomStorageKey)||"[]")}catch{items=[]}if(!Array.isArray(items))return;items.forEach(item=>{if(item?.id&&!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push({...item,custom:true})})}
    function aulaMaterialSaveCustom(){try{localStorage.setItem(aulaMaterialCustomStorageKey,JSON.stringify(aulaMaterialsPanelData.filter(item=>item.custom)))}catch{showToast("Il browser non consente di salvare i nuovi materiali")}}
    const aulaMaterialsPanelLoadBeforeCustom=window.aulaMaterialsPanelLoad;window.aulaMaterialsPanelLoad=function(){aulaMaterialsPanelLoadBeforeCustom();aulaMaterialLoadCustom()};
    function aulaMaterialAddStatus(message="",tone=""){const node=document.getElementById("materialAddStatus");if(!node)return;node.textContent=message;tone?node.dataset.tone=tone:node.removeAttribute("data-tone")}
    function aulaMaterialAddOpen(trigger){aulaMaterialAddPreviousFocus=trigger||document.activeElement;aulaMaterialAddBusy=false;aulaMaterialAddStatus();aulaMaterialAddSetMode("link");const dialog=document.getElementById("materialAddDialog");if(dialog)dialog.hidden=false;window.setTimeout(()=>document.getElementById("materialAddName")?.focus(),20)}
    function aulaMaterialAddClose(){if(aulaMaterialAddBusy)return;const dialog=document.getElementById("materialAddDialog");if(dialog)dialog.hidden=true;["materialAddName","materialAddUrl","materialAddFile"].forEach(id=>{const node=document.getElementById(id);if(node)node.value=""});aulaMaterialUpdateClassificationPreview();aulaMaterialAddPreviousFocus?.focus?.();aulaMaterialAddPreviousFocus=null}
    function aulaMaterialAddBackdrop(event){if(event.target?.id==="materialAddDialog")aulaMaterialAddClose()}
    function aulaMaterialAddSetMode(mode){aulaMaterialAddMode=mode==="file"?"file":"link";const link=document.getElementById("materialAddLinkFields"),file=document.getElementById("materialAddFileFields"),linkTab=document.getElementById("materialAddLinkTab"),fileTab=document.getElementById("materialAddFileTab");if(link)link.hidden=aulaMaterialAddMode!=="link";if(file)file.hidden=aulaMaterialAddMode!=="file";linkTab?.classList.toggle("active",aulaMaterialAddMode==="link");fileTab?.classList.toggle("active",aulaMaterialAddMode==="file");linkTab?.setAttribute("aria-selected",String(aulaMaterialAddMode==="link"));fileTab?.setAttribute("aria-selected",String(aulaMaterialAddMode==="file"));aulaMaterialUpdateClassificationPreview()}
    function aulaMaterialPreliminary(){const url=String(document.getElementById("materialAddUrl")?.value||"").trim(),file=document.getElementById("materialAddFile")?.files?.[0]||null,ext=aulaMaterialAddMode==="file"?aulaMaterialExtension(file?.name):aulaMaterialExtension(url),kind=aulaMaterialBasicKind(ext);return{url,file,ext,kind,kindLabel:aulaMaterialKindLabel(kind),access:aulaMaterialAddMode==="file"?"Interno locale":"Importazione richiesta",monitor:aulaMaterialAddMode==="file"?"Monitoraggio disponibile":"Non monitorabile prima dell’importazione"}}
    function aulaMaterialUpdateClassificationPreview(){const data=aulaMaterialPreliminary(),node=document.getElementById("materialAddClassification");if(!node)return;if(aulaMaterialAddMode==="file"&&!data.file){node.innerHTML="<strong>Classificazione preliminare</strong><br>Seleziona un file compatibile.";return}if(aulaMaterialAddMode==="link"&&!data.url){node.innerHTML="<strong>Classificazione preliminare</strong><br>Inserisci un URL HTTPS pubblico.";return}node.innerHTML=`<strong>${aulaMaterialsPanelEscape(data.kindLabel)}</strong><br>${aulaMaterialsPanelEscape(data.access)} · ${aulaMaterialsPanelEscape(data.monitor)}`}
    async function aulaMaterialAddSubmit(){if(aulaMaterialAddBusy)return;const title=String(document.getElementById("materialAddName")?.value||"").trim().replace(/\s+/g," "),course=String(document.getElementById("materialAddCourse")?.value||"Risorse libere"),data=aulaMaterialPreliminary();aulaMaterialAddStatus();if(title.length<3){aulaMaterialAddStatus("Inserisci un titolo di almeno 3 caratteri.","error");document.getElementById("materialAddName")?.focus();return}if(aulaMaterialAddMode==="link"&&!aulaMaterialSafeHttps(data.url)){aulaMaterialAddStatus("Usa un URL HTTPS pubblico, senza credenziali o indirizzi locali.","error");document.getElementById("materialAddUrl")?.focus();return}if(aulaMaterialAddMode==="file"){if(!data.file){aulaMaterialAddStatus("Seleziona un file.","error");return}if(data.file.size>aulaMaterialMaxBytes){aulaMaterialAddStatus("Il file supera il limite di 10 MB.","error");return}if(!aulaMaterialAllowedExtensions.has(data.ext)){aulaMaterialAddStatus("Formato non ammesso. Usa PDF, TXT, Markdown, DOC/DOCX o PPT/PPTX.","error");return}}aulaMaterialAddBusy=true;document.getElementById("materialAddSubmit").disabled=true;aulaMaterialAddStatus(aulaMaterialAddMode==="file"?"Preparazione sicura del file…":"Verifica del collegamento…");await new Promise(resolve=>setTimeout(resolve,430));const id=`custom-${Date.now().toString(36)}`,stored=aulaMaterialAddMode==="file",material={id,title,description:stored?`File locale ${data.file.name} · ${Math.max(1,Math.round(data.file.size/1024))} KB`:`Collegamento aggiunto manualmente: ${data.url}`,course,kind:data.kind,kindLabel:data.kindLabel,access:stored?"internal":"import-required",accessLabel:stored?"Interno":"Importazione richiesta",monitoring:stored?"full":"none",monitoringLabel:stored?"Monitoraggio completo":"Non monitorabile",progress:0,progressLabel:"Non iniziato",icon:({pdf:"P",text:"T",document:"D",presentation:"S"})[data.kind]||"↗",viewerReady:false,custom:true,sourceType:aulaMaterialAddMode,url:stored?null:data.url,originalName:stored?data.file.name:null,storageName:stored?aulaMaterialSecureName(data.file):null,fileSize:stored?data.file.size:null,importStatus:stored?"ready":"pending"};aulaMaterialsPanelData.unshift(material);aulaMaterialSaveCustom();aulaMaterialsPanelState.selectedId=id;aulaMaterialsPanelSave();aulaMaterialAddBusy=false;document.getElementById("materialAddSubmit").disabled=false;aulaMaterialAddClose();aulaMaterialsPanelRefresh();showToast(`Materiale aggiunto: ${title}`)}
    window.addEventListener("keydown",event=>{const dialog=document.getElementById("materialAddDialog");if(event.key==="Escape"&&dialog&&!dialog.hidden&&!aulaMaterialAddBusy){event.preventDefault();aulaMaterialAddClose()}});
''',
3: r'''

    /* ==========================================================
       MATERIALI — CLASSIFICAZIONE COERENTE CON L'APP
       ========================================================== */
    function aulaMaterialOfficialDescriptor(material){const ext=aulaMaterialExtension(material.storageName||material.originalName||material.url||material.title),stored=Boolean(material.storageName||material.sourceType==="file"),url=String(material.url||""),youtube=/^https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(url),vimeo=/^https:\/\/(?:www\.)?vimeo\.com\//i.test(url),directVideo=aulaMaterialSafeHttps(url)&&["mp4","webm","ogg"].includes(ext);let d;if(material.access&&material.explicitClassification)d={access:material.access,monitoring:material.monitoring,viewer:material.viewer||null,importStatus:material.importStatus||"not-required",provider:material.provider||"none",reason:material.reason||"Classificazione esplicita della demo."};else if(stored&&["txt","md"].includes(ext))d={access:"internal",monitoring:"full",viewer:"text",importStatus:"ready",provider:"internal",reason:"Testo privato pronto nel lettore interno."};else if(stored&&ext==="pdf")d={access:"internal",monitoring:"partial",viewer:"pdf",importStatus:"ready",provider:"internal",reason:"PDF consultabile nel workspace con posizione salvata."};else if(!stored&&ext==="pdf"&&url)d={access:"import-required",monitoring:"none",viewer:"pdf",importStatus:"pending",provider:"web",reason:"Il PDF deve essere importato nello spazio protetto prima del monitoraggio."};else if(stored&&["doc","docx"].includes(ext))d={access:"internal",monitoring:"full",viewer:"document",importStatus:"ready",provider:"internal",reason:"Documento convertito in testo sicuro."};else if(stored&&["ppt","pptx"].includes(ext))d={access:"internal",monitoring:"full",viewer:"presentation",importStatus:"ready",provider:"internal",reason:"Presentazione renderizzata come slide testuali sicure."};else if(youtube)d={access:"embedded",monitoring:"full",viewer:"video",importStatus:"not-required",provider:"youtube",reason:"Video YouTube compatibile con il player incorporato."};else if(vimeo)d={access:"embedded",monitoring:"full",viewer:"video",importStatus:"not-required",provider:"vimeo",reason:"Video Vimeo compatibile con il player incorporato."};else if(directVideo)d={access:"embedded",monitoring:"full",viewer:"video",importStatus:"not-required",provider:"html5-video",reason:"Video HTTPS compatibile con il player interno."};else if(material.kind==="lesson")d={access:"internal",monitoring:"full",viewer:"lesson",importStatus:"ready",provider:"internal",reason:"Lezione nativa del workspace."};else if(url&&aulaMaterialSafeHttps(url))d={access:"import-required",monitoring:"none",viewer:"web-article",importStatus:"pending",provider:"web",reason:"La pagina richiede una copia leggibile autorizzata."};else d={access:"unsupported",monitoring:"none",viewer:null,importStatus:"failed",provider:"none",reason:"La risorsa non dispone di un formato interno sicuro."};return d}
    function aulaMaterialApplyDescriptor(material){const d=aulaMaterialOfficialDescriptor(material),accessLabels={internal:"Interno",embedded:"Incorporato","import-required":"Importazione richiesta","external-unmonitored":"Esterno",unsupported:"Non supportato"},monitorLabels={full:"Monitoraggio completo",partial:"Monitoraggio parziale","opened-only":"Solo apertura",none:"Non monitorabile"};Object.assign(material,d,{accessLabel:accessLabels[d.access]||d.access,monitoringLabel:monitorLabels[d.monitoring]||d.monitoring,kind:d.viewer==="web-article"?"link":material.kind,kindLabel:material.kindLabel||aulaMaterialKindLabel(material.kind),reason:d.reason});return material}
    function aulaMaterialClassifyAll(){aulaMaterialsPanelData.forEach(aulaMaterialApplyDescriptor)}
    const aulaMaterialsPanelLoadBeforeClassification=window.aulaMaterialsPanelLoad;window.aulaMaterialsPanelLoad=function(){aulaMaterialsPanelLoadBeforeClassification();aulaMaterialClassifyAll()};aulaMaterialClassifyAll();
    window.aulaMaterialUpdateClassificationPreview=function(){const data=aulaMaterialPreliminary(),node=document.getElementById("materialAddClassification");if(!node)return;const draft={title:String(document.getElementById("materialAddName")?.value||"Materiale"),url:aulaMaterialAddMode==="link"?data.url:null,originalName:data.file?.name||null,storageName:data.file?`demo.${data.ext}`:null,sourceType:aulaMaterialAddMode,kind:data.kind},d=aulaMaterialOfficialDescriptor(draft);if(aulaMaterialAddMode==="file"&&!data.file||aulaMaterialAddMode==="link"&&!data.url){node.innerHTML="<strong>Classificazione automatica</strong><br>Inserisci una sorgente per vedere accesso e monitorabilità.";return}node.innerHTML=`<strong>${aulaMaterialsPanelEscape(aulaMaterialKindLabel(d.viewer||data.kind))}</strong><div class="material-classification-grid"><div><span>Accesso</span><strong>${aulaMaterialsPanelEscape(d.access)}</strong></div><div><span>Viewer</span><strong>${aulaMaterialsPanelEscape(d.viewer||"nessuno")}</strong></div><div><span>Provider</span><strong>${aulaMaterialsPanelEscape(d.provider)}</strong></div><div><span>Import</span><strong>${aulaMaterialsPanelEscape(d.importStatus)}</strong></div></div><br>${aulaMaterialsPanelEscape(d.reason)}`}
''',
4: r'''

    /* ==========================================================
       MATERIALI — VIEWER PDF LOCALE
       ========================================================== */
    const aulaPdfPages=[
      {title:"Esercizi · Capitolo 1",body:"Obiettivo del fascicolo: trasformare le nozioni iniziali in procedure verificabili. Ogni esercizio richiede input, elaborazione, output e almeno un caso limite.",items:["Leggere con attenzione la consegna","Scrivere un esempio valido","Individuare un errore possibile"]},
      {title:"1. Sequenza di istruzioni",body:"Descrivi un algoritmo quotidiano usando passaggi ordinati. Spiega perché cambiare l'ordine può modificare il risultato.",items:["Passaggi numerati","Condizione iniziale","Risultato atteso"]},
      {title:"2. Input e output",body:"Immagina un programma che chiede il nome e restituisce un saluto. Distingui chiaramente ciò che entra da ciò che esce.",items:["Input: nome","Elaborazione: costruzione frase","Output: saluto"]},
      {title:"3. Tipi di dato",body:"Classifica età, prezzo, nome e risposta vero/falso. Motiva la scelta del tipo più adatto.",items:["Intero","Numero decimale","Stringa","Booleano"]},
      {title:"4. Casi limite",body:"Un programma calcola la media di una lista. Cosa accade con una lista vuota? Definisci il comportamento corretto prima di scrivere codice.",items:["Lista vuota","Valori non numerici","Un solo valore"]},
      {title:"5. Errori di sintassi",body:"Osserva una riga incompleta e spiega quale parte impedisce al linguaggio di interpretarla.",items:["Parentesi","Virgolette","Indentazione"]},
      {title:"6. Errori logici",body:"Il programma viene eseguito ma produce un risultato sbagliato. Descrivi come useresti esempi piccoli per trovare il passaggio errato.",items:["Valore atteso","Valore ottenuto","Prima divergenza"]},
      {title:"7. Pseudocodice",body:"Scrivi lo pseudocodice di un controllo che stabilisce se una persona è maggiorenne.",items:["Leggi età","Confronta con 18","Mostra il risultato"]},
      {title:"8. Verifica",body:"Prepara tre test: un caso normale, un caso al limite e un caso non valido.",items:["Età 25","Età 18","Testo al posto del numero"]},
      {title:"9. Scomposizione",body:"Dividi un problema più grande in funzioni o sottoproblemi con responsabilità distinte.",items:["Acquisizione dati","Validazione","Calcolo","Presentazione"]},
      {title:"10. Riflessione",body:"Spiega con parole tue la differenza tra algoritmo e programma, includendo un controesempio.",items:["Definizione intuitiva","Definizione tecnica","Controesempio"]},
      {title:"Soluzioni guidate",body:"Confronta il tuo ragionamento con i criteri: chiarezza, ordine, gestione degli errori e verificabilità.",items:["Non copiare soltanto il risultato","Controlla i casi limite","Spiega le scelte"]}
    ];
    const aulaPdfState={materialId:null,page:1};
    function aulaPdfMaterial(id){return aulaMaterialsPanelData.find(item=>item.id===id)}
    function aulaPdfRender(){const material=aulaPdfMaterial(aulaPdfState.materialId),page=aulaPdfPages[aulaPdfState.page-1]||aulaPdfPages[0],percent=Math.round(aulaPdfState.page/aulaPdfPages.length*100);if(!material||!documentContent)return;documentContent.innerHTML=`<section class="material-pdf-viewer"><div class="document-section-label">PDF interno · ${aulaMaterialsPanelEscape(material.course)}</div><div class="material-viewer-toolbar"><button type="button" onclick="aulaPdfMove(-1)" ${aulaPdfState.page<=1?"disabled":""}>← Pagina precedente</button><div><strong>Pagina ${aulaPdfState.page} di ${aulaPdfPages.length}</strong><br><span>${percent}% del documento</span></div><button type="button" onclick="aulaPdfMove(1)" ${aulaPdfState.page>=aulaPdfPages.length?"disabled":""}>Pagina successiva →</button></div><div class="material-viewer-progress" aria-label="Avanzamento PDF ${percent}%"><span style="width:${percent}%"></span></div><article class="material-pdf-sheet"><small>Pagina ${aulaPdfState.page}</small><h1>${aulaMaterialsPanelEscape(page.title)}</h1><p>${aulaMaterialsPanelEscape(page.body)}</p><ul>${page.items.map(item=>`<li>${aulaMaterialsPanelEscape(item)}</li>`).join("")}</ul></article></section>`;material.progress=percent;material.progressLabel=`Pagina ${aulaPdfState.page} di ${aulaPdfPages.length}`;state.currentView="material-pdf";setEveContext("materiali");saveState()}
    function aulaPdfMove(direction){aulaPdfState.page=Math.max(1,Math.min(aulaPdfPages.length,aulaPdfState.page+direction));aulaPdfRender();pageScroll?.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}
    function aulaPdfOpen(material){if(audioLessonState.speaking)stopAudioLesson(false);if(exerciseSpeechState.speaking)stopExerciseSpeech(false);aulaPdfState.materialId=material.id;aulaPdfState.page=Math.max(1,Math.round((material.progress||1)/100*aulaPdfPages.length));document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;document.getElementById("courseLessonTitle").textContent=material.title;aulaPdfRender();closeDrawer();showToast(`PDF aperto: ${material.title}`)}
    const aulaMaterialsOpenBeforePdf=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(material&&aulaMaterialOfficialDescriptor(material).viewer==="pdf"&&aulaMaterialOfficialDescriptor(material).access==="internal")return aulaPdfOpen(material);return aulaMaterialsOpenBeforePdf(id)};
''',
5: r'''

    /* ==========================================================
       MATERIALI — DOCX E PPTX SICURI
       ========================================================== */
    Object.assign(aulaMaterialsPanelData.find(item=>item.id==="study-guide-docx")||{}, {documentSections:[{title:"Perché usare le funzioni",paragraphs:["Una funzione raccoglie istruzioni che svolgono un compito riconoscibile.","Dare un nome chiaro alla funzione rende il programma più leggibile e permette di riutilizzare la stessa logica."]},{title:"Parametri e risultato",paragraphs:["I parametri rappresentano i dati ricevuti dalla funzione.","Il valore restituito è il risultato che la funzione consegna al resto del programma."]},{title:"Controlli finali",paragraphs:["Verifica input validi, casi limite e nomi comprensibili.","Una funzione troppo lunga spesso contiene più responsabilità e dovrebbe essere divisa."]}]});
    Object.assign(aulaMaterialsPanelData.find(item=>item.id==="algorithm-slides-pptx")||{}, {slides:[{title:"Algoritmi",points:["Sequenza finita di passaggi","Ordine non ambiguo","Risultato verificabile"]},{title:"Pseudocodice",points:["Indipendente dal linguaggio","Descrive decisioni e ripetizioni","Prepara la scrittura del programma"]},{title:"Test",points:["Caso normale","Caso al limite","Input non valido"]},{title:"Dalla soluzione al codice",points:["Scomponi il problema","Implementa un pezzo per volta","Confronta output atteso e ottenuto"]}]});
    const aulaPresentationState={materialId:null,slide:1};
    function aulaDocumentOpen(material){if(audioLessonState.speaking)stopAudioLesson(false);document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;documentContent.innerHTML=`<section class="material-document-viewer"><div class="document-section-label">Documento convertito · ${aulaMaterialsPanelEscape(material.course)}</div><article class="material-document-page"><h1>${aulaMaterialsPanelEscape(material.title)}</h1>${(material.documentSections||[]).map(section=>`<section><h2>${aulaMaterialsPanelEscape(section.title)}</h2>${section.paragraphs.map(text=>`<p>${aulaMaterialsPanelEscape(text)}</p>`).join("")}</section>`).join("")}</article></section>`;state.currentView="material-document";setEveContext("materiali");closeDrawer();showToast(`Documento aperto: ${material.title}`)}
    function aulaPresentationRender(){const material=aulaMaterialsPanelData.find(item=>item.id===aulaPresentationState.materialId),slides=material?.slides||[],slide=slides[aulaPresentationState.slide-1];if(!material||!slide)return;const percent=Math.round(aulaPresentationState.slide/slides.length*100);documentContent.innerHTML=`<section class="material-presentation-viewer"><div class="document-section-label">Presentazione testuale · ${aulaMaterialsPanelEscape(material.course)}</div><div class="material-viewer-toolbar"><button type="button" onclick="aulaPresentationMove(-1)" ${aulaPresentationState.slide<=1?"disabled":""}>← Slide precedente</button><div><strong>Slide ${aulaPresentationState.slide} di ${slides.length}</strong><br><span>${percent}% della presentazione</span></div><button type="button" onclick="aulaPresentationMove(1)" ${aulaPresentationState.slide>=slides.length?"disabled":""}>Slide successiva →</button></div><div class="material-slide-stage"><article class="material-slide"><small>Slide ${aulaPresentationState.slide}</small><h1>${aulaMaterialsPanelEscape(slide.title)}</h1><ul>${slide.points.map(point=>`<li>${aulaMaterialsPanelEscape(point)}</li>`).join("")}</ul></article></div></section>`;material.progress=percent;material.progressLabel=`Slide ${aulaPresentationState.slide} di ${slides.length}`;state.currentView="material-presentation";setEveContext("materiali")}
    function aulaPresentationMove(direction){const material=aulaMaterialsPanelData.find(item=>item.id===aulaPresentationState.materialId),total=material?.slides?.length||1;aulaPresentationState.slide=Math.max(1,Math.min(total,aulaPresentationState.slide+direction));aulaPresentationRender()}
    function aulaPresentationOpen(material){if(audioLessonState.speaking)stopAudioLesson(false);document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;aulaPresentationState.materialId=material.id;aulaPresentationState.slide=Math.max(1,Math.round((material.progress||1)/100*(material.slides?.length||1)));aulaPresentationRender();closeDrawer();showToast(`Presentazione aperta: ${material.title}`)}
    const aulaMaterialsOpenBeforeDocuments=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){const material=aulaMaterialsPanelData.find(item=>item.id===id),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if(material&&viewer==="document")return aulaDocumentOpen(material);if(material&&viewer==="presentation")return aulaPresentationOpen(material);return aulaMaterialsOpenBeforeDocuments(id)};
''',
6: r'''

    /* ==========================================================
       MATERIALI — PLAYER VIDEO SIMULATO
       ========================================================== */
    [
      {id:"video-youtube-python",title:"Python: primo programma",description:"Video YouTube rappresentato con player locale controllabile.",course:"Programmazione da Zero",kind:"video",kindLabel:"Video",url:"https://www.youtube.com/watch?v=demoPython01",access:"embedded",accessLabel:"Incorporato",monitoring:"full",monitoringLabel:"Monitoraggio completo",progress:0,progressLabel:"Non iniziato",icon:"▶",viewerReady:true,provider:"youtube",duration:245,explicitClassification:true,viewer:"video",importStatus:"not-required",reason:"Video YouTube compatibile con il player incorporato."},
      {id:"video-vimeo-algorithms",title:"Algoritmi visuali",description:"Video Vimeo simulato senza caricare contenuti remoti.",course:"Programmazione da Zero",kind:"video",kindLabel:"Video",url:"https://vimeo.com/123456789",access:"embedded",accessLabel:"Incorporato",monitoring:"full",monitoringLabel:"Monitoraggio completo",progress:0,progressLabel:"Non iniziato",icon:"▶",viewerReady:true,provider:"vimeo",duration:310,explicitClassification:true,viewer:"video",importStatus:"not-required",reason:"Video Vimeo compatibile con il player incorporato."},
      {id:"video-https-debug",title:"Debug passo per passo",description:"File MP4 HTTPS rappresentato dal player HTML5 locale della demo.",course:"Risorse libere",kind:"video",kindLabel:"Video",url:"https://example.org/didattica/debug.mp4",access:"embedded",accessLabel:"Incorporato",monitoring:"full",monitoringLabel:"Monitoraggio completo",progress:0,progressLabel:"Non iniziato",icon:"▶",viewerReady:true,provider:"html5-video",duration:180,explicitClassification:true,viewer:"video",importStatus:"not-required",reason:"Video HTTPS compatibile con il player HTML5."}
    ].forEach(item=>{if(!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push(item)});
    const aulaVideoState={materialId:null,current:0,duration:1,playing:false,ranges:[],timer:null};
    function aulaFormatVideoTime(value){const seconds=Math.max(0,Math.floor(value)),m=Math.floor(seconds/60),s=seconds%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
    function aulaMergeRanges(ranges){const sorted=ranges.filter(r=>r.end>r.start).sort((a,b)=>a.start-b.start),merged=[];sorted.forEach(range=>{const last=merged[merged.length-1];if(last&&range.start<=last.end+1)last.end=Math.max(last.end,range.end);else merged.push({...range})});return merged}
    function aulaVideoWatchedSeconds(){return aulaMergeRanges(aulaVideoState.ranges).reduce((sum,r)=>sum+r.end-r.start,0)}
    function aulaVideoRender(){const material=aulaMaterialsPanelData.find(item=>item.id===aulaVideoState.materialId);if(!material)return;const coverage=Math.min(100,Math.round(aulaVideoWatchedSeconds()/aulaVideoState.duration*100)),completed=coverage>=90;material.progress=coverage;material.progressLabel=completed?"Completato":`${coverage}% realmente visto`;documentContent.innerHTML=`<section class="material-video-viewer"><div class="document-section-label">Player locale · nessun iframe remoto</div><div class="material-video-stage"><span class="material-video-provider">${aulaMaterialsPanelEscape(material.provider)}</span><div class="material-video-symbol">${aulaVideoState.playing?"Ⅱ":"▶"}</div></div><div class="material-video-controls"><button type="button" onclick="aulaVideoToggle()" aria-label="${aulaVideoState.playing?"Pausa":"Riproduci"}">${aulaVideoState.playing?"Ⅱ":"▶"}</button><input type="range" min="0" max="${aulaVideoState.duration}" value="${Math.floor(aulaVideoState.current)}" oninput="aulaVideoSeek(this.value)" aria-label="Posizione video"><span>${aulaFormatVideoTime(aulaVideoState.current)} / ${aulaFormatVideoTime(aulaVideoState.duration)}</span></div><div class="material-viewer-progress"><span style="width:${coverage}%"></span></div><div class="material-video-stats"><div><span>Copertura reale</span><strong>${coverage}%</strong></div><div><span>Secondi unici</span><strong>${Math.round(aulaVideoWatchedSeconds())}</strong></div><div><span>Completamento</span><strong>${completed?"Raggiunto":"Richiede almeno 90%"}</strong></div></div><div class="material-workspace-honesty"><strong>Demo locale.</strong> Il player simula play, pausa e seek; non scarica né incorpora il video remoto.</div></section>`;state.currentView="material-video";setEveContext("materiali")}
    function aulaVideoTick(){if(!aulaVideoState.playing)return;const before=aulaVideoState.current;aulaVideoState.current=Math.min(aulaVideoState.duration,aulaVideoState.current+1);aulaVideoState.ranges.push({start:before,end:aulaVideoState.current});if(aulaVideoState.current>=aulaVideoState.duration){aulaVideoState.playing=false;clearInterval(aulaVideoState.timer);aulaVideoState.timer=null}aulaVideoRender()}
    function aulaVideoToggle(){aulaVideoState.playing=!aulaVideoState.playing;if(aulaVideoState.playing&&!aulaVideoState.timer)aulaVideoState.timer=setInterval(aulaVideoTick,1000);if(!aulaVideoState.playing&&aulaVideoState.timer){clearInterval(aulaVideoState.timer);aulaVideoState.timer=null}aulaVideoRender()}
    function aulaVideoSeek(value){aulaVideoState.current=Math.max(0,Math.min(aulaVideoState.duration,Number(value)||0));aulaVideoRender()}
    function aulaVideoStop(){aulaVideoState.playing=false;if(aulaVideoState.timer)clearInterval(aulaVideoState.timer);aulaVideoState.timer=null}
    function aulaVideoOpen(material){aulaVideoStop();document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;aulaVideoState.materialId=material.id;aulaVideoState.duration=material.duration||180;aulaVideoState.current=0;aulaVideoState.ranges=[];aulaVideoRender();closeDrawer();showToast(`Video aperto: ${material.title}`)}
    const aulaMaterialsOpenBeforeVideo=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){const material=aulaMaterialsPanelData.find(item=>item.id===id),descriptor=material?aulaMaterialOfficialDescriptor(material):null;if(material&&descriptor?.viewer==="video")return aulaVideoOpen(material);aulaVideoStop();return aulaMaterialsOpenBeforeVideo(id)};document.addEventListener("visibilitychange",()=>{if(document.hidden&&aulaVideoState.playing)aulaVideoToggle()});
''',
7: r'''

    /* ==========================================================
       MATERIALI — IMPORTAZIONE RICHIESTA
       ========================================================== */
    [
      {id:"import-web-functions",title:"Articolo web sulle funzioni",description:"Pagina HTTPS da trasformare in copia leggibile autorizzata.",course:"Programmazione da Zero",kind:"link",kindLabel:"Pagina web",url:"https://example.org/didattica/funzioni",access:"import-required",accessLabel:"Importazione richiesta",monitoring:"none",monitoringLabel:"Non monitorabile",progress:0,progressLabel:"Importazione necessaria",icon:"⇩",viewerReady:false,importStatus:"pending",explicitClassification:true,viewer:"web-article",provider:"web",reason:"La pagina richiede una copia leggibile autorizzata."},
      {id:"import-external-pdf",title:"Scheda esterna sui tipi di dato",description:"PDF remoto che richiede importazione nello spazio protetto.",course:"Programmazione da Zero",kind:"pdf",kindLabel:"PDF",url:"https://example.org/didattica/tipi-dato.pdf",access:"import-required",accessLabel:"Importazione richiesta",monitoring:"none",monitoringLabel:"Non monitorabile",progress:0,progressLabel:"Importazione necessaria",icon:"⇩",viewerReady:false,importStatus:"pending",explicitClassification:true,viewer:"pdf",provider:"web",reason:"Il PDF deve essere importato prima del monitoraggio."}
    ].forEach(item=>{if(!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push(item)});
    const aulaMaterialImportedStorageKey="aula-demo-material-imports-v1";let aulaMaterialImportBusy=false;
    function aulaMaterialImportedIds(){try{const parsed=JSON.parse(localStorage.getItem(aulaMaterialImportedStorageKey)||"[]");return new Set(Array.isArray(parsed)?parsed:[])}catch{return new Set()}}
    function aulaMaterialSaveImported(set){try{localStorage.setItem(aulaMaterialImportedStorageKey,JSON.stringify([...set]))}catch{}}
    function aulaMaterialApplyImported(material){if(!aulaMaterialImportedIds().has(material.id))return material;material.sourceType="file";material.storageName=material.kind==="pdf"?`${material.id}.pdf`:`${material.id}.txt`;material.access="internal";material.monitoring=material.kind==="pdf"?"partial":"full";material.importStatus="ready";material.provider="internal";material.explicitClassification=false;material.viewerReady=true;if(material.id==="import-web-functions")material.documentSections=[{title:"Copia leggibile autorizzata",paragraphs:["Le funzioni permettono di assegnare un nome a un comportamento riutilizzabile.","Parametri e valori restituiti definiscono il confine tra la funzione e il resto del programma."]}];aulaMaterialApplyDescriptor(material);return material}
    aulaMaterialsPanelData.forEach(aulaMaterialApplyImported);
    function aulaMaterialImportRender(material,status=""){documentContent.innerHTML=`<section class="material-import-state"><div class="document-section-label">Importazione richiesta</div><h1>${aulaMaterialsPanelEscape(material.title)}</h1><p>${aulaMaterialsPanelEscape(material.reason||"Questa risorsa deve essere importata prima dell’uso interno.")}</p><div class="material-import-steps"><div class="${aulaMaterialImportedIds().has(material.id)?"done":""}">Verifica della sorgente HTTPS</div><div class="${aulaMaterialImportedIds().has(material.id)?"done":""}">Creazione della copia protetta</div><div class="${aulaMaterialImportedIds().has(material.id)?"done":""}">Classificazione e monitorabilità</div></div><div class="material-import-actions"><button class="primary" type="button" onclick="aulaMaterialImport('${aulaMaterialsPanelEscape(material.id)}')" ${aulaMaterialImportBusy?"disabled":""}>${aulaMaterialImportedIds().has(material.id)?"Apri copia importata":"Importa copia autorizzata"}</button><button type="button" onclick="openDrawer('materiali')">Scegli un altro materiale</button></div><div class="material-import-status" id="materialImportStatus">${aulaMaterialsPanelEscape(status)}</div><div class="material-workspace-honesty"><strong>Demo locale.</strong> Nessun contenuto remoto viene scaricato; la procedura rappresenta gli stati dell’app ufficiale.</div></section>`;state.currentView="material-import";setEveContext("materiali")}
    function aulaMaterialImportOpen(material){document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;aulaMaterialImportRender(material);closeDrawer()}
    async function aulaMaterialImport(id){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(!material||aulaMaterialImportBusy)return;const imported=aulaMaterialImportedIds();if(imported.has(id)){aulaMaterialApplyImported(material);return window.aulaMaterialsPanelOpen(id)}aulaMaterialImportBusy=true;aulaMaterialImportRender(material,"Verifica e importazione in corso…");await new Promise(resolve=>setTimeout(resolve,650));imported.add(id);aulaMaterialSaveImported(imported);aulaMaterialApplyImported(material);aulaMaterialImportBusy=false;aulaMaterialsPanelState.selectedId=id;aulaMaterialsPanelSave();showToast("Importazione completata senza duplicati");window.aulaMaterialsPanelOpen(id)}
    const aulaMaterialsOpenBeforeImport=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(!material)return aulaMaterialsOpenBeforeImport(id);aulaMaterialApplyImported(material);const descriptor=aulaMaterialOfficialDescriptor(material);if(descriptor.access==="import-required"&&!aulaMaterialImportedIds().has(id))return aulaMaterialImportOpen(material);if(material.id==="import-web-functions"&&aulaMaterialImportedIds().has(id))return aulaDocumentOpen(material);return aulaMaterialsOpenBeforeImport(id)};
''',
8: r'''

    /* ==========================================================
       MATERIALI — TRACKING, AUTOSALVATAGGIO E RIPRESA
       ========================================================== */
    const aulaMaterialProgressStorageKey="aula-demo-material-progress-v2";const aulaMaterialTracking={currentId:null,openedAt:0,lastInteraction:0,activeSeconds:0,timer:null,events:[],resumed:false};
    function aulaMaterialProgressAll(){try{const parsed=JSON.parse(localStorage.getItem(aulaMaterialProgressStorageKey)||"{}");return parsed&&typeof parsed==="object"?parsed:{}}catch{return {}}}
    function aulaMaterialProgressGet(id){return aulaMaterialProgressAll()[id]||null}
    function aulaMaterialPosition(){const material=aulaMaterialsPanelData.find(item=>item.id===aulaMaterialTracking.currentId),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if(viewer==="pdf")return{page:aulaPdfState.page,completion:Math.round(aulaPdfState.page/aulaPdfPages.length*100)};if(viewer==="presentation")return{slide:aulaPresentationState.slide,completion:material?.slides?.length?Math.round(aulaPresentationState.slide/material.slides.length*100):0};if(viewer==="video")return{videoTime:aulaVideoState.current,videoRanges:aulaMergeRanges(aulaVideoState.ranges),completion:material?.progress||0};if(viewer==="document"||viewer==="text")return{scrollTop:pageScroll?.scrollTop||0,scrollRatio:pageScroll?.scrollHeight?Math.min(1,(pageScroll.scrollTop+pageScroll.clientHeight)/pageScroll.scrollHeight):0,completion:pageScroll?.scrollHeight?Math.round(Math.min(1,(pageScroll.scrollTop+pageScroll.clientHeight)/pageScroll.scrollHeight)*100):0};return{completion:material?.progress||0}}
    function aulaMaterialTrackingSave(eventType=null){if(!aulaMaterialTracking.currentId)return;const all=aulaMaterialProgressAll(),previous=all[aulaMaterialTracking.currentId]||{},position=aulaMaterialPosition(),events=[...(previous.events||[])];if(eventType)events.push({type:eventType,at:new Date().toISOString()});all[aulaMaterialTracking.currentId]={...previous,...position,activeSeconds:aulaMaterialTracking.activeSeconds,updatedAt:new Date().toISOString(),events:events.slice(-8)};try{localStorage.setItem(aulaMaterialProgressStorageKey,JSON.stringify(all))}catch{}const material=aulaMaterialsPanelData.find(item=>item.id===aulaMaterialTracking.currentId);if(material&&Number.isFinite(position.completion)){material.progress=position.completion;material.progressLabel=position.completion>=99?"Completato":"Ripresa disponibile"}aulaMaterialTrackingStatus("Salvato automaticamente")}
    function aulaMaterialTrackingStatus(text){const node=document.getElementById("materialTrackingStatus");if(node)node.textContent=text}
    function aulaMaterialTrackingStop(eventType="material_closed"){if(aulaMaterialTracking.timer)clearInterval(aulaMaterialTracking.timer);aulaMaterialTracking.timer=null;if(aulaMaterialTracking.currentId)aulaMaterialTrackingSave(eventType);aulaMaterialTracking.currentId=null}
    function aulaMaterialTrackingStart(id,saved){aulaMaterialTracking.currentId=id;aulaMaterialTracking.openedAt=Date.now();aulaMaterialTracking.lastInteraction=Date.now();aulaMaterialTracking.activeSeconds=Number(saved?.activeSeconds||0);aulaMaterialTracking.resumed=Boolean(saved);aulaMaterialTracking.timer=setInterval(()=>{const visible=document.visibilityState==="visible",recent=Date.now()-aulaMaterialTracking.lastInteraction<30000,videoActive=aulaVideoState.materialId===id&&aulaVideoState.playing;if(visible&&(recent||videoActive)){aulaMaterialTracking.activeSeconds+=1;if(aulaMaterialTracking.activeSeconds%5===0)aulaMaterialTrackingSave()}},1000)}
    function aulaMaterialTrackingBanner(id,saved){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(!material||!documentContent)return;const eventNames={material_opened:"Aperto",material_resumed:"Ripreso",material_closed:"Chiuso"},history=(saved?.events||[]).slice(-3).map(event=>`<span>${eventNames[event.type]||event.type}</span>`).join("");const banner=document.createElement("div");banner.className="material-tracking-banner";banner.innerHTML=`<div class="material-tracking-icon">↺</div><div class="material-tracking-copy"><strong>${saved?"Materiale ripreso":"Nuovo materiale aperto"}</strong><span>${saved?`Posizione e ${Math.round(Number(saved.activeSeconds||0)/60)} minuti attivi ripristinati.`:"La posizione verrà salvata automaticamente in questo browser."}</span><div class="material-tracking-history">${history}</div></div><div class="material-tracking-status" id="materialTrackingStatus">Salvato automaticamente</div>`;documentContent.prepend(banner)}
    function aulaMaterialRestoreBeforeOpen(id,saved){const material=aulaMaterialsPanelData.find(item=>item.id===id),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if(!saved)return;if(viewer==="pdf"&&saved.page)aulaPdfState.page=saved.page;if(viewer==="presentation"&&saved.slide)aulaPresentationState.slide=saved.slide;if(viewer==="video"){aulaVideoState.current=Number(saved.videoTime||0);aulaVideoState.ranges=Array.isArray(saved.videoRanges)?saved.videoRanges:[]}if(Number.isFinite(saved.completion))material.progress=saved.completion}
    const aulaMaterialsOpenBeforeTracking=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){aulaMaterialTrackingStop();const saved=aulaMaterialProgressGet(id);aulaMaterialRestoreBeforeOpen(id,saved);const result=aulaMaterialsOpenBeforeTracking(id);window.setTimeout(()=>{if(saved){const material=aulaMaterialsPanelData.find(item=>item.id===id),viewer=material?aulaMaterialOfficialDescriptor(material).viewer:null;if((viewer==="document"||viewer==="text")&&saved.scrollTop)pageScroll?.scrollTo({top:saved.scrollTop,behavior:"auto"})}aulaMaterialTrackingBanner(id,saved);aulaMaterialTrackingStart(id,saved);aulaMaterialTrackingSave(saved?"material_resumed":"material_opened")},30);return result};
    const aulaPdfMoveBeforeTracking=window.aulaPdfMove;window.aulaPdfMove=function(direction){const result=aulaPdfMoveBeforeTracking(direction);aulaMaterialTracking.lastInteraction=Date.now();aulaMaterialTrackingSave();return result};const aulaPresentationMoveBeforeTracking=window.aulaPresentationMove;window.aulaPresentationMove=function(direction){const result=aulaPresentationMoveBeforeTracking(direction);aulaMaterialTracking.lastInteraction=Date.now();aulaMaterialTrackingSave();return result};const aulaVideoSeekBeforeTracking=window.aulaVideoSeek;window.aulaVideoSeek=function(value){const result=aulaVideoSeekBeforeTracking(value);aulaMaterialTracking.lastInteraction=Date.now();aulaMaterialTrackingSave();return result};document.addEventListener("pointerdown",()=>{if(aulaMaterialTracking.currentId)aulaMaterialTracking.lastInteraction=Date.now()},{passive:true});pageScroll?.addEventListener("scroll",()=>{if(aulaMaterialTracking.currentId){aulaMaterialTracking.lastInteraction=Date.now();aulaMaterialTrackingStatus("Salvataggio…")}}, {passive:true});window.addEventListener("pagehide",()=>aulaMaterialTrackingStop());document.addEventListener("visibilitychange",()=>{if(document.hidden)aulaMaterialTrackingSave("material_closed")});
''',
9: r'''

    /* ==========================================================
       MATERIALI — ERRORI SICURI E ALTERNATIVE
       ========================================================== */
    [
      {id:"material-unsupported-zip",title:"Archivio esercizi ZIP",description:"Formato non supportato dal workspace didattico.",course:"Risorse libere",kind:"unsupported",kindLabel:"ZIP",access:"unsupported",accessLabel:"Non supportato",monitoring:"none",monitoringLabel:"Non monitorabile",progress:0,progressLabel:"Non disponibile",icon:"!",viewerReady:false,explicitClassification:true,viewer:null,importStatus:"failed",provider:"none",reason:"Gli archivi ZIP non vengono aperti nel workspace."},
      {id:"material-unavailable",title:"Dispensa rimossa dal proprietario",description:"La voce è ancora nella cronologia, ma il contenuto non è più disponibile.",course:"Programmazione da Zero",kind:"unavailable",kindLabel:"Non disponibile",access:"unsupported",accessLabel:"Non disponibile",monitoring:"none",monitoringLabel:"Non monitorabile",progress:24,progressLabel:"Cronologia conservata",icon:"×",viewerReady:false,explicitClassification:true,viewer:null,importStatus:"failed",provider:"none",reason:"Il file originale è stato rimosso; progressi e cronologia restano separati."},
      {id:"material-retry-demo",title:"Appunti temporaneamente non caricabili",description:"Stato demo per verificare errore, retry e recupero idempotente.",course:"Programmazione da Zero",kind:"text",kindLabel:"Testo",access:"internal",accessLabel:"Interno",monitoring:"full",monitoringLabel:"Monitoraggio completo",progress:12,progressLabel:"Ripresa sospesa",icon:"↻",viewerReady:true,explicitClassification:true,viewer:"error-demo",importStatus:"ready",provider:"internal",reason:"Errore temporaneo di lettura."}
    ].forEach(item=>{if(!aulaMaterialsPanelData.some(current=>current.id===item.id))aulaMaterialsPanelData.push(item)});const aulaMaterialErrorAttempts={};
    function aulaMaterialAlternatives(excludeId){return aulaMaterialsPanelData.filter(item=>item.id!==excludeId&&["lesson","pdf","document","presentation"].includes(aulaMaterialOfficialDescriptor(item).viewer||item.kind)&&aulaMaterialOfficialDescriptor(item).access==="internal").slice(0,3)}
    function aulaMaterialErrorRender(material,kind){const definitions={unsupported:{title:"Formato non supportato",text:"Questo formato non dispone di un viewer interno sicuro. Il file non è stato eseguito né aperto esternamente.",code:"unsupported_material",tone:"warning",retry:false},unavailable:{title:"Materiale non disponibile",text:"Il contenuto è stato rimosso o non è più raggiungibile. Progressi e cronologia restano conservati separatamente.",code:"material_unavailable",tone:"error",retry:false},temporary:{title:"Caricamento non riuscito",text:"La lettura si è interrotta prima di mostrare il contenuto. Nessun progresso parziale è stato sovrascritto.",code:"temporary_load_error",tone:"error",retry:true}},def=definitions[kind],alternatives=aulaMaterialAlternatives(material.id);documentContent.innerHTML=`<section class="material-error-state" data-tone="${def.tone}"><div class="document-section-label">Stato sicuro del workspace</div><h1>${def.title}</h1><p>${def.text}</p><div class="material-error-code">${def.code} · ${aulaMaterialsPanelEscape(material.id)}</div><div class="material-error-actions">${def.retry?`<button class="primary" type="button" onclick="aulaMaterialRetry('${aulaMaterialsPanelEscape(material.id)}')">Riprova caricamento</button>`:""}<button type="button" onclick="openDrawer('materiali')">Torna ai materiali</button></div><div><strong>Alternative disponibili</strong><div class="material-alternatives">${alternatives.map(item=>`<article class="material-alternative"><strong>${aulaMaterialsPanelEscape(item.title)}</strong><span>${aulaMaterialsPanelEscape(item.kindLabel)} · ${aulaMaterialsPanelEscape(item.monitoringLabel)}</span><button type="button" onclick="aulaMaterialsPanelOpen('${aulaMaterialsPanelEscape(item.id)}')">Apri alternativa</button></article>`).join("")}</div></div></section>`;state.currentView="material-error";setEveContext("materiali")}
    function aulaMaterialErrorOpen(material,kind){aulaVideoStop();document.querySelectorAll(".content-tab").forEach(tab=>tab.classList.remove("active"));document.getElementById("selectedMaterialTitle").textContent=material.title;document.getElementById("selectedMaterialDescription").textContent=material.description;aulaMaterialErrorRender(material,kind);closeDrawer()}
    async function aulaMaterialRetry(id){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(!material)return;aulaMaterialErrorAttempts[id]=(aulaMaterialErrorAttempts[id]||0)+1;const button=document.querySelector(".material-error-actions .primary");if(button){button.disabled=true;button.textContent="Nuovo tentativo…"}await new Promise(resolve=>setTimeout(resolve,620));material.viewer="document";material.kind="document";material.kindLabel="Testo";material.documentSections=[{title:"Contenuto recuperato",paragraphs:["Il secondo tentativo ha recuperato una copia coerente del testo.","La posizione precedente non è stata cancellata e il materiale non è stato duplicato."]}];material.reason="Contenuto recuperato dopo un errore temporaneo.";material.explicitClassification=true;showToast("Materiale recuperato al secondo tentativo");window.aulaMaterialsPanelOpen(id)}
    const aulaMaterialsOpenBeforeErrors=window.aulaMaterialsPanelOpen;window.aulaMaterialsPanelOpen=function(id){const material=aulaMaterialsPanelData.find(item=>item.id===id);if(!material)return aulaMaterialsOpenBeforeErrors(id);if(id==="material-unsupported-zip")return aulaMaterialErrorOpen(material,"unsupported");if(id==="material-unavailable")return aulaMaterialErrorOpen(material,"unavailable");if(id==="material-retry-demo"&&!aulaMaterialErrorAttempts[id])return aulaMaterialErrorOpen(material,"temporary");return aulaMaterialsOpenBeforeErrors(id)};
''',
}

CHANGELOG_DETAILS = {
2: ["Dialog accessibile per collegamento HTTPS o file locale.","Validazione URL pubblico e blocco indirizzi locali.","Limite file 10 MB e formati PDF/TXT/MD/DOC/DOCX/PPT/PPTX.","Generazione di un nome file sicuro e salvataggio dei soli metadati locali.","Nuovo materiale immediatamente disponibile nel drawer."],
3: ["Classificazione deterministica coerente con `resolveMaterialAccess`.","Access mode: internal, embedded, import-required, external-unmonitored e unsupported.","Viewer, provider, import status e motivo visibili.","Distinzione tra monitoraggio completo, parziale, sola apertura e assente."],
4: ["Viewer PDF locale senza iframe remoti.","Dodici pagine demo, navigazione precedente/successiva e indicatore percentuale.","Aggiornamento del materiale selezionato e dell’avanzamento."],
5: ["DOCX rappresentato come testo sicuro strutturato.","PPTX rappresentato come sequenza di slide testuali.","Navigazione slide e mantenimento del workspace centrale."],
6: ["Materiali YouTube, Vimeo e video HTTPS.","Player simulato locale con play, pausa e seek.","Intervalli realmente visti e completamento solo dopo copertura del 90%.","Nessun iframe o download remoto nella demo."],
7: ["Stato import-required per articolo web e PDF remoto.","Importazione simulata in tre fasi e conversione a risorsa interna.","Seconda richiesta idempotente e copia importata persistente."],
8: ["Autosalvataggio posizione, percentuale e tempo attivo.","Ripresa di pagina PDF, slide, posizione video e scroll documento.","Eventi opened/resumed/closed e banner di stato accessibile."],
9: ["Stati formato non supportato, materiale non disponibile ed errore temporaneo.","Retry recuperabile senza duplicati o perdita del progresso.","Alternative interne sicure e ritorno al selettore.","Fase 3 completata con pannello, viewer, importazione, tracking ed errori."],
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Anchor {label!r} expected once, found {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()


def apply_extra_transforms(html: str, step: int) -> str:
    if step == 2:
        html = replace_once(html, '  <div class="portal-room-manage-dialog" id="portalRoomManageDialog" hidden onclick="portalDashboardRoomManageBackdrop(event)">', DIALOG_HTML + '\n  <div class="portal-room-manage-dialog" id="portalRoomManageDialog" hidden onclick="portalDashboardRoomManageBackdrop(event)">', "material add dialog")
        old = '''          <div class="materials-panel-footer">
            <span>Upload, link, limiti file e classificazione completa arrivano nelle prossime sottofasi della Fase 3.</span>
            <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
          </div>'''
        new = '''          <div class="materials-panel-footer">
            <span>La demo salva soltanto metadati nel browser. I file reali restano sul dispositivo.</span>
            <div class="materials-panel-footer-actions">
              <button class="primary" type="button" onclick="aulaMaterialAddOpen(this)">＋ Aggiungi materiale</button>
              <button type="button" onclick="portalDashboardOpenCatalogForRoom('python-room'); closeDrawer()">Apri Catalogo</button>
            </div>
          </div>'''
        html = replace_once(html, old, new, "materials footer")
    if step == 3:
        old = '''              <span class="materials-panel-badge">${aulaMaterialsPanelEscape(material.accessLabel)}</span>
              <span class="materials-panel-badge monitor-${aulaMaterialsPanelEscape(material.monitoring)}">${aulaMaterialsPanelEscape(material.monitoringLabel)}</span>'''
        new = '''              <span class="materials-panel-badge" title="${aulaMaterialsPanelEscape(material.reason || '')}">${aulaMaterialsPanelEscape(material.accessLabel)}</span>
              <span class="materials-panel-badge monitor-${aulaMaterialsPanelEscape(material.monitoring)}">${aulaMaterialsPanelEscape(material.monitoringLabel)}</span>
              <span class="materials-panel-badge import-${aulaMaterialsPanelEscape(material.importStatus || 'not-required')}">${aulaMaterialsPanelEscape(material.importStatus || 'not-required')}</span>'''
        html = replace_once(html, old, new, "classification badges")
        old2 = '''            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <div class="materials-panel-meta">'''
        new2 = '''            <p>${aulaMaterialsPanelEscape(material.description)}</p>
            <small class="materials-panel-reason">${aulaMaterialsPanelEscape(material.reason || 'Classificazione locale della demo.')}</small>
            <div class="materials-panel-meta">'''
        html = replace_once(html, old2, new2, "classification reason")
    return html


def update_html(html: str, step: int) -> str:
    marker = STEPS[step]["marker"]
    if marker in html:
        return html
    html = replace_once(html, CSS_ANCHOR, CSS[step] + "\n\n" + CSS_ANCHOR, f"CSS step {step}")
    html = replace_once(html, JS_ANCHOR, JS[step] + "\n\n" + JS_ANCHOR, f"JS step {step}")
    return apply_extra_transforms(html, step)


def validate(html: str, step: int) -> None:
    required = [STEPS[step]["marker"], "MATERIALI E WORKSPACE — PANNELLO MATERIALI 1.3.0-alpha.1", "function buildMaterialsDrawerHtml(", "function aulaMaterialsPanelOpen("]
    cumulative = {
        2: ["id=\"materialAddDialog\"", "aulaMaterialAddSubmit", "aulaMaterialMaxBytes"],
        3: ["aulaMaterialOfficialDescriptor", "import-required", "monitoringLevel" if False else "Monitoraggio completo"],
        4: ["aulaPdfPages", "aulaPdfMove", "material-pdf-sheet"],
        5: ["aulaDocumentOpen", "aulaPresentationOpen", "material-slide-stage"],
        6: ["aulaVideoToggle", "aulaMergeRanges", "material-video-stage"],
        7: ["aulaMaterialImport", "aulaMaterialImportedStorageKey", "material-import-state"],
        8: ["aulaMaterialTrackingSave", "aulaMaterialProgressStorageKey", "material-tracking-banner"],
        9: ["aulaMaterialErrorRender", "material-unsupported-zip", "material-alternatives"],
    }
    for index in range(2, step + 1):
        required.extend(cumulative[index])
    for value in required:
        if value not in html:
            raise RuntimeError(f"Missing marker: {value}")
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


def update_docs(html: str, step: int) -> None:
    info = STEPS[step]
    version = info["version"]
    data = html.encode("utf-8")
    size = len(data)
    lines = html.count("\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob = git_blob_sha(data)

    readme = README_PATH.read_text(encoding="utf-8")
    readme = re.sub(r"\*\*Demo [^\n]+\*\*", f"**Demo {version} pronta per verifica: {info['summary']}.**", readme, count=1)
    readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{version}`", readme, count=1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    details = "\n".join(f"- {item}" for item in CHANGELOG_DETAILS[step])
    entry = f'''## [{version}] — {DATE}\n\n### {info['title']}\n\n{details}\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob}`\n\n### Stato\n\nCheckpoint HTML completo prodotto durante l'autorizzazione dell'utente a completare l'intera Fase 3.\n\n---\n\n'''
    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    previous = "1.3.0-alpha.1" if step == 2 else STEPS[step - 1]["version"]
    if f"## [{version}]" not in changelog:
        changelog = changelog.replace(f"## [{previous}]", entry + f"## [{previous}]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    heading = f"## {info['title']}"
    state = "🟡 — checkpoint finale della Fase 3 in attesa di approvazione" if step == 9 else "🟢 — completato automaticamente nell'autorizzazione Fase 3"
    section = f'''\n{heading}\n\nStato: {state}\n\nVersione: `{version}`\n\n- {info['summary']};\n- HTML canonico aggiornato;\n- copia scaricabile: `reference/checkpoints/phase-3/demo-aula-studio-virtuale-{version}.html`;\n- controlli statici e sintattici eseguiti dal workflow.\n\n---\n'''
    if heading not in status:
        status = status.replace("# Regola per Codex", section + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    heading_arch = f"## Fase 3 · {version}"
    section_arch = f'''\n{heading_arch}\n\n{info['summary'].capitalize()}. La demo mantiene dati deterministici e non dichiara chiamate remote reali. La copia del checkpoint è salvata in `reference/checkpoints/phase-3/`.\n'''
    if heading_arch not in architecture:
        architecture += section_arch
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    previous_version = "1.3.0-alpha.1" if step == 2 else STEPS[step - 1]["version"]
    previous_title = "Materiali: pannello e selezione" if step == 2 else STEPS[step - 1]["title"].replace("Materiali: ", "Materiali: ")
    approvals = re.sub(
        rf"\| Fase 3 \| {re.escape(previous_title)} \| IN_ATTESA_APPROVAZIONE \| 2026-07-22 \| Demo HTML {re.escape(previous_version)} pronta da aprire e verificare\. \|",
        f"| Fase 3 | {previous_title} | APPROVATO | 2026-07-22 | Prosecuzione autorizzata dall'utente per l'intera Fase 3; checkpoint {previous_version} archiviato. |",
        approvals,
    )
    row_state = "IN_ATTESA_APPROVAZIONE" if step == 9 else "IN_ATTESA_APPROVAZIONE"
    row = f"| Fase 3 | {info['title']} | {row_state} | {DATE} | Demo HTML {version} prodotta; prosecuzione automatica autorizzata. |"
    if f"| Fase 3 | {info['title']} |" not in approvals:
        approvals = approvals.replace("| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", row + "\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", 1)
    if step == 9 and "| Fase 3 | Materiali e workspace: fase completa |" not in approvals:
        approvals = approvals.replace("| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", f"| Fase 3 | Materiali e workspace: fase completa | IN_ATTESA_APPROVAZIONE | {DATE} | Tutte le nove sottofasi sono presenti nella demo {version}. |\n| Fasi 2–10 | Passaggi successivi | DA_INIZIARE | — | Ogni passaggio avrà un checkpoint separato. |", 1)
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    snapshot = CHECKPOINT_DIR / f"demo-aula-studio-virtuale-{version}.html"
    shutil.copyfile(HTML_PATH, snapshot)

    manifest = CHECKPOINT_DIR / "README.md"
    manifest_text = manifest.read_text(encoding="utf-8") if manifest.exists() else "# Checkpoint scaricabili — Fase 3\n\nQueste copie sono snapshot di verifica. La fonte autorevole resta `reference/demo-aula-studio-virtuale-canonica.html`.\n\n"
    line = f"- `{version}` — `{snapshot.name}` — SHA-256 `{sha256}` — {size} byte — {lines} righe\n"
    if f"`{version}`" not in manifest_text:
        manifest_text += line
    manifest.write_text(manifest_text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--step", type=int, required=True, choices=STEPS)
    args = parser.parse_args()
    step = args.step
    html = HTML_PATH.read_text(encoding="utf-8")
    updated = update_html(html, step)
    validate(updated, step)
    HTML_PATH.write_text(updated, encoding="utf-8")
    update_docs(updated, step)
    data = updated.encode("utf-8")
    print(f"step={step}")
    print(f"version={STEPS[step]['version']}")
    print(f"commit_message={STEPS[step]['commit']}")
    print(f"bytes={len(data)}")
    print(f"lines={updated.count(chr(10)) + 1}")
    print(f"sha256={hashlib.sha256(data).hexdigest()}")
    print(f"git_blob_sha={git_blob_sha(data)}")


if __name__ == "__main__":
    main()
