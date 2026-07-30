(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-architecture")) return;

  const navButton = document.createElement("button");
  navButton.dataset.view = "core-architecture";
  navButton.innerHTML = '<span class="ico">⌘</span>Architettura CORE';
  const researchButton = nav.querySelector('[data-view="intelligence-research"]');
  (researchButton || nav.lastElementChild)?.insertAdjacentElement("afterend", navButton);

  const layers = [
    ["ui", "Interfaccia", "Client-safe", "Nessuna chiave, provider o fetch"],
    ["agent", "Orchestrazione", "Server-only", "Adapter tipizzati verso i prototipi"],
    ["prompts", "Prompt", "Server-only", "Versioni e gate senza accesso diretto UI"],
    ["context", "Contesto", "Server-only", "Identità, aula e minimizzazione"],
    ["retrieval", "Retrieval", "Server-only", "Materiali CORE e fonti INTELLIGENCE"],
    ["memory", "Memoria", "Pianificata", "Solo consenso esplicito"],
    ["tools", "Strumenti", "Pianificati", "Autorizzazione e conferma"],
    ["voice", "Voce", "Contratto UI", "Stati visibili e fallback"],
    ["safety", "Sicurezza", "Server-only", "Il codice autorizza ed esegue"],
    ["evaluation", "Valutazione", "Server-only", "Evidenze e gate verificabili"],
  ];

  const probes = [
    { key: "health", label: "Servizio FastAPI", state: "disabled" },
    { key: "requirements", label: "Requisiti e versioni", state: "disabled" },
    { key: "materials", label: "Materiali e retrieval", state: "disabled" },
    { key: "research", label: "Ricerca e revisione", state: "disabled" },
  ];

  const view = document.createElement("section");
  view.id = "core-architecture";
  view.className = "view";
  view.innerHTML = `
    <div class="grid">
      <section class="panel span-12"><div class="panel-head"><div><h3>Architettura unificata di Eve</h3><p>CORE-1.2 — confini features/eve, API server e adapter dei prototipi. La preview simula lo stato: non contatta servizi né espone segreti.</p></div><span class="tag violet">CORE-1.2</span></div><div class="panel-body"><div class="metric-row"><div class="metric"><small>Confini registrati</small><strong>10/10</strong><div class="progress"><span style="width:100%"></span></div></div><div class="metric"><small>Adapter tipizzati</small><strong>4</strong><div class="progress"><span style="width:80%"></span></div></div><div class="metric"><small>Rete dalla UI</small><strong>0</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div><div class="metric"><small>Feature flag</small><strong>OFF</strong><div class="progress"><span style="width:25%;background:var(--warn)"></span></div></div></div></div></section>
      <section class="panel span-8"><div class="panel-head"><div><h3>Mappa dei moduli</h3><p>Ogni capacità ha un proprietario stabile; i moduli client non importano i confini server.</p></div><span class="pill">Sorgente unica</span></div><div class="panel-body list" id="eveArchitectureLayers"></div></section>
      <section class="panel span-4"><div class="panel-head"><div><h3>Confine API server</h3><p>Simulazione dichiarata del probe composito.</p></div><span class="tag warn" id="eveArchitectureMode">Disattivato</span></div><div class="panel-body list" id="eveArchitectureProbes"></div><div class="panel-body"><button class="btn green" id="simulateArchitectureProbe" style="width:100%">Simula adapter disponibili</button></div></section>
      <section class="panel span-7"><div class="panel-head"><div><h3>Verifica architetturale</h3><p>Controlli statici equivalenti ai test del checkpoint.</p></div><span class="pill">Nessuna rete reale</span></div><div class="panel-body list" id="eveArchitectureChecks"></div><div class="panel-body"><button class="btn" id="runArchitectureChecks" style="width:100%">Esegui controlli</button></div></section>
      <section class="panel span-5"><div class="panel-head"><div><h3>Regole non negoziabili</h3><p>Il prototipo resta un servizio separato e viene raggiunto soltanto dal server.</p></div><span class="tag">Gate C</span></div><div class="panel-body list"><div class="row"><div class="meta"><strong>UI isolata</strong><small>Nessun token, URL interno o logica provider nel browser</small></div><span class="tag">Attivo</span></div><div class="row"><div class="meta"><strong>Adapter opt-in</strong><small>EVE_CORE_INTEGRATION_ENABLED=false per impostazione predefinita</small></div><span class="tag warn">OFF</span></div><div class="row"><div class="meta"><strong>Nessuna migrazione dati</strong><small>SQLite e Supabase non vengono fusi in questo checkpoint</small></div><span class="tag">Separati</span></div><div class="row"><div class="meta"><strong>Nessuna integrazione produzione</strong><small>La route diagnostica non attiva chat, memoria o strumenti</small></div><span class="tag red">Esclusa</span></div></div></section>
    </div>`;
  main.appendChild(view);

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const renderLayers = () => { document.getElementById("eveArchitectureLayers").innerHTML = layers.map(([key, label, boundary, note]) => `<div class="row"><div class="meta"><strong>${escapeHtml(label)}</strong><small>src/features/eve/${escapeHtml(key)} · ${escapeHtml(note)}</small></div><span class="tag${boundary.includes("Pianificat") ? " warn" : ""}">${escapeHtml(boundary)}</span></div>`).join(""); };
  const renderProbes = () => { document.getElementById("eveArchitectureProbes").innerHTML = probes.map((probe) => `<div class="row"><div class="meta"><strong>${escapeHtml(probe.label)}</strong><small>${escapeHtml(probe.key)} · risposta redatta e tipizzata</small></div><span class="tag ${probe.state === "available" ? "" : "warn"}">${probe.state === "available" ? "Disponibile" : "Disattivato"}</span></div>`).join(""); };
  const checks = [["Barrel pubblico", "Nessun export dei moduli server"], ["UI client-safe", "Nessun fetch, process.env o chiave"], ["Server-only", "Config, adapter e composizione isolati"], ["Endpoint allowlist", "Quattro probe GET senza redirect"], ["Risposte limitate", "MIME JSON e limite byte"], ["Prototipi separati", "Nessun import diretto Python → TypeScript"]];

  document.getElementById("simulateArchitectureProbe").addEventListener("click", () => {
    const activate = probes.some((probe) => probe.state !== "available");
    probes.forEach((probe) => { probe.state = activate ? "available" : "disabled"; });
    const mode = document.getElementById("eveArchitectureMode");
    mode.textContent = activate ? "Simulazione disponibile" : "Disattivato";
    mode.className = activate ? "tag" : "tag warn";
    renderProbes();
    window.EveAnimationLibrary?.setState?.(activate ? "eve-success" : "eve-offline");
  });

  document.getElementById("runArchitectureChecks").addEventListener("click", async (event) => {
    const button = event.currentTarget; button.disabled = true;
    const target = document.getElementById("eveArchitectureChecks");
    target.innerHTML = checks.map((item, index) => `<div class="row" data-core-check="${index}"><div class="meta"><strong>${index + 1}. ${escapeHtml(item[0])}</strong><small>${escapeHtml(item[1])}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-test-running");
    for (let index = 0; index < checks.length; index += 1) {
      const tag = target.querySelector(`[data-core-check="${index}"] .tag`); tag.className = "tag violet"; tag.textContent = "Controllo"; await new Promise((resolve) => setTimeout(resolve, 160)); tag.className = "tag"; tag.textContent = "Superato";
    }
    window.EveAnimationLibrary?.setState?.("eve-tests-passed"); button.disabled = false; window.notify?.("CORE-1.2: confini architetturali verificati nella simulazione UI");
  });

  navButton.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node.id === "core-architecture"));
    document.querySelectorAll(".nav button").forEach((node) => node.classList.toggle("active", node === navButton));
    document.getElementById("pageTitle").textContent = "Architettura CORE";
    document.getElementById("pageSubtitle").textContent = "Confini server, adapter tipizzati e ownership dei moduli Eve.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  renderLayers(); renderProbes();
  window.EveCoreArchitecturePreview = Object.freeze({ checkpoint: "CORE-1.2", layers: layers.map((item) => item[0]), probeCount: probes.length });
})();
