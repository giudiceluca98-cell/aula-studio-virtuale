(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("intelligence-research")) return;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

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
            <h3>Centro ricerca, provider, revisione e promozione controllata</h3>
            <p>INTELLIGENCE-0.6 — ricerca controllata, indice semantico versionato e retrieval ibrido operano soltanto su materiali approvati.</p>
          </div>
          <span class="tag violet" id="researchCheckpointBadge">INTELLIGENCE-0.6</span>
        </div>
        <div class="panel-body">
          <div class="metric-row">
            <div class="metric"><small>Fonti acquisite</small><strong id="researchAcquisitionCount">0</strong><div class="progress"><span style="width:65%;background:var(--green)"></span></div></div>
            <div class="metric"><small>In revisione</small><strong id="researchReviewCount">0</strong><div class="progress"><span style="width:45%;background:var(--warn)"></span></div></div>
            <div class="metric"><small>Approvate</small><strong id="researchApprovedCount">0</strong><div class="progress"><span style="width:35%;background:var(--green)"></span></div></div>
            <div class="metric"><small>Promozioni CORE attive</small><strong id="researchPromotionCount">0</strong><div class="progress"><span style="width:25%;background:var(--violet)"></span></div></div>
          </div>
        </div>
      </section>



      <section class="panel span-12" id="searchProviderPanel">
        <div class="panel-head">
          <div><h3>Query → provider → candidati in quarantena</h3><p>Simulazione UI dichiarata: provider disattivati per default, limiti per aula/utente, deduplicazione URL, motivazione del ranking e nessuna acquisizione automatica.</p></div>
          <span class="tag warn" id="searchFeatureFlag">EVE_RESEARCH_SEARCH_ENABLED=false</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="searchPlannedQuery">Query pianificata</label><select id="searchPlannedQuery"><option value="q1">curricolo programmazione introduttivo</option><option value="q2">manuali universitari Python recenti</option></select></div>
            <div class="field"><label for="searchProvider">Provider</label><select id="searchProvider"><option>provider-accademico</option><option>provider-fallback</option></select></div>
            <div class="field"><label for="searchIncludedDomain">Dominio incluso</label><input id="searchIncludedDomain" value="example.edu"></div>
            <div class="field"><label for="searchLanguage">Lingua</label><input id="searchLanguage" value="it"></div>
            <div class="field"><label for="searchMaxResults">Risultati massimi</label><input id="searchMaxResults" type="number" min="1" max="50" value="5"></div>
            <div class="field"><label for="searchRegisterCandidates">Registrazione</label><select id="searchRegisterCandidates"><option value="yes">Candidati in quarantena</option><option value="no">Solo anteprima risultati</option></select></div>
          </div>
          <button class="btn green" id="simulateProviderSearch" style="width:100%;margin-top:12px">Simula esecuzione controllata</button>
          <div class="grid" style="margin-top:12px">
            <div class="panel span-5"><div class="panel-head"><div><h3>Audit esecuzione</h3><p>Retry, fallback, costo e limiti.</p></div><span class="pill" id="searchExecutionBadge">0 esecuzioni</span></div><div class="panel-body list" id="searchExecutionStages"></div></div>
            <div class="panel span-7"><div class="panel-head"><div><h3>Risultati normalizzati</h3><p>Ranking motivato e URL deduplicati.</p></div><span class="tag violet" id="searchResultBadge">0 risultati</span></div><div class="panel-body list" id="searchResultList"></div></div>
          </div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Regole non negoziabili</h3><p>La preview simula il contratto UI; i controlli reali restano server-side.</p></div>
          <span class="pill">Simulazione dichiarata</span>
        </div>
        <div class="panel-body list">
          <div class="row"><div class="meta"><strong>Acquisizione ≠ approvazione</strong><small>Ogni documento web resta non fidato e in quarantena.</small></div><span class="tag warn">Separati</span></div>
          <div class="row"><div class="meta"><strong>Decisione umana</strong><small>Revisore, motivazione, punteggi e provenienza vengono registrati.</small></div><span class="tag">Obbligatoria</span></div>
          <div class="row"><div class="meta"><strong>Punteggi qualità</strong><small>Non approvano mai automaticamente una fonte.</small></div><span class="tag red">Solo supporto</span></div>
          <div class="row"><div class="meta"><strong>Prompt injection</strong><small>Le segnalazioni richiedono presa d'atto esplicita prima dell'approvazione.</small></div><span class="tag warn">Controllata</span></div>
          <div class="row"><div class="meta"><strong>Promozione CORE</strong><small>Esplicita, idempotente, tracciata e revocabile.</small></div><span class="tag violet">Opt-in</span></div>
          <div class="row"><div class="meta"><strong>Revoca</strong><small>Rimuove il materiale dal retrieval senza cancellarne la cronologia.</small></div><span class="tag">Reversibile</span></div>
        </div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Coda di revisione umana</h3><p>Seleziona una fonte acquisita e completa il ciclo di revisione.</p></div>
          <span class="pill" id="reviewQueueBadge">0 da verificare</span>
        </div>
        <div class="panel-body list" id="reviewQueue"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Scheda di revisione</h3><p>Metadati, qualità e rischi restano collegati all'acquisizione esatta.</p></div>
          <span class="tag warn" id="selectedReviewStatus">quarantined</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="reviewSource">Fonte</label><select id="reviewSource"></select></div>
            <div class="field"><label for="reviewerId">Revisore</label><input id="reviewerId" value="docente-01"></div>
            <div class="field"><label for="reviewAuthor">Autore</label><input id="reviewAuthor" value="Dipartimento di Informatica"></div>
            <div class="field"><label for="reviewPublisher">Editore</label><input id="reviewPublisher" value="Università dimostrativa"></div>
            <div class="field"><label for="reviewLicense">Licenza</label><input id="reviewLicense" value="CC BY 4.0"></div>
            <div class="field"><label for="reviewLanguage">Lingua</label><input id="reviewLanguage" value="it"></div>
            <div class="field"><label for="scoreQuality">Qualità</label><input id="scoreQuality" type="number" min="0" max="100" value="90"></div>
            <div class="field"><label for="scoreAuthority">Autorevolezza</label><input id="scoreAuthority" type="number" min="0" max="100" value="88"></div>
            <div class="field"><label for="scoreFreshness">Aggiornamento</label><input id="scoreFreshness" type="number" min="0" max="100" value="94"></div>
            <div class="field"><label for="scoreRelevance">Pertinenza</label><input id="scoreRelevance" type="number" min="0" max="100" value="96"></div>
            <div class="field"><label for="scoreCompleteness">Completezza</label><input id="scoreCompleteness" type="number" min="0" max="100" value="84"></div>
            <div class="field" style="grid-column:1/-1"><label for="reviewRationale">Motivazione obbligatoria</label><textarea id="reviewRationale" rows="3">Fonte pertinente, verificabile e adeguata al percorso didattico.</textarea></div>
          </div>
          <label style="display:flex;gap:10px;align-items:flex-start;margin-top:12px"><input id="riskAcknowledged" type="checkbox"><span><strong>Ho verificato le segnalazioni di sicurezza</strong><br><small>Necessario soltanto quando il contenuto presenta indicatori sospetti.</small></span></label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            <button class="btn" id="startReview">Avvia revisione</button>
            <button class="btn green" id="approveReview">Approva con motivazione</button>
            <button class="btn" id="rejectReview">Rifiuta</button>
          </div>
          <div class="list" id="reviewStages" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Analisi sicurezza e provenienza</h3><p>Indicatori deterministici per il revisore, mai una decisione automatica.</p></div>
          <span class="tag" id="riskSeverity">none</span>
        </div>
        <div class="panel-body list" id="reviewEvidence"></div>
      </section>

      <section class="panel span-7">
        <div class="panel-head">
          <div><h3>Promozione verso i materiali CORE</h3><p>È disponibile soltanto dopo un'approvazione valida dell'acquisizione corrente.</p></div>
          <span class="tag red" id="promotionFlag">Opt-in server-side</span>
        </div>
        <div class="panel-body">
          <div class="form-grid">
            <div class="field"><label for="promotionTitle">Titolo materiale</label><input id="promotionTitle" value="Manuale didattico controllato"></div>
            <div class="field"><label for="idempotencyKey">Idempotency key</label><input id="idempotencyKey" value="promotion-source-11-v1"></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
            <button class="btn green" id="promoteSource">Promuovi esplicitamente</button>
            <button class="btn" id="revokePromotion">Revoca promozione</button>
          </div>
          <div class="list" id="promotionResult" style="margin-top:12px"></div>
        </div>
      </section>

      <section class="panel span-5">
        <div class="panel-head">
          <div><h3>Confronto versioni</h3><p>Una nuova acquisizione scade la revisione precedente, senza alterare il materiale storico già approvato.</p></div>
          <button class="btn" id="simulateNewVersion">Simula nuova versione</button>
        </div>
        <div class="panel-body list" id="versionComparison"></div>
      </section>
    </div>`;
  main.appendChild(view);



  const searchExecutions = [];
  const providerResults = [
    {url:"https://example.edu/course?utm_source=newsletter&b=2&a=1#intro", title:"Curricolo verificabile", publisher:"Example University", score:0.95, language:"it", reason:"dominio accademico"},
    {url:"https://example.edu/course?a=1&b=2", title:"Duplicato URL canonico", publisher:"Example University", score:0.51, language:"it", reason:"stesso contenuto"},
    {url:"https://example.org/manual", title:"Manuale alternativo", publisher:"Ente didattico", score:0.77, language:"it", reason:"pertinenza didattica"}
  ];
  const normalizePreviewUrl = value => {
    const url = new URL(value);
    ["utm_source","utm_medium","utm_campaign","fbclid","gclid"].forEach(key => url.searchParams.delete(key));
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    url.searchParams.sort();
    return url.toString().replace(/\/$/, url.pathname === "/" ? "/" : "");
  };
  function renderSearchResults(execution) {
    const list = document.getElementById("searchResultList");
    const badge = document.getElementById("searchResultBadge");
    if (!execution) {
      list.innerHTML = '<div class="row"><div class="meta"><strong>Nessuna esecuzione</strong><small>La preview non contatta provider reali.</small></div><span class="tag warn">OFF</span></div>';
      badge.textContent = "0 risultati";
      return;
    }
    badge.textContent = `${execution.results.length} risultati`;
    list.innerHTML = execution.results.map(item => `<div class="row"><div class="meta"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.url)} · score=${item.score.toFixed(2)} · ${escapeHtml(item.reason)} · source_id=${item.sourceId ?? "non registrato"} · content_acquired=false</small></div><span class="${item.sourceId ? "tag warn" : "tag violet"}">${item.sourceId ? "Quarantena" : "Solo risultato"}</span></div>`).join("");
  }


  const sources = [
    {
      id: 11,
      project: "research-a14c",
      room: "room-python-zero",
      title: "Curricolo di programmazione",
      url: "https://example.edu/computer-science",
      acquisitionId: 101,
      sha256: "29b87b0f…f91a",
      previousSha256: null,
      bytes: 18432,
      acquired: true,
      status: "quarantined",
      reviewStatus: null,
      reviewId: null,
      suspicious: false,
      flags: [],
      severity: "none",
      rationale: null,
      scores: null,
      promotion: null
    },
    {
      id: 12,
      project: "research-a14c",
      room: "room-python-zero",
      title: "Pagina con istruzioni sospette",
      url: "https://example.org/python-curriculum",
      acquisitionId: 102,
      sha256: "7d2f66ca…930b",
      previousSha256: null,
      bytes: 12390,
      acquired: true,
      status: "quarantined",
      reviewStatus: null,
      reviewId: null,
      suspicious: true,
      flags: ["ignore_previous_instructions", "tool_execution_instruction"],
      severity: "high",
      rationale: null,
      scores: null,
      promotion: null
    },
    {
      id: 21,
      project: "research-b82e",
      room: "room-matematica",
      title: "Competenze matematiche",
      url: "https://example.edu/mathematics",
      acquisitionId: 201,
      sha256: "1ab98e34…551c",
      previousSha256: null,
      bytes: 21600,
      acquired: true,
      status: "under_review",
      reviewStatus: "under_review",
      reviewId: 3,
      suspicious: false,
      flags: [],
      severity: "none",
      rationale: null,
      scores: null,
      promotion: null
    }
  ];

  let nextReviewId = 4;
  let nextMaterialId = 71;

  const selectedSource = () => {
    const value = Number(document.getElementById("reviewSource")?.value);
    return sources.find(source => source.id === value) || sources[0];
  };

  const scoreValues = () => ({
    quality: Number(document.getElementById("scoreQuality").value),
    authority: Number(document.getElementById("scoreAuthority").value),
    freshness: Number(document.getElementById("scoreFreshness").value),
    relevance: Number(document.getElementById("scoreRelevance").value),
    completeness: Number(document.getElementById("scoreCompleteness").value)
  });

  function notify(message) {
    window.notify?.(message);
  }

  function renderEvidence(source) {
    const evidence = document.getElementById("reviewEvidence");
    const severity = document.getElementById("riskSeverity");
    severity.textContent = source.severity;
    severity.className = source.suspicious ? "tag red" : "tag";
    evidence.innerHTML = `
      <div class="row"><div class="meta"><strong>Acquisizione vincolata</strong><small>ID ${source.acquisitionId} · SHA-256 ${escapeHtml(source.sha256)} · ${source.bytes} byte</small></div><span class="tag">Immutabile</span></div>
      <div class="row"><div class="meta"><strong>URL finale</strong><small>${escapeHtml(source.url)}</small></div><span class="tag violet">Provenienza</span></div>
      <div class="row"><div class="meta"><strong>Prompt injection</strong><small>${source.flags.length ? escapeHtml(source.flags.join(", ")) : "Nessun indicatore deterministico rilevato"}</small></div><span class="${source.suspicious ? "tag red" : "tag"}">${source.suspicious ? "Segnalata" : "Non rilevata"}</span></div>
      <div class="row"><div class="meta"><strong>Decisione automatica</strong><small>L'analisi non può approvare o rifiutare la fonte.</small></div><span class="tag red">Vietata</span></div>`;
  }

  function renderPromotion(source) {
    const node = document.getElementById("promotionResult");
    if (!source.promotion) {
      node.innerHTML = `<div class="row"><div class="meta"><strong>Nessuna promozione attiva</strong><small>Il documento non partecipa al retrieval CORE.</small></div><span class="tag warn">Non promosso</span></div>`;
      return;
    }
    node.innerHTML = `
      <div class="row"><div class="meta"><strong>${source.promotion.status === "active" ? "Materiale CORE attivo" : "Promozione revocata"}</strong><small>${escapeHtml(source.promotion.materialId)} · version ${source.promotion.versionId} · key ${escapeHtml(source.promotion.key)}</small></div><span class="${source.promotion.status === "active" ? "tag" : "tag red"}">${source.promotion.status}</span></div>
      <div class="row"><div class="meta"><strong>Cronologia preservata</strong><small>Revisione ${source.reviewId}, acquisizione ${source.acquisitionId} e materiale restano collegati.</small></div><span class="tag violet">Audit</span></div>`;
  }

  function renderVersions(source) {
    const changed = Boolean(source.previousSha256 && source.previousSha256 !== source.sha256);
    document.getElementById("versionComparison").innerHTML = `
      <div class="row"><div class="meta"><strong>Acquisizione corrente</strong><small>ID ${source.acquisitionId} · ${escapeHtml(source.sha256)}</small></div><span class="tag">Corrente</span></div>
      <div class="row"><div class="meta"><strong>Versione precedente</strong><small>${source.previousSha256 ? escapeHtml(source.previousSha256) : "Nessuna acquisizione precedente"}</small></div><span class="${changed ? "tag warn" : "tag"}">${changed ? "Checksum cambiato" : "Non disponibile"}</span></div>
      <div class="row"><div class="meta"><strong>Effetto sulla revisione</strong><small>${changed ? "La revisione precedente è expired; serve una nuova decisione umana." : "La revisione resta legata all'acquisizione visualizzata."}</small></div><span class="${changed ? "tag red" : "tag"}">${changed ? "Scaduta" : "Coerente"}</span></div>`;
  }

  function render() {
    document.getElementById("researchAcquisitionCount").textContent = String(sources.filter(source => source.acquired).length);
    document.getElementById("researchReviewCount").textContent = String(sources.filter(source => source.reviewStatus === "under_review").length);
    document.getElementById("researchApprovedCount").textContent = String(sources.filter(source => source.reviewStatus === "approved").length);
    document.getElementById("researchPromotionCount").textContent = String(sources.filter(source => source.promotion?.status === "active").length);
    document.getElementById("reviewQueueBadge").textContent = `${sources.filter(source => source.acquired && !["approved", "rejected"].includes(source.reviewStatus)).length} da verificare`;

    const selector = document.getElementById("reviewSource");
    const previous = selector.value;
    selector.innerHTML = sources.map(source => `<option value="${source.id}">${escapeHtml(source.title)} · ${source.room}</option>`).join("");
    selector.value = sources.some(source => String(source.id) === previous) ? previous : String(sources[0].id);

    document.getElementById("reviewQueue").innerHTML = sources.map(source => `
      <button class="row" data-review-source="${source.id}" style="width:100%;text-align:left">
        <div class="meta"><strong>${escapeHtml(source.title)}</strong><small>${escapeHtml(source.room)} · acquisition=${source.acquisitionId} · source_status=${source.status} · review=${source.reviewStatus || "not_started"}</small></div>
        <span class="${source.reviewStatus === "approved" ? "tag" : source.reviewStatus === "rejected" ? "tag red" : "tag warn"}">${source.reviewStatus || "Da revisionare"}</span>
      </button>`).join("");
    document.querySelectorAll("[data-review-source]").forEach(button => button.addEventListener("click", () => {
      selector.value = button.dataset.reviewSource;
      syncSelectedSource();
    }));
    syncSelectedSource();
  }

  function syncSelectedSource() {
    const source = selectedSource();
    if (!source) return;
    const status = document.getElementById("selectedReviewStatus");
    status.textContent = source.reviewStatus || source.status;
    status.className = source.reviewStatus === "approved" ? "tag" : source.reviewStatus === "rejected" ? "tag red" : "tag warn";
    document.getElementById("idempotencyKey").value = `promotion-source-${source.id}-acq-${source.acquisitionId}`;
    document.getElementById("promotionTitle").value = source.title;
    document.getElementById("riskAcknowledged").checked = false;
    renderEvidence(source);
    renderPromotion(source);
    renderVersions(source);
  }

  async function animateStages(stages) {
    const node = document.getElementById("reviewStages");
    node.innerHTML = stages.map((stage, index) => `<div class="row" data-review-stage="${index}"><div class="meta"><strong>${index + 1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    for (let index = 0; index < stages.length; index += 1) {
      const tag = node.querySelector(`[data-review-stage="${index}"] .tag`);
      tag.className = "tag violet";
      tag.textContent = "In corso";
      await wait(180);
      tag.className = "tag";
      tag.textContent = "Registrato";
    }
  }

  document.getElementById("reviewSource").addEventListener("change", syncSelectedSource);

  document.getElementById("startReview").addEventListener("click", async () => {
    const source = selectedSource();
    if (!source) return;
    window.EveAnimationLibrary?.setState?.("eve-reading");
    await animateStages([
      ["Identità revisore", "La decisione sarà attribuita al revisore indicato"],
      ["Acquisizione corrente", `La revisione viene fissata all'acquisition_id ${source.acquisitionId}`],
      ["Analisi deterministica", "Indicatori sospetti mostrati senza decisioni automatiche"],
      ["Stato under_review", "La fonte resta fuori dai materiali CORE"]
    ]);
    source.reviewId ||= nextReviewId++;
    source.reviewStatus = "under_review";
    source.status = "under_review";
    render();
    window.EveAnimationLibrary?.setState?.("eve-confirmation-needed");
    notify("Revisione avviata: nessuna approvazione automatica");
  });

  document.getElementById("approveReview").addEventListener("click", async () => {
    const source = selectedSource();
    const rationale = document.getElementById("reviewRationale").value.trim();
    if (source.reviewStatus !== "under_review") return notify("Avvia prima la revisione della fonte selezionata");
    if (rationale.length < 10) return notify("La motivazione di approvazione è obbligatoria");
    if (source.suspicious && !document.getElementById("riskAcknowledged").checked) return notify("Conferma di aver verificato le segnalazioni di sicurezza");
    const scores = scoreValues();
    if (Object.values(scores).some(value => !Number.isFinite(value) || value < 0 || value > 100)) return notify("Tutti i punteggi devono essere compresi tra 0 e 100");
    window.EveAnimationLibrary?.setState?.("eve-test-running");
    await animateStages([
      ["Motivazione", "La decisione non dipende soltanto dal punteggio"],
      ["Metadati", "Autore, editore, licenza e lingua vengono collegati"],
      ["Rischi", source.suspicious ? "Presa d'atto registrata" : "Nessun indicatore deterministico"],
      ["Approvazione", "La fonte è approvata ma non ancora promossa"]
    ]);
    source.reviewStatus = "approved";
    source.status = "approved";
    source.rationale = rationale;
    source.scores = scores;
    render();
    window.EveAnimationLibrary?.setState?.("eve-success");
    notify("Fonte approvata: la promozione CORE richiede ancora un'azione separata");
  });

  document.getElementById("rejectReview").addEventListener("click", async () => {
    const source = selectedSource();
    const rationale = document.getElementById("reviewRationale").value.trim();
    if (source.reviewStatus !== "under_review") return notify("Avvia prima la revisione");
    if (rationale.length < 10) return notify("La motivazione di rifiuto è obbligatoria");
    await animateStages([
      ["Motivazione", "Il rifiuto viene attribuito al revisore"],
      ["Stato rejected", "La fonte non può essere promossa"],
      ["Cronologia", "Acquisizione e decisione restano consultabili"]
    ]);
    source.reviewStatus = "rejected";
    source.status = "rejected";
    source.rationale = rationale;
    render();
    window.EveAnimationLibrary?.setState?.("eve-error-supportive");
    notify("Fonte rifiutata con motivazione registrata");
  });

  document.getElementById("promoteSource").addEventListener("click", async () => {
    const source = selectedSource();
    if (source.reviewStatus !== "approved") return notify("Soltanto una fonte approvata può essere promossa");
    if (source.promotion?.status === "active") return notify("Promozione idempotente: il materiale è già attivo");
    const key = document.getElementById("idempotencyKey").value.trim();
    if (key.length < 8) return notify("L'idempotency key deve contenere almeno 8 caratteri");
    if (!window.confirm?.("Promuovere questa acquisizione approvata nei materiali CORE?")) return;
    window.EveAnimationLibrary?.setState?.("eve-publishing");
    await animateStages([
      ["Verifica revisione", `Review ${source.reviewId} approvata e acquisition ${source.acquisitionId} corrente`],
      ["Idempotenza", `Chiave ${key}`],
      ["Import CORE", "Contenuto, provenienza e metadati vengono collegati"],
      ["Retrieval", "Il materiale diventa consultabile soltanto dopo l'import riuscito"]
    ]);
    source.promotion = {
      status: "active",
      materialId: `material-research-${nextMaterialId++}`,
      versionId: 1,
      key
    };
    render();
    window.EveAnimationLibrary?.setState?.("eve-published");
    notify("Promozione simulata: materiale CORE attivo e tracciato");
  });

  document.getElementById("revokePromotion").addEventListener("click", async () => {
    const source = selectedSource();
    if (source.promotion?.status !== "active") return notify("Non esiste una promozione attiva da revocare");
    if (!window.confirm?.("Revocare il materiale dal retrieval mantenendo la cronologia?")) return;
    window.EveAnimationLibrary?.setState?.("eve-rollback");
    await animateStages([
      ["Revoca attribuita", "Attore e motivazione vengono registrati"],
      ["Disattivazione retrieval", "current_version_id viene rimosso senza cancellare le versioni"],
      ["Stato superseded", "Fonte e revisione restano nella cronologia"]
    ]);
    source.promotion.status = "revoked";
    source.reviewStatus = "superseded";
    source.status = "superseded";
    render();
    window.EveAnimationLibrary?.setState?.("eve-success");
    notify("Promozione revocata: cronologia preservata");
  });

  document.getElementById("simulateNewVersion").addEventListener("click", () => {
    const source = selectedSource();
    source.previousSha256 = source.sha256;
    source.sha256 = `new-${source.id}-${Date.now().toString(16)}…sha`;
    source.acquisitionId += 1000;
    source.bytes += 768;
    if (["under_review", "approved"].includes(source.reviewStatus)) {
      source.reviewStatus = "expired";
      source.status = "expired";
    }
    render();
    window.EveAnimationLibrary?.setState?.("eve-version-created");
    notify("Nuova acquisizione simulata: la revisione precedente è scaduta");
  });

  function openResearchView() {
    document.querySelectorAll(".view").forEach(node => node.classList.toggle("active", node.id === "intelligence-research"));
    document.querySelectorAll(".nav button").forEach(node => node.classList.toggle("active", node === navButton));
    document.getElementById("pageTitle").textContent = "Ricerca provider e qualità delle fonti";
    document.getElementById("pageSubtitle").textContent = "Esegui query controllate, registra candidati in quarantena e mantieni revisione e promozione separate.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }



  document.getElementById("simulateProviderSearch").addEventListener("click", async () => {
    const button = document.getElementById("simulateProviderSearch");
    const stages = document.getElementById("searchExecutionStages");
    const domain = document.getElementById("searchIncludedDomain").value.trim().toLowerCase();
    const register = document.getElementById("searchRegisterCandidates").value === "yes";
    const maxResults = Math.max(1, Math.min(50, Number(document.getElementById("searchMaxResults").value) || 5));
    const provider = document.getElementById("searchProvider").value;
    button.disabled = true;
    document.getElementById("searchFeatureFlag").textContent = "Simulazione: flag temporaneamente ON";
    const steps = [
      ["Limiti server-side", "Aula, utente, progetto, giorno e massimo risultati"],
      ["Provider configurabile", `${provider} con timeout, retry e fallback`],
      ["Normalizzazione URL", "Schema, credenziali, dominio, frammenti e tracking"],
      ["Deduplicazione", "Un solo risultato per URL normalizzato"],
      ["Ranking motivato", "Score e motivazioni conservati nell'audit"],
      ["Quarantena", register ? "Candidati registrati senza acquisizione" : "Risultati non registrati"]
    ];
    stages.innerHTML = steps.map((step,index) => `<div class="row" data-search-step="${index}"><div class="meta"><strong>${index+1}. ${step[0]}</strong><small>${step[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-searching");
    for (let index=0; index<steps.length; index+=1) {
      const tag = stages.querySelector(`[data-search-step="${index}"] .tag`);
      tag.className = "tag violet"; tag.textContent = "In corso"; await wait(150);
      tag.className = "tag"; tag.textContent = "Superato";
    }
    const unique = new Map();
    providerResults.forEach(item => {
      const normalized = normalizePreviewUrl(item.url);
      const host = new URL(normalized).hostname;
      if (domain && !(host === domain || host.endsWith(`.${domain}`))) return;
      const previous = unique.get(normalized);
      if (!previous || item.score > previous.score) unique.set(normalized, {...item,url:normalized});
    });
    const results = [...unique.values()].sort((a,b) => b.score-a.score).slice(0,maxResults).map((item,index) => ({...item,sourceId:register ? 400+searchExecutions.length*10+index : null}));
    const execution = {id:searchExecutions.length+1, provider, attempts:provider.includes("fallback") ? 2 : 1, cost:0.12, results};
    searchExecutions.push(execution);
    document.getElementById("searchExecutionBadge").textContent = `${searchExecutions.length} esecuzioni`;
    renderSearchResults(execution);
    document.getElementById("searchFeatureFlag").textContent = "EVE_RESEARCH_SEARCH_ENABLED=false";
    window.EveAnimationLibrary?.setState?.("eve-success");
    notify(register ? "Risultati registrati come candidati: nessuna acquisizione avviata" : "Anteprima risultati completata senza registrazione");
    button.disabled = false;
  });


  navButton.addEventListener("click", openResearchView);
  renderSearchResults(null);

  const ingestionGrid = view.querySelector('.grid');
  if (ingestionGrid && !document.getElementById('advancedIngestionPanel')) {
    const panel=document.createElement('section'); panel.id='advancedIngestionPanel'; panel.className='panel span-7';
    panel.innerHTML=`<div class="panel-head"><div><h3>Ingestione documentale avanzata</h3><p>INTELLIGENCE-0.5 — PDF, DOCX ed EPUB vengono estratti localmente, senza macro, script o promozione automatica.</p></div><span class="tag warn">Flag OFF</span></div><div class="panel-body"><div class="form-grid"><div class="field"><label>Formato</label><select id="advancedFormat"><option>PDF nativo</option><option>DOCX senza macro</option><option>EPUB</option></select></div><div class="field"><label>Deduplicazione</label><select id="advancedDuplicate"><option>Nessun duplicato</option><option>Duplicato esatto</option><option>Quasi duplicato</option></select></div></div><button class="btn green" id="simulateAdvancedIngestion" style="width:100%;margin-top:12px">Simula estrazione e quarantena</button><div class="list" id="advancedIngestionStages" style="margin-top:12px"></div></div>`;
    const crawl=document.createElement('section');crawl.className='panel span-5';crawl.innerHTML=`<div class="panel-head"><div><h3>Crawling strettamente limitato</h3><p>Solo stesso dominio, profondità e pagine limitate; ogni URL passa dai controlli SSRF e robots.</p></div><span class="tag warn">OFF di default</span></div><div class="panel-body"><div class="field"><label>Profondità</label><select id="crawlDepth"><option>0</option><option selected>1</option></select></div><div class="field"><label>Pagine massime</label><select id="crawlPages"><option>3</option><option selected>10</option></select></div><button class="btn" id="simulateLimitedCrawl" style="width:100%;margin-top:12px">Simula crawl limitato</button><div class="list" id="crawlStages" style="margin-top:12px"></div></div>`;
    ingestionGrid.append(panel,crawl);
    const run=async(id,target,stages)=>{const button=document.getElementById(id);button.disabled=true;const node=document.getElementById(target);node.innerHTML=stages.map((s,i)=>`<div class="row" data-stage="${i}"><div class="meta"><strong>${i+1}. ${s[0]}</strong><small>${s[1]}</small></div><span class="tag warn">In attesa</span></div>`).join('');for(let i=0;i<stages.length;i++){const tag=node.querySelector(`[data-stage="${i}"] .tag`);tag.className='tag violet';tag.textContent='In corso';await new Promise(r=>setTimeout(r,150));tag.className='tag';tag.textContent='Superato'}button.disabled=false;window.notify?.('Simulazione completata: contenuto ancora non fidato')};
    document.getElementById('simulateAdvancedIngestion').addEventListener('click',()=>run('simulateAdvancedIngestion','advancedIngestionStages',[["Limiti e formato","Byte, pagine, archivio e MIME"],["Rifiuto contenuti attivi","Macro, relazioni esterne, password e script"],["Estrazione verificabile","Pagine, paragrafi e spine EPUB con locator"],["Deduplicazione","SHA-256 e somiglianza testuale deterministica"],["Quarantena","instructions_executable=false; nessuna promozione CORE"]]));
    document.getElementById('simulateLimitedCrawl').addEventListener('click',()=>run('simulateLimitedCrawl','crawlStages',[["URL radice","Fonte già registrata"],["Controlli rete","SSRF, DNS, robots, redirect e TLS"],["Confini","Stesso dominio, profondità e numero pagine"],["Budget","Byte totali e arresto tracciato"],["Quarantena pagine","Nessun JavaScript eseguito o materiale CORE creato"]]));
  }


  const semanticGrid = view.querySelector('.grid');
  if (semanticGrid && !document.getElementById('hybridRetrievalPanel')) {
    const indexPanel=document.createElement('section');
    indexPanel.id='hybridRetrievalPanel';indexPanel.className='panel span-6';
    indexPanel.innerHTML=`<div class="panel-head"><div><h3>Indice semantico versionato</h3><p>INTELLIGENCE-0.6 — indicizza soltanto materiali con promozione attiva, separati per aula, modello e versione.</p></div><span class="tag warn">Embedding OFF</span></div><div class="panel-body"><div class="form-grid"><div class="field"><label>Provider</label><select id="embeddingProvider"><option>deterministic-local / hash-embedding-v1</option><option disabled>provider esterno non configurato</option></select></div><div class="field"><label>Materiale approvato</label><select id="semanticMaterial"><option>material-research-801 · v1</option><option>material-research-802 · v1</option></select></div></div><button class="btn green" id="simulateSemanticIndex" style="width:100%;margin-top:12px">Simula indicizzazione idempotente</button><div class="list" id="semanticIndexStages" style="margin-top:12px"></div></div>`;
    const retrievalPanel=document.createElement('section');
    retrievalPanel.className='panel span-6';
    retrievalPanel.innerHTML=`<div class="panel-head"><div><h3>Retrieval ibrido verificabile</h3><p>Lessicale + semantico + filtri strutturati, con fallback lessicale e locator obbligatorio.</p></div><span class="tag warn">Retrieval OFF</span></div><div class="panel-body"><div class="field"><label for="hybridQuery">Query</label><input id="hybridQuery" value="come funzionano algoritmi e variabili"></div><div class="form-grid"><div class="field"><label>Modalità</label><select id="hybridMode"><option>Hybrid</option><option>Lexical fallback</option></select></div><div class="field"><label>Soglia minima</label><input id="hybridThreshold" type="number" min="0" max="1" step="0.05" value="0.15"></div></div><button class="btn" id="simulateHybridSearch" style="width:100%;margin-top:12px">Simula retrieval</button><div class="list" id="hybridResults" style="margin-top:12px"></div></div>`;
    semanticGrid.append(indexPanel,retrievalPanel);
    const animateSemantic=async(buttonId,target,steps)=>{const button=document.getElementById(buttonId);button.disabled=true;const node=document.getElementById(target);node.innerHTML=steps.map((s,i)=>`<div class="row" data-semantic-stage="${i}"><div class="meta"><strong>${i+1}. ${s[0]}</strong><small>${s[1]}</small></div><span class="tag warn">In attesa</span></div>`).join('');for(let i=0;i<steps.length;i++){const tag=node.querySelector(`[data-semantic-stage="${i}"] .tag`);tag.className='tag violet';tag.textContent='In corso';await new Promise(r=>setTimeout(r,150));tag.className='tag';tag.textContent='Superato'}button.disabled=false};
    document.getElementById('simulateSemanticIndex').addEventListener('click',async()=>{window.EveAnimationLibrary?.setState?.('eve-processing');await animateSemantic('simulateSemanticIndex','semanticIndexStages',[["Promozione attiva","Materiale e versione autorizzati nell'aula"],["Job idempotente","Chiave, provider, modello e dimensioni versionati"],["Chunk verificabili","Ogni vettore conserva char:start-end e SHA-256"],["Isolamento","Indice separato per room_id e permessi"],["Persistenza","Ricostruzione e cancellazione esplicite"]]);window.EveAnimationLibrary?.setState?.('eve-success');window.notify?.('Simulazione indice completata: nessun provider esterno contattato')});
    document.getElementById('simulateHybridSearch').addEventListener('click',async()=>{const mode=document.getElementById('hybridMode').value;window.EveAnimationLibrary?.setState?.('eve-searching');await animateSemantic('simulateHybridSearch','hybridResults',[["Filtri server-side","Aula, progetto, fonte e materiale"],["Candidati lessicali","Termini, frequenza e deduplicazione SHA-256"],["Punteggio semantico",mode==='Hybrid'?"Coseno su modello e dimensioni compatibili":"Provider indisponibile: fallback lessicale"],["Reranking","Pesi, soglia e bonus frase esatta"],["Citazioni","Solo risultati con locator verificabile"],["Metriche","Latenza, token, costo, precision@k e recall@k"]]);window.EveAnimationLibrary?.setState?.('eve-success');window.notify?.(`Retrieval simulato in modalità ${mode}`)});
  }

  render();
})();

(() => {
  const view = document.getElementById("intelligence-research");
  const grid = view?.querySelector(".grid");
  if (!grid || document.getElementById("sourceHealthPanel")) return;

  const sourceHealth = document.createElement("section");
  sourceHealth.id = "sourceHealthPanel";
  sourceHealth.className = "panel span-7";
  sourceHealth.innerHTML = `
    <div class="panel-head">
      <div><h3>Freschezza e salute delle fonti</h3><p>INTELLIGENCE-0.7 — ricontrollo pianificabile, checksum, scadenza e cronologia senza approvazione automatica.</p></div>
      <span class="tag warn">Recheck OFF</span>
    </div>
    <div class="panel-body">
      <div class="form-grid">
        <div class="field"><label>Esito simulato</label><select id="healthScenario"><option value="unchanged">Disponibile / invariata</option><option value="changed">Modificata</option><option value="stale">Obsoleta</option><option value="removed">Rimossa (404/410)</option><option value="unavailable">Temporaneamente non disponibile</option></select></div>
        <div class="field"><label>Scadenza massima</label><select id="healthExpiry"><option>30 giorni</option><option selected>180 giorni</option><option>365 giorni</option></select></div>
      </div>
      <button class="btn green" id="simulateSourceHealth" style="width:100%;margin-top:12px">Simula ricontrollo controllato</button>
      <div class="list" id="sourceHealthStages" style="margin-top:12px"></div>
    </div>`;

  const conflicts = document.createElement("section");
  conflicts.className = "panel span-5";
  conflicts.innerHTML = `
    <div class="panel-head"><div><h3>Contraddizioni e preferenze motivate</h3><p>Il sistema segnala il conflitto; una persona decide se preferire una fonte, conservarle entrambe o scartare il segnale.</p></div><span class="tag warn">Nessun vincitore automatico</span></div>
    <div class="panel-body">
      <div class="field"><label>Conflitto</label><select id="conflictScenario"><option>Valore numerico discordante</option><option>Data non coerente</option><option>Versione differente</option><option>Ambito non confrontabile</option></select></div>
      <div class="field"><label>Decisione umana</label><select id="conflictDecision"><option>Preferisci fonte più recente</option><option>Mantieni entrambe con nota</option><option>Segnale non valido</option></select></div>
      <button class="btn" id="simulateConflictResolution" style="width:100%;margin-top:12px">Simula revisione del conflitto</button>
      <div class="list" id="conflictStages" style="margin-top:12px"></div>
    </div>`;

  const report = document.createElement("section");
  report.className = "panel span-12";
  report.innerHTML = `
    <div class="panel-head"><div><h3>Report di copertura e affidabilità del corpus</h3><p>Metriche separate per disponibilità, freschezza, provenienza e coerenza. Il punteggio non modifica review o promozioni.</p></div><span class="pill">Storico preservato</span></div>
    <div class="panel-body">
      <div class="metric-row">
        <div class="metric"><small>Fonti controllate</small><strong id="healthCheckedMetric">18/24</strong><div class="progress"><span style="width:75%"></span></div></div>
        <div class="metric"><small>Salute media</small><strong id="healthScoreMetric">82</strong><div class="progress"><span style="width:82%;background:var(--green)"></span></div></div>
        <div class="metric"><small>Da verificare</small><strong id="healthAttentionMetric">4</strong><div class="progress"><span style="width:30%;background:var(--warn)"></span></div></div>
        <div class="metric"><small>Conflitti aperti</small><strong id="healthConflictMetric">2</strong><div class="progress"><span style="width:20%;background:var(--red)"></span></div></div>
      </div>
      <div class="list" id="corpusHealthNotes" style="margin-top:12px">
        <div class="row"><div class="meta"><strong>Regola di sicurezza</strong><small>health_score_can_approve=false · automatic_promotion=false</small></div><span class="tag">Attiva</span></div>
        <div class="row"><div class="meta"><strong>Citazioni storiche</strong><small>Acquisition ID, checksum, material_id e version_id restano collegati</small></div><span class="tag violet">Preservate</span></div>
      </div>
    </div>`;
  grid.append(sourceHealth, conflicts, report);

  const animate = async (buttonId, targetId, stages) => {
    const button = document.getElementById(buttonId);
    const node = document.getElementById(targetId);
    button.disabled = true;
    node.innerHTML = stages.map((stage,index) => `<div class="row" data-health-stage="${index}"><div class="meta"><strong>${index+1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    for (let index=0; index<stages.length; index+=1) {
      const tag = node.querySelector(`[data-health-stage="${index}"] .tag`);
      tag.className = "tag violet"; tag.textContent = "In corso";
      await new Promise(resolve => setTimeout(resolve, 150));
      tag.className = "tag"; tag.textContent = "Registrato";
    }
    button.disabled = false;
  };

  document.getElementById("simulateSourceHealth").addEventListener("click", async () => {
    const scenario = document.getElementById("healthScenario").value;
    const labels = {
      unchanged: ["Checksum invariato", "Fonte corrente; nessuna nuova acquisizione"],
      changed: ["Checksum differente", "Nuova acquisizione in quarantena e review scaduta"],
      stale: ["Scadenza superata", "Fonte segnalata come obsoleta senza rifiuto automatico"],
      removed: ["HTTP 404/410", "Fonte rimossa; citazioni storiche ancora disponibili"],
      unavailable: ["Errore temporaneo", "Backoff e nuovo controllo pianificato"]
    };
    window.EveAnimationLibrary?.setState?.("eve-searching");
    await animate("simulateSourceHealth", "sourceHealthStages", [
      ["Policy effettiva", `Scadenza ${document.getElementById("healthExpiry").value} e intervallo di recheck`],
      ["Acquisizione controllata", "SSRF, DNS, robots, redirect, TLS e limiti già approvati"],
      labels[scenario],
      ["Dimensioni separate", "Disponibilità, freschezza, provenienza e coerenza"],
      ["Cronologia", "Snapshot immutabile con acquisition_id, checksum e riferimenti CORE"],
      ["Nessuna approvazione", "Il punteggio salute non modifica review o promozione"]
    ]);
    window.EveAnimationLibrary?.setState?.(scenario === "removed" ? "eve-error-supportive" : "eve-success");
    window.notify?.("Simulazione salute fonte completata senza richieste di rete reali");
  });

  document.getElementById("simulateConflictResolution").addEventListener("click", async () => {
    window.EveAnimationLibrary?.setState?.("eve-confirmation-needed");
    await animate("simulateConflictResolution", "conflictStages", [
      ["Evidenze", "Claim e locator delle due fonti vengono conservati"],
      ["Contesto", "Freschezza, provenienza e qualità sono mostrati separatamente"],
      ["Decisione", document.getElementById("conflictDecision").value],
      ["Motivazione obbligatoria", "La preferenza è attribuita a una persona"],
      ["Storico", "Il conflitto resta consultabile anche dopo la risoluzione"]
    ]);
    window.EveAnimationLibrary?.setState?.("eve-success");
    window.notify?.("Conflitto risolto nella simulazione: nessun vincitore scelto automaticamente");
  });
})();
