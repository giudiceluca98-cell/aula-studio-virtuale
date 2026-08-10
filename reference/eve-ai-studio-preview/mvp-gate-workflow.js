(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-mvp-gate")) return;

  const button = document.createElement("button");
  button.dataset.view = "core-mvp-gate";
  button.innerHTML = '<span class="ico">✓</span>Gate MVP';
  nav.appendChild(button);

  const view = document.createElement("section");
  view.id = "core-mvp-gate";
  view.className = "view";
  view.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head"><div><h3>CORE-1.7 — Gate MVP end-to-end</h3><p>Simulazione dichiarata del percorso completo. Non usa rete, database, provider o memoria reali.</p></div><span class="tag violet">alpha.17</span></div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Identità</small><strong>Server</strong><div class="progress"><span style="width:100%"></span></div></div>
            <div class="metric"><small>Fonti</small><strong>Autorizzate</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
            <div class="metric"><small>Citazioni</small><strong>Verificabili</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
            <div class="metric"><small>Memoria/azioni</small><strong>0</strong><div class="progress"><span style="width:0%"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head"><div><h3>Percorso obbligatorio</h3><p>Seleziona uno scenario e verifica ogni gate nell'ordine.</p></div><span class="pill">Simulazione UI</span></div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label>Scenario</label><select id="mvpScenario"><option value="success">Percorso completo riuscito</option><option value="no-source">Fonte assente</option><option value="cross-room">Materiale di altra aula</option><option value="provider-down">Provider indisponibile</option><option value="disabled">Eve disattivata</option></select></div>
            <div class="field"><label>Domanda</label><input id="mvpQuestion" value="Spiegami il concetto selezionato"></div>
          </div>
          <button class="btn green" id="runMvpGate" style="width:100%;margin-top:12px">Esegui Gate MVP</button>
          <div class="list" id="mvpGateStages" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head"><div><h3>Risultato verificabile</h3><p>Risposta, incertezza, fonti e operazioni permanenti.</p></div><span class="tag warn" id="mvpResultBadge">In attesa</span></div>
        <div class="panel-body list" id="mvpResult"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head"><div><h3>Apertura della fonte</h3><p>Il locator e lo SHA-256 devono corrispondere prima di mostrare il passaggio.</p></div><button class="btn" id="openMvpSource" disabled>Apri fonte</button></div>
        <div class="panel-body list" id="mvpSourceResult"><div class="row"><div class="meta"><strong>Nessuna fonte aperta</strong><small>Completa uno scenario riuscito.</small></div><span class="tag warn">In attesa</span></div></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head"><div><h3>Feedback utente</h3><p>Il feedback è attribuibile ma non diventa automaticamente verità o memoria.</p></div><span class="pill">RLS utente</span></div>
        <div class="panel-body"><div style="display:flex;gap:8px"><button class="btn" id="mvpHelpful" disabled>Utile</button><button class="btn" id="mvpImprove" disabled>Da migliorare</button></div><div class="list" id="mvpFeedbackResult" style="margin-top:12px"></div></div>
      </section>
    </div>`;
  main.appendChild(view);

  const stages = [
    ["Sessione autenticata", "Identità derivata dal server"],
    ["Appartenenza aula", "room_id e ruoli verificati"],
    ["Contesto didattico", "corso, lezione, sezione e selezione minimizzati"],
    ["Materiali autorizzati", "revocati e cross-room esclusi"],
    ["Retrieval", "soltanto chunk correnti e autorizzati"],
    ["Provider", "budget, timeout, fallback e output strutturato"],
    ["Grounding", "nessuna fonte inventata"],
    ["Citazioni", "locator e SHA-256 presenti"],
    ["Persistenza", "conversazione e messaggi attribuibili"],
    ["Apertura fonte", "integrità verificabile"],
    ["Feedback", "salvabile e revisionabile"],
    ["Memoria e azioni", "nessuna operazione automatica"],
  ];

  const scenario = () => document.getElementById("mvpScenario").value;
  const renderResult = (kind) => {
    const badge = document.getElementById("mvpResultBadge");
    const result = document.getElementById("mvpResult");
    const open = document.getElementById("openMvpSource");
    const feedback = [document.getElementById("mvpHelpful"), document.getElementById("mvpImprove")];
    open.disabled = true; feedback.forEach(node => node.disabled = true);
    if (kind === "success") {
      badge.className = "tag"; badge.textContent = "PASS";
      result.innerHTML = `
        <div class="row"><div class="meta"><strong>Risposta grounded</strong><small>Incertezza low · provider controllato · retrieval ibrido</small></div><span class="tag">Verificata</span></div>
        <div class="row"><div class="meta"><strong>[1] Manuale autorizzato</strong><small>char:120-286 · sha256=9d13b7…a90f</small></div><span class="tag violet">Citazione</span></div>
        <div class="row"><div class="meta"><strong>Memoria e azioni</strong><small>memory_written=false · actions_executed=false</small></div><span class="tag">0 operazioni</span></div>`;
      open.disabled = false; feedback.forEach(node => node.disabled = false);
    } else if (kind === "no-source") {
      badge.className = "tag warn"; badge.textContent = "NO SOURCE";
      result.innerHTML = `<div class="row"><div class="meta"><strong>Non trovo una fonte sufficiente</strong><small>grounded=false · uncertainty=high · citations=[]</small></div><span class="tag warn">Limite dichiarato</span></div>`;
    } else if (kind === "cross-room") {
      badge.className = "tag red"; badge.textContent = "403";
      result.innerHTML = `<div class="row"><div class="meta"><strong>Materiale non autorizzato</strong><small>Il gate si arresta prima del retrieval.</small></div><span class="tag red">Bloccato</span></div>`;
    } else if (kind === "provider-down") {
      badge.className = "tag warn"; badge.textContent = "503";
      result.innerHTML = `<div class="row"><div class="meta"><strong>Provider indisponibile</strong><small>Errore redatto; nessuna risposta o costo duplicato.</small></div><span class="tag warn">Fallback/gate</span></div>`;
    } else {
      badge.className = "tag red"; badge.textContent = "OFF";
      result.innerHTML = `<div class="row"><div class="meta"><strong>Eve disattivata</strong><small>L'app continua a funzionare senza aprire il flusso MVP.</small></div><span class="tag red">Feature flag</span></div>`;
    }
  };

  button.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(node => node.classList.toggle("active", node === view));
    document.querySelectorAll(".nav button").forEach(node => node.classList.toggle("active", node === button));
    document.getElementById("pageTitle").textContent = "Gate MVP";
    document.getElementById("pageSubtitle").textContent = "Verifica il primo percorso reale completo di Eve.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.getElementById("runMvpGate").addEventListener("click", async event => {
    const run = event.currentTarget; run.disabled = true;
    const chosen = scenario();
    const list = document.getElementById("mvpGateStages");
    list.innerHTML = stages.map((item, index) => `<div class="row" data-mvp-stage="${index}"><div class="meta"><strong>${index + 1}. ${item[0]}</strong><small>${item[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    const stopAt = chosen === "disabled" ? 0 : chosen === "cross-room" ? 3 : chosen === "provider-down" ? 5 : stages.length;
    window.EveAnimationLibrary?.setState?.("eve-processing");
    for (let index = 0; index < stages.length; index += 1) {
      const tag = list.querySelector(`[data-mvp-stage="${index}"] .tag`);
      if (index === stopAt && chosen !== "success" && chosen !== "no-source") {
        tag.className = "tag red"; tag.textContent = "Bloccato"; break;
      }
      tag.className = "tag violet"; tag.textContent = "Verifica";
      await new Promise(resolve => setTimeout(resolve, 105));
      tag.className = "tag"; tag.textContent = "PASS";
    }
    renderResult(chosen);
    window.EveAnimationLibrary?.setState?.(chosen === "success" || chosen === "no-source" ? "eve-success" : "eve-warning");
    run.disabled = false;
  });

  document.getElementById("openMvpSource").addEventListener("click", () => {
    document.getElementById("mvpSourceResult").innerHTML = `<div class="row"><div class="meta"><strong>Passaggio verificato</strong><small>Locator e SHA-256 corrispondono. instructions_executable=false.</small></div><span class="tag">Integrità OK</span></div>`;
  });
  const feedback = label => {
    document.getElementById("mvpFeedbackResult").innerHTML = `<div class="row"><div class="meta"><strong>${label}</strong><small>Attribuito all'utente; non aggiorna automaticamente prompt, memoria o modello.</small></div><span class="tag">Salvato</span></div>`;
  };
  document.getElementById("mvpHelpful").addEventListener("click", () => feedback("Feedback positivo"));
  document.getElementById("mvpImprove").addEventListener("click", () => feedback("Feedback critico"));

  if (new URLSearchParams(location.search).get("preview") === "core-1.7") button.click();
})();
