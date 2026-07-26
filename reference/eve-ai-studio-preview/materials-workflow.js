(() => {
  document.querySelectorAll("h3,p,small,strong").forEach(node => {
    node.textContent = node.textContent
      .replaceAll("Eve 0.7-preview", "Eve 0.8-preview")
      .replaceAll("Checkpoint 0.7 integrato", "Checkpoint 0.8 integrato");
  });

  const dashboardCheckpoint = [...document.querySelectorAll(".panel-head h3")]
    .find(node => node.textContent.includes("Checkpoint 0.8 integrato"));
  if (dashboardCheckpoint) {
    const panel = dashboardCheckpoint.closest(".panel");
    panel.querySelector(".panel-head p").textContent =
      "Catalogo materiali, importazione controllata, versioni e preparazione RAG senza embedding esterni.";
    const tag = panel.querySelector(".panel-head .tag");
    if (tag) tag.textContent = "20 test specifici";
    const heading = panel.querySelector(".panel-body h2");
    if (heading) heading.textContent = "6 formati testuali · SQLite schema 1";
    const paragraph = panel.querySelector(".panel-body p");
    if (paragraph) paragraph.textContent =
      "Ogni documento viene limitato, identificato con SHA-256, deduplicato per aula, versionato, estratto e suddiviso in chunk deterministici. Gli embedding restano disattivati.";
    const button = panel.querySelector("[data-go]");
    if (button) {
      button.dataset.go = "rag-materials";
      button.textContent = "Apri materiali e RAG";
    }
  }

  const nav = document.querySelector(".nav");
  const providersButton = nav?.querySelector('[data-view="providers"]');
  const testsButton = nav?.querySelector('[data-view="tests"]');
  const anchor = providersButton || testsButton;
  if (!nav || !anchor || document.getElementById("rag-materials")) return;

  const materialsButton = document.createElement("button");
  materialsButton.dataset.view = "rag-materials";
  materialsButton.innerHTML = '<span class="ico">▤</span>Materiali e RAG';
  anchor.insertAdjacentElement("afterend", materialsButton);

  const materialsView = document.createElement("section");
  materialsView.id = "rag-materials";
  materialsView.className = "view";
  materialsView.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div>
            <h3>Catalogo materiali e preparazione RAG</h3>
            <p>Checkpoint 0.8 — importazione documentale controllata, checksum, versioni, estrazione testuale e chunk senza embedding esterni.</p>
          </div>
          <span class="tag" id="materialRagBadge">Nessun embedding</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Materiali</small><strong id="materialCount">3</strong><div class="progress"><span style="width:60%"></span></div></div>
            <div class="metric"><small>Versioni</small><strong id="materialVersionCount">4</strong><div class="progress"><span style="width:70%"></span></div></div>
            <div class="metric"><small>Chunk preparati</small><strong id="materialChunkCount">18</strong><div class="progress"><span style="width:82%"></span></div></div>
            <div class="metric"><small>Test Checkpoint 0.8</small><strong>20/20</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Importazione controllata</h3><p>La simulazione non effettua rete e non invia documenti a provider esterni.</p></div>
          <span class="pill">Massimo 2 MB</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="materialRoom">Aula</label><select id="materialRoom"><option>room-python-zero</option><option>room-matematica</option></select></div>
            <div class="field"><label for="materialScenario">Scenario</label><select id="materialScenario"><option value="valid">Importazione valida</option><option value="duplicate">Checksum duplicato</option><option value="version">Nuova versione</option><option value="unsupported">PDF non ancora supportato</option><option value="oversize">Limite dimensione superato</option></select></div>
            <div class="field"><label for="materialTitle">Titolo</label><input id="materialTitle" value="Introduzione alle funzioni"></div>
            <div class="field"><label for="materialFilename">File</label><input id="materialFilename" value="funzioni-python.md"></div>
            <div class="field"><label for="materialMediaType">Media type</label><select id="materialMediaType"><option>text/markdown</option><option>text/plain</option><option>text/html</option><option>text/csv</option><option>application/json</option><option>application/pdf</option></select></div>
            <div class="field"><label for="materialText">Testo dimostrativo</label><textarea id="materialText" rows="5"># Funzioni Python\n\nUna funzione raggruppa istruzioni riutilizzabili e può ricevere parametri.</textarea></div>
          </div>
          <button class="btn green" id="runMaterialImport" style="width:100%;margin-top:12px">Esegui importazione controllata</button>
          <div class="list" id="materialImportStages" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Pipeline RAG preparatoria</h3><p>Il checkpoint termina prima della generazione degli embedding.</p></div>
          <span class="tag violet">Deterministica</span>
        </div>
        <div class="panel-body list">
          <div class="row"><div class="meta"><strong>1. Limiti e formato</strong><small>Dimensione, UTF-8, MIME consentiti e metadati</small></div><span class="tag">Codice</span></div>
          <div class="row"><div class="meta"><strong>2. SHA-256</strong><small>Checksum dei byte originali e deduplicazione per aula</small></div><span class="tag">Attivo</span></div>
          <div class="row"><div class="meta"><strong>3. Estrazione</strong><small>TXT, Markdown, CSV, HTML, XHTML e JSON</small></div><span class="tag">Locale</span></div>
          <div class="row"><div class="meta"><strong>4. Chunk</strong><small>Offset, indice e SHA-256 del testo di ogni segmento</small></div><span class="tag">Pronti</span></div>
          <div class="row"><div class="meta"><strong>5. Embedding</strong><small>Nessun modello, provider o chiamata esterna configurata</small></div><span class="tag red">Disattivati</span></div>
        </div>
      </section>

      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Catalogo per aula</h3><p>Il checksum è deduplicato soltanto all'interno della stessa aula; le versioni restano immutabili.</p></div>
          <span class="pill" id="materialCatalogBadge">3 materiali</span>
        </div>
        <div class="panel-body list" id="materialCatalogList"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Chunk della versione selezionata</h3><p>Testo, offset e impronta sono pronti per un futuro indice vettoriale controllato.</p></div>
          <span class="tag" id="materialChunkBadge">6 chunk</span>
        </div>
        <div class="panel-body list" id="materialChunksList"></div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Cronologia importazioni</h3><p>Gli errori conservano solo codice e classe, non il contenuto del documento o dell'eccezione.</p></div>
          <button class="btn" id="resetMaterialDemo">Ripristina demo</button>
        </div>
        <div class="panel-body list" id="materialImportHistory"></div>
      </section>
    </div>`;
  document.querySelector(".main")?.appendChild(materialsView);

  const seedMaterials = () => ([
    {id:"mat-a13f",room:"room-python-zero",title:"Variabili e tipi",file:"variabili.md",type:"text/markdown",version:2,status:"ready",checksum:"4d61e7c9",chars:6840,chunks:7},
    {id:"mat-b84a",room:"room-python-zero",title:"Funzioni Python",file:"funzioni-python.md",type:"text/markdown",version:1,status:"ready",checksum:"92bd31a0",chars:4210,chunks:6},
    {id:"mat-c02e",room:"room-matematica",title:"Equazioni di primo grado",file:"equazioni.html",type:"text/html",version:1,status:"ready",checksum:"c118f2d4",chars:3890,chunks:5}
  ]);
  const seedHistory = () => ([
    {id:4,status:"ready",room:"room-matematica",code:"—",checksum:"c118f2d4"},
    {id:3,status:"duplicate",room:"room-python-zero",code:"duplicate_checksum",checksum:"4d61e7c9"},
    {id:2,status:"ready",room:"room-python-zero",code:"—",checksum:"4d61e7c9"},
    {id:1,status:"ready",room:"room-python-zero",code:"—",checksum:"92bd31a0"}
  ]);
  let catalog = seedMaterials();
  let history = seedHistory();
  let importId = 5;

  const stages = [
    ["Limiti e metadati", "Dimensione, MIME, UTF-8 e JSON dei metadati"],
    ["Checksum e deduplicazione", "SHA-256 dei byte originali nel perimetro dell'aula"],
    ["Versione immutabile", "Creazione del materiale o della revisione successiva"],
    ["Estrazione testuale", "Conversione locale senza OCR o servizi esterni"],
    ["Preparazione chunk", "Offset, hash e stato embedding not_requested"]
  ];

  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function renderStages(active = -1, outcome = "pending") {
    document.getElementById("materialImportStages").innerHTML = stages.map((stage, index) => {
      let label = "In attesa";
      let className = "tag warn";
      if (index < active) { label = "Completato"; className = "tag"; }
      if (index === active) { label = outcome === "failed" ? "Bloccato" : outcome === "done" ? "Completato" : "In corso"; className = outcome === "failed" ? "tag red" : outcome === "done" ? "tag" : "tag violet"; }
      if (outcome === "failed" && index > active) { label = "Non eseguito"; className = "tag warn"; }
      if (outcome === "done") { label = "Completato"; className = "tag"; }
      return `<div class="row"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="${className}">${label}</span></div>`;
    }).join("");
  }

  function renderCatalog() {
    document.getElementById("materialCatalogBadge").textContent = `${catalog.length} materiali`;
    document.getElementById("materialCount").textContent = String(catalog.length);
    document.getElementById("materialVersionCount").textContent = String(catalog.reduce((sum, item) => sum + item.version, 0));
    document.getElementById("materialChunkCount").textContent = String(catalog.reduce((sum, item) => sum + item.chunks, 0));
    document.getElementById("materialCatalogList").innerHTML = catalog.map(item => `
      <div class="row"><div class="meta"><strong>${item.title}</strong><small>${item.id} · ${item.room} · ${item.file} · ${item.type} · v${item.version} · SHA-256 ${item.checksum}… · ${item.chars.toLocaleString("it-IT")} caratteri · ${item.chunks} chunk</small></div><span class="${item.status === "ready" ? "tag" : "tag red"}">${item.status}</span></div>`).join("");
  }

  function renderChunks() {
    const selected = catalog.find(item => item.room === document.getElementById("materialRoom").value) || catalog[0];
    const count = selected?.chunks || 0;
    document.getElementById("materialChunkBadge").textContent = `${count} chunk`;
    document.getElementById("materialChunksList").innerHTML = count ? Array.from({length:Math.min(count,6)}, (_, index) => {
      const start = index * 1050;
      const end = start + (index === count - 1 ? 640 : 1200);
      return `<div class="row"><div class="meta"><strong>Chunk ${index}</strong><small>offset ${start}–${end} · SHA-256 ${hashText(`${selected.id}:${index}:${start}:${end}`)}… · embedding not_requested</small></div><span class="tag violet">Testo pronto</span></div>`;
    }).join("") : '<div class="empty">Nessun chunk disponibile.</div>';
  }

  function renderHistory() {
    document.getElementById("materialImportHistory").innerHTML = history.map(item => `
      <div class="row"><div class="meta"><strong>#${item.id} · ${item.status}</strong><small>${item.room} · checksum ${item.checksum}… · codice ${item.code} · contenuto errore non salvato</small></div><span class="${item.status === "ready" ? "tag" : item.status === "duplicate" ? "tag warn" : "tag red"}">${item.status}</span></div>`).join("");
  }

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
  function setEve(state) {
    window.EveAnimationLibrary?.setState?.(state);
    window.EveAvatarRuntime?.setState?.(state);
  }

  async function runImport() {
    const button = document.getElementById("runMaterialImport");
    const scenario = document.getElementById("materialScenario").value;
    const room = document.getElementById("materialRoom").value;
    const title = document.getElementById("materialTitle").value.trim() || "Materiale senza titolo";
    const file = document.getElementById("materialFilename").value.trim() || "materiale.txt";
    const text = document.getElementById("materialText").value;
    const mediaType = scenario === "unsupported" ? "application/pdf" : document.getElementById("materialMediaType").value;
    const checksum = hashText(text);
    button.disabled = true;
    setEve("eve-uploading");
    renderStages(0);
    await wait(220);

    if (scenario === "oversize") {
      renderStages(0, "failed");
      history.unshift({id:importId++,status:"failed",room,code:"material_too_large",checksum});
      setEve("eve-error-supportive");
      renderHistory();
      button.disabled = false;
      return;
    }

    renderStages(1);
    setEve("eve-searching");
    await wait(220);
    const duplicate = scenario === "duplicate" || catalog.some(item => item.room === room && item.checksum === checksum);
    if (duplicate) {
      renderStages(1, "failed");
      history.unshift({id:importId++,status:"duplicate",room,code:"duplicate_checksum",checksum});
      setEve("eve-confirmation-needed");
      renderHistory();
      button.disabled = false;
      return;
    }

    renderStages(2);
    await wait(220);
    if (scenario === "unsupported") {
      renderStages(3, "failed");
      history.unshift({id:importId++,status:"failed",room,code:"unsupported_media_type",checksum});
      setEve("eve-error-supportive");
      renderHistory();
      button.disabled = false;
      return;
    }

    renderStages(3);
    setEve("eve-reading");
    await wait(220);
    renderStages(4);
    setEve("eve-indexing");
    await wait(220);

    const existing = scenario === "version" ? catalog.find(item => item.room === room) : null;
    if (existing) {
      existing.version += 1;
      existing.title = title;
      existing.file = file;
      existing.type = mediaType;
      existing.checksum = checksum;
      existing.chars = text.length;
      existing.chunks = Math.max(1, Math.ceil(text.length / 1200));
    } else {
      catalog.unshift({id:`mat-${hashText(`${room}:${title}:${importId}`).slice(0,4)}`,room,title,file,type:mediaType,version:1,status:"ready",checksum,chars:text.length,chunks:Math.max(1,Math.ceil(text.length/1200))});
    }
    history.unshift({id:importId++,status:"ready",room,code:"—",checksum});
    renderStages(4, "done");
    setEve("eve-success");
    renderCatalog();
    renderChunks();
    renderHistory();
    button.disabled = false;
  }

  document.getElementById("runMaterialImport").addEventListener("click", runImport);
  document.getElementById("materialRoom").addEventListener("change", renderChunks);
  document.getElementById("materialScenario").addEventListener("change", event => {
    if (event.target.value === "unsupported") {
      document.getElementById("materialMediaType").value = "application/pdf";
      document.getElementById("materialFilename").value = "dispensa.pdf";
    }
  });
  document.getElementById("resetMaterialDemo").addEventListener("click", () => {
    catalog = seedMaterials();
    history = seedHistory();
    importId = 5;
    renderCatalog();
    renderChunks();
    renderHistory();
    renderStages();
    setEve("eve-idle-soft");
  });

  renderCatalog();
  renderChunks();
  renderHistory();
  renderStages();
})();
