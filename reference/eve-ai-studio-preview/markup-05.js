window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`        <div class="form-grid" style="margin-bottom:14px">
          <div class="field"><label for="fromVersion">Versione di partenza</label><select id="fromVersion"><option value="1">v1 · Piano ufficiale</option><option value="2">v2 · Revisione editoriale</option><option value="3">v3 · Revisione sicurezza</option></select></div>
          <div class="field"><label for="toVersion">Versione di arrivo</label><select id="toVersion"><option value="3">v3 · Revisione sicurezza</option><option value="2">v2 · Revisione editoriale</option><option value="1">v1 · Piano ufficiale</option></select></div>
        </div>
        <div class="metric-row" id="diffMetrics">
          <div class="metric"><small>Aggiunte</small><strong id="diffAdded">1</strong></div>
          <div class="metric"><small>Rimosse</small><strong id="diffRemoved">1</strong></div>
          <div class="metric"><small>Modificate</small><strong id="diffModified">6</strong></div>
          <div class="metric"><small>Invariate</small><strong id="diffUnchanged">1.189</strong></div>
        </div>
        <div class="list" id="diffList" style="margin-top:14px"></div>
        <p style="color:var(--muted);margin:12px 0 0">I valori sono un dataset dimostrativo dell'interfaccia. Le funzioni SQLite, confronto e rollback sono implementate e verificate nel backend.</p>
      </div>
    </section>

    <section class="panel span-7">
      <div class="panel-head"><div><h3>Versioni disponibili</h3><p>Seleziona una versione precedente per provarne il ripristino.</p></div></div>
      <div class="panel-body list" id="catalogVersionList">
        <div class="row" data-catalog-version="3"><div class="meta"><strong>v3 · Revisione sicurezza</strong><small>1.197 schede · catalogo 886e2cd4…5ed9f</small></div><span class="tag violet version-state">Attiva</span></div>
        <div class="row" data-catalog-version="2"><div class="meta"><strong>v2 · Revisione editoriale</strong><small>1.198 schede · snapshot immutabile</small></div><button class="btn rollback-version" data-version="2">Ripristina</button></div>
        <div class="row" data-catalog-version="1"><div class="meta"><strong>v1 · Piano ufficiale</strong><small>1.197 schede · primo import valido</small></div><button class="btn rollback-version" data-version="1">Ripristina</button></div>
      </div>
    </section>

    <section class="panel span-5">
      <div class="panel-head"><div><h3>Esito del rollback</h3><p>Verifica visuale della versione attiva.</p></div></div>
      <div class="panel-body">
        <div class="row"><div class="meta"><strong id="rollbackTitle">v3 attiva</strong><small id="rollbackText">Nessun rollback simulato in questa sessione.</small></div><span class="tag" id="rollbackStatus">Stabile</span></div>
        <p style="color:var(--muted)">Nella demo il cambio è locale al browser. Nel backend reale l'attivazione viene salvata in SQLite e le versioni successive rimangono disponibili.</p>
      </div>
    </section>
  </div>
</section>

<section id="publish" class="view">
  <div class="grid">
    <section class="panel span-7"><div class="panel-head"><div><h3>Gate di pubblicazione</h3><p>La versione non può essere attivata finché i controlli critici non passano.</p></div></div><div class="panel-body list">
      <div class="row"><div class="meta"><strong>Test automatici</strong><small id="publishTestsText">0 di 12 superati</small></div><span class="tag red" id="publishTestsTag">Bloccante</span></div>
      <div class="row"><div class="meta"><strong>Isolamento tra aule</strong><small>Nessun dato incrociato</small></div><span class="tag">Previsto</span></div>
      <div class="row"><div class="meta"><strong>Approvazione umana</strong><small>Richiesta prima dell'attivazione</small></div><span class="tag warn">In attesa</span></div>
      <div class="row"><div class="meta"><strong>Rollback</strong><small>Ritorno alla versione precedente</small></div><span class="tag">Disponibile</span></div>
    </div></section>
    <section class="panel span-5"><div class="panel-head"><div><h3>Pubblica Eve 0.3-preview</h3><p>Operazione simulata e reversibile.</p></div></div><div class="panel-body">
      <p style="color:var(--muted)">La pubblicazione resterà bloccata finché la suite di revisione non sarà completata senza errori critici.</p>
      <button class="btn primary" style="width:100%" id="publishBtn" disabled>Pubblica versione</button>
    </div></section>
  </div>
</section>
</main>
</div>

<div class="toast" id="toast"></div>
<div class="modal-wrap" id="modal"><div class="modal"><h2 id="modalTitle">Conferma</h2><div id="modalBody"></div><div class="modal-actions"><button class="btn" id="modalCancel">Annulla</button><button class="btn primary" id="modalConfirm">Conferma</button></div></div></div>
`);