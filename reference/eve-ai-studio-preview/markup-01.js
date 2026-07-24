window.__EVE_HTML_PARTS=window.__EVE_HTML_PARTS||[];window.__EVE_HTML_PARTS.push(String.raw`<div class="app">
<aside class="sidebar">
  <div class="brand"><div class="logo">E</div><div><strong>Eve AI Studio</strong><small>Laboratorio di Aula Studio</small></div></div>

  <section class="eve-card" aria-label="Identità canonica di Eve">
    <svg class="eve-portrait" viewBox="0 0 420 420" role="img" aria-label="Eve, capelli lilla e occhi viola">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6e35ae"/><stop offset=".55" stop-color="#32206e"/><stop offset="1" stop-color="#1a1840"/></linearGradient>
        <linearGradient id="hair" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#efe4ff"/><stop offset=".45" stop-color="#cdb7ec"/><stop offset="1" stop-color="#8d70b8"/></linearGradient>
        <linearGradient id="skin" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#fff7f7"/><stop offset=".75" stop-color="#edcfd2"/><stop offset="1" stop-color="#c894a0"/></linearGradient>
        <radialGradient id="eye"><stop stop-color="#fff"/><stop offset=".2" stop-color="#dbc9ff"/><stop offset=".58" stop-color="#8e54e9"/><stop offset="1" stop-color="#1d123e"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="9"/></filter>
      </defs>
      <rect width="420" height="420" fill="url(#bg)"/>
      <circle cx="326" cy="90" r="84" fill="#b664ff" opacity=".25" filter="url(#glow)"/>
      <circle cx="72" cy="335" r="105" fill="#716dff" opacity=".18" filter="url(#glow)"/>
      <path d="M93 420c9-73 55-116 117-116s111 43 121 116z" fill="#080912"/>
      <path d="M184 274h52l11 54h-75z" fill="url(#skin)"/>
      <ellipse cx="210" cy="206" rx="93" ry="112" fill="url(#skin)"/>
      <path d="M111 218c-13-108 35-172 106-178 73-6 116 61 103 152-17-52-38-82-91-95-35 29-73 41-118 45z" fill="url(#hair)"/>
      <path d="M103 141c20-86 95-133 168-88 49 30 65 101 35 179-8-55-34-93-81-112-30 25-65 40-122 43z" fill="url(#hair)"/>
      <path d="M112 170c-17 87 10 139 60 158-34-5-62-19-78-45-20-34-17-79 18-113z" fill="#a98bcf"/>
      <path d="M307 164c26 56 17 127-53 166 42-11 75-35 85-74 8-32-2-67-32-92z" fill="#9a78c5"/>
      <path d="M120 124c34-55 74-80 123-74-5 30-20 52-39 68-25 22-52 33-84 38z" fill="#eadcff"/>
      <path d="M228 53c60 8 91 50 92 106-30-11-57-27-78-48-10-11-17-31-14-58z" fill="#c1a8e4"/>
      <path d="M131 151c20-10 46-10 65 1" fill="none" stroke="#795a9a" stroke-width="6" stroke-linecap="round"/>
      <path d="M224 152c20-11 47-9 64 4" fill="none" stroke="#795a9a" stroke-width="6" stroke-linecap="round"/>
      <path d="M139 181c15-18 44-20 58 0-11 28-46 29-58 0z" fill="#fff"/>
      <path d="M224 181c15-18 44-20 58 0-11 28-46 29-58 0z" fill="#fff"/>
      <ellipse cx="169" cy="181" rx="15" ry="22" fill="url(#eye)"/><ellipse cx="254" cy="181" rx="15" ry="22" fill="url(#eye)"/>
      <ellipse cx="169" cy="184" rx="5" ry="10" fill="#120b26"/><ellipse cx="254" cy="184" rx="5" ry="10" fill="#120b26"/>
      <circle cx="164" cy="173" r="4" fill="#fff"/><circle cx="249" cy="173" r="4" fill="#fff"/>
      <path d="M203 190c-4 16-5 29 7 31" fill="none" stroke="#c38e98" stroke-width="3" stroke-linecap="round"/>
      <path d="M177 244c22 16 47 15 68-2" fill="none" stroke="#b55a73" stroke-width="5" stroke-linecap="round"/>
      <path d="M181 244c17 8 40 8 58-1" fill="none" stroke="#fff0f4" stroke-width="2" stroke-linecap="round"/>
      <path d="M147 322l28-15 35 63 34-63 32 16-9 97H154z" fill="#07080e"/>
      <path d="M175 308l35 62 34-62" fill="none" stroke="#2b273b" stroke-width="4"/>
      <path d="M126 95c-19 30-30 70-24 107" fill="none" stroke="#f4e9ff" stroke-width="12" stroke-linecap="round" opacity=".8"/>
      <path d="M309 88c22 35 28 72 19 110" fill="none" stroke="#b294db" stroke-width="13" stroke-linecap="round" opacity=".8"/>
    </svg>
    <div class="eve-meta">
      <div class="eve-line"><h2>Eve</h2><span class="pill"><span class="dot"></span> Anteprima attiva</span></div>
      <p>Tutor contestuale, assistente vocale e agente controllato.</p>
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