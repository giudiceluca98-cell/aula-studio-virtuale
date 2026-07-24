window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`        <div class="metric-row">
          <div class="metric"><small>Requisiti</small><strong>1.197</strong><div class="progress"><span style="width:22%"></span></div></div>
          <div class="metric"><small>Materiali</small><strong id="materialCount">4</strong><div class="progress"><span style="width:36%"></span></div></div>
          <div class="metric"><small>Test superati</small><strong id="passedMetric">0/12</strong><div class="progress"><span id="testProgress" style="width:0%"></span></div></div>
          <div class="metric"><small>Test backend</small><strong>15/15</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
        </div>
      </div>
    </section>
    <section class="panel span-4">
      <div class="panel-head"><div><h3>Identità di Eve</h3><p>Vincoli permanenti della personalità.</p></div></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Trasparente</strong><small>Dichiara fonti e incertezza</small></div><span class="tag">Attivo</span></div>
        <div class="row"><div class="meta"><strong>Didattica</strong><small>Spiega, interroga e adatta</small></div><span class="tag">Attivo</span></div>
        <div class="row"><div class="meta"><strong>Controllata</strong><small>Propone prima di agire</small></div><span class="tag">Attivo</span></div>
      </div>
    </section>
    <section class="panel span-7">
      <div class="panel-head"><div><h3>Capacità previste</h3><p>Moduli indipendenti, attivabili progressivamente.</p></div><button class="btn" data-go="prompts">Configura</button></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Chat contestuale</strong><small>Aula, corso, lezione, selezione e progresso</small></div><span class="tag violet">MVP</span></div>
        <div class="row"><div class="meta"><strong>Materiali e fonti</strong><small>RAG, ricerca ibrida e citazioni verificabili</small></div><span class="tag violet">MVP</span></div>
        <div class="row"><div class="meta"><strong>Tutor adattivo</strong><small>Metodo socratico, esercizi e lacune</small></div><span class="tag warn">Fase 3</span></div>
        <div class="row"><div class="meta"><strong>Agente con strumenti</strong><small>Note, timer, attività e progressi con conferma</small></div><span class="tag warn">Fase 4</span></div>
      </div>
    </section>
    <section class="panel span-5">
      <div class="panel-head"><div><h3>Checkpoint 0.3 integrato</h3><p>Persistenza, versionamento e rollback verificati.</p></div><span class="tag">15 test superati</span></div>
      <div class="panel-body">
        <h2 style="margin:2px 0 8px">SQLite · 3 versioni demo</h2>
        <p style="color:var(--muted)">Ogni importazione resta tracciata; due versioni possono essere confrontate e una versione precedente può essere riattivata senza cancellare le successive.</p>
        <button class="btn primary" data-go="versions">Verifica versioni</button>
      </div>
    </section>
  </div>
</section>


<section id="requirements" class="view">
  <div class="grid">
    <section class="panel span-12">
      <div class="panel-head"><div><h3>Importatore del piano ufficiale</h3><p>Checkpoint 0.3 — catalogo strutturato, persistente, versionato e reversibile.</p></div><span class="tag violet">Checksum verificato</span></div>
      <div class="panel-body">
        <div class="metric-row">
          <div class="metric"><small>Sezioni</small><strong>36</strong><div class="progress"><span style="width:100%"></span></div></div>
          <div class="metric"><small>Schede</small><strong>1.197</strong><div class="progress"><span style="width:100%"></span></div></div>
          <div class="metric"><small>ID unici</small><strong>1.197</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          <div class="metric"><small>Avvisi</small><strong id="requirementWarnings">0</strong><div class="progress"><span style="width:2%;background:var(--green)"></span></div></div>
        </div>
      </div>
    </section>

    <section class="panel span-8">
      <div class="panel-head"><div><h3>Catalogo dei requisiti</h3><p>Cerca per ID, titolo o modulo tecnico.</p></div><button class="btn primary" id="simulateImport">Verifica nuovamente</button></div>
      <div class="panel-body">
        <div class="form-grid" style="margin-bottom:12px">
          <div class="field"><label for="requirementSearch">Ricerca</label><input id="requirementSearch" placeholder="Esempio: memoria, fonti, 1.3"></div>
          <div class="field"><label for="requirementModule">Modulo</label><select id="requirementModule"><option value="all">Tutti i moduli</option><option>agent</option><option>ui</option><option>retrieval</option><option>memory</option><option>safety</option><option>evaluation</option><option>authoring</option><option>unassigned</option></select></div>
        </div>
        <div class="list" id="requirementsList"></div>
        <p id="requirementsResult" style="color:var(--muted);margin:12px 0 0" aria-live="polite"></p>
      </div>
    </section>

    <section class="panel span-4">
      <div class="panel-head"><div><h3>Controlli dell'importazione</h3><p>Validazioni realmente previste nel backend.</p></div></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Campi obbligatori</strong><small>6 campi per ogni scheda</small></div><span class="tag">Valido</span></div>
        <div class="row"><div class="meta"><strong>Identificativi duplicati</strong><small>Blocco immediato dell'importazione</small></div><span class="tag">Nessuno</span></div>
        <div class="row"><div class="meta"><strong>Numerazione sezioni</strong><small>Continua da 1 a 36</small></div><span class="tag">Valida</span></div>
        <div class="row"><div class="meta"><strong>Checksum sorgente</strong><small>da527e3a…b6313</small></div><span class="tag violet">Registrato</span></div>
        <div class="row"><div class="meta"><strong>Checksum catalogo</strong><small>886e2cd4…5ed9f</small></div><span class="tag violet">Persistito</span></div>
      </div>
    </section>

    <section class="panel span-12">
      <div class="panel-head"><div><h3>Distribuzione principale dei moduli</h3><p>Le schede vengono instradate automaticamente, ma restano verificabili e correggibili.</p></div></div>
      <div class="panel-body list">
`);