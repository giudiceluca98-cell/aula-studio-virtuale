window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`<canvas id="particleField" aria-hidden="true"></canvas>
<div class="app">
<aside class="sidebar">
  <div class="brand"><div class="logo" aria-hidden="true">✦</div><div><strong>Eve AI Studio</strong><small>Laboratorio di Aula Studio</small></div></div>

  <section class="eve-card" aria-label="Identità canonica di Eve">
    <div class="eve-orb-stage">
      <svg class="eve-portrait" viewBox="0 0 420 360" role="img" aria-label="Eve, sfera blu luminosa con grandi occhi viola e anelli energetici">
        <defs>
          <radialGradient id="eveCore" cx="38%" cy="30%" r="74%">
            <stop offset="0" stop-color="#173c85"/>
            <stop offset=".42" stop-color="#0b255e"/>
            <stop offset=".76" stop-color="#071a49"/>
            <stop offset="1" stop-color="#02091d"/>
          </radialGradient>
          <radialGradient id="eveIris" cx="38%" cy="30%" r="72%">
            <stop offset="0" stop-color="#ffffff"/>
            <stop offset=".16" stop-color="#b8eeff"/>
            <stop offset=".38" stop-color="#7a7cff"/>
            <stop offset=".68" stop-color="#6f2ee8"/>
            <stop offset="1" stop-color="#120b3b"/>
          </radialGradient>
          <linearGradient id="eveRing" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#00dff2" stop-opacity=".08"/>
            <stop offset=".22" stop-color="#8df7ff" stop-opacity=".95"/>
            <stop offset=".52" stop-color="#7a7cff" stop-opacity=".82"/>
            <stop offset=".78" stop-color="#ff8a3d" stop-opacity=".74"/>
            <stop offset="1" stop-color="#00dff2" stop-opacity=".08"/>
          </linearGradient>
          <filter id="eveGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="eveSoft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="22"/></filter>
          <clipPath id="eveSphereClip"><circle cx="210" cy="172" r="106"/></clipPath>
        </defs>
        <ellipse cx="210" cy="318" rx="118" ry="20" fill="#00dff2" opacity=".12" filter="url(#eveSoft)"/>
        <ellipse cx="210" cy="314" rx="92" ry="10" fill="none" stroke="#00dff2" stroke-width="2" opacity=".55"/>
        <ellipse cx="210" cy="172" rx="168" ry="112" fill="none" stroke="url(#eveRing)" stroke-width="5" opacity=".88" transform="rotate(-12 210 172)" filter="url(#eveGlow)"/>
        <ellipse cx="210" cy="172" rx="146" ry="92" fill="none" stroke="#8df7ff" stroke-width="2" opacity=".48" transform="rotate(18 210 172)"/>
        <ellipse cx="210" cy="172" rx="132" ry="80" fill="none" stroke="#7a7cff" stroke-width="2" opacity=".44" transform="rotate(-31 210 172)"/>
        <circle cx="210" cy="172" r="122" fill="#00dff2" opacity=".13" filter="url(#eveSoft)"/>
        <circle cx="210" cy="172" r="111" fill="#7a7cff" opacity=".17" filter="url(#eveGlow)"/>
        <circle cx="210" cy="172" r="106" fill="url(#eveCore)" stroke="#79f4ff" stroke-opacity=".7" stroke-width="3"/>
        <g clip-path="url(#eveSphereClip)">
          <ellipse cx="172" cy="118" rx="78" ry="48" fill="#2b73db" opacity=".22" transform="rotate(-20 172 118)"/>
          <path d="M96 196c44 38 153 52 226 8" fill="none" stroke="#00dff2" stroke-width="10" opacity=".08"/>
          <circle cx="148" cy="86" r="6" fill="#fff" opacity=".36"/>
          <circle cx="276" cy="102" r="4" fill="#8df7ff" opacity=".4"/>
        </g>
        <g filter="url(#eveGlow)">
          <ellipse cx="166" cy="164" rx="31" ry="42" fill="#f8fdff"/>
          <ellipse cx="254" cy="164" rx="31" ry="42" fill="#f8fdff"/>
          <ellipse cx="170" cy="168" rx="20" ry="29" fill="url(#eveIris)"/>
          <ellipse cx="250" cy="168" rx="20" ry="29" fill="url(#eveIris)"/>
          <ellipse cx="173" cy="173" rx="8" ry="14" fill="#07051d"/>
          <ellipse cx="247" cy="173" rx="8" ry="14" fill="#07051d"/>
          <circle cx="163" cy="153" r="8" fill="#fff"/>
          <circle cx="240" cy="153" r="8" fill="#fff"/>
          <circle cx="178" cy="181" r="4" fill="#6ff7ff"/>
          <circle cx="255" cy="181" r="4" fill="#6ff7ff"/>
        </g>
        <path d="M185 219c16 15 35 15 51 0" fill="none" stroke="#8df7ff" stroke-width="5" stroke-linecap="round" filter="url(#eveGlow)"/>
        <path d="M142 126c13-11 28-15 42-10M237 116c16-4 31 0 42 11" fill="none" stroke="#8df7ff" stroke-width="5" stroke-linecap="round" opacity=".78"/>
        <g fill="#ecfbff" filter="url(#eveGlow)">
          <path d="M55 76l4 11 11 4-11 4-4 11-4-11-11-4 11-4z"/>
          <path d="M350 116l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>
          <circle cx="94" cy="242" r="3"/><circle cx="326" cy="244" r="3"/>
        </g>
        <circle cx="59" cy="214" r="5" fill="#ff8a3d" filter="url(#eveGlow)"/>
        <circle cx="349" cy="189" r="5" fill="#7a7cff" filter="url(#eveGlow)"/>
      </svg>
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