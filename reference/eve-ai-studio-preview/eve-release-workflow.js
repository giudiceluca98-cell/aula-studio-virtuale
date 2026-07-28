(() => {
  const publishView = document.getElementById("publish");
  const versionsView = document.getElementById("versions");
  if (!publishView || !versionsView || document.getElementById("eveReleaseCandidate")) return;

  const candidateKey = "eve-studio-release-candidate-v1";
  const historyKey = "eve-studio-release-history-v1";
  const modeLabels = {
    adaptive_explanation: "Spiegazione adattiva",
    socratic: "Metodo socratico",
    quiz: "Quiz e interrogazione",
    correction: "Correzione guidata",
    planning: "Pianificazione",
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const releaseHistory = () => {
    const history = readJson(historyKey, []);
    return Array.isArray(history) ? history : [];
  };

  const nextVersionNumber = () => {
    const history = releaseHistory();
    return history.length ? Math.max(...history.map((item) => Number(item.version) || 0)) + 1 : 1;
  };

  publishView.innerHTML = `
    <div class="grid">
      <section class="panel span-7" id="eveReleaseCandidate">
        <div class="panel-head">
          <div><h3>Configurazione pronta per Pubblica</h3><p>Qui la configurazione di lavoro diventa una Versione N candidata al rilascio.</p></div>
          <span class="tag warn" id="releaseCandidateBadge">Nessuna configurazione</span>
        </div>
        <div class="panel-body">
          <div class="empty" id="releaseCandidateEmpty">Da “Configura e prova”, usa “Invia a Pubblica” dopo aver verificato il modello nella chat.</div>
          <div id="releaseCandidateContent" hidden>
            <div class="build-eve-preview" id="releaseCandidateSummary"></div>
            <div class="prompt-next-action" id="releaseCandidateRules"></div>
          </div>
        </div>
      </section>
      <section class="panel span-5">
        <div class="panel-head"><div><h3>Approvazione per Aula Studio</h3><p>Il caricamento richiede sempre una conferma esplicita.</p></div><span class="pill">Approvazione obbligatoria</span></div>
        <div class="panel-body">
          <div class="list">
            <div class="row"><div class="meta"><strong>Configurazione ricevuta</strong><small>Deve arrivare dalla chat di prova.</small></div><span class="tag warn" id="releaseConfigGate">In attesa</span></div>
            <div class="row"><div class="meta"><strong>Controlli qualità</strong><small>Saranno collegati ai test reali.</small></div><span class="tag warn">Da collegare</span></div>
            <div class="row"><div class="meta"><strong>Connessione con Aula</strong><small>Invio dell’aggiornamento all’app ufficiale.</small></div><span class="tag red">Non collegata</span></div>
          </div>
          <label class="release-approval">
            <input type="checkbox" id="releaseApprovalCheck" disabled>
            <span>Confermo di voler caricare questa versione su Aula Studio.</span>
          </label>
          <button class="btn primary" id="approveReleaseForAula" style="width:100%;margin-top:12px" disabled>Approva caricamento</button>
          <button class="btn" id="returnToEveBuilder" style="width:100%;margin-top:8px">Torna a Configura e prova</button>
          <p class="build-eve-note" id="releaseApprovalNote"><strong>Stato reale:</strong> l’approvazione viene registrata, ma l’invio resterà in attesa finché Aula Studio non sarà collegata.</p>
        </div>
      </section>
    </div>
  `;

  versionsView.innerHTML = `
    <div class="grid">
      <section class="panel span-12">
        <div class="panel-head">
          <div><h3>Storico delle versioni pubblicate</h3><p>Qui compariranno soltanto le configurazioni realmente inviate ad Aula.</p></div>
          <span class="tag violet" id="releaseHistoryCount">0 versioni</span>
        </div>
        <div class="panel-body list" id="releaseHistoryList"></div>
      </section>
      <section class="panel span-12">
        <div class="panel-head"><div><h3>Versione in preparazione</h3><p>Non fa ancora parte dello storico pubblicato.</p></div></div>
        <div class="panel-body" id="releaseDraftSummary"></div>
      </section>
    </div>
  `;

  const render = () => {
    const candidate = readJson(candidateKey, null);
    const history = releaseHistory();
    const empty = document.getElementById("releaseCandidateEmpty");
    const content = document.getElementById("releaseCandidateContent");
    const badge = document.getElementById("releaseCandidateBadge");
    const gate = document.getElementById("releaseConfigGate");
    const approvalCheck = document.getElementById("releaseApprovalCheck");
    const approvalButton = document.getElementById("approveReleaseForAula");
    const approvalNote = document.getElementById("releaseApprovalNote");

    if (!candidate) {
      empty.hidden = false;
      content.hidden = true;
      badge.textContent = "Nessuna configurazione";
      badge.className = "tag warn";
      gate.textContent = "In attesa";
      gate.className = "tag warn";
      approvalCheck.checked = false;
      approvalCheck.disabled = true;
      approvalButton.disabled = true;
      approvalButton.textContent = "Approva caricamento";
    } else {
      empty.hidden = true;
      content.hidden = false;
      badge.textContent = candidate.approvedAt
        ? `Versione ${candidate.version} · Approvata`
        : `Versione ${candidate.version} · In preparazione`;
      badge.className = candidate.approvedAt ? "tag" : "tag violet";
      gate.textContent = "Ricevuta";
      gate.className = "tag";
      approvalCheck.disabled = Boolean(candidate.approvedAt);
      approvalCheck.checked = Boolean(candidate.approvedAt);
      approvalButton.disabled = Boolean(candidate.approvedAt) || !approvalCheck.checked;
      approvalButton.textContent = candidate.approvedAt
        ? `Versione ${candidate.version} approvata`
        : `Approva Versione ${candidate.version}`;
      const configuredProfiles = Object.values(candidate.profiles || {}).filter((profile) => profile?.savedAt);
      const selectedMode = candidate.selectedModel || candidate.config?.mode || "adaptive_explanation";
      const selectedProfile = candidate.profiles?.[selectedMode] || {};
      const activeRuleCount = Array.isArray(selectedProfile.ruleIds) ? selectedProfile.ruleIds.length : 0;
      document.getElementById("releaseCandidateSummary").textContent = [
        `Versione ${candidate.version} · modello provato: ${modeLabels[selectedMode] || selectedMode}`,
        `Obiettivo: ${selectedProfile.objective || candidate.config?.mission || "Non specificato"}`,
        `Regole attive nel modello provato: ${activeRuleCount}`,
        `Modelli personalizzati: ${configuredProfiles.length}/5`,
        `Preparata: ${new Date(candidate.preparedAt).toLocaleString("it-IT")}`,
      ].join("\n");
      document.getElementById("releaseCandidateRules").textContent =
        configuredProfiles.length
          ? `Modelli inclusi: ${configuredProfiles.map((profile) => modeLabels[profile.mode] || profile.mode).join(", ")}.`
          : "Nessun modello è stato ancora personalizzato.";
      approvalNote.innerHTML = candidate.approvedAt
        ? `<strong>Approvazione registrata:</strong> ${new Date(candidate.approvedAt).toLocaleString("it-IT")}. Il caricamento attende il collegamento reale con Aula Studio.`
        : "<strong>Stato reale:</strong> spunta la conferma per approvare questa versione. Nessun dato verrà inviato finché Aula Studio non sarà collegata.";
    }

    document.getElementById("releaseHistoryCount").textContent =
      `${history.length} ${history.length === 1 ? "versione" : "versioni"}`;
    document.getElementById("releaseHistoryList").innerHTML = history.length
      ? history.slice().reverse().map((item) => `
          <div class="row">
            <div class="meta"><strong>Versione ${item.version}</strong><small>${modeLabels[item.selectedModel || item.config?.mode] || item.selectedModel || item.config?.mode} · inviata ${new Date(item.publishedAt).toLocaleString("it-IT")}</small></div>
            <span class="tag">Pubblicata</span>
          </div>
        `).join("")
      : '<div class="empty">Nessuna versione è stata ancora inviata ad Aula.</div>';
    document.getElementById("releaseDraftSummary").innerHTML = candidate
      ? `<div class="row"><div class="meta"><strong>Versione ${candidate.version}</strong><small>${modeLabels[candidate.selectedModel || candidate.config?.mode] || candidate.selectedModel || candidate.config?.mode} · ${candidate.approvedAt ? "approvata, in attesa di collegamento" : "pronta per l’approvazione"}</small></div><span class="tag warn">Non pubblicata</span></div>`
      : '<div class="empty">Nessuna versione in preparazione.</div>';
  };

  const prepareCandidate = (payload) => {
    const current = readJson(candidateKey, null);
    const candidate = {
      version: current?.version || nextVersionNumber(),
      profiles: payload.profiles || {},
      selectedModel: payload.selectedModel || "adaptive_explanation",
      preparedAt: new Date().toISOString(),
      approvedAt: null,
      status: "awaiting_approval",
    };
    localStorage.setItem(candidateKey, JSON.stringify(candidate));
    render();
    if (typeof notify === "function") notify(`Versione ${candidate.version} inviata a Pubblica`);
    return candidate;
  };

  window.__EVE_SEND_TO_PUBLISH__ = prepareCandidate;
  window.addEventListener("eve:send-to-publish", (event) => prepareCandidate(event.detail || {}));

  document.getElementById("returnToEveBuilder")?.addEventListener("click", () => {
    document.querySelector('[data-view="laboratory"]')?.click();
  });
  document.getElementById("releaseApprovalCheck")?.addEventListener("change", (event) => {
    const candidate = readJson(candidateKey, null);
    const button = document.getElementById("approveReleaseForAula");
    button.disabled = !candidate || !event.target.checked;
  });
  document.getElementById("approveReleaseForAula")?.addEventListener("click", () => {
    const candidate = readJson(candidateKey, null);
    const check = document.getElementById("releaseApprovalCheck");
    if (!candidate || !check.checked || candidate.approvedAt) return;
    const approved = {
      ...candidate,
      approvedAt: new Date().toISOString(),
      status: "approved_waiting_connection",
    };
    localStorage.setItem(candidateKey, JSON.stringify(approved));
    render();
    if (typeof notify === "function") notify(`Versione ${approved.version} approvata; caricamento in attesa del collegamento con Aula`);
  });

  const publishNav = document.querySelector('[data-view="publish"]');
  const versionsNav = document.querySelector('[data-view="versions"]');
  if (publishNav) publishNav.lastChild.textContent = "Pubblica in Aula";
  if (versionsNav) versionsNav.lastChild.textContent = "Storico pubblicazioni";
  publishNav?.addEventListener("click", () => {
    render();
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Pubblica";
    if (subtitle) subtitle.textContent = "Controlla la versione preparata e approva esplicitamente il caricamento su Aula Studio.";
  });
  versionsNav?.addEventListener("click", () => {
    render();
    const title = document.getElementById("pageTitle");
    const subtitle = document.getElementById("pageSubtitle");
    if (title) title.textContent = "Storico pubblicazioni";
    if (subtitle) subtitle.textContent = "Consulta esclusivamente le versioni realmente inviate ad Aula.";
  });

  render();
})();
