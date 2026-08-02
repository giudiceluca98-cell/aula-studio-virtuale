(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-provider-runtime")) return;
  const button = document.createElement("button");
  button.dataset.view = "core-provider-runtime";
  button.innerHTML = '<span class="ico">AI</span>Provider reale';
  const panelButton = nav.querySelector('[data-view="core-eve-panel"]');
  (panelButton || nav.lastElementChild)?.insertAdjacentElement("afterend", button);
  const view = document.createElement("section");
  view.id = "core-provider-runtime";
  view.className = "view";
  view.innerHTML = `<div class="grid">
    <section class="panel span-12"><div class="panel-head"><div><h3>Provider AI reale controllato</h3><p>CORE-1.6 — chiavi solo server-side, output JSON, budget, rate limit, timeout, fallback mock e circuit breaker.</p></div><span class="tag violet">CORE-1.6 · alpha.15</span></div><div class="panel-body"><div class="metric-row"><div class="metric"><small>Provider esterno</small><strong>OFF</strong><div class="progress"><span style="width:18%;background:var(--warn)"></span></div></div><div class="metric"><small>Fallback</small><strong>Mock</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div><div class="metric"><small>Rate limit</small><strong>30/min</strong><div class="progress"><span style="width:60%"></span></div></div><div class="metric"><small>Circuit</small><strong>3 errori</strong><div class="progress"><span style="width:45%;background:var(--violet)"></span></div></div></div></div></section>
    <section class="panel span-7"><div class="panel-head"><div><h3>Simula un'esecuzione</h3><p>La preview non contatta provider e non legge chiavi: mostra soltanto le transizioni previste.</p></div><span class="pill">Simulazione UI dichiarata</span></div><div class="panel-body"><div class="form-grid"><div class="field"><label for="providerScenario">Scenario</label><select id="providerScenario"><option value="success">Provider reale disponibile</option><option value="fallback">Timeout e fallback mock</option><option value="budget">Budget esaurito</option><option value="circuit">Circuit breaker aperto</option><option value="rate">Rate limit raggiunto</option></select></div><div class="field"><label for="providerProfile">Profilo</label><select id="providerProfile"><option>chat-production</option><option>chat-development</option></select></div></div><button class="btn green" id="runProviderScenario" style="width:100%;margin-top:12px">Esegui simulazione</button><div class="list" id="providerScenarioStages" style="margin-top:12px"></div></div></section>
    <section class="panel span-5"><div class="panel-head"><div><h3>Confini di sicurezza</h3><p>Nessuna capacità dipende soltanto dal client.</p></div><span class="tag warn">Fail closed</span></div><div class="panel-body list"><div class="row"><div class="meta"><strong>Segreti</strong><small>Solo EVE_EXTERNAL_PROVIDER_API_KEY server-side; mai telemetria o browser</small></div><span class="tag">Redatti</span></div><div class="row"><div class="meta"><strong>Output</strong><small>JSON validato; markdown o schema errato vengono rifiutati</small></div><span class="tag">Strutturato</span></div><div class="row"><div class="meta"><strong>Budget</strong><small>Limiti per esecuzione e giornalieri prima e dopo la risposta</small></div><span class="tag">Bloccanti</span></div><div class="row"><div class="meta"><strong>Azioni</strong><small>Il provider propone dati, ma non può eseguire strumenti</small></div><span class="tag red">Non eseguite</span></div></div></section>
  </div>`;
  main.appendChild(view);
  const open = () => { document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node === view)); document.querySelectorAll(".nav button").forEach((node) => node.classList.toggle("active", node === button)); document.getElementById("pageTitle").textContent = "Provider AI reale"; document.getElementById("pageSubtitle").textContent = "Verifica budget, fallback, rate limit e circuit breaker senza contattare servizi esterni."; };
  button.addEventListener("click", open);
  const stageDefinitions = {
    success: [["Feature flag", "Provider esterno abilitato e configurazione completa", "Superato"], ["Segreto server-side", "La chiave non attraversa API diagnostiche o UI", "Redatto"], ["Output JSON", "Schema ChatResponse verificato", "Valido"], ["Budget e telemetria", "Token e costo stimati senza contenuto sensibile", "Registrato"]],
    fallback: [["Provider primario", "Timeout entro il limite configurato", "Fallito"], ["Circuit breaker", "Errore contato senza dettagli sensibili", "1/3"], ["Fallback mock", "Risposta deterministica e zero costo esterno", "Attivo"]],
    budget: [["Preflight", "Budget giornaliero o per esecuzione esaurito", "Bloccato"], ["Provider", "Nessuna richiesta inviata", "Non chiamato"]],
    circuit: [["Circuit breaker", "Soglia errori raggiunta", "Aperto"], ["Provider primario", "Tentativo saltato durante recovery", "Saltato"], ["Fallback mock", "Servizio ancora disponibile", "Attivo"]],
    rate: [["Rate limiter", "Finestra di 60 secondi piena", "429 interno"], ["Provider", "Nessun costo e nessuna chiamata", "Non chiamato"]],
  };
  document.getElementById("runProviderScenario").addEventListener("click", async () => {
    const scenario = document.getElementById("providerScenario").value;
    const stages = stageDefinitions[scenario];
    const container = document.getElementById("providerScenarioStages");
    container.innerHTML = stages.map((stage, index) => `<div class="row" data-provider-stage="${index}"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-thinking");
    for (let index = 0; index < stages.length; index += 1) {
      const tag = container.querySelector(`[data-provider-stage="${index}"] .tag`);
      tag.className = "tag violet"; tag.textContent = "In corso";
      await new Promise((resolve) => setTimeout(resolve, 180));
      tag.className = stages[index][2] === "Fallito" || stages[index][2] === "Bloccato" || stages[index][2] === "Aperto" ? "tag warn" : "tag";
      tag.textContent = stages[index][2];
    }
    window.EveAnimationLibrary?.setState?.(scenario === "success" ? "eve-success" : "eve-confirmation-needed");
  });
})();
