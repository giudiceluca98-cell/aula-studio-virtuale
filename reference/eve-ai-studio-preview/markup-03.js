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
    <section class="panel span-12">
      <div class="panel-head"><div><h3>Configurazioni prompt versionate</h3><p>Checkpoint 0.4 — bozza, revisione, pubblicabilità, pubblicazione e rollback controllato.</p></div><span class="tag violet" id="promptActiveBadge">Attiva · v1</span></div>
      <div class="panel-body">
        <div class="metric-row">
          <div class="metric"><small>Versioni demo</small><strong id="promptVersionCount">3</strong><div class="progress"><span style="width:75%"></span></div></div>
          <div class="metric"><small>Modalità didattiche</small><strong>5</strong><div class="progress"><span style="width:100%"></span></div></div>
          <div class="metric"><small>Schema SQLite</small><strong>1</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          <div class="metric"><small>Test Checkpoint 0.4</small><strong>15/15</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
        </div>
      </div>
    </section>

    <section class="panel span-12">
      <div class="panel-head"><div><h3>Flusso di approvazione</h3><p>Le transizioni non valide sono bloccate dal backend, non affidate al modello.</p></div><span class="pill">Gate server-side</span></div>
      <div class="panel-body">
        <div class="workflow">
          <article class="stage"><div class="num">01 · Draft</div><h3>Bozza</h3><p>Contenuto modificabile in una nuova versione.</p></article>
          <article class="stage"><div class="num">02 · In review</div><h3>Revisione</h3><p>La configurazione è congelata per il controllo.</p></article>
          <article class="stage"><div class="num">03 · Publishable</div><h3>Pubblicabile</h3><p>Richiede test superati e approvazione esplicita.</p></article>
        </div>
        <div class="row"><div class="meta"><strong>Published</strong><small>Una sola versione attiva per configurazione; la precedente viene archiviata automaticamente.</small></div><span class="tag">Protetto</span></div>
      </div>
    </section>

    <section class="panel span-7">
      <div class="panel-head"><div><h3>Editor della configurazione</h3><p>Ogni salvataggio produce una nuova versione immutabile.</p></div><span class="tag" id="promptStatusBadge">Draft</span></div>
      <div class="panel-body">
        <div class="form-grid">
          <div class="field"><label for="promptVersionSelect">Versione selezionata</label><select id="promptVersionSelect"></select></div>
          <div class="field"><label for="promptName">Nome</label><input id="promptName"></div>
          <div class="field full"><label for="systemPrompt">Prompt di sistema</label><textarea id="systemPrompt"></textarea></div>
          <div class="field"><label for="promptMode">Modalità didattica</label><select id="promptMode"><option value="adaptive_explanation">Spiegazione adattiva</option><option value="socratic">Metodo socratico</option><option value="quiz">Quiz e interrogazione</option><option value="correction">Correzione guidata</option><option value="planning">Pianificazione</option></select></div>
          <div class="field"><label for="promptTone">Tono</label><select id="promptTone"><option value="calm_direct">Calmo e diretto</option><option value="friendly">Amichevole</option><option value="technical">Tecnico</option></select></div>
          <div class="field"><label for="promptDepth">Profondità</label><select id="promptDepth"><option value="1">1 · Essenziale</option><option value="2">2 · Normale</option><option value="3">3 · Approfondita</option><option value="4">4 · Massima</option></select></div>
          <div class="field"><label for="promptSources">Fonti</label><select id="promptSources"><option value="required">Obbligatorie</option><option value="when_available">Quando disponibili</option><option value="disabled">Disattivate</option></select></div>
          <div class="field"><label for="promptSolution">Politica soluzione</label><select id="promptSolution"><option value="guided">Guidata</option><option value="direct">Diretta</option><option value="never_immediate">Mai immediata</option></select></div>
          <div class="field"><label for="promptMemory">Memoria</label><select id="promptMemory"><option value="consent">Con consenso</option><option value="session_only">Solo sessione</option><option value="off">Disattivata</option></select></div>
          <div class="field"><label for="promptTools">Strumenti</label><select id="promptTools"><option value="propose">Solo proposta</option><option value="read_only">Sola lettura</option><option value="confirm">Con conferma</option></select></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button class="btn primary" id="savePromptDraft">Salva nuova bozza</button>
          <button class="btn" id="submitPromptReview">Invia in revisione</button>
          <button class="btn green" id="approvePromptTests">Test superati</button>
          <button class="btn primary" id="publishPromptVersion">Pubblica prompt</button>
        </div>
        <p id="promptWorkflowMessage" style="color:var(--muted);margin:12px 0 0" aria-live="polite">Seleziona una versione per verificarne contenuto e stato.</p>
      </div>
    </section>

    <section class="panel span-5">
      <div class="panel-head"><div><h3>Storico delle versioni</h3><p>Le versioni precedenti non vengono sovrascritte.</p></div><span class="pill">SQLite persistente</span></div>
      <div class="panel-body list" id="promptVersionList"></div>
    </section>

    <section class="panel span-8">
      <div class="panel-head"><div><h3>Confronta configurazioni</h3><p>Il servizio individua prompt, modalità, stato e parametri modificati.</p></div><button class="btn primary" id="comparePromptVersions">Confronta</button></div>
      <div class="panel-body">
        <div class="form-grid" style="margin-bottom:14px">
          <div class="field"><label for="promptCompareFrom">Partenza</label><select id="promptCompareFrom"></select></div>
          <div class="field"><label for="promptCompareTo">Arrivo</label><select id="promptCompareTo"></select></div>
        </div>
        <div class="list" id="promptDiffList"></div>
      </div>
    </section>

    <section class="panel span-4">
      <div class="panel-head"><div><h3>Rollback non distruttivo</h3><p>Una versione passata viene copiata in una nuova bozza.</p></div></div>
      <div class="panel-body">
        <div class="field"><label for="promptRollbackSource">Versione sorgente</label><select id="promptRollbackSource"></select></div>
        <button class="btn" id="createPromptRollback" style="width:100%;margin-top:12px">Crea bozza di rollback</button>
        <div class="row" style="margin-top:12px"><div class="meta"><strong id="promptRollbackTitle">Nessun rollback eseguito</strong><small id="promptRollbackText">Lo storico rimane intatto.</small></div><span class="tag" id="promptRollbackStatus">Pronto</span></div>
      </div>
    </section>

    <section class="panel span-12">
      <div class="panel-head"><div><h3>Modalità didattiche disponibili</h3><p>Preset tipizzati restituiti dall’API del Checkpoint 0.4.</p></div></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Spiegazione adattiva</strong><small>Adatta profondità, esempi e domanda di controllo.</small></div><span class="tag">adaptive_explanation</span></div>
        <div class="row"><div class="meta"><strong>Metodo socratico</strong><small>Domande progressive e indizi senza soluzione immediata.</small></div><span class="tag violet">socratic</span></div>
        <div class="row"><div class="meta"><strong>Quiz e interrogazione</strong><small>Domande, attesa della risposta e feedback formativo.</small></div><span class="tag violet">quiz</span></div>
        <div class="row"><div class="meta"><strong>Correzione guidata</strong><small>Motivo dell’errore e nuovo tentativo controllato.</small></div><span class="tag violet">correction</span></div>
        <div class="row"><div class="meta"><strong>Pianificazione</strong><small>Obiettivi e scadenze trasformati in un piano realistico.</small></div><span class="tag violet">planning</span></div>
      </div>
    </section>
  </div>
</section>


`);