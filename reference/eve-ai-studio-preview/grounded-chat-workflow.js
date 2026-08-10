(() => {
  const nav = document.querySelector(".nav");
  const main = document.querySelector(".main");
  if (!nav || !main || document.getElementById("core-grounded-chat")) return;
  const button = document.createElement("button");
  button.dataset.view = "core-grounded-chat";
  button.innerHTML = '<span class="ico">✦</span>Chat grounded';
  nav.appendChild(button);
  const view = document.createElement("section");
  view.id = "core-grounded-chat";
  view.className = "view";
  view.innerHTML = `
    <div class="grid">
      <section class="panel span-12"><div class="panel-head"><div><h3>CORE-2.0 — Chat contestuale grounded</h3><p>Simulazione UI dichiarata: chat privata, contesto minimo, fonti verificabili e output separato.</p></div><span class="tag violet">alpha.18</span></div><div class="panel-body"><div class="metric-row"><div class="metric"><small>Ambito</small><strong>Privato</strong><div class="progress"><span style="width:100%"></span></div></div><div class="metric"><small>Fonti</small><strong>Registry</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div><div class="metric"><small>Modalità</small><strong>3</strong><div class="progress"><span style="width:75%;background:var(--violet)"></span></div></div><div class="metric"><small>Memoria/azioni</small><strong>0</strong><div class="progress"><span style="width:0%"></span></div></div></div></div></section>
      <section class="panel span-5"><div class="panel-head"><div><h3>Domanda e profondità</h3><p>La conoscenza generale resta disattivata in questa preview.</p></div><span class="pill">Nessun fetch</span></div><div class="panel-body"><div class="form-grid"><div class="field" style="grid-column:1/-1"><label>Domanda</label><textarea id="groundedQuestion" rows="4">Spiegami come funziona la fotosintesi.</textarea></div><div class="field"><label>Profondità</label><select id="groundedDepth"><option value="brief">Breve</option><option value="normal" selected>Normale</option><option value="deep">Approfondita</option></select></div><div class="field"><label>Scenario</label><select id="groundedScenario"><option value="grounded">Risposta grounded</option><option value="not-found">Fonte non trovata</option><option value="invented">Fonte inventata dal modello</option><option value="fallback">Provider indisponibile</option><option value="general">Conoscenza generale etichettata</option></select></div></div><button class="btn green" id="runGroundedChat" style="width:100%;margin-top:12px">Genera risposta controllata</button></div></section>
      <section class="panel span-7"><div class="panel-head"><div><h3>Output strutturato</h3><p>Fatti, ipotesi e suggerimenti mantengono base conoscitiva e citazioni.</p></div><span class="tag warn" id="groundedBadge">In attesa</span></div><div class="panel-body list" id="groundedOutput"></div></section>
      <section class="panel span-6"><div class="panel-head"><div><h3>Registry citazioni</h3><p>Il modello può usare soltanto gli identificativi presenti.</p></div><span class="pill">S1 · S2</span></div><div class="panel-body list" id="groundedSources"><div class="row"><div class="meta"><strong>S1 — Manuale di biologia</strong><small>material-bio:120-480 · SHA verificato</small></div><span class="tag">Autorizzata</span></div><div class="row"><div class="meta"><strong>S2 — Lezione corrente</strong><small>material-lesson:20-210 · SHA verificato</small></div><span class="tag">Autorizzata</span></div></div></section>
      <section class="panel span-6"><div class="panel-head"><div><h3>Controlli permanenti</h3><p>Il testo generato non modifica memoria, materiali o applicazione.</p></div><span class="tag">Server-side</span></div><div class="panel-body list"><div class="row"><div class="meta"><strong>Chat privata</strong><small>Owner e room_id verificati con RLS</small></div><span class="tag">Attivo</span></div><div class="row"><div class="meta"><strong>Fonti inventate</strong><small>Identificativi fuori registry rifiutati</small></div><span class="tag red">Bloccate</span></div><div class="row"><div class="meta"><strong>Memoria e azioni</strong><small>memory_written=false · actions_executed=false</small></div><span class="tag red">Nessuna</span></div></div></section>
    </div>`;
  main.appendChild(view);
  const escape = (value) => String(value).replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const row = (title, text, tag, cls="tag") => `<div class="row"><div class="meta"><strong>${escape(title)}</strong><small>${escape(text)}</small></div><span class="${cls}">${escape(tag)}</span></div>`;
  document.getElementById("runGroundedChat").addEventListener("click", async () => {
    const scenario = document.getElementById("groundedScenario").value;
    const depth = document.getElementById("groundedDepth").value;
    const output = document.getElementById("groundedOutput");
    const badge = document.getElementById("groundedBadge");
    badge.className = "tag violet"; badge.textContent = "Verifica";
    output.innerHTML = row("Contesto minimo", "Identità, aula, materiale e conversazione privata", "OK");
    await new Promise((resolve) => setTimeout(resolve, 220));
    if (scenario === "not-found") {
      output.innerHTML += row("Risposta non trovata", "Nessun passaggio pertinente: nessun fatto o fonte inventata", "HIGH", "tag warn");
      badge.className = "tag warn"; badge.textContent = "Non trovato"; return;
    }
    const fallback = scenario === "fallback" || scenario === "invented";
    if (scenario === "invented") output.innerHTML += row("Fonte S99", "Identificativo assente dal registry: output del modello rifiutato", "Bloccata", "tag red");
    output.innerHTML += row("Fatti", "La fotosintesi converte energia luminosa in energia chimica [S1]", "Materiale");
    if (depth !== "brief") output.innerHTML += row("Ipotesi", "L'efficienza può variare con luce e disponibilità di CO₂ [S2]", "Materiale", "tag violet");
    if (depth === "deep") output.innerHTML += row("Suggerimento", "Confrontare fase luminosa e ciclo di Calvin usando i due passaggi citati", "Materiale", "tag violet");
    if (scenario === "general") output.innerHTML += row("Conoscenza generale", "Elemento dichiarato senza citazione materiale", "Generale", "tag warn");
    output.innerHTML += row("Provider", fallback ? "Fallback deterministico sicuro; nessuna fonte inventata" : "Modello reale con output JSON validato", fallback ? "Fallback" : "Validato", fallback ? "tag warn" : "tag");
    badge.className = "tag"; badge.textContent = fallback ? "Fallback sicuro" : "Grounded";
  });
  button.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach((node) => node.classList.toggle("active", node.id === "core-grounded-chat"));
    document.querySelectorAll(".nav button").forEach((node) => node.classList.toggle("active", node === button));
    document.getElementById("pageTitle").textContent = "Chat contestuale grounded";
    document.getElementById("pageSubtitle").textContent = "Chat privata con fonti registrate, profondità e output strutturato.";
  });
  if (new URLSearchParams(location.search).get("preview") === "core-2.0") button.click();
})();
