(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-identity-context")) return;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const navButton = document.createElement("button");
  navButton.dataset.view = "core-identity-context";
  navButton.innerHTML = '<span class="ico">◉</span>Identità e contesto';
  const databaseButton = nav.querySelector('[data-view="core-database-production"]');
  (databaseButton || nav.lastElementChild)?.insertAdjacentElement("afterend", navButton);

  const view = document.createElement("section");
  view.id = "core-identity-context";
  view.className = "view";
  view.innerHTML = `
    <div class="grid">
      <section class="panel span-12"><div class="panel-head"><div><h3>Context Builder verificato</h3><p>CORE-1.4 — identità, ruoli, risorse e materiali sono rivalidati server-side. La preview simula il flusso e non concede permessi reali.</p></div><span class="tag violet">CORE-1.4 · alpha.11</span></div>
      <div class="panel-body"><div class="metric-row">
        <div class="metric"><small>Identità</small><strong id="contextIdentityMetric">Autenticata</strong><div class="progress"><span style="width:100%"></span></div></div>
        <div class="metric"><small>Ruoli effettivi</small><strong id="contextRoleMetric">student</strong><div class="progress"><span style="width:45%;background:var(--violet)"></span></div></div>
        <div class="metric"><small>Materiali autorizzati</small><strong id="contextMaterialMetric">1</strong><div class="progress"><span style="width:35%;background:var(--green)"></span></div></div>
        <div class="metric"><small>TTL token</small><strong>300 s</strong><div class="progress"><span style="width:50%;background:var(--warn)"></span></div></div>
      </div></div></section>

      <section class="panel span-7"><div class="panel-head"><div><h3>Costruisci contesto minimo</h3><p>Il server usa la sessione; userId e ruoli non provengono dal modulo.</p></div><span class="pill">Feature flag OFF di default</span></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="field"><label for="contextRoom">Aula</label><select id="contextRoom"><option value="room-python-zero">room-python-zero</option><option value="room-other">room-other (non autorizzata)</option></select></div>
          <div class="field"><label for="contextRole">Profilo simulato</label><select id="contextRole"><option value="student">Studente</option><option value="teacher">Docente</option><option value="author">Autore</option><option value="admin">Amministratore</option></select></div>
          <div class="field"><label for="contextScope">Ambito</label><select id="contextScope"><option value="private">Privato</option><option value="room_shared">Condiviso nell'aula</option></select></div>
          <div class="field"><label for="contextMaterial">Materiale</label><select id="contextMaterial"><option value="material-python-01">Lezione Python autorizzata</option><option value="material-cross-room">Materiale altra aula</option><option value="material-revoked">Materiale revocato</option></select></div>
          <div class="field"><label for="contextLesson">Lezione</label><input id="contextLesson" value="programming-0-1"></div>
          <div class="field"><label for="contextSection">Sezione</label><input id="contextSection" value="variabili"></div>
          <div class="field" style="grid-column:1/-1"><label for="contextSelection">Testo selezionato</label><textarea id="contextSelection" rows="4">Una variabile associa un nome a un valore utilizzabile dal programma.</textarea></div>
          <label style="grid-column:1/-1;display:flex;gap:8px;align-items:center"><input type="checkbox" id="contextShareSelection"> Includi esplicitamente il testo nel contesto condiviso</label>
        </div>
        <button class="btn green" id="simulateContextBuild" style="width:100%;margin-top:12px">Simula verifica server-side</button>
        <div class="list" id="contextBuildStages" style="margin-top:12px"></div>
      </div></section>

      <section class="panel span-5"><div class="panel-head"><div><h3>Contesto firmato</h3><p>Il log conserva hash, identificativi e conteggi; mai il testo selezionato.</p></div><span class="tag warn">HMAC server-only</span></div>
      <div class="panel-body list" id="contextResult">
        <div class="row"><div class="meta"><strong>In attesa</strong><small>Esegui la simulazione per vedere autorizzazioni, minimizzazione e audit.</small></div><span class="tag warn">Non emesso</span></div>
      </div></section>

      <section class="panel span-12"><div class="panel-head"><div><h3>Regole non negoziabili</h3><p>Le decisioni sono applicate dal codice e da RLS, non dalla preview o dal modello.</p></div><span class="pill">Zero fiducia nel client</span></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Identità autenticata</strong><small>Derivata dalla sessione Supabase server-side</small></div><span class="tag">Verificata</span></div>
        <div class="row"><div class="meta"><strong>Isolamento aula</strong><small>Corso, conversazione e materiali devono condividere lo stesso room_id</small></div><span class="tag">RLS</span></div>
        <div class="row"><div class="meta"><strong>Ruoli espliciti</strong><small>student, teacher, author e admin; nessun ruolo inferito dall'AI</small></div><span class="tag violet">Attribuibili</span></div>
        <div class="row"><div class="meta"><strong>Minimizzazione</strong><small>TTL breve, numero materiali limitato, testo solo se necessario</small></div><span class="tag violet">Attiva</span></div>
        <div class="row"><div class="meta"><strong>Audit redatto</strong><small>SHA-256 e lunghezza; nessun testo selezionato nei log</small></div><span class="tag">Append-only</span></div>
      </div></section>
    </div>`;
  main.appendChild(view);

  const stages = [
    ["Sessione autenticata", "L'identità viene letta dal server; il client non invia userId"],
    ["Appartenenza all'aula", "room_members e RLS bloccano riferimenti cross-room"],
    ["Ruoli effettivi", "Ruolo base più ruoli didattici esplicitamente assegnati"],
    ["Corso e posizione", "Corso, lezione e sezione sono confrontati con metadati autorizzati"],
    ["Materiali autorizzati", "Solo asset CORE attivi e non revocati"],
    ["Minimizzazione", "Limiti su testo, materiali, ambito e durata"],
    ["Firma HMAC", "Token a TTL breve verificabile soltanto server-side"],
    ["Audit redatto", "Persistiti hash, identificativi e conteggi, non il testo"],
  ];

  const open = () => {
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node.id === view.id));
    document.querySelectorAll(".nav button").forEach((node) => node.classList.toggle("active", node === navButton));
    document.getElementById("pageTitle").textContent = "Identità e Context Builder";
    document.getElementById("pageSubtitle").textContent = "Contesto minimo, autorizzato, firmato e tracciabile.";
    window.scrollTo({top:0,behavior:"smooth"});
  };
  navButton.addEventListener("click", open);

  document.getElementById("simulateContextBuild").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const room = document.getElementById("contextRoom").value;
    const role = document.getElementById("contextRole").value;
    const scope = document.getElementById("contextScope").value;
    const material = document.getElementById("contextMaterial").value;
    const selection = document.getElementById("contextSelection").value.trim();
    const shareSelection = document.getElementById("contextShareSelection").checked;
    const stageNode = document.getElementById("contextBuildStages");
    const resultNode = document.getElementById("contextResult");
    button.disabled = true;
    stageNode.innerHTML = stages.map((stage,index)=>`<div class="row" data-context-stage="${index}"><div class="meta"><strong>${index+1}. ${stage[0]}</strong><small>${stage[1]}</small></div><span class="tag warn">In attesa</span></div>`).join("");
    window.EveAnimationLibrary?.setState?.("eve-thinking");
    let blocked = null;
    if (room !== "room-python-zero") blocked = "L'utente non appartiene all'aula richiesta";
    else if (material === "material-cross-room") blocked = "Il materiale appartiene a un'altra aula";
    else if (material === "material-revoked") blocked = "Il materiale è revocato";
    else if (scope === "room_shared" && role === "student") blocked = "Lo studente non può creare contesto condiviso";
    else if (scope === "room_shared" && shareSelection) blocked = "La condivisione del testo è OFF nel server di prova";

    for (let index=0; index<stages.length; index+=1) {
      const tag = stageNode.querySelector(`[data-context-stage="${index}"] .tag`);
      tag.className="tag violet"; tag.textContent="In corso";
      await new Promise((resolve)=>setTimeout(resolve,140));
      if (blocked && index === (room !== "room-python-zero" ? 1 : material !== "material-python-01" ? 4 : 5)) {
        tag.className="tag red"; tag.textContent="Bloccato"; break;
      }
      tag.className="tag"; tag.textContent="Superato";
    }

    if (blocked) {
      resultNode.innerHTML=`<div class="row"><div class="meta"><strong>Contesto rifiutato</strong><small>${escapeHtml(blocked)} · nessun token emesso · audit outcome=rejected</small></div><span class="tag red">403</span></div>`;
      window.EveAnimationLibrary?.setState?.("eve-error");
      window.notify?.("Contesto bloccato dai controlli server-side simulati");
    } else {
      const included = scope === "private" ? selection.length : 0;
      document.getElementById("contextRoleMetric").textContent = role;
      document.getElementById("contextMaterialMetric").textContent = "1";
      resultNode.innerHTML=`
        <div class="row"><div class="meta"><strong>Identità e ambito</strong><small>user=sessione · room=${escapeHtml(room)} · ruolo=${escapeHtml(role)} · scope=${escapeHtml(scope)}</small></div><span class="tag">Verificati</span></div>
        <div class="row"><div class="meta"><strong>Posizione</strong><small>lesson=${escapeHtml(document.getElementById("contextLesson").value)} · section=${escapeHtml(document.getElementById("contextSection").value)} · material=${escapeHtml(material)}</small></div><span class="tag violet">Autorizzata</span></div>
        <div class="row"><div class="meta"><strong>Selezione</strong><small>${included} caratteri nel token · audit conserva soltanto sha256 e lunghezza</small></div><span class="tag violet">Minimizzata</span></div>
        <div class="row"><div class="meta"><strong>Token</strong><small>checkpoint=CORE-1.4 · ttl=300s · nonce=preview · firma=server-only</small></div><span class="tag">Emesso</span></div>`;
      window.EveAnimationLibrary?.setState?.("eve-success");
      window.notify?.("Simulazione completata: contesto autorizzato e firmato");
    }
    button.disabled=false;
  });
})();
