window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`<section id="tests" class="view">
  <div class="test-grid">
    <section class="panel"><div class="panel-head"><div><h3>Suite di revisione</h3><p>12 prove critiche prima della pubblicazione.</p></div><button class="btn green" id="runTests">Esegui tutti i test</button></div><div class="panel-body list" id="testList"></div></section>
    <section class="panel"><div class="panel-head"><div><h3>Console</h3><p>Risultati della simulazione.</p></div><span class="pill" id="runState">In attesa</span></div><div class="panel-body"><div class="test-console" id="testConsole">Eve Evaluation Runner v0.1
Nessuna esecuzione avviata.</div></div></section>
  </div>
</section>

<section id="memory" class="view">
  <div class="grid">
    <section class="panel span-7"><div class="panel-head"><div><h3>Memorie candidate</h3><p>Nessuna informazione diventa permanente senza consenso.</p></div></div><div class="panel-body list" id="memoryList">
      <div class="row"><div class="meta"><strong>Preferisce esempi pratici</strong><small>Proposto dalla conversazione · memoria personale</small></div><div><button class="btn approve-memory">Approva</button></div></div>
      <div class="row"><div class="meta"><strong>Difficoltà con il concetto di variabile</strong><small>Evidenza didattica · scadenza suggerita 30 giorni</small></div><div><button class="btn approve-memory">Approva</button></div></div>
    </div></section>
    <section class="panel span-5"><div class="panel-head"><div><h3>Controlli privacy</h3><p>Impostazioni per utente e aula.</p></div></div><div class="panel-body">
      <div class="row"><div class="meta"><strong>Memoria personale</strong><small>Richiede consenso per ogni nuovo ricordo</small></div><button class="switch on"></button></div>
      <div class="row"><div class="meta"><strong>Memoria dell'aula</strong><small>Soltanto contenuti condivisi</small></div><button class="switch on"></button></div>
      <div class="row"><div class="meta"><strong>Conservazione audio</strong><small>Disattivata</small></div><button class="switch"></button></div>
      <button class="btn danger" style="margin-top:12px;width:100%" id="deleteMemory">Elimina tutte le memorie demo</button>
    </div></section>
  </div>
</section>

<section id="versions" class="view">
  <div class="grid">
    <section class="panel span-12">
      <div class="panel-head"><div><h3>Catalogo requisiti versionato</h3><p>Checkpoint 0.3 — anteprima visiva delle funzioni persistenti implementate nel backend.</p></div><span class="tag violet" id="activeVersionBadge">Versione attiva v3</span></div>
      <div class="panel-body">
        <div class="metric-row">
          <div class="metric"><small>Versioni</small><strong>3</strong><div class="progress"><span style="width:75%"></span></div></div>
          <div class="metric"><small>Importazioni</small><strong>4</strong><div class="progress"><span style="width:100%"></span></div></div>
          <div class="metric"><small>Schema SQLite</small><strong>1</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
          <div class="metric"><small>Persistenza</small><strong>Attiva</strong><div class="progress"><span style="width:100%;background:var(--green)"></span></div></div>
        </div>
      </div>
    </section>

    <section class="panel span-7">
      <div class="panel-head"><div><h3>Cronologia delle importazioni</h3><p>Successi, reimportazioni invariate ed errori rimangono consultabili.</p></div><span class="pill">Dati demo coerenti col backend</span></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>#4 · Reimportazione di controllo</strong><small>Catalogo identico a v3 · nessuna duplicazione</small></div><span class="tag">unchanged</span></div>
        <div class="row"><div class="meta"><strong>#3 · Revisione sicurezza</strong><small>Versione v3 · replace · 1.197 schede</small></div><span class="tag violet">success</span></div>
        <div class="row"><div class="meta"><strong>#2 · File incompleto</strong><small>Importazione bloccata · numero sezioni inatteso</small></div><span class="tag red">failed</span></div>
        <div class="row"><div class="meta"><strong>#1 · Piano ufficiale</strong><small>Versione v1 · 36 sezioni · 1.197 schede</small></div><span class="tag violet">success</span></div>
      </div>
    </section>

    <section class="panel span-5">
      <div class="panel-head"><div><h3>Protezione dello storico</h3><p>Comportamento reale previsto dal servizio 0.3.</p></div></div>
      <div class="panel-body list">
        <div class="row"><div class="meta"><strong>Snapshot immutabili</strong><small>Le versioni salvate non vengono sovrascritte</small></div><span class="tag">Attivo</span></div>
        <div class="row"><div class="meta"><strong>Deduplicazione</strong><small>Cataloghi identici riusano la stessa versione</small></div><span class="tag">Attiva</span></div>
        <div class="row"><div class="meta"><strong>Rollback non distruttivo</strong><small>Cambia la versione attiva senza eliminare dati</small></div><span class="tag">Attivo</span></div>
        <div class="row"><div class="meta"><strong>Plaintext negli errori</strong><small>Non viene conservato nella cronologia</small></div><span class="tag">Protetto</span></div>
      </div>
    </section>

    <section class="panel span-12">
      <div class="panel-head"><div><h3>Confronta due versioni</h3><p>Il backend calcola schede aggiunte, rimosse, modificate e invariate, compresi i campi cambiati.</p></div><button class="btn primary" id="compareVersions">Confronta</button></div>
      <div class="panel-body">
`);