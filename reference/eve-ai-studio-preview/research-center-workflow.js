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
            <h3>Centro ricerca e progetti di apprendimento</h3>
            <p>INTELLIGENCE-0.1 — pianificazione persistente, query e catalogo fonti in quarantena. Nessuna ricerca web viene ancora eseguita.</p>
          </div>
          <span class="tag violet" id="researchCheckpointBadge">INTELLIGENCE-0.1</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Progetti</small><strong id="researchProjectCount">2</strong><div class="progress"><span style="width:40%"></span></div></div>
            <div class="metric"><small>Query pianificate</small><strong id="researchQueryCount">5</strong><div class="progress"><span style="width:55%"></span></div></div>
            <div class="metric"><small>Fonti in quarantena</small><strong id="researchSourceCount">3</strong><div class="progress"><span style="width:35%;background:var(--warn)"></span></div></div>
            <div class="metric"><small>Test specifici</small><strong>15/15</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Nuovo progetto di apprendimento</h3><p>Definisce obiettivo, materia, livello e piano; non avvia rete o provider esterni.</p></div>
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
          <div><h3>Confini del checkpoint</h3><p>Le capacità future sono visibili ma rimangono tecnicamente disattivate.</p></div>
          <span class="tag warn">Nessuna rete</span>
        </div>
        <div class="panel-body list">
          <div class="row"><div class="meta"><strong>Progetti e obiettivi</strong><small>Persistenza, isolamento per aula e stati tracciati</small></div><span class="tag">Attivi</span></div>
          <div class="row"><div class="meta"><strong>Query di ricerca</strong><small>Catalogate come planned, mai eseguite in questo checkpoint</small></div><span class="tag">Pianificate</span></div>
          <div class="row"><div class="meta"><strong>Fonti candidate</strong><small>Solo URL e metadati; contenuto non acquisito</small></div><span class="tag warn">Quarantena</span></div>
          <div class="row"><div class="meta"><strong>Ricerca online</strong><small>Verrà introdotta in INTELLIGENCE-0.2 con limiti e audit</small></div><span class="tag red">Disattivata</span></div>
          <div class="row"><div class="meta"><strong>Addestramento del modello</strong><small>Nessuna modifica automatica dei pesi o del comportamento</small></div><span class="tag red">Disattivato</span></div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Progetti per aula</h3><p>Ogni progetto mantiene il proprio piano, le query e le fonti candidate senza accedere alle altre aule.</p></div>
          <span class="pill" id="researchCatalogBadge">2 progetti</span>
        </div>
        <div class="panel-body list" id="researchProjectList"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Query pianificate</h3><p>Le query verranno eseguite soltanto da un connettore web approvato nel checkpoint successivo.</p></div>
          <button class="btn" id="addResearchQuery">Aggiungi query</button>
        </div>
        <div class="panel-body list" id="researchQueryList"></div>
      </section>

      <section class="panel span-6">
        <div class="panel-head">
          <div><h3>Quarantena fonti</h3><p>Un URL registrato non viene aperto, scaricato o considerato conoscenza.</p></div>
          <button class="btn" id="addResearchSource">Registra URL</button>
        </div>
        <div class="panel-body list" id="researchSourceList"></div>
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
    {url:"https://example.edu/computer-science",publisher:"Università dimostrativa",status:"quarantined"},
    {url:"https://example.org/python-curriculum",publisher:"Ente didattico dimostrativo",status:"quarantined"},
    {url:"https://example.edu/mathematics",publisher:"Dipartimento dimostrativo",status:"quarantined"}
  ];

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

  function render() {
    document.getElementById("researchProjectCount").textContent = String(projects.length);
    document.getElementById("researchQueryCount").textContent = String(queries.length);
    document.getElementById("researchSourceCount").textContent = String(sources.length);
    document.getElementById("researchCatalogBadge").textContent = `${projects.length} progetti`;
    document.getElementById("researchProjectList").innerHTML = projects.map(item => `
      <div class="row"><div class="meta"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.room)} · ${escapeHtml(item.domain)} · ${escapeHtml(item.level)} · ${item.queries} query · ${item.sources} fonti candidate · web_access=false</small></div><span class="${item.status === "active" ? "tag" : "tag warn"}">${item.status}</span></div>`).join("");
    document.getElementById("researchQueryList").innerHTML = queries.map((text, index) => `
      <div class="row"><div class="meta"><strong>Query ${index + 1}</strong><small>${escapeHtml(text)} · stato planned · nessuna esecuzione</small></div><span class="tag violet">Pianificata</span></div>`).join("");
    document.getElementById("researchSourceList").innerHTML = sources.map(item => `
      <div class="row"><div class="meta"><strong>${escapeHtml(item.publisher)}</strong><small>${escapeHtml(item.url)} · content_acquired=false · trust_level=unreviewed</small></div><span class="tag warn">Quarantena</span></div>`).join("");
  }

  function openResearchView() {
    document.querySelectorAll(".view").forEach(node => node.classList.toggle("active", node.id === "intelligence-research"));
    document.querySelectorAll(".nav button").forEach(node => node.classList.toggle("active", node === navButton));
    document.getElementById("pageTitle").textContent = "Ricerca e apprendimento";
    document.getElementById("pageSubtitle").textContent = "Progetta ciò che Eve dovrà studiare, senza acquisire ancora contenuti dal web.";
    window.scrollTo({top:0, behavior:"smooth"});
  }
  navButton.addEventListener("click", openResearchView);

  const stages = [
    ["Validazione obiettivo", "Titolo, dominio, lingua, livello e argomenti"],
    ["Isolamento aula", "Il progetto è visibile solo nel room_id selezionato"],
    ["Persistenza SQLite", "Progetto e cronologia degli stati vengono salvati"],
    ["Piano query", "Le query restano planned e non effettuano rete"],
    ["Revisione umana", "Le fonti future entreranno sempre in quarantena"]
  ];

  document.getElementById("createResearchProject").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const stagesNode = document.getElementById("researchCreationStages");
    stagesNode.innerHTML = stages.map((stage, index) => `<div class="row" data-research-stage="${index}"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-thinking");
    for (let index = 0; index < stages.length; index += 1) {
      const row = stagesNode.querySelector(`[data-research-stage="${index}"]`);
      row.querySelector(".tag").className = "tag violet";
      row.querySelector(".tag").textContent = "In corso";
      await new Promise(resolve => setTimeout(resolve, 180));
      row.querySelector(".tag").className = "tag";
      row.querySelector(".tag").textContent = "Completato";
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
    window.notify?.("Progetto di ricerca creato senza accesso alla rete");
  });

  document.getElementById("addResearchQuery").addEventListener("click", () => {
    queries.unshift("nuova query didattica pianificata");
    projects[0].queries += 1;
    render();
    window.EveAnimationLibrary?.setState?.("eve-processing");
  });

  document.getElementById("addResearchSource").addEventListener("click", () => {
    sources.unshift({url:"https://example.org/new-candidate",publisher:"Fonte candidata dimostrativa",status:"quarantined"});
    projects[0].sources += 1;
    render();
    window.EveAnimationLibrary?.setState?.("eve-confirmation-needed");
  });

  render();
})();
