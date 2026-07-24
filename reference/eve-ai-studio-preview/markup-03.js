window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`        <div class="row"><div class="meta"><strong>Roadmap</strong><small>Fasi, priorità, MVP e criteri di approvazione</small></div><span class="tag violet">142 schede</span></div>
        <div class="row"><div class="meta"><strong>Memoria</strong><small>Profilo didattico, consenso, conservazione e controllo</small></div><span class="tag violet">105 schede</span></div>
        <div class="row"><div class="meta"><strong>Dati</strong><small>Database, persistenza, migrazioni e tracciabilità</small></div><span class="tag violet">88 schede</span></div>
        <div class="row"><div class="meta"><strong>Retrieval</strong><small>Materiali, RAG, indicizzazione, ricerca e fonti</small></div><span class="tag violet">74 schede</span></div>
        <div class="row"><div class="meta"><strong>Sicurezza</strong><small>Privacy, permessi, protezioni e contenuti sensibili</small></div><span class="tag violet">67 schede</span></div>
      </div>
    </section>
  </div>
</section>

<section id="laboratory" class="view">
  <section class="panel">
    <div class="panel-head"><div><h3>Laboratorio conversazionale</h3><p>Simulazione locale del pannello Eve dentro una lezione.</p></div><span class="pill"><span class="dot"></span> Contesto disponibile</span></div>
    <div class="chat-layout">
      <div class="chat-main">
        <div class="contextbar"><span class="pill">Aula: Programmazione</span><span class="pill">Corso: Python da zero</span><span class="pill">Lezione 1.2</span><span class="pill">Livello: Principiante</span></div>
        <div class="messages" id="messages">
          <div class="msg"><div class="avatar">E</div><div class="bubble"><p><strong>Ciao, sono Eve.</strong> Sto seguendo la lezione sulle variabili in Python.</p><p>Posso spiegare la parte selezionata, creare un esempio oppure interrogarti senza darti subito la soluzione.</p><span class="source">Fonte attiva · Programmazione da Zero · Lezione 1.2 · “Variabili e valori”</span></div></div>
        </div>
        <div class="composer">
          <div class="quick"><button data-prompt="Spiegami questa parte in modo semplice">Spiegami</button><button data-prompt="Fammi un esempio reale">Esempio</button><button data-prompt="Interrogami senza darmi subito la risposta">Interrogami</button><button data-prompt="Quali fonti stai usando?">Fonti</button></div>
          <div class="compose-row"><textarea id="chatInput" placeholder="Scrivi a Eve..."></textarea><button class="btn primary" id="sendBtn">Invia</button></div>
        </div>
      </div>
      <aside class="chat-side">
        <h4>Comportamento della sessione</h4>
        <div class="control"><label>Modalità <span>contestuale</span></label><select id="modeSelect"><option>Spiegazione adattiva</option><option>Metodo socratico</option><option>Interrogazione</option><option>Correzione</option><option>Pianificazione</option></select></div>
        <div class="control"><label>Profondità <span id="depthValue">2/4</span></label><input class="range" id="depthRange" type="range" min="1" max="4" value="2"></div>
        <div class="control"><label>Mostra sempre le fonti <button class="switch on" data-toggle="sources"></button></label></div>
        <div class="control"><label>Memoria permanente <button class="switch" data-toggle="memory"></button></label></div>
        <div class="control"><label>Azioni nell'app <span>Solo proposta</span></label><select><option>Livello B — Proposta</option><option>Livello A — Lettura</option><option>Livello C — Conferma</option></select></div>
        <button class="btn" style="width:100%" id="clearChat">Nuova conversazione</button>
      </aside>
    </div>
  </section>
</section>

<section id="materials" class="view">
  <div class="grid">
    <section class="panel span-8"><div class="panel-head"><div><h3>Materiali indicizzati</h3><p>Fonti utilizzabili da Eve nel contesto autorizzato.</p></div><button class="btn primary" id="addMaterial">Aggiungi materiale</button></div><div class="panel-body list" id="materialList">
      <div class="row"><div class="meta"><strong>Programmazione da Zero</strong><small>Lezioni native · 84 blocchi · aggiornato oggi</small></div><span class="tag">Indicizzato</span></div>
      <div class="row"><div class="meta"><strong>Appunti aula — Variabili</strong><small>TXT · 12 blocchi · privato</small></div><span class="tag">Indicizzato</span></div>
      <div class="row"><div class="meta"><strong>Introduzione a Python</strong><small>PDF · 43 pagine · fonte esterna</small></div><span class="tag warn">Da verificare</span></div>
      <div class="row"><div class="meta"><strong>Glossario del corso</strong><small>Materiale nativo · 61 termini</small></div><span class="tag">Indicizzato</span></div>
    </div></section>
    <section class="panel span-4"><div class="panel-head"><div><h3>Pipeline RAG</h3><p>Controlli della conoscenza.</p></div></div><div class="panel-body">
      <div class="kpi"><span>Estrazione testo</span><b>Attiva</b></div><div class="progress"><span style="width:100%"></span></div>
      <div class="kpi"><span>Ricerca ibrida</span><b>Attiva</b></div><div class="progress"><span style="width:90%"></span></div>
      <div class="kpi"><span>Citazioni</span><b>Obbligatorie</b></div><div class="progress"><span style="width:100%"></span></div>
      <div class="kpi"><span>Difesa prompt injection</span><b>Da testare</b></div><div class="progress"><span style="width:55%;background:var(--amber)"></span></div>
    </div></section>
  </div>
</section>

<section id="prompts" class="view">
  <div class="grid">
    <section class="panel span-8"><div class="panel-head"><div><h3>Prompt di sistema</h3><p>Istruzioni versionate che definiscono il comportamento di Eve.</p></div><span class="tag violet">eve-system-v0.1</span></div><div class="panel-body">
      <div class="field"><textarea id="systemPrompt">Sei Eve, tutor didattico di Aula Studio Virtuale. Usa il contesto autorizzato, mostra le fonti, distingui fatti e ipotesi, dichiara l'incertezza e non eseguire azioni senza il livello di autorizzazione richiesto. In modalità socratica non fornire immediatamente la soluzione: formula domande progressive e usa indizi graduati.</textarea></div>
      <div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" id="savePrompt">Salva nuova bozza</button><button class="btn" id="restorePrompt">Ripristina</button></div>
    </div></section>
`);