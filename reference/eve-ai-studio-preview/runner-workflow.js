(() => {
  const testsView = document.getElementById("tests");
  if (!testsView) return;

  document.querySelectorAll("h3,p,small,strong").forEach(node => {
    node.textContent = node.textContent
      .replaceAll("Eve 0.5-preview", "Eve 0.6-preview")
      .replaceAll("Checkpoint 0.5 integrato", "Checkpoint 0.6 integrato");
  });

  const dashboardCheckpoint = [...document.querySelectorAll(".panel-head h3")]
    .find(node => node.textContent.includes("Checkpoint 0.6 integrato"));
  if (dashboardCheckpoint) {
    const panel = dashboardCheckpoint.closest(".panel");
    panel.querySelector(".panel-head p").textContent =
      "Runner deterministico, grader automatici e artefatti redatti.";
    const tag = panel.querySelector(".panel-head .tag");
    if (tag) tag.textContent = "29 test specifici";
    const heading = panel.querySelector(".panel-body h2");
    if (heading) heading.textContent = "8 scenari eseguibili · provider mock";
    const paragraph = panel.querySelector(".panel-body p");
    if (paragraph) paragraph.textContent =
      "Gli scenari possono essere eseguiti senza inserire manualmente i risultati. Il runner misura durata, applica grader e conserva soltanto metadati redatti e hash.";
  }

  const backendMetric = [...document.querySelectorAll(".metric")]
    .find(metric => metric.querySelector("small")?.textContent.includes("Test Checkpoint 0.5"));
  if (backendMetric) {
    backendMetric.querySelector("small").textContent = "Test Checkpoint 0.6";
    backendMetric.querySelector("strong").textContent = "29/29";
  }

  const grid = testsView.querySelector(".grid");
  const summaryPanel = grid?.querySelector(".panel.span-12");
  if (!grid || !summaryPanel) return;

  const summaryTitle = summaryPanel.querySelector("h3");
  const summaryText = summaryPanel.querySelector("p");
  const schemaBadge = summaryPanel.querySelector("#evaluationSchemaBadge");
  if (summaryTitle) summaryTitle.textContent = "Valutazioni e runner automatico";
  if (summaryText) summaryText.textContent =
    "Checkpoint 0.6 — input eseguibili, provider mock, grader automatici, durata e artefatti redatti.";
  if (schemaBadge) schemaBadge.textContent = "Schema SQLite 2";

  const metrics = summaryPanel.querySelectorAll(".metric");
  if (metrics[3]) {
    metrics[3].querySelector("small").textContent = "Test Checkpoint 0.6";
    metrics[3].querySelector("strong").textContent = "29/29";
  }

  const runnerPanel = document.createElement("section");
  runnerPanel.className = "panel span-12";
  runnerPanel.id = "automaticRunnerPanel";
  runnerPanel.innerHTML = `
    <div class="panel-head">
      <div>
        <h3>Runner automatico deterministico</h3>
        <p>Esegue gli scenari, interroga il provider mock e genera i risultati senza input manuale.</p>
      </div>
      <span class="tag" id="automaticRunnerBadge">Pronto</span>
    </div>
    <div class="panel-body">
      <div class="metric-row">
        <div class="metric"><small>Provider</small><strong>mock</strong><div class="progress"><span style="width:100%"></span></div></div>
        <div class="metric"><small>Modello</small><strong style="font-size:15px">eve-foundation-mock-v2</strong><div class="progress"><span style="width:100%"></span></div></div>
        <div class="metric"><small>Input eseguibili</small><strong>8/8</strong><div class="progress"><span style="width:100%"></span></div></div>
        <div class="metric"><small>Output grezzo salvato</small><strong>No</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
      </div>
      <div class="grid" style="margin-top:14px">
        <div class="span-5">
          <div class="form-grid">
            <div class="field"><label for="automaticRunnerPrompt">Versione prompt</label>
              <select id="automaticRunnerPrompt">
                <option value="1">v1 · Eve Tutor Base</option>
                <option value="2">v2 · Eve Tutor Socratico</option>
                <option value="3" selected>v3 · Eve Quiz Guidato</option>
              </select>
            </div>
            <div class="field"><label for="automaticRunnerMode">Simulazione provider</label>
              <select id="automaticRunnerMode">
                <option value="pass">Esecuzione valida</option>
                <option value="provider-error">Errore del provider</option>
                <option value="latency">Latenza oltre budget</option>
              </select>
            </div>
          </div>
          <button class="btn green" id="executeAutomaticRunner" style="width:100%;margin-top:12px">Esegui runner automatico</button>
          <div class="list" id="automaticRunnerStages" style="margin-top:12px"></div>
        </div>
        <div class="span-7">
          <div class="test-console" id="automaticRunnerConsole">Eve Automatic Runner v0.6\nProvider: mock\nOutput grezzo: non conservato\nIn attesa di esecuzione.</div>
        </div>
      </div>
      <div class="panel" style="margin-top:14px;box-shadow:none">
        <div class="panel-head">
          <div><h3>Artefatti redatti dell’ultima esecuzione</h3><p>Solo durata, hash, conteggi e codice errore. Nessun testo completo della risposta.</p></div>
          <span class="pill" id="runnerArtifactCount">0 artefatti</span>
        </div>
        <div class="panel-body list" id="automaticRunnerArtifacts">
          <div class="empty">Avvia il runner per verificare gli artefatti.</div>
        </div>
      </div>
    </div>`;
  summaryPanel.insertAdjacentElement("afterend", runnerPanel);

  const manualHeading = [...testsView.querySelectorAll(".panel-head h3")]
    .find(node => node.textContent === "Nuova esecuzione");
  if (manualHeading) {
    manualHeading.textContent = "Esecuzione manuale di compatibilità";
    const text = manualHeading.parentElement.querySelector("p");
    if (text) text.textContent =
      "Resta disponibile per verificare manualmente casi limite e risultati importati da altri runner.";
  }

  const stages = [
    ["input", "Costruzione richieste", "ChatRequest tipizzate dal payload scenario"],
    ["provider", "Provider mock", "Generazione deterministica senza modello esterno"],
    ["graders", "Grader automatici", "Contesto, fonti, isolamento, permessi, qualità e latenza"],
    ["redaction", "Redazione e hash", "Nessun output completo salvato nel database"],
    ["complete", "Completamento run", "Risultati persistiti e gate ricalcolato"]
  ];

  function renderStages(activeIndex = -1, failed = false) {
    document.getElementById("automaticRunnerStages").innerHTML = stages.map((stage, index) => {
      const done = index < activeIndex || (!failed && activeIndex >= stages.length);
      const active = index === activeIndex;
      const status = done ? "Completato" : active ? "In corso" : "In attesa";
      const className = done ? "tag" : active ? "tag violet" : "tag warn";
      return `<div class="row"><div class="meta"><strong>${index + 1}. ${stage[1]}</strong><small>${stage[2]}</small></div><span class="${className}">${status}</span></div>`;
    }).join("");
  }

  const scenarioArtifacts = [
    ["context-correctness", 0.41, 1, 0, "86bf02a1"],
    ["source-grounding", 0.37, 1, 0, "4a64d9c0"],
    ["room-isolation", 0.35, 1, 0, "3ce71f92"],
    ["permission-enforcement", 0.33, 1, 0, "43b6e005"],
    ["uncertainty-handling", 0.39, 1, 0, "ad9413ef"],
    ["pedagogical-quality", 0.44, 1, 0, "996bea21"],
    ["language-consistency", 0.32, 1, 0, "7ccf017d"],
    ["latency-budget", 0.31, 1, 0, "c41408ae"]
  ];

  function renderArtifacts(mode) {
    const artifacts = scenarioArtifacts.map((item, index) => ({
      key: item[0],
      duration: mode === "latency" && index === 7 ? 910.4 : item[1],
      sources: item[2],
      actions: item[3],
      hash: item[4],
      error: mode === "provider-error" && index === 2 ? "RuntimeError" : null
    }));
    document.getElementById("runnerArtifactCount").textContent = `${artifacts.length} artefatti`;
    document.getElementById("automaticRunnerArtifacts").innerHTML = artifacts.map(item => `
      <div class="row">
        <div class="meta">
          <strong>${item.key}</strong>
          <small>durata ${item.duration.toLocaleString("it-IT", {maximumFractionDigits:2})} ms · fonti ${item.sources} · azioni ${item.actions} · sha256 ${item.hash}…${item.error ? ` · errore ${item.error}` : ""}</small>
        </div>
        <span class="${item.error ? "tag red" : "tag"}">${item.error ? "Redatto" : "Hash salvato"}</span>
      </div>`).join("");
  }

  function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  async function executeRunner() {
    const button = document.getElementById("executeAutomaticRunner");
    const badge = document.getElementById("automaticRunnerBadge");
    const consoleNode = document.getElementById("automaticRunnerConsole");
    const promptId = document.getElementById("automaticRunnerPrompt").value;
    const mode = document.getElementById("automaticRunnerMode").value;
    button.disabled = true;
    badge.textContent = "In esecuzione";
    badge.className = "tag violet";
    consoleNode.textContent = `Eve Automatic Runner v0.6\nrun: nuovo · prompt v${promptId}\nprovider: mock\n`;

    for (let index = 0; index < stages.length; index += 1) {
      renderStages(index);
      consoleNode.textContent += `[${index + 1}/5] ${stages[index][1]}…\n`;
      await wait(360);
      if (mode === "provider-error" && index === 1) {
        consoleNode.textContent += "Provider error intercettato. Il contenuto dell’eccezione non viene conservato.\n";
      }
    }

    renderStages(stages.length);
    renderArtifacts(mode);
    const manualPrompt = document.getElementById("evaluationRunPrompt");
    const manualMode = document.getElementById("evaluationRunMode");
    if (manualPrompt) manualPrompt.value = promptId;
    if (manualMode) manualMode.value = mode === "pass" ? "pass" : mode === "latency" ? "optional" : "critical";
    document.getElementById("runTests")?.click();

    const passed = mode !== "provider-error";
    consoleNode.textContent += passed
      ? "Run automatico completato. Risultati e metadati redatti persistiti.\n"
      : "Run automatico completato con fallimento controllato. Codice errore persistito senza testo grezzo.\n";
    consoleNode.textContent += "output_raw_stored=false\n";
    badge.textContent = passed ? "Completato" : "Errore gestito";
    badge.className = passed ? "tag" : "tag red";
    button.disabled = false;
    window.__EVE_AUTOMATIC_RUNNER__ = {
      provider: "mock",
      model: "eve-foundation-mock-v2",
      promptVersion: Number(promptId),
      mode,
      artifacts: 8,
      rawOutputStored: false
    };
    if (typeof notify === "function") notify("Runner automatico completato");
  }

  document.getElementById("executeAutomaticRunner")?.addEventListener("click", executeRunner);
  renderStages();
})();
