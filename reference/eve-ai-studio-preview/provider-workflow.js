(() => {
  document.querySelectorAll("h3,p,small,strong").forEach(node => {
    node.textContent = node.textContent
      .replaceAll("Eve 0.6-preview", "Eve 0.7-preview")
      .replaceAll("Checkpoint 0.6 integrato", "Checkpoint 0.7 integrato");
  });

  const dashboardCheckpoint = [...document.querySelectorAll(".panel-head h3")]
    .find(node => node.textContent.includes("Checkpoint 0.7 integrato"));
  if (dashboardCheckpoint) {
    const panel = dashboardCheckpoint.closest(".panel");
    panel.querySelector(".panel-head p").textContent =
      "Provider, modelli, profili, retry, fallback, budget e telemetria controllata.";
    const tag = panel.querySelector(".panel-head .tag");
    if (tag) tag.textContent = "28 test specifici";
    const heading = panel.querySelector(".panel-body h2");
    if (heading) heading.textContent = "2 provider · 3 modelli · 3 profili";
    const paragraph = panel.querySelector(".panel-body p");
    if (paragraph) paragraph.textContent =
      "I provider esterni restano disattivati. Chat e valutazioni usano profili diversi con timeout, retry, fallback e limiti di spesa applicati dal server.";
    const button = panel.querySelector("[data-go]");
    if (button) {
      button.dataset.go = "providers";
      button.textContent = "Apri provider";
    }
  }

  const nav = document.querySelector(".nav");
  const testsButton = nav?.querySelector('[data-view="tests"]');
  if (!nav || !testsButton || document.getElementById("providers")) return;

  const providerButton = document.createElement("button");
  providerButton.dataset.view = "providers";
  providerButton.innerHTML = '<span class="ico">⌘</span>Provider e modelli';
  testsButton.insertAdjacentElement("afterend", providerButton);

  const providerView = document.createElement("section");
  providerView.id = "providers";
  providerView.className = "view";
  providerView.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div>
            <h3>Registro provider e modelli</h3>
            <p>Checkpoint 0.7 — catalogo controllato, profili, budget e telemetria senza contenuti delle conversazioni.</p>
          </div>
          <span class="tag" id="providerExternalBadge">Esterni disattivati</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Provider registrati</small><strong>2</strong><div class="progress"><span style="width:66%"></span></div></div>
            <div class="metric"><small>Modelli registrati</small><strong>3</strong><div class="progress"><span style="width:75%"></span></div></div>
            <div class="metric"><small>Profili</small><strong>3</strong><div class="progress"><span style="width:100%"></span></div></div>
            <div class="metric"><small>Test Checkpoint 0.7</small><strong>28/28</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Provider</h3><p>Un solo provider è utilizzabile. Quello esterno è un segnaposto bloccato.</p></div>
          <span class="pill">2 registrati</span>
        </div>
        <div class="panel-body list" id="providerCatalogList"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Modelli</h3><p>Prezzi e finestre di contesto sono dichiarati nel registro.</p></div>
          <span class="pill">2 attivi · 1 disattivato</span>
        </div>
        <div class="panel-body list" id="providerModelList"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Profili di esecuzione</h3><p>Chat, valutazioni ed eventuale revisione esterna non condividono automaticamente le stesse regole.</p></div>
          <span class="tag violet">Server-side</span>
        </div>
        <div class="panel-body list" id="providerProfileList"></div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Budget giornaliero demo</h3><p>La telemetria salva token stimati e costi, non il testo della conversazione.</p></div>
          <span class="pill" id="providerTelemetryCount">0 eventi</span>
        </div>
        <div class="panel-body">
          <div class="kpi"><span>Token usati</span><b id="providerDailyTokens">0</b></div>
          <div class="progress"><span id="providerTokenProgress" style="width:0%"></span></div>
          <div class="kpi"><span>Costo stimato</span><b id="providerDailyCost">$0,000000</b></div>
          <div class="progress"><span style="width:0%;background:var(--green)"></span></div>
          <div class="row" style="margin-top:12px">
            <div class="meta"><strong>Contenuto salvato</strong><small>Solo hash, contatori, durata, modello e codice errore</small></div>
            <span class="tag">Redatto</span>
          </div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Simulatore di orchestrazione</h3><p>Verifica successo, retry, timeout con fallback e blocchi preventivi.</p></div>
          <span class="tag" id="providerSimulationBadge">Pronto</span>
        </div>
        <div class="panel-body">
          <div class="grid">
            <div class="span-5">
              <div class="form-grid">
                <div class="field">
                  <label for="providerProfileSelect">Profilo</label>
                  <select id="providerProfileSelect">
                    <option value="chat-development">chat-development</option>
                    <option value="evaluation-safe">evaluation-safe</option>
                    <option value="external-review">external-review · disattivato</option>
                  </select>
                </div>
                <div class="field">
                  <label for="providerSimulationMode">Comportamento</label>
                  <select id="providerSimulationMode">
                    <option value="success">Successo al primo tentativo</option>
                    <option value="retry">Errore transitorio e retry</option>
                    <option value="fallback">Timeout e fallback</option>
                    <option value="budget">Budget token superato</option>
                    <option value="external">Provider esterno bloccato</option>
                  </select>
                </div>
              </div>
              <button class="btn green" id="runProviderSimulation" style="width:100%;margin-top:12px">Esegui simulazione</button>
              <div class="list" id="providerSimulationStages" style="margin-top:12px"></div>
            </div>
            <div class="span-7">
              <div class="test-console" id="providerSimulationConsole">Eve Provider Orchestrator v0.7
external_providers_enabled=false
telemetry_content_stored=false
In attesa di esecuzione.</div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Telemetria delle esecuzioni</h3><p>Gli eventi sono consultabili senza messaggi, testo selezionato o risposte complete.</p></div>
          <button class="btn" id="clearProviderTelemetry">Azzera dati demo</button>
        </div>
        <div class="panel-body list" id="providerTelemetryList">
          <div class="empty">Nessuna esecuzione simulata.</div>
        </div>
      </section>
    </div>`;

  document.querySelector(".main")?.appendChild(providerView);

  const providers = [
    {key:"mock",label:"Provider mock deterministico",kind:"mock",enabled:true,note:"Nessuna rete, nessuna chiave e costo stimato pari a zero."},
    {key:"external-template",label:"Provider esterno non configurato",kind:"external",enabled:false,note:"Disattivato per impostazione predefinita e privo di credenziali."}
  ];
  const models = [
    {key:"eve-foundation-mock-v2",provider:"mock",enabled:true,context:"128.000",cost:"$0"},
    {key:"eve-foundation-mock-fallback-v1",provider:"mock",enabled:true,context:"64.000",cost:"$0"},
    {key:"external-model-placeholder",provider:"external-template",enabled:false,context:"—",cost:"non configurato"}
  ];
  const profiles = [
    {key:"chat-development",label:"Chat sviluppo sicura",targets:"mock v2",timeout:"2.000 ms",retry:"2 tentativi",budget:"12.000 token · $0"},
    {key:"evaluation-safe",label:"Valutazioni deterministiche",targets:"mock v2 → fallback v1",timeout:"1.500 ms",retry:"2 per target",budget:"16.000 token · $0"},
    {key:"external-review",label:"Revisione provider esterno",targets:"external-template",timeout:"15.000 ms",retry:"1 tentativo",budget:"20.000 token · $0,25",disabled:true}
  ];
  const telemetry = [];
  let telemetryId = 1;
  let dailyTokens = 0;

  function renderCatalog() {
    document.getElementById("providerCatalogList").innerHTML = providers.map(item => `
      <div class="row"><div class="meta"><strong>${item.label}</strong><small>${item.key} · ${item.kind} · ${item.note}</small></div><span class="${item.enabled ? "tag" : "tag red"}">${item.enabled ? "Attivo" : "Disattivato"}</span></div>`).join("");
    document.getElementById("providerModelList").innerHTML = models.map(item => `
      <div class="row"><div class="meta"><strong>${item.key}</strong><small>${item.provider} · contesto ${item.context} · costo ${item.cost}</small></div><span class="${item.enabled ? "tag" : "tag red"}">${item.enabled ? "Attivo" : "Bloccato"}</span></div>`).join("");
    document.getElementById("providerProfileList").innerHTML = profiles.map(item => `
      <div class="row"><div class="meta"><strong>${item.label}</strong><small>${item.key} · ${item.targets} · timeout ${item.timeout} · ${item.retry} · ${item.budget}</small></div><span class="${item.disabled ? "tag red" : "tag violet"}">${item.disabled ? "Disattivato" : "Disponibile"}</span></div>`).join("");
  }

  function renderTelemetry() {
    document.getElementById("providerTelemetryCount").textContent = `${telemetry.length} ${telemetry.length === 1 ? "evento" : "eventi"}`;
    document.getElementById("providerDailyTokens").textContent = dailyTokens.toLocaleString("it-IT");
    document.getElementById("providerTokenProgress").style.width = `${Math.min(100, dailyTokens / 2500)}%`;
    const list = document.getElementById("providerTelemetryList");
    list.innerHTML = telemetry.length ? telemetry.slice().reverse().map(item => `
      <div class="row"><div class="meta"><strong>#${item.id} · ${item.profile} · ${item.status}</strong><small>${item.provider}/${item.model} · tentativi ${item.attempts} · fallback ${item.fallback ? "sì" : "no"} · token ${item.tokens} · costo $0 · sha256 ${item.hash}…${item.error ? ` · errore ${item.error}` : ""}</small></div><span class="${item.status === "success" ? "tag" : "tag red"}">${item.status}</span></div>`).join("") : '<div class="empty">Nessuna esecuzione simulata.</div>';
  }

  const stages = [
    ["profile","Validazione profilo","Scopo, stato e autorizzazione dei provider esterni"],
    ["budget","Controllo budget","Token input, limite per run e uso giornaliero"],
    ["primary","Tentativo primario","Timeout e retry applicati dal server"],
    ["fallback","Fallback","Usato soltanto quando previsto dal profilo"],
    ["telemetry","Telemetria redatta","Hash, token, costo, durata e codici errore"]
  ];

  function renderStages(active = -1, completed = false, stoppedAt = -1) {
    document.getElementById("providerSimulationStages").innerHTML = stages.map((stage, index) => {
      let label = "In attesa";
      let className = "tag warn";
      if (index < active || completed) {
        label = stoppedAt === index ? "Bloccato" : "Completato";
        className = stoppedAt === index ? "tag red" : "tag";
      } else if (index === active) {
        label = "In corso";
        className = "tag violet";
      }
      if (stoppedAt >= 0 && index > stoppedAt) {
        label = "Non eseguito";
        className = "tag warn";
      }
      return `<div class="row"><div class="meta"><strong>${index + 1}. ${stage[1]}</strong><small>${stage[2]}</small></div><span class="${className}">${label}</span></div>`;
    }).join("");
  }

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function runSimulation() {
    const profile = document.getElementById("providerProfileSelect").value;
    const mode = document.getElementById("providerSimulationMode").value;
    const badge = document.getElementById("providerSimulationBadge");
    const button = document.getElementById("runProviderSimulation");
    const consoleNode = document.getElementById("providerSimulationConsole");
    button.disabled = true;
    badge.textContent = "In esecuzione";
    badge.className = "tag violet";
    consoleNode.textContent = `Eve Provider Orchestrator v0.7\nprofile=${profile}\nexternal_providers_enabled=false\n`;

    const blockedExternal = profile === "external-review" || mode === "external";
    const blockedBudget = mode === "budget";
    const stopStage = blockedExternal ? 0 : blockedBudget ? 1 : -1;

    for (let index = 0; index < stages.length; index += 1) {
      if (stopStage >= 0 && index > stopStage) break;
      renderStages(index);
      consoleNode.textContent += `[${index + 1}/5] ${stages[index][1]}…\n`;
      await wait(260);
      if (index === stopStage) break;
      if (mode === "retry" && index === 2) consoleNode.textContent += "attempt 1: RuntimeError redatto\nattempt 2: success\n";
      if (mode === "fallback" && index === 2) consoleNode.textContent += "primary: TimeoutError dopo 1.500 ms\n";
      if (mode === "fallback" && index === 3) consoleNode.textContent += "fallback: eve-foundation-mock-fallback-v1 success\n";
    }

    if (blockedExternal || blockedBudget) {
      renderStages(stopStage + 1, false, stopStage);
      const message = blockedExternal ? "Blocco preflight: provider esterno disattivato. Nessuna chiamata eseguita." : "Blocco preflight: budget token input superato. Nessuna chiamata eseguita.";
      consoleNode.textContent += `${message}\ntelemetry_event_created=false\n`;
      badge.textContent = "Bloccato prima della chiamata";
      badge.className = "tag red";
      button.disabled = false;
      return;
    }

    renderStages(stages.length, true);
    const attempts = mode === "success" ? 1 : 2;
    const fallback = mode === "fallback";
    const model = fallback ? "eve-foundation-mock-fallback-v1" : "eve-foundation-mock-v2";
    const tokens = profile === "evaluation-safe" ? 214 : 146;
    const hash = ["8f21c4ad","a730bc11","c9120ef5"][telemetry.length % 3];
    telemetry.push({id:telemetryId++,profile,status:"success",provider:"mock",model,attempts,fallback,tokens,hash});
    dailyTokens += tokens;
    renderTelemetry();
    consoleNode.textContent += `status=success\nattempts=${attempts}\nfallback_used=${fallback}\ninput_tokens=${Math.round(tokens * 0.42)}\noutput_tokens=${Math.round(tokens * 0.58)}\nestimated_cost_usd=0\nrequest_sha256=${hash}…\nresponse_content_stored=false\n`;
    badge.textContent = "Completato";
    badge.className = "tag";
    button.disabled = false;
    if (typeof notify === "function") notify("Orchestrazione simulata completata");
  }

  function openProviderView() {
    document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === "providers"));
    document.querySelectorAll(".nav button").forEach(button => button.classList.toggle("active", button === providerButton));
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Provider e modelli";
    if (subtitle) subtitle.textContent = "Controlla modelli, profili, fallback, budget e telemetria.";
    window.scrollTo({top:0,behavior:"smooth"});
  }

  providerButton.addEventListener("click", openProviderView);
  document.querySelectorAll('[data-go="providers"]').forEach(button => button.addEventListener("click", event => { event.preventDefault(); openProviderView(); }));
  document.getElementById("runProviderSimulation")?.addEventListener("click", runSimulation);
  document.getElementById("clearProviderTelemetry")?.addEventListener("click", () => {
    telemetry.length = 0;
    dailyTokens = 0;
    renderTelemetry();
    document.getElementById("providerSimulationConsole").textContent = "Telemetria demo azzerata. Nessun contenuto conversazionale era presente.";
  });

  renderCatalog();
  renderTelemetry();
  renderStages();
})();
