(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-eve-panel")) return;
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const button = document.createElement("button");
  button.dataset.view = "core-eve-panel";
  button.innerHTML = '<span class="ico">◐</span>Pannello Eve';
  const contextButton = nav.querySelector('[data-view="core-identity-context"]');
  (contextButton || nav.lastElementChild)?.insertAdjacentElement("afterend", button);

  const view = document.createElement("section");
  view.id = "core-eve-panel"; view.className = "view";
  view.innerHTML = `<div class="grid">
    <section class="panel span-12"><div class="panel-head"><div><h3>Pannello Eve integrato</h3><p>CORE-1.5 — pannello laterale o espanso, ingressi da lezione, catalogo e aula, focus e layout mobile. Simulazione UI senza provider.</p></div><span class="tag violet">CORE-1.5 · alpha.12</span></div>
      <div class="panel-body"><div class="metric-row"><div class="metric"><small>Feature flag</small><strong>OFF</strong><div class="progress"><span style="width:20%;background:var(--warn)"></span></div></div><div class="metric"><small>Ingressi</small><strong>3</strong><div class="progress"><span style="width:75%"></span></div></div><div class="metric"><small>Modalità</small><strong>2</strong><div class="progress"><span style="width:55%;background:var(--violet)"></span></div></div><div class="metric"><small>Runtime avatar</small><strong>1.2.6</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div></div></div></section>
    <section class="panel span-7"><div class="panel-head"><div><h3>Prova i punti di apertura</h3><p>Ogni punto passa solo identificativi contestuali; ruoli e autorizzazioni restano server-side.</p></div><span class="pill">Preview interattiva</span></div><div class="panel-body">
      <div class="form-grid"><div class="field"><label for="panelEntry">Ingresso</label><select id="panelEntry"><option value="lesson">Lezione</option><option value="catalog">Catalogo</option><option value="room">Aula</option></select></div><div class="field"><label for="panelMode">Modalità</label><select id="panelMode"><option value="side">Laterale</option><option value="expanded">Espansa</option></select></div><div class="field" style="grid-column:1/-1"><label for="panelContext">Contesto simulato</label><input id="panelContext" value="room-python-zero · programming-0-1 · variabili"></div></div>
      <button class="btn green" id="openEvePanelPreview" style="width:100%;margin-top:12px">Apri Eve</button><div class="list" id="evePanelPreviewEvents" style="margin-top:12px"></div>
    </div></section>
    <section class="panel span-5"><div class="panel-head"><div><h3>Garanzie</h3><p>Il pannello non deve rendere inutilizzabile l'app quando il flag è disattivato.</p></div><span class="tag warn">Server decides</span></div><div class="panel-body list">
      <div class="row"><div class="meta"><strong>Focus</strong><small>Focus iniziale, ripristino e trap in modalità espansa</small></div><span class="tag">Attivo</span></div><div class="row"><div class="meta"><strong>Tastiera</strong><small>Escape e Ctrl/⌘ + Maiusc + E</small></div><span class="tag">Attiva</span></div><div class="row"><div class="meta"><strong>Mobile</strong><small>Bottom sheet sotto 768 px</small></div><span class="tag">Responsive</span></div><div class="row"><div class="meta"><strong>Reduced motion</strong><small>Nessuna animazione obbligatoria</small></div><span class="tag">Rispettato</span></div><div class="row"><div class="meta"><strong>Provider AI</strong><small>Non attivato in CORE-1.5</small></div><span class="tag red">Escluso</span></div>
    </div></section>
  </div>`;
  main.appendChild(view);

  const overlay = document.createElement("div");
  overlay.id = "evePanelPreviewOverlay";
  overlay.hidden = true;
  overlay.innerHTML = `<div class="eve-panel-preview-backdrop"></div><aside class="eve-panel-preview-shell" role="dialog" aria-modal="true" aria-labelledby="evePanelPreviewTitle"><header><div class="eve-panel-preview-id"><span class="eve-panel-preview-orb"></span><div><strong id="evePanelPreviewTitle">Eve</strong><small id="evePanelPreviewSubtitle">Lezione · CORE-1.5</small></div></div><div><button class="btn" id="toggleEvePanelPreview">Espandi</button><button class="btn" id="closeEvePanelPreview">Chiudi</button></div></header><div class="eve-panel-preview-body"><span class="tag" id="evePanelPreviewState">loading</span><h3>Contesto verificabile</h3><p id="evePanelPreviewContext"></p><div class="row"><div class="meta"><strong>Nessun provider esterno</strong><small>La domanda resta una bozza locale fino a CORE-1.6.</small></div><span class="tag warn">Mock UI</span></div><textarea rows="4" placeholder="Prepara una domanda per Eve..."></textarea><button class="btn green" id="prepareEvePanelDraft">Prepara bozza</button><p id="evePanelPreviewNotice"></p></div></aside>`;
  document.body.appendChild(overlay);

  const style = document.createElement("style");
  style.textContent = `.eve-panel-preview-backdrop{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.48);backdrop-filter:blur(4px)}.eve-panel-preview-shell{position:fixed;z-index:91;top:12px;right:12px;bottom:12px;width:min(420px,calc(100vw - 24px));overflow:hidden;border:1px solid rgba(145,240,255,.18);border-radius:24px;color:#eaffff;background:linear-gradient(180deg,#0a222b,#07161d);box-shadow:0 30px 90px rgba(0,0,0,.5)}.eve-panel-preview-shell.is-expanded{left:12px;width:auto}.eve-panel-preview-shell header{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(145,240,255,.12);padding:14px}.eve-panel-preview-id{display:flex;align-items:center;gap:10px}.eve-panel-preview-id small{display:block;margin-top:3px;color:rgba(230,255,255,.6);font-size:9px}.eve-panel-preview-orb{display:block;width:46px;height:46px;border-radius:50%;background:radial-gradient(circle at 34% 28%,#fff,#75edf4 16%,#2ca7b8 42%,#40568b 72%);box-shadow:0 0 25px rgba(90,230,245,.28)}.eve-panel-preview-body{padding:18px}.eve-panel-preview-body>p{margin:8px 0 14px;color:rgba(230,255,255,.65);font-size:10px}.eve-panel-preview-body textarea{width:100%;margin:14px 0 8px;border:1px solid rgba(145,240,255,.15);border-radius:12px;padding:10px;color:#fff;background:rgba(255,255,255,.05)}@media(max-width:767px){.eve-panel-preview-shell{top:auto;left:8px;right:8px;bottom:8px;width:auto;max-height:78vh}}@media(prefers-reduced-motion:reduce){.eve-panel-preview-shell{scroll-behavior:auto}}`;
  document.head.appendChild(style);

  const showView = () => { document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node === view)); document.querySelectorAll(".nav button").forEach((node) => node.classList.toggle("active", node === button)); document.getElementById("pageTitle").textContent = "Pannello Eve"; document.getElementById("pageSubtitle").textContent = "Verifica integrazione visiva, focus e modalità responsive."; };
  button.addEventListener("click", showView);
  const shell = overlay.querySelector(".eve-panel-preview-shell"); const close = overlay.querySelector("#closeEvePanelPreview"); const toggle = overlay.querySelector("#toggleEvePanelPreview");
  function closePanel(){ overlay.hidden=true; document.getElementById("openEvePanelPreview")?.focus(); window.EveAnimationLibrary?.setState?.("eve-idle"); }
  document.getElementById("openEvePanelPreview").addEventListener("click", () => { const entry=document.getElementById("panelEntry").value; const mode=document.getElementById("panelMode").value; const context=document.getElementById("panelContext").value; overlay.hidden=false; shell.classList.toggle("is-expanded",mode==="expanded"); toggle.textContent=mode==="expanded"?"Riduci":"Espandi"; document.getElementById("evePanelPreviewSubtitle").textContent=`${entry} · CORE-1.5`; document.getElementById("evePanelPreviewContext").textContent=context; document.getElementById("evePanelPreviewState").textContent="loading"; window.EveAnimationLibrary?.setState?.("eve-thinking"); setTimeout(()=>{document.getElementById("evePanelPreviewState").textContent="ready";window.EveAnimationLibrary?.setState?.("eve-success");close.focus();},220); document.getElementById("evePanelPreviewEvents").innerHTML=`<div class="row"><div class="meta"><strong>Apertura da ${esc(entry)}</strong><small>modalità=${esc(mode)} · contesto=${esc(context)}</small></div><span class="tag">Simulata</span></div>`; });
  close.addEventListener("click", closePanel); overlay.querySelector(".eve-panel-preview-backdrop").addEventListener("click",closePanel); toggle.addEventListener("click",()=>{shell.classList.toggle("is-expanded");toggle.textContent=shell.classList.contains("is-expanded")?"Riduci":"Espandi";}); document.getElementById("prepareEvePanelDraft").addEventListener("click",()=>{document.getElementById("evePanelPreviewNotice").textContent="Bozza locale pronta: nessun invio a provider esterni.";});
  document.addEventListener("keydown",(event)=>{
    if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==="e"){
      event.preventDefault();
      if(overlay.hidden){
        showView();
        const opener=document.getElementById("openEvePanelPreview");
        opener.focus();
        opener.click();
      }else closePanel();
      return;
    }
    if(event.key==="Escape"&&!overlay.hidden){event.preventDefault();closePanel();return;}
    if(event.key!=="Tab"||overlay.hidden||!shell.classList.contains("is-expanded"))return;
    const focusable=[...shell.querySelectorAll('button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
})();
