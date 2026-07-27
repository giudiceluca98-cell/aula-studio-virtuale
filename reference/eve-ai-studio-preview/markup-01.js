window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`<canvas id="particleField" aria-hidden="true"></canvas>
<div class="app">
<aside class="sidebar">
  <div class="brand"><div class="logo" aria-hidden="true">✦</div><div><strong>Eve AI Studio</strong><small>Laboratorio di Aula Studio</small></div></div>

  <section class="eve-card" aria-label="Identità canonica di Eve">
    <div class="eve-orb-stage">
      <img id="eveHqPortrait" class="eve-portrait eve-hq-portrait" alt="Eve, assistente AI animata" draggable="false">
    </div>
    <div class="eve-meta">
      <div class="eve-line"><h2>Eve</h2><span class="pill"><span class="dot"></span> Anteprima attiva</span></div>
      <p>La tua assistente AI per studio, comprensione e progresso.</p>
    </div>
  </section>

  <div class="nav-label">Studio</div>
  <nav class="nav">
    <button class="active" data-view="dashboard"><span class="ico">◫</span>Panoramica</button>
    <button data-view="requirements"><span class="ico">▦</span>Requisiti del piano</button>
    <button data-view="laboratory"><span class="ico">✦</span>Laboratorio Eve</button>
    <button data-view="materials"><span class="ico">▤</span>Materiali e RAG</button>
    <button data-view="prompts"><span class="ico">⌁</span>Prompt e comportamento</button>
    <button data-view="tests"><span class="ico">✓</span>Revisione e test</button>
    <button data-view="memory"><span class="ico">◉</span>Memoria e privacy</button>
    <button data-view="versions"><span class="ico">↻</span>Versioni</button>
    <button data-view="publish"><span class="ico">↑</span>Pubblicazione</button>
  </nav>
  <div class="side-foot"><strong>Modalità anteprima</strong><small>Nessun modello AI o database è collegato. Tutti i dati restano nel browser.</small></div>
</aside>

<main class="main">
<header class="topbar">
  <div><h1 id="pageTitle">Panoramica</h1><p id="pageSubtitle">Progetta, verifica e pubblica le capacità di Eve.</p></div>
  <div class="actions"><button class="btn" id="resetBtn">Ripristina demo</button><button class="btn primary" data-go="laboratory">Prova Eve</button></div>
</header>

<section id="dashboard" class="view active">
  <div class="workflow">
    <article class="stage active"><div class="num">Carta 01 · Modifica</div><h3>Costruisci Eve</h3><p>Configura comportamento, materiali, strumenti, memoria e voce.</p><div class="status"><span class="tag violet">In lavorazione</span></div></article>
    <article class="stage"><div class="num">Carta 02 · Revisione</div><h3>Verifica ogni capacità</h3><p>Esegui scenari, test di sicurezza, fonti, costi e isolamento.</p><div class="status"><span class="tag warn">12 test pronti</span></div></article>
    <article class="stage"><div class="num">Carta 03 · Pubblicazione</div><h3>Approva una versione</h3><p>Pubblica soltanto configurazioni tracciate e senza errori critici.</p><div class="status"><span class="tag">Bloccata correttamente</span></div></article>
  </div>
  <div class="grid">
    <section class="panel span-8">
      <div class="panel-head"><div><h3>Stato della versione Eve 0.3-preview</h3><p>Catalogo persistente, cronologia, confronto e rollback del piano.</p></div><span class="pill">Feature flag attiva</span></div>
      <div class="panel-body">
`);