(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("intelligence-research")) return;

  const navButton = document.createElement("button");
  navButton.dataset.view = "intelligence-research";
  navButton.innerHTML = '<span class="ico">⌕</span>Ricerca e apprendimento';
  const materialsButton = nav.querySelector('[data-view="rag-materials"]');
  (materialsButton || nav.lastElementChild)?.insertAdjacentElement("afterend", navButton);

  const view = document.createElement("section");
  view.id = "intelligence-research";
  view.className = "view";
  view.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div>
            <h3>Centro ricerca e acquisizione controllata</h3>
            <p>INTELLIGENCE-0.2 — progetti, query e fonti candidate restano separati dall'acquisizione URL, che è opt-in, tracciata e sempre in quarantena.</p>
          </div>
          <span class="tag violet" id="researchCheckpointBadge">INTELLIGENCE-0.2</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Progetti</small><strong id="researchProjectCount">2</strong><div class="progress"><span style="width:40%"></span></div></div>
            <div class="metric"><small>Query pianificate</small><strong id="researchQueryCount">5</strong><div class="progress"><span style="width:55%"></span></div></div>
            <div class="metric"><small>Fonti candidate</small><strong id="researchSourceCount">3</strong><div class="progress"><span style="width:45%;background:var(--warn)"></span></div></div>
            <div class="metric"><small>Acquisizioni riuscite</small><strong id="researchAcquisitionCount">1</strong><div class="progress"><span style="width:30%;background:var(--green)"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Nuovo progetto di apprendimento</h3><p>Definisce obiettivo, materia, livello e piano; non avvia automaticamente rete o provider esterni.</p></div>
          <span class="pill">Revisione umana obbligatoria</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="researchRoom">Aula</label><select id="researchRoom"><option>room-python-zero</option><option>room-matematica</option></select></div>
            <div class="field"><label for="researchDomain">Materia o campo</label><input id="researchDomain" value="Informatica"></div>
            <div class="field"><label for="researchTitle">Titolo</label><input id="researchTitle" value="Programmazione da zero"></div>
            <div class="field"><label for="researchLevel">Livello</label><input id="researchLevel" value="Principiante → universitario"></div>
            <div class="field" style="grid-column:1/-1"><label for="researchObjective">Obiettivo</label><textarea id="researchObjective" rows="4">Costruire una base didattica completa, verificabile e progressiva sulla programmazione.</textarea></div>
            <div class="field" style="grid-column:1/-1"><label for="researchTopics">Argomenti iniziali</label><input id="researchTopics" value="algoritmi, variabili, controllo di flusso, funzioni"></div>
          </div>
          <button class="btn green" id="createResearchProject" style="width:100%;margin-top:12px">Crea progetto controllato</button>
          <div class="list" id="researchCreationStages" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Confini del checkpoint</h3><p>Disponibilità del modulo e accesso web attivo sono stati separati esplicitamente.</p></div>
          <span class="tag warn">Flag rete OFF</span>
        </div>
        <div class="panel-body list">
          <div class="row"><div class="meta"><strong>Progetti e obiettivi</strong><small>Persistenza, isolamento per aula e stati tracciati</small></div><span class="tag">Attivi</span></div>
          <div class="row"><div class="meta"><strong>Query di ricerca</strong><small>Catalogate come planned; nessun motore generalista le esegue</small></div><span class="tag violet">Pianificate</span></div>
          <div class="row"><div class="meta"><strong>Fonti candidate</strong><small>URL e metadati restano non fidati fino alla revisione</small></div><span class="tag warn">Quarantena</span></div>
          <div class="row"><div class="meta"><strong>Acquisizione URL esplicito</strong><small>Disponibile soltanto con EVE_RESEARCH_WEB_ENABLED=true</small></div><span class="tag warn">Opt-in</span></div>
          <div class="row"><div class="meta"><strong>Promozione nei materiali CORE</strong><small>Nessuna approvazione, ingestione o embedding automatici</small></div><span class="tag red">Esclusa</span></div>
          <div class="row"><div class="meta"><strong>Addestramento del modello</strong><small>Nessuna modifica automatica dei pesi o del comportamento</small></div><span class="tag red">Disattivato</span></div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Progetti per aula</h3><p>Ogni progetto mantiene piano, query, fonti ed eventi senza accedere alle altre aule.</p></div>
          <span class="pill" id="researchCatalogBadge">2 progetti</span>
        </div>
        <div class="panel-body list" id="researchProjectList"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Query pianificate</h3><p>Le query non vengono eseguite da questo checkpoint: servono a organizzare il lavoro di ricerca.</p></div>
          <button class="btn" id="addResearchQuery">Aggiungi query</button>
        </div>
        <div class="panel-body list" id="researchQueryList"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Quarantena fonti</h3><p>Un URL registrato non diventa automaticamente contenuto acquisito o conoscenza approvata.</p></div>
          <button class="btn" id="addResearchSource">Registra URL</button>
        </div>
        <div class="panel-body list" id="researchSourceList"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div>
            <h3>Pipeline di acquisizione controllata</h3>
            <p>Simulazione UI dichiarata: la preview non effettua richieste reali e non sostituisce i controlli server-side.</p>
          </div>
          <span class="pill">Simulazione UI dichiarata</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="acquisitionRoom">Aula</label><select id="acquisitionRoom"><option>room-python-zero</option><option>room-matematica</option></select></div>
            <div class="field"><label for="acquisitionSource">Fonte candidata</label><select id="acquisitionSource"></select></div>
            <div class="field" style="grid-column:1/-1"><label for="acquisitionUrl">URL registrato</label><input id="acquisitionUrl" readonly></div>
          </div>
          <button class="btn green" id="simulateAcquisition" style="width:100%;margin-top:12px">Simula controllo e quarantena</button>
          <div class="list" id="acquisitionStages" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Documento acquisito</h3><p>Il testo resta dato esterno non fidato; le istruzioni contenute non sono eseguibili.</p></div>
          <span class="tag warn">untrusted_web_content</span>
        </div>
        <div class="panel-body list" id="quarantinedDocument"></div>
      </section>
    </div>`;
  main.appendChild(view);

  const projects = [
    {id:"research-a14c",room:"room-python-zero",title:"Programmazione da zero",domain:"Informatica",level:"Principiante → universitario",status:"active",queries:3,sources:2},
    {id:"research-b82e",room:"room-matematica",title:"Matematica completa",domain:"Matematica",level:"Primaria → università",status:"draft",queries:2,sources:1}
  ];
  const queries = [
    "curricolo programmazione dalle basi agli algoritmi",
    "manuali universitari introduttivi Python",
    "errori comuni principianti programmazione",
    "progressione didattica algebra primaria università",
    "fonti istituzionali competenze matematiche"
  ];
  const sources = [
    {
      id:11,
      project:"research-a14c",
      room:"room-python-zero",
      url:"https://example.edu/computer-science",
      publisher:"Università dimostrativa",
      status:"quarantined",
      trustLevel:"unreviewed_acquired",
      acquired:true,
      acquisition:"succeeded",
      sha256:"29b87b0f…f91a",
      mediaType:"text/html",
      bytes:18432
    },
    {
      id:12,
      project:"research-a14c",
      room:"room-python-zero",
      url:"https://example.org/python-curriculum",
      publisher:"Ente didattico dimostrativo",
      status:"quarantined",
      trustLevel:"unreviewed",
      acquired:false,
      acquisition:"not_started"
    },
    {
      id:21,
      project:"research-b82e",
      room:"room-matematica",
      url:"https://example.edu/mathematics",
      publisher:"Dipartimento dimostrativo",
      status:"quarantined",
      trustLevel:"unreviewed",
      acquired:false,
      acquisition:"not_started"
    }
  ];

  let nextSourceId = 30;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  function selectedAcquisitionSource() {
    const value = document.getElementById("acquisitionSource")?.value;
    return sources.find(item => String(item.id) === value) || sources[0];
  }

  function syncAcquisitionSource() {
    const source = selectedAcquisitionSource();
    if (!source) return;
    const room = document.getElementById("acquisitionRoom");
    if (room && Array.from(room.options).some(option => option.value === source.room)) room.value = source.room;
    document.getElementById("acquisitionUrl").value = source.url;
    document.getElementById("quarantinedDocument").innerHTML = source.acquired ? `
      <div class="row"><div class="meta"><strong>Stato</strong><small>quarantined · trust=untrusted_web_content · instructions_executable=false</small></div><span class="tag warn">Revisione richiesta</span></div>
      <div class="row"><div class="meta"><strong>Provenienza</strong><small>${escapeHtml(source.url)} · ${escapeHtml(source.mediaType)} · ${source.bytes} byte</small></div><span class="tag">${escapeHtml(source.sha256)}</span></div>
      <div class="row"><div class="meta"><strong>Separazione CORE</strong><small>Nessun materiale, chunk, embedding o risposta RAG creati automaticamente</small></div><span class="tag red">Non promosso</span></div>
    ` : `
      <div class="row"><div class="meta"><strong>Nessun documento acquisito</strong><small>L'URL resta un metadato candidato. Il server deve autorizzare esplicitamente l'acquisizione.</small></div><span class="tag warn">In attesa</span></div>
    `;
  }

  function render() {
    document.getElementById("researchProjectCount").textContent = String(projects.length);
    document.getElementById("researchQueryCount").textContent = String(queries.length);
    document.getElementById("researchSourceCount").textContent = String(sources.length);
    document.getElementById("researchAcquisitionCount").textContent = String(sources.filter(item => item.acquisition === "succeeded").length);
    document.getElementById("researchCatalogBadge").textContent = `${projects.length} progetti`;

    document.getElementById("researchProjectList").innerHTML = projects.map(item => `
      <div class="row"><div class="meta"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.room)} · ${escapeHtml(item.domain)} · ${escapeHtml(item.level)} · ${item.queries} query · ${item.sources} fonti · isolamento aula attivo</small></div><span class="${item.status === "active" ? "tag" : "tag warn"}">${item.status}</span></div>`).join("");

    document.getElementById("researchQueryList").innerHTML = queries.map((text, index) => `
      <div class="row"><div class="meta"><strong>Query ${index + 1}</strong><small>${escapeHtml(text)} · stato planned · nessuna esecuzione automatica</small></div><span class="tag violet">Pianificata</span></div>`).join("");

    document.getElementById("researchSourceList").innerHTML = sources.map(item => `
      <div class="row"><div class="meta"><strong>${escapeHtml(item.publisher)}</strong><small>${escapeHtml(item.url)} · room=${escapeHtml(item.room)} · status=${item.status} · trust_level=${item.trustLevel} · content_acquired=${item.acquired} · acquisition=${item.acquisition}${item.sha256 ? ` · sha256=${escapeHtml(item.sha256)}` : ""}</small></div><span class="${item.acquired ? "tag" : "tag warn"}">${item.acquired ? "Acquisita / quarantena" : "Solo candidata"}</span></div>`).join("");

    const selector = document.getElementById("acquisitionSource");
    const previous = selector.value;
    selector.innerHTML = sources.map(item => `<option value="${item.id}">${escapeHtml(item.publisher)}</option>`).join("");
    selector.value = sources.some(item => String(item.id) === previous) ? previous : String(sources[0]?.id || "");
    syncAcquisitionSource();
  }

  function openResearchView() {
    document.querySelectorAll(".view").forEach(node => node.classList.toggle("active", node.id === "intelligence-research"));
    document.querySelectorAll(".nav button").forEach(node => node.classList.toggle("active", node === navButton));
    document.getElementById("pageTitle").textContent = "Ricerca e apprendimento";
    document.getElementById("pageSubtitle").textContent = "Progetta la ricerca e acquisisci URL espliciti senza promozione automatica della conoscenza.";
    window.scrollTo({top:0, behavior:"smooth"});
  }

  navButton.addEventListener("click", openResearchView);
  document.getElementById("acquisitionSource").addEventListener("change", syncAcquisitionSource);

  const creationStages = [
    ["Validazione obiettivo", "Titolo, dominio, lingua, livello e argomenti"],
    ["Isolamento aula", "Il progetto è visibile solo nel room_id selezionato"],
    ["Persistenza SQLite", "Progetto e cronologia degli stati vengono salvati"],
    ["Piano query", "Le query restano planned e non effettuano rete"],
    ["Revisione umana", "Le fonti entrano sempre come non fidate e in quarantena"]
  ];

  document.getElementById("createResearchProject").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const stagesNode = document.getElementById("researchCreationStages");
    stagesNode.innerHTML = creationStages.map((stage, index) => `<div class="row" data-research-stage="${index}"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-thinking");
    for (let index = 0; index < creationStages.length; index += 1) {
      const row = stagesNode.querySelector(`[data-research-stage="${index}"]`);
      const tag = row.querySelector(".tag");
      tag.className = "tag violet";
      tag.textContent = "In corso";
      await new Promise(resolve => setTimeout(resolve, 180));
      tag.className = "tag";
      tag.textContent = "Completato";
    }
    const title = document.getElementById("researchTitle").value.trim() || "Progetto senza titolo";
    const room = document.getElementById("researchRoom").value;
    const topics = document.getElementById("researchTopics").value.split(",").map(value => value.trim()).filter(Boolean);
    projects.unshift({
      id:`research-demo-${String(projects.length + 1).padStart(2,"0")}`,
      room,
      title,
      domain:document.getElementById("researchDomain").value.trim() || "Generale",
      level:document.getElementById("researchLevel").value.trim() || "Da definire",
      status:"draft",
      queries:topics.length,
      sources:0
    });
    topics.forEach(topic => queries.unshift(`${topic} fonti didattiche verificabili`));
    render();
    window.EveAnimationLibrary?.setState?.("eve-success");
    button.disabled = false;
    window.notify?.("Progetto creato: nessuna ricerca o acquisizione automatica avviata");
  });

  document.getElementById("addResearchQuery").addEventListener("click", () => {
    queries.unshift("nuova query didattica pianificata");
    if (projects[0]) projects[0].queries += 1;
    render();
    window.EveAnimationLibrary?.setState?.("eve-processing");
  });

  document.getElementById("addResearchSource").addEventListener("click", () => {
    const project = projects[0];
    const source = {
      id:nextSourceId++,
      project:project?.id || "research-demo",
      room:project?.room || "room-python-zero",
      url:`https://example.org/new-candidate-${nextSourceId}`,
      publisher:"Fonte candidata dimostrativa",
      status:"quarantined",
      trustLevel:"unreviewed",
      acquired:false,
      acquisition:"not_started"
    };
    sources.unshift(source);
    if (project) project.sources += 1;
    render();
    document.getElementById("acquisitionSource").value = String(source.id);
    syncAcquisitionSource();
    window.EveAnimationLibrary?.setState?.("eve-confirmation-needed");
  });

  const acquisitionStages = [
    ["Feature flag server-side", "Il flusso reale parte soltanto con EVE_RESEARCH_WEB_ENABLED=true"],
    ["Validazione URL e porta", "Solo HTTP/HTTPS completi, senza credenziali, porte 80 e 443"],
    ["DNS e protezione SSRF", "Blocco reti private, loopback, link-local, multicast e indirizzi riservati"],
    ["robots.txt fail-closed", "Controllo della destinazione iniziale e di ogni destinazione raggiunta tramite redirect"],
    ["Redirect, TLS e IP pinning", "Ogni destinazione viene rivalidata e il downgrade HTTPS viene bloccato"],
    ["Limiti risposta", "Timeout, Content-Length, byte massimi, MIME testuali e nessuna compressione inattesa"],
    ["Estrazione e checksum", "Testo locale normalizzato e SHA-256 dei byte originali"],
    ["Quarantena obbligatoria", "trust=untrusted_web_content; instructions_executable=false; nessuna promozione CORE"]
  ];

  document.getElementById("simulateAcquisition").addEventListener("click", async event => {
    const button = event.currentTarget;
    const source = selectedAcquisitionSource();
    if (!source) return;
    button.disabled = true;
    const stagesNode = document.getElementById("acquisitionStages");
    stagesNode.innerHTML = acquisitionStages.map((stage, index) => `<div class="row" data-acquisition-stage="${index}"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-searching");

    for (let index = 0; index < acquisitionStages.length; index += 1) {
      const row = stagesNode.querySelector(`[data-acquisition-stage="${index}"]`);
      const tag = row.querySelector(".tag");
      tag.className = "tag violet";
      tag.textContent = "In corso";
      await new Promise(resolve => setTimeout(resolve, 170));
      tag.className = "tag";
      tag.textContent = "Superato";
    }

    source.acquired = true;
    source.acquisition = "succeeded";
    source.trustLevel = "unreviewed_acquired";
    source.sha256 = "local-preview…sha256";
    source.mediaType = "text/html";
    source.bytes = 12288;
    render();
    document.getElementById("acquisitionSource").value = String(source.id);
    syncAcquisitionSource();
    window.EveAnimationLibrary?.setState?.("eve-success");
    window.notify?.("Simulazione completata: documento ancora in quarantena");
    button.disabled = false;
  });

  render();
})();
