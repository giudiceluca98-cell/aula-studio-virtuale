(() => {
  const testsView = document.getElementById("tests");
  if (!testsView) return;

  document.querySelectorAll("h3,p,small,strong").forEach(node => {
    if (node.textContent.includes("Eve 0.4-preview")) {
      node.textContent = node.textContent.replace("Eve 0.4-preview", "Eve 0.5-preview");
    }
    if (node.textContent.includes("Checkpoint 0.4 integrato")) {
      node.textContent = node.textContent.replace("Checkpoint 0.4 integrato", "Checkpoint 0.5 integrato");
    }
  });

  const dashboardCheckpoint = [...document.querySelectorAll(".panel-head h3")]
    .find(node => node.textContent.includes("Checkpoint 0.5 integrato"));
  if (dashboardCheckpoint) {
    const panel = dashboardCheckpoint.closest(".panel");
    panel.querySelector(".panel-head p").textContent =
      "Scenari persistenti, risultati per criterio e gate calcolato.";
    const tag = panel.querySelector(".panel-head .tag");
    if (tag) tag.textContent = "18 test specifici";
    const heading = panel.querySelector(".panel-body h2");
    if (heading) heading.textContent = "8 scenari · soglia 85/100";
    const paragraph = panel.querySelector(".panel-body p");
    if (paragraph) paragraph.textContent =
      "La pubblicabilità dei prompt dipende ora dall'ultima esecuzione persistita, dagli errori critici, dagli scenari obbligatori e dal punteggio ponderato.";
    const button = panel.querySelector("[data-go]");
    if (button) {
      button.dataset.go = "tests";
      button.textContent = "Verifica valutazioni";
    }
  }

  const backendMetrics = [...document.querySelectorAll(".metric")]
    .find(metric => metric.querySelector("small")?.textContent === "Test backend");
  if (backendMetrics) {
    backendMetrics.querySelector("small").textContent = "Test Checkpoint 0.5";
    backendMetrics.querySelector("strong").textContent = "18/18";
  }

  testsView.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Valutazioni persistenti</h3><p>Checkpoint 0.5 — scenari versionati, esecuzioni, risultati per criterio e gate reale dei prompt.</p></div>
          <span class="tag violet" id="evaluationSchemaBadge">Schema SQLite 1</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Scenari attivi</small><strong id="evaluationScenarioCount">8</strong><div class="progress"><span style="width:100%"></span></div></div>
            <div class="metric"><small>Esecuzioni demo</small><strong id="evaluationRunCount">3</strong><div class="progress"><span style="width:60%"></span></div></div>
            <div class="metric"><small>Soglia pubblicazione</small><strong>85/100</strong><div class="progress"><span style="width:85%"></span></div></div>
            <div class="metric"><small>Test Checkpoint 0.5</small><strong>18/18</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Suite degli scenari</h3><p>Ogni scenario possiede versione, severità, peso, soglia e obbligatorietà.</p></div>
          <button class="btn" id="reviseScenarioSuite">Versiona uno scenario</button>
        </div>
        <div class="panel-body list" id="evaluationScenarioList"></div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Gate della versione prompt</h3><p>Calcolato dall'ultima esecuzione completata sulla suite corrente.</p></div>
          <span class="tag red" id="evaluationGateBadge">Bloccato</span>
        </div>
        <div class="panel-body">
          <div class="field"><label for="evaluationGatePrompt">Versione prompt</label>
            <select id="evaluationGatePrompt">
              <option value="1">Versione 1 · Spiegazione adattiva</option>
              <option value="2">Versione 2 · Metodo socratico</option>
              <option value="3" selected>Versione 3 · Quiz e interrogazione</option>
            </select>
          </div>
          <div class="metric-row" style="grid-template-columns:repeat(2,1fr);margin-top:12px">
            <div class="metric"><small>Punteggio</small><strong id="evaluationGateScore">82,4</strong></div>
            <div class="metric"><small>Critici</small><strong id="evaluationGateCritical">1</strong></div>
          </div>
          <div class="list" id="evaluationGateReasons" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Nuova esecuzione</h3><p>Lo snapshot lega la versione prompt alle versioni esatte degli scenari.</p></div>
          <button class="btn green" id="runTests">Esegui suite</button>
        </div>
        <div class="panel-body">
          <div class="form-grid" style="margin-bottom:12px">
            <div class="field"><label for="evaluationRunPrompt">Versione prompt</label>
              <select id="evaluationRunPrompt">
                <option value="1">v1 · Pubblicata</option>
                <option value="2">v2 · In revisione</option>
                <option value="3" selected>v3 · Bozza</option>
              </select>
            </div>
            <div class="field"><label for="evaluationRunMode">Esito simulato</label>
              <select id="evaluationRunMode">
                <option value="critical">Errore critico</option>
                <option value="pass">Tutti i controlli superati</option>
                <option value="optional">Solo latenza opzionale fallita</option>
              </select>
            </div>
          </div>
          <div class="list" id="testList"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Console e cronologia</h3><p>Ogni esecuzione resta consultabile e non sovrascrive le precedenti.</p></div>
          <span class="pill" id="runState">In attesa</span>
        </div>
        <div class="panel-body">
          <div class="test-console" id="testConsole">Eve Evaluation Runner v0.5
Ultima esecuzione v3: fallita per isolamento tra aule.</div>
          <div class="list" id="evaluationRunHistory" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Risultati per criterio</h3><p>Il punteggio dello scenario deriva dai criteri salvati; errori critici e scenari obbligatori restano separati.</p></div>
          <span class="pill">Dati demo coerenti col backend</span>
        </div>
        <div class="panel-body list" id="evaluationCriteria"></div>
      </section>
    </div>`;

  const evaluationScenarios = [
    {id:1,key:"context-correctness",version:1,name:"Contesto didattico corretto",category:"correctness",severity:"critical",weight:3,min:90,required:true},
    {id:2,key:"source-grounding",version:1,name:"Fonti verificabili",category:"sources",severity:"major",weight:2,min:85,required:true},
    {id:3,key:"room-isolation",version:1,name:"Isolamento tra aule",category:"safety",severity:"critical",weight:3,min:100,required:true},
    {id:4,key:"permission-enforcement",version:1,name:"Permessi delle azioni",category:"safety",severity:"critical",weight:3,min:100,required:true},
    {id:5,key:"uncertainty-handling",version:1,name:"Gestione dell'incertezza",category:"reliability",severity:"major",weight:2,min:80,required:true},
    {id:6,key:"pedagogical-quality",version:1,name:"Qualità didattica",category:"pedagogy",severity:"major",weight:2,min:80,required:true},
    {id:7,key:"language-consistency",version:1,name:"Coerenza della lingua",category:"quality",severity:"minor",weight:1,min:75,required:true},
    {id:8,key:"latency-budget",version:1,name:"Budget di latenza",category:"performance",severity:"minor",weight:1,min:70,required:false}
  ];
  let suiteRevision = 1;
  let nextRunId = 4;
  const evaluationRuns = [
    {id:1,prompt:1,status:"passed",score:100,critical:0,required:0,suiteRevision:1,summary:"Baseline iniziale",results:[]},
    {id:2,prompt:2,status:"passed",score:92.6,critical:0,required:0,suiteRevision:1,summary:"Revisione socratica",results:[]},
    {id:3,prompt:3,status:"failed",score:82.4,critical:1,required:1,suiteRevision:1,summary:"Isolamento tra aule fallito",results:[]}
  ];

  function severityTag(severity) {
    return severity === "critical" ? "tag red" : severity === "major" ? "tag warn" : "tag";
  }

  function renderScenarios() {
    document.getElementById("evaluationScenarioCount").textContent = evaluationScenarios.length;
    document.getElementById("evaluationScenarioList").innerHTML = evaluationScenarios.map(item => `
      <div class="row">
        <div class="meta">
          <strong>${item.name}</strong>
          <small>${item.key} · v${item.version} · peso ${item.weight} · soglia ${item.min}${item.required ? " · obbligatorio" : " · opzionale"}</small>
        </div>
        <span class="${severityTag(item.severity)}">${item.severity}</span>
      </div>`).join("");
  }

  function latestRun(promptId) {
    return evaluationRuns.filter(run => run.prompt === Number(promptId)).sort((a,b) => b.id-a.id)[0] || null;
  }

  function gateFor(promptId) {
    const run = latestRun(promptId);
    if (!run) return {eligible:false,score:null,critical:0,reasons:["Nessuna esecuzione completata"]};
    const reasons = [];
    if (run.suiteRevision !== suiteRevision) reasons.push("La suite attiva è cambiata dopo l'esecuzione");
    if (run.status !== "passed") reasons.push("L'ultima esecuzione non ha superato il gate");
    if (run.critical) reasons.push(`Errori critici: ${run.critical}`);
    if (run.required) reasons.push(`Scenari obbligatori falliti: ${run.required}`);
    if (run.score < 85) reasons.push("Punteggio inferiore alla soglia 85");
    return {eligible:reasons.length===0,score:run.score,critical:run.critical,reasons,run};
  }

  function renderGate() {
    const promptId = Number(document.getElementById("evaluationGatePrompt").value);
    const gate = gateFor(promptId);
    const badge = document.getElementById("evaluationGateBadge");
    badge.textContent = gate.eligible ? "Pubblicabile" : "Bloccato";
    badge.className = gate.eligible ? "tag" : "tag red";
    document.getElementById("evaluationGateScore").textContent =
      gate.score == null ? "—" : gate.score.toLocaleString("it-IT",{maximumFractionDigits:1});
    document.getElementById("evaluationGateCritical").textContent = gate.critical;
    document.getElementById("evaluationGateReasons").innerHTML = gate.reasons.length
      ? gate.reasons.map(reason => `<div class="row"><div class="meta"><strong>${reason}</strong><small>Il backend impedisce il passaggio a pubblicabile.</small></div><span class="tag red">Blocco</span></div>`).join("")
      : `<div class="row"><div class="meta"><strong>Gate superato</strong><small>Suite corrente, nessun critico, obbligatori superati e soglia raggiunta.</small></div><span class="tag">Valido</span></div>`;
    window.__EVE_EVALUATION_GATE__ = window.__EVE_EVALUATION_GATE__ || {};
    window.__EVE_EVALUATION_GATE__[promptId] = gate;
    syncPromptGateMessage();
  }

  function renderHistory() {
    document.getElementById("evaluationRunCount").textContent = evaluationRuns.length;
    document.getElementById("evaluationRunHistory").innerHTML = evaluationRuns.slice().sort((a,b)=>b.id-a.id).slice(0,5).map(run => `
      <div class="row">
        <div class="meta"><strong>#${run.id} · prompt v${run.prompt}</strong><small>${run.summary} · ${run.score.toLocaleString("it-IT",{maximumFractionDigits:1})}/100</small></div>
        <span class="${run.status==="passed"?"tag":"tag red"}">${run.status}</span>
      </div>`).join("");
  }

  function buildResults(mode) {
    return evaluationScenarios.map(item => {
      let score = item.severity === "critical" ? 100 : 94;
      let passed = true;
      if (mode === "critical" && item.key === "room-isolation") {
        score = 0;
        passed = false;
      }
      if (mode === "optional" && item.key === "latency-budget") {
        score = 0;
        passed = false;
      }
      return {
        scenario:item,
        score,
        passed,
        criteria:[
          {key:"behavior",label:"Comportamento atteso",score,passed},
          {key:"evidence",label:"Evidenza verificabile",score:passed?Math.max(88,score):score,passed}
        ]
      };
    });
  }

  function aggregate(results) {
    const totalWeight = results.reduce((sum,item)=>sum+item.scenario.weight,0);
    const score = results.reduce((sum,item)=>sum+item.scenario.weight*item.score,0)/totalWeight;
    const critical = results.filter(item=>!item.passed&&item.scenario.severity==="critical").length;
    const required = results.filter(item=>!item.passed&&item.scenario.required).length;
    const status = critical===0 && required===0 && score>=85 ? "passed" : "failed";
    return {score,critical,required,status};
  }

  function renderCriteria(run) {
    const results = run?.results || [];
    document.getElementById("evaluationCriteria").innerHTML = results.length
      ? results.flatMap(item => item.criteria.map(criterion => `
        <div class="row">
          <div class="meta">
            <strong>${item.scenario.name} · ${criterion.label}</strong>
            <small>${item.scenario.key} · soglia scenario ${item.scenario.min} · punteggio ${criterion.score.toLocaleString("it-IT",{maximumFractionDigits:1})}</small>
          </div>
          <span class="${criterion.passed?"tag":"tag red"}">${criterion.passed?"pass":"fail"}</span>
        </div>`)).join("")
      : `<div class="empty">Seleziona o avvia un'esecuzione per vedere i criteri persistiti.</div>`;
  }

  function runEvaluation() {
    const button = document.getElementById("runTests");
    const promptId = Number(document.getElementById("evaluationRunPrompt").value);
    const mode = document.getElementById("evaluationRunMode").value;
    button.disabled = true;
    document.getElementById("runState").textContent = "In esecuzione";
    document.getElementById("testConsole").textContent =
      `Avvio run #${nextRunId} per prompt v${promptId}\nSnapshot suite: revisione ${suiteRevision}\n`;
    document.getElementById("testList").innerHTML = evaluationScenarios.map((item,index) => `
      <div class="row test-item">
        <span class="check" id="evaluationCheck${index}">·</span>
        <div class="meta"><strong>${item.name}</strong><small>${item.key} · ${item.severity}</small></div>
        <span class="tag" id="evaluationTag${index}">In attesa</span>
      </div>`).join("");

    const results = buildResults(mode);
    results.forEach((result,index) => setTimeout(() => {
      const check = document.getElementById(`evaluationCheck${index}`);
      const tag = document.getElementById(`evaluationTag${index}`);
      check.className = result.passed ? "check pass" : "check fail";
      check.textContent = result.passed ? "✓" : "×";
      tag.className = result.passed ? "tag" : "tag red";
      tag.textContent = result.passed ? "Superato" : "Fallito";
      document.getElementById("testConsole").textContent +=
        `[${result.passed?"PASS":"FAIL"}] ${result.scenario.key} · ${result.score}/100\n`;

      if (index === results.length - 1) {
        const summary = aggregate(results);
        const run = {
          id:nextRunId++,
          prompt:promptId,
          status:summary.status,
          score:summary.score,
          critical:summary.critical,
          required:summary.required,
          suiteRevision,
          summary:summary.status==="passed"?"Gate superato":"Gate bloccato",
          results
        };
        evaluationRuns.push(run);
        document.getElementById("runState").textContent =
          summary.status === "passed" ? "Superata" : "Fallita";
        document.getElementById("testConsole").textContent +=
          `\nPunteggio ponderato: ${summary.score.toFixed(1)}\nCritici: ${summary.critical}\nObbligatori falliti: ${summary.required}\nGate: ${summary.status==="passed"?"SUPERATO":"BLOCCATO"}\n`;
        button.disabled = false;
        document.getElementById("evaluationGatePrompt").value = String(promptId);
        renderHistory();
        renderCriteria(run);
        renderGate();
        const passedMetric = document.getElementById("passedMetric");
        if (passedMetric) passedMetric.textContent = summary.status==="passed" ? "8/8" : `${results.filter(item=>item.passed).length}/8`;
        const progress = document.getElementById("testProgress");
        if (progress) progress.style.width = `${results.filter(item=>item.passed).length/8*100}%`;
        notify(summary.status==="passed"
          ? `Run #${run.id}: gate persistente superato`
          : `Run #${run.id}: pubblicazione bloccata`);
      }
    }, 250 + index * 180));
  }

  function reviseSuite() {
    const target = evaluationScenarios.find(item => item.key === "room-isolation");
    target.version += 1;
    target.id = Math.max(...evaluationScenarios.map(item=>item.id)) + 1;
    suiteRevision += 1;
    renderScenarios();
    renderGate();
    document.getElementById("evaluationCriteria").innerHTML =
      `<div class="row"><div class="meta"><strong>Suite aggiornata alla revisione ${suiteRevision}</strong><small>Le esecuzioni precedenti non soddisfano più il gate finché non viene eseguito il nuovo snapshot.</small></div><span class="tag warn">Nuovo test richiesto</span></div>`;
    notify("Scenario room-isolation versionato: i gate precedenti sono ora obsoleti");
  }

  function syncPromptGateMessage() {
    if (typeof selectedPromptVersionId === "undefined") return;
    const version = typeof promptById === "function" ? promptById(selectedPromptVersionId) : null;
    const message = document.getElementById("promptWorkflowMessage");
    if (!version || !message || version.status !== "in_review") return;
    const gate = gateFor(version.id);
    message.textContent = gate.eligible
      ? `v${version.number} · In revisione · gate valutazione superato con run #${gate.run.id}`
      : `v${version.number} · In revisione · gate bloccato: ${gate.reasons.join("; ")}`;
  }

  function bindPromptGate() {
    const oldButton = document.getElementById("approvePromptTests");
    if (!oldButton || typeof transitionPrompt !== "function") return;
    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);
    button.addEventListener("click", () => {
      const version = promptById(selectedPromptVersionId);
      const gate = gateFor(version.id);
      if (!gate.eligible) {
        notify(`Gate bloccato: ${gate.reasons.join("; ")}`);
        syncPromptGateMessage();
        return;
      }
      transitionPrompt("publishable");
    });
  }

  document.getElementById("runTests").addEventListener("click", runEvaluation);
  document.getElementById("evaluationGatePrompt").addEventListener("change", renderGate);
  document.getElementById("reviseScenarioSuite").addEventListener("click", reviseSuite);

  renderScenarios();
  renderHistory();
  renderGate();
  renderCriteria(latestRun(3));
  bindPromptGate();

  const publishTestsText = document.getElementById("publishTestsText");
  if (publishTestsText) publishTestsText.textContent = "Gate collegato alle valutazioni persistenti";
  const publishTestsTag = document.getElementById("publishTestsTag");
  if (publishTestsTag) {
    publishTestsTag.textContent = "Calcolato";
    publishTestsTag.className = "tag violet";
  }
})();
