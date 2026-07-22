from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "reference/demo-aula-studio-virtuale-canonica.html"
README_PATH = ROOT / "reference/README.md"
CHANGELOG_PATH = ROOT / "reference/CHANGELOG_DEMO.md"
STATUS_PATH = ROOT / "reference/INTEGRATION_STATUS.md"
ARCHITECTURE_PATH = ROOT / "reference/DEMO_ARCHITECTURE.md"
APPROVALS_PATH = ROOT / "reference/PHASE_APPROVALS.md"

VERSION = "1.1.0-alpha.1"
DATE = "2026-07-22"
MARKER = "CATALOGO INTELLIGENTE — CHECKPOINT 1.1.0-alpha.1"

CATALOG_CSS = r'''

    /* ==========================================================
       CATALOGO INTELLIGENTE — CHECKPOINT 1.1.0-alpha.1
       Vista autonoma integrata nella demo canonica.
       ========================================================== */

    .catalog-demo-view {
      min-height: 100vh;
      overflow: auto;
      background:
        radial-gradient(circle at 14% 0%, rgba(0, 223, 242, 0.12), transparent 30%),
        radial-gradient(circle at 92% 8%, rgba(122, 124, 255, 0.13), transparent 28%),
        linear-gradient(180deg, var(--page), var(--page-deep));
    }

    .catalog-demo-view::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      opacity: 0.28;
      background-image:
        linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px);
      background-size: 46px 46px;
      mask-image: radial-gradient(circle at 50% 18%, black, transparent 78%);
    }

    .catalog-demo-view > * {
      position: relative;
      z-index: 1;
    }

    .catalog-demo-main {
      padding: 44px 0 70px;
    }

    .catalog-demo-hero {
      max-width: 940px;
      margin: 0 auto;
      text-align: center;
    }

    .catalog-demo-hero h1 {
      margin: 14px 0 12px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: clamp(42px, 6vw, 78px);
      font-weight: 500;
      letter-spacing: -0.045em;
      line-height: 1;
    }

    .catalog-demo-hero p {
      max-width: 760px;
      margin: 0 auto;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.7;
    }

    .catalog-demo-search {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      margin-top: 28px;
      padding: 9px;
      border: 1px solid rgba(125, 235, 255, 0.18);
      border-radius: 20px;
      background: color-mix(in srgb, var(--surface-strong) 92%, transparent);
      box-shadow: 0 22px 64px rgba(0,0,0,0.28), var(--glow);
      backdrop-filter: blur(18px) saturate(130%);
    }

    .catalog-demo-search-icon {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      color: var(--green-2);
      font-size: 20px;
    }

    .catalog-demo-search input {
      width: 100%;
      min-width: 0;
      min-height: 46px;
      padding: 0 8px;
      outline: none;
      color: var(--ink);
      border: 0;
      background: transparent;
      font-size: 15px;
    }

    .catalog-demo-search input::placeholder {
      color: color-mix(in srgb, var(--muted) 72%, transparent);
    }

    .catalog-demo-shortcuts {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-top: 13px;
    }

    .catalog-demo-shortcut {
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      color: var(--muted);
      background: rgba(255,255,255,0.025);
      cursor: pointer;
    }

    .catalog-demo-shortcut:hover,
    .catalog-demo-shortcut:focus-visible {
      color: var(--ink);
      border-color: rgba(125, 235, 255, 0.34);
      background: rgba(0,223,242,0.065);
    }

    .catalog-demo-layout {
      display: grid;
      grid-template-columns: 248px minmax(0, 1fr) 286px;
      gap: 18px;
      align-items: start;
      margin-top: 38px;
    }

    .catalog-demo-panel {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: color-mix(in srgb, var(--surface-strong) 92%, transparent);
      box-shadow: 0 20px 58px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.025);
      backdrop-filter: blur(18px) saturate(125%);
    }

    .catalog-demo-sidebar,
    .catalog-demo-path {
      position: sticky;
      top: 18px;
      padding: 17px;
    }

    .catalog-demo-panel-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 13px;
    }

    .catalog-demo-panel-title h2,
    .catalog-demo-panel-title h3 {
      margin: 0;
      font-size: 14px;
    }

    .catalog-demo-filter-grid {
      display: grid;
      gap: 11px;
    }

    .catalog-demo-filter-grid label {
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 760;
    }

    .catalog-demo-filter-grid select {
      width: 100%;
      min-height: 39px;
      padding: 0 10px;
      color: var(--ink);
      border: 1px solid var(--line);
      border-radius: 11px;
      background: var(--surface);
    }

    .catalog-demo-check {
      display: flex !important;
      grid-template-columns: none !important;
      align-items: center;
      gap: 9px !important;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 11px;
      background: rgba(255,255,255,0.022);
      cursor: pointer;
    }

    .catalog-demo-check input {
      width: 16px;
      height: 16px;
      accent-color: var(--green);
    }

    .catalog-demo-topic-list {
      display: grid;
      gap: 7px;
      margin-top: 16px;
      padding-top: 15px;
      border-top: 1px solid var(--line);
    }

    .catalog-demo-topic {
      width: 100%;
      min-height: 38px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0 11px;
      color: var(--muted);
      border: 1px solid transparent;
      border-radius: 11px;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }

    .catalog-demo-topic:hover,
    .catalog-demo-topic.is-active {
      color: var(--ink);
      border-color: var(--line);
      background: rgba(0,223,242,0.055);
    }

    .catalog-demo-center {
      min-width: 0;
    }

    .catalog-demo-feedback {
      min-height: 76px;
      display: grid;
      grid-template-columns: 42px minmax(0, 1fr);
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
      padding: 14px 16px;
      border: 1px solid rgba(125, 235, 255, 0.18);
      border-radius: 17px;
      background:
        radial-gradient(circle at 0% 0%, rgba(0,223,242,0.10), transparent 46%),
        color-mix(in srgb, var(--surface-strong) 93%, transparent);
    }

    .catalog-demo-eve {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(125,235,255,0.28);
      border-radius: 50%;
      color: var(--green-2);
      background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.14), transparent 24%), var(--surface-soft);
      box-shadow: 0 0 22px rgba(0,223,242,0.12);
      font-weight: 900;
    }

    .catalog-demo-feedback strong,
    .catalog-demo-feedback span {
      display: block;
    }

    .catalog-demo-feedback span {
      margin-top: 4px;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.5;
    }

    .catalog-demo-results-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin: 0 2px 12px;
    }

    .catalog-demo-results-head h2 {
      margin: 0;
      font-size: 17px;
    }

    .catalog-demo-count {
      color: var(--muted);
      font-size: 11px;
    }

    .catalog-demo-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 13px;
    }

    .catalog-demo-card {
      min-width: 0;
      display: flex;
      flex-direction: column;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background:
        linear-gradient(155deg, color-mix(in srgb, var(--surface-strong) 96%, var(--green) 2%), var(--surface));
      box-shadow: 0 15px 36px rgba(0,0,0,0.17), inset 0 1px 0 rgba(255,255,255,0.025);
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }

    .catalog-demo-card:hover {
      transform: translateY(-2px);
      border-color: rgba(125,235,255,0.28);
      box-shadow: 0 20px 42px rgba(0,0,0,0.23), 0 0 20px rgba(0,223,242,0.06);
    }

    .catalog-demo-card.is-selected {
      border-color: rgba(125,235,255,0.42);
      box-shadow: 0 0 0 2px rgba(0,223,242,0.08), 0 20px 42px rgba(0,0,0,0.21);
    }

    .catalog-demo-card-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .catalog-demo-badge {
      padding: 4px 7px;
      border-radius: 999px;
      color: var(--green-2);
      background: rgba(0,223,242,0.075);
      font-size: 8px;
      font-weight: 820;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .catalog-demo-badge.secondary {
      color: #c7c8ff;
      background: rgba(122,124,255,0.09);
    }

    .catalog-demo-card h3 {
      margin: 13px 0 7px;
      font-size: 16px;
      line-height: 1.3;
    }

    .catalog-demo-provider {
      margin: 0 0 9px;
      color: var(--green-2);
      font-size: 9px;
      font-weight: 760;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .catalog-demo-description {
      flex: 1;
      margin: 0;
      color: var(--muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .catalog-demo-monitoring {
      margin-top: 12px;
      padding: 8px 9px;
      border: 1px solid rgba(82,232,176,0.16);
      border-radius: 10px;
      color: #8df7d1;
      background: rgba(82,232,176,0.045);
      font-size: 9px;
    }

    .catalog-demo-card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-top: 13px;
    }

    .catalog-demo-card-actions button {
      min-height: 37px;
      padding: 0 8px;
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--ink);
      background: rgba(255,255,255,0.025);
      font-size: 9px;
      font-weight: 760;
      cursor: pointer;
    }

    .catalog-demo-card-actions button.primary {
      color: #eaffff;
      border-color: rgba(125,235,255,0.25);
      background: linear-gradient(135deg, rgba(9,107,129,0.88), rgba(75,77,178,0.84));
    }

    .catalog-demo-empty {
      grid-column: 1 / -1;
      padding: 34px 20px;
      border: 1px dashed var(--line);
      border-radius: 18px;
      color: var(--muted);
      text-align: center;
    }

    .catalog-demo-path-count {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: #eaffff;
      background: linear-gradient(135deg, var(--green), #5268c8);
      font-size: 11px;
      font-weight: 900;
    }

    .catalog-demo-path-copy {
      margin: 0 0 13px;
      color: var(--muted);
      font-size: 10px;
      line-height: 1.5;
    }

    .catalog-demo-path-list {
      display: grid;
      gap: 8px;
      margin: 0 0 14px;
      padding: 0;
      list-style: none;
    }

    .catalog-demo-path-item {
      display: grid;
      grid-template-columns: 25px minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 11px;
      background: rgba(255,255,255,0.022);
      font-size: 9px;
    }

    .catalog-demo-path-index {
      display: grid;
      width: 25px;
      height: 25px;
      place-items: center;
      border-radius: 50%;
      color: var(--green-2);
      background: rgba(0,223,242,0.075);
      font-weight: 900;
    }

    .catalog-demo-remove {
      width: 26px;
      height: 26px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 8px;
      color: var(--muted);
      background: transparent;
      cursor: pointer;
    }

    .catalog-demo-import {
      width: 100%;
      min-height: 44px;
      border: 1px solid rgba(125,235,255,0.26);
      border-radius: 12px;
      color: #eaffff;
      background: linear-gradient(135deg, rgba(9,107,129,0.94), rgba(75,77,178,0.90));
      font-weight: 780;
      cursor: pointer;
    }

    .catalog-demo-import:disabled {
      opacity: 0.43;
      cursor: not-allowed;
    }

    .catalog-demo-privacy {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 9px;
      line-height: 1.5;
    }

    .catalog-demo-status {
      min-height: 22px;
      margin-top: 10px;
      color: #8df7d1;
      font-size: 9px;
      line-height: 1.45;
    }

    @media (max-width: 1120px) {
      .catalog-demo-layout {
        grid-template-columns: 220px minmax(0, 1fr);
      }

      .catalog-demo-path {
        position: static;
        grid-column: 1 / -1;
      }

      .catalog-demo-path-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 760px) {
      .catalog-demo-main {
        padding-top: 28px;
      }

      .catalog-demo-search {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .catalog-demo-search .portal-button {
        grid-column: 1 / -1;
        width: 100%;
      }

      .catalog-demo-layout {
        grid-template-columns: 1fr;
      }

      .catalog-demo-sidebar,
      .catalog-demo-path {
        position: static;
      }

      .catalog-demo-grid,
      .catalog-demo-path-list {
        grid-template-columns: 1fr;
      }

      .catalog-demo-hero h1 {
        font-size: clamp(38px, 13vw, 60px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .catalog-demo-card,
      .catalog-demo-shortcut {
        transition: none !important;
      }
    }
'''

CATALOG_HTML = r'''

  <section class="portal-view catalog-demo-view" id="portalCatalog" hidden data-catalog-demo-version="1.1.0-alpha.1">
    <header class="portal-header">
      <div class="portal-container portal-navbar">
        <button class="portal-brand" type="button" onclick="navigatePortal('dashboard')" aria-label="Torna alla scrivania">
          <span class="portal-brand-mark" aria-hidden="true"></span>
          <span>Catalogo</span>
        </button>
        <nav class="portal-nav" aria-label="Navigazione Catalogo">
          <button class="portal-button" type="button" onclick="navigatePortal('dashboard')">← Scrivania</button>
          <button class="portal-button" type="button" onclick="toggleDarkMode()">Tema</button>
          <span class="portal-status">✦ Eve · percorso locale</span>
        </nav>
      </div>
    </header>

    <main class="catalog-demo-main">
      <div class="portal-container">
        <section class="catalog-demo-hero">
          <div class="portal-eyebrow">Catalogo intelligente · gratuito</div>
          <h1>Cosa vuoi studiare?</h1>
          <p>
            Cerca materiali già presenti nella demo. Eve li ordina con regole locali,
            senza chiamare OpenAI e senza consumare credito.
          </p>

          <div class="catalog-demo-search" role="search">
            <span class="catalog-demo-search-icon" aria-hidden="true">⌕</span>
            <input id="catalogDemoSearch" type="search" maxlength="180" placeholder="Es. imparare Python partendo da zero" aria-label="Cerca nel Catalogo" oninput="catalogDemoRender()" onkeydown="if(event.key === 'Enter'){ event.preventDefault(); catalogDemoRender(true); }">
            <button class="portal-button primary" type="button" onclick="catalogDemoRender(true)">Cerca nel catalogo →</button>
          </div>

          <div class="catalog-demo-shortcuts" aria-label="Ricerche rapide">
            <button class="catalog-demo-shortcut" type="button" onclick="catalogDemoUseQuery('Programmazione da zero')">Programmazione</button>
            <button class="catalog-demo-shortcut" type="button" onclick="catalogDemoUseQuery('Matematica dalle basi')">Matematica</button>
            <button class="catalog-demo-shortcut" type="button" onclick="catalogDemoUseQuery('Inglese per il lavoro')">Lingue</button>
            <button class="catalog-demo-shortcut" type="button" onclick="catalogDemoUseQuery('Non so da dove iniziare')">✦ Non so da dove iniziare</button>
          </div>
        </section>

        <div class="catalog-demo-layout">
          <aside class="catalog-demo-panel catalog-demo-sidebar" aria-label="Filtri del Catalogo">
            <div class="catalog-demo-panel-title">
              <h2>Filtri</h2>
              <button class="catalog-demo-remove" type="button" onclick="catalogDemoResetFilters()" title="Azzera filtri" aria-label="Azzera filtri">↺</button>
            </div>

            <div class="catalog-demo-filter-grid">
              <label>
                Livello
                <select id="catalogDemoLevel" onchange="catalogDemoRender()">
                  <option value="all">Tutti i livelli</option>
                  <option value="zero">Da zero</option>
                  <option value="base">Base</option>
                  <option value="intermedio">Intermedio</option>
                </select>
              </label>

              <label>
                Formato
                <select id="catalogDemoFormat" onchange="catalogDemoRender()">
                  <option value="all">Tutti i formati</option>
                  <option value="corso">Corso</option>
                  <option value="documentazione">Documentazione</option>
                  <option value="video">Video</option>
                  <option value="esercizi">Esercizi</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>

              <label>
                Lingua
                <select id="catalogDemoLanguage" onchange="catalogDemoRender()">
                  <option value="all">Tutte le lingue</option>
                  <option value="it">Italiano</option>
                  <option value="en">Inglese</option>
                </select>
              </label>

              <label class="catalog-demo-check" for="catalogDemoVerified">
                <input id="catalogDemoVerified" type="checkbox" onchange="catalogDemoRender()">
                Solo fonti verificate
              </label>
            </div>

            <div class="catalog-demo-topic-list" aria-label="Argomenti">
              <button class="catalog-demo-topic" type="button" data-catalog-topic="programmazione" onclick="catalogDemoUseQuery('programmazione')"><span>Programmazione</span><span>8</span></button>
              <button class="catalog-demo-topic" type="button" data-catalog-topic="matematica" onclick="catalogDemoUseQuery('matematica')"><span>Matematica</span><span>3</span></button>
              <button class="catalog-demo-topic" type="button" data-catalog-topic="lingue" onclick="catalogDemoUseQuery('lingue')"><span>Lingue</span><span>2</span></button>
              <button class="catalog-demo-topic" type="button" data-catalog-topic="metodo" onclick="catalogDemoUseQuery('metodo di studio')"><span>Metodo di studio</span><span>2</span></button>
            </div>
          </aside>

          <section class="catalog-demo-center" aria-label="Risultati del Catalogo">
            <div class="catalog-demo-feedback" aria-live="polite">
              <span class="catalog-demo-eve" aria-hidden="true">E</span>
              <div>
                <strong id="catalogDemoEveTitle">Eve ha preparato una selezione iniziale</strong>
                <span id="catalogDemoEveText">Parti dal corso editoriale, aggiungi una fonte di consultazione e completa con esercizi verificabili.</span>
              </div>
            </div>

            <div class="catalog-demo-results-head">
              <h2>Materiali disponibili</h2>
              <span class="catalog-demo-count" id="catalogDemoCount">0 risultati</span>
            </div>

            <div class="catalog-demo-grid" id="catalogDemoResults"></div>
          </section>

          <aside class="catalog-demo-panel catalog-demo-path" aria-label="Percorso selezionato">
            <div class="catalog-demo-panel-title">
              <div>
                <div class="portal-mini-label">Percorso personale</div>
                <h3>La selezione di Eve</h3>
              </div>
              <span class="catalog-demo-path-count" id="catalogDemoPathCount">0</span>
            </div>

            <p class="catalog-demo-path-copy">
              I materiali scelti restano privati finché non importi esplicitamente il percorso nell’aula.
            </p>

            <ol class="catalog-demo-path-list" id="catalogDemoPathList"></ol>

            <button class="catalog-demo-import" id="catalogDemoImportButton" type="button" onclick="catalogDemoImportPath()" disabled>
              Importa nella stanza Python
            </button>
            <div class="catalog-demo-status" id="catalogDemoStatus" aria-live="polite"></div>

            <div class="catalog-demo-privacy">
              <strong>Privacy.</strong> Ricerca, filtri e selezione sono simulati localmente. La demo non invia dati e non contatta provider esterni.
            </div>
          </aside>
        </div>
      </div>
    </main>
  </section>
'''

CATALOG_JS = r'''

    /* ==========================================================
       CATALOGO INTELLIGENTE — DATI E INTERAZIONI DETERMINISTICHE
       ========================================================== */

    const catalogDemoMaterials = [
      {
        id: "programmazione-zero",
        title: "Programmazione da Zero",
        provider: "Aula editoriale",
        format: "corso",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione coding python software development",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Percorso nativo dalle basi assolute: lezioni, esercizi, quiz, glossario, Python Project e criteri di completamento."
      },
      {
        id: "python-docs",
        title: "Documentazione ufficiale Python",
        provider: "Python Software Foundation",
        format: "documentazione",
        level: "base",
        language: "it",
        verified: true,
        topic: "programmazione python sintassi documentazione",
        monitoring: "Apribile nell’aula · monitoraggio parziale",
        description: "Riferimento ufficiale per sintassi, tipi, funzioni, moduli e libreria standard, utile durante gli esercizi."
      },
      {
        id: "python-exercises",
        title: "Esercizi Python con verifica",
        provider: "Aula Practice",
        format: "esercizi",
        level: "base",
        language: "it",
        verified: true,
        topic: "programmazione python esercizi problemi pratica",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Serie progressiva di esercizi con input, output atteso, casi limite e controllo finale del risultato."
      },
      {
        id: "algoritmi-pdf",
        title: "Algoritmi e pensiero computazionale",
        provider: "Open Learning Notes",
        format: "pdf",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione algoritmi pseudocodice logica metodo",
        monitoring: "Richiede importazione del PDF",
        description: "Dispensa introduttiva su scomposizione dei problemi, algoritmi, pseudocodice, test e casi limite."
      },
      {
        id: "python-video",
        title: "Python: prima lezione guidata",
        provider: "Aula Video",
        format: "video",
        level: "zero",
        language: "it",
        verified: true,
        topic: "programmazione python video installazione primo programma",
        monitoring: "Apribile nell’aula · copertura video monitorabile",
        description: "Video introduttivo con installazione, primo programma, terminale e lettura degli errori più comuni."
      },
      {
        id: "math-zero",
        title: "Matematica dalle basi",
        provider: "Aula editoriale",
        format: "corso",
        level: "zero",
        language: "it",
        verified: true,
        topic: "matematica numeri algebra geometria",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Percorso progressivo per recuperare numeri, operazioni, algebra e ragionamento matematico."
      },
      {
        id: "english-work",
        title: "English for Work",
        provider: "Open Skills",
        format: "corso",
        level: "base",
        language: "en",
        verified: false,
        topic: "lingue inglese lavoro conversazione vocabolario",
        monitoring: "Apribile nell’aula · monitoraggio parziale",
        description: "Materiali pratici per email, colloqui, riunioni e lessico professionale. Fonte personale da verificare."
      },
      {
        id: "study-method",
        title: "Metodo di studio e ripasso attivo",
        provider: "Aula Focus",
        format: "documentazione",
        level: "base",
        language: "it",
        verified: true,
        topic: "metodo studio memoria ripasso focus",
        monitoring: "Apribile e monitorabile nell’aula",
        description: "Guida a obiettivi, sessioni focus, recupero attivo, domande di controllo e pianificazione settimanale."
      }
    ];

    const catalogDemoState = {
      initialized: false,
      saved: new Set(["programmazione-zero", "python-docs"]),
      selected: new Set(["programmazione-zero", "python-docs", "python-exercises"]),
      importedSignature: ""
    };

    const catalogDemoFormatLabels = {
      corso: "Corso",
      documentazione: "Documentazione",
      video: "Video",
      esercizi: "Esercizi",
      pdf: "PDF"
    };

    const catalogDemoLevelLabels = {
      zero: "Da zero",
      base: "Base",
      intermedio: "Intermedio"
    };

    function catalogDemoEscape(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function catalogDemoElements() {
      return {
        search: document.getElementById("catalogDemoSearch"),
        level: document.getElementById("catalogDemoLevel"),
        format: document.getElementById("catalogDemoFormat"),
        language: document.getElementById("catalogDemoLanguage"),
        verified: document.getElementById("catalogDemoVerified"),
        results: document.getElementById("catalogDemoResults"),
        count: document.getElementById("catalogDemoCount"),
        eveTitle: document.getElementById("catalogDemoEveTitle"),
        eveText: document.getElementById("catalogDemoEveText"),
        pathCount: document.getElementById("catalogDemoPathCount"),
        pathList: document.getElementById("catalogDemoPathList"),
        importButton: document.getElementById("catalogDemoImportButton"),
        status: document.getElementById("catalogDemoStatus")
      };
    }

    function catalogDemoFilteredMaterials() {
      const elements = catalogDemoElements();
      const query = String(elements.search?.value || "").trim().toLocaleLowerCase("it");
      const level = elements.level?.value || "all";
      const format = elements.format?.value || "all";
      const language = elements.language?.value || "all";
      const verifiedOnly = Boolean(elements.verified?.checked);
      const terms = query.split(/\s+/).filter(Boolean);

      return catalogDemoMaterials.filter((material) => {
        const haystack = `${material.title} ${material.provider} ${material.description} ${material.topic}`.toLocaleLowerCase("it");
        return (terms.length === 0 || terms.every((term) => haystack.includes(term)))
          && (level === "all" || material.level === level)
          && (format === "all" || material.format === format)
          && (language === "all" || material.language === language)
          && (!verifiedOnly || material.verified);
      });
    }

    function catalogDemoCard(material) {
      const saved = catalogDemoState.saved.has(material.id);
      const selected = catalogDemoState.selected.has(material.id);
      return `
        <article class="catalog-demo-card ${selected ? "is-selected" : ""}" data-catalog-material="${catalogDemoEscape(material.id)}">
          <div class="catalog-demo-card-badges">
            <span class="catalog-demo-badge">${catalogDemoEscape(catalogDemoFormatLabels[material.format] || material.format)}</span>
            <span class="catalog-demo-badge secondary">${catalogDemoEscape(catalogDemoLevelLabels[material.level] || material.level)}</span>
            <span class="catalog-demo-badge secondary">${material.verified ? "Fonte verificata" : "Da verificare"}</span>
          </div>
          <h3>${catalogDemoEscape(material.title)}</h3>
          <p class="catalog-demo-provider">${catalogDemoEscape(material.provider)} · ${catalogDemoEscape(material.language.toUpperCase())}</p>
          <p class="catalog-demo-description">${catalogDemoEscape(material.description)}</p>
          <div class="catalog-demo-monitoring">${catalogDemoEscape(material.monitoring)}</div>
          <div class="catalog-demo-card-actions">
            <button type="button" onclick="catalogDemoToggleSaved('${catalogDemoEscape(material.id)}')">${saved ? "★ Salvato" : "☆ Salva"}</button>
            <button class="primary" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')">${selected ? "✓ Nel percorso" : "+ Usa nel percorso"}</button>
          </div>
        </article>
      `;
    }

    function catalogDemoRender(announce = false) {
      const elements = catalogDemoElements();
      if (!elements.results) return;
      const materials = catalogDemoFilteredMaterials();
      elements.results.innerHTML = materials.length
        ? materials.map(catalogDemoCard).join("")
        : `<div class="catalog-demo-empty"><strong>Nessun materiale corrisponde ai filtri.</strong><br>Prova ad azzerare i filtri o usa una ricerca più generale.</div>`;
      if (elements.count) elements.count.textContent = `${materials.length} ${materials.length === 1 ? "risultato" : "risultati"}`;

      const query = String(elements.search?.value || "").trim();
      if (elements.eveTitle) {
        elements.eveTitle.textContent = query
          ? `Eve ha organizzato la ricerca “${query}”`
          : "Eve ha preparato una selezione iniziale";
      }
      if (elements.eveText) {
        elements.eveText.textContent = materials.length
          ? `Ho trovato ${materials.length} materiali compatibili. Seleziona quelli utili e controlla il percorso sulla destra.`
          : "Non ho trovato una corrispondenza completa. Riduci i filtri oppure prova un obiettivo più generale.";
      }

      document.querySelectorAll("[data-catalog-topic]").forEach((button) => {
        const topic = button.getAttribute("data-catalog-topic") || "";
        button.classList.toggle("is-active", Boolean(query) && query.toLocaleLowerCase("it").includes(topic));
      });

      catalogDemoRenderPath();
      if (announce && elements.status) elements.status.textContent = `Ricerca completata: ${materials.length} materiali disponibili.`;
    }

    function catalogDemoRenderPath() {
      const elements = catalogDemoElements();
      if (!elements.pathList) return;
      const selected = catalogDemoMaterials.filter((material) => catalogDemoState.selected.has(material.id));
      if (elements.pathCount) elements.pathCount.textContent = String(selected.length);
      elements.pathList.innerHTML = selected.length
        ? selected.map((material, index) => `
            <li class="catalog-demo-path-item">
              <span class="catalog-demo-path-index">${index + 1}</span>
              <span>${catalogDemoEscape(material.title)}</span>
              <button class="catalog-demo-remove" type="button" onclick="catalogDemoToggleSelected('${catalogDemoEscape(material.id)}')" aria-label="Rimuovi ${catalogDemoEscape(material.title)} dal percorso">×</button>
            </li>
          `).join("")
        : `<li class="catalog-demo-empty">Seleziona almeno un materiale dai risultati.</li>`;
      if (elements.importButton) elements.importButton.disabled = selected.length === 0;
    }

    function catalogDemoToggleSaved(id) {
      if (catalogDemoState.saved.has(id)) catalogDemoState.saved.delete(id);
      else catalogDemoState.saved.add(id);
      const elements = catalogDemoElements();
      if (elements.status) elements.status.textContent = catalogDemoState.saved.has(id)
        ? "Materiale aggiunto ai salvati personali."
        : "Materiale rimosso dai salvati personali.";
      catalogDemoRender();
    }

    function catalogDemoToggleSelected(id) {
      if (catalogDemoState.selected.has(id)) catalogDemoState.selected.delete(id);
      else catalogDemoState.selected.add(id);
      catalogDemoState.importedSignature = "";
      const elements = catalogDemoElements();
      if (elements.status) elements.status.textContent = catalogDemoState.selected.has(id)
        ? "Materiale aggiunto al percorso."
        : "Materiale rimosso dal percorso.";
      catalogDemoRender();
    }

    function catalogDemoUseQuery(query) {
      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = query;
      catalogDemoRender(true);
    }

    function catalogDemoResetFilters() {
      const elements = catalogDemoElements();
      if (elements.search) elements.search.value = "";
      if (elements.level) elements.level.value = "all";
      if (elements.format) elements.format.value = "all";
      if (elements.language) elements.language.value = "all";
      if (elements.verified) elements.verified.checked = false;
      if (elements.status) elements.status.textContent = "Filtri azzerati.";
      catalogDemoRender();
    }

    function catalogDemoImportPath() {
      const selected = catalogDemoMaterials.filter((material) => catalogDemoState.selected.has(material.id));
      const signature = selected.map((material) => material.id).sort().join("|");
      const elements = catalogDemoElements();
      if (!selected.length) return;
      if (catalogDemoState.importedSignature === signature) {
        if (elements.status) elements.status.textContent = "Questo percorso è già presente nella stanza: nessun duplicato creato.";
        portalNotify("Percorso già presente nella stanza");
        return;
      }
      catalogDemoState.importedSignature = signature;
      if (elements.status) elements.status.textContent = `Percorso importato: ${selected.length} materiali, un corso e una checklist simulati.`;
      portalNotify("Percorso importato nella stanza Python");
    }

    function catalogDemoInit() {
      if (!document.getElementById("portalCatalog")) return;
      if (!catalogDemoState.initialized) {
        catalogDemoState.initialized = true;
        const elements = catalogDemoElements();
        if (elements.search && !elements.search.value) elements.search.value = "programmazione";
      }
      catalogDemoRender();
    }
'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Anchor {label!r} expected once, found {count}")
    return text.replace(old, new, 1)


def git_blob_sha(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("utf-8")
    return hashlib.sha1(header + data).hexdigest()


def update_html(html: str) -> str:
    if MARKER in html:
        return html

    html = replace_once(
        html,
        "  </style>\n</head>",
        CATALOG_CSS + "\n  </style>\n</head>",
        "style closing",
    )

    html = replace_once(
        html,
        '  <section class="portal-view portal-aula-view" id="portalAula" hidden>',
        CATALOG_HTML + '\n  <section class="portal-view portal-aula-view" id="portalAula" hidden>',
        "aula section",
    )

    html = replace_once(
        html,
        "    const portalRouteMap = {\n      presentation: document.getElementById(\"portalPresentation\"),\n      dashboard: document.getElementById(\"portalDashboard\"),\n      aula: document.getElementById(\"portalAula\")\n    };",
        "    const portalRouteMap = {\n      presentation: document.getElementById(\"portalPresentation\"),\n      dashboard: document.getElementById(\"portalDashboard\"),\n      catalog: document.getElementById(\"portalCatalog\"),\n      aula: document.getElementById(\"portalAula\")\n    };",
        "portal route map",
    )

    html = replace_once(
        html,
        "    const portalTitles = {\n      presentation: \"Aula Studio Virtuale — Presentazione\",\n      dashboard: \"Aula Studio Virtuale — Le tue stanze\",\n      aula: \"Aula Studio Virtuale — Programmazione in Python\"\n    };",
        "    const portalTitles = {\n      presentation: \"Aula Studio Virtuale — Presentazione\",\n      dashboard: \"Aula Studio Virtuale — Le tue stanze\",\n      catalog: \"Aula Studio Virtuale — Catalogo intelligente\",\n      aula: \"Aula Studio Virtuale — Programmazione in Python\"\n    };",
        "portal titles",
    )

    html = replace_once(
        html,
        "      document.body.dataset.portalRoute = normalizedRoute;\n      document.title = portalTitles[normalizedRoute];",
        "      document.body.dataset.portalRoute = normalizedRoute;\n      document.title = portalTitles[normalizedRoute];\n      if (normalizedRoute === \"catalog\") catalogDemoInit();",
        "catalog initialization",
    )

    html = replace_once(
        html,
        "    function portalOpenCatalog() {\n      navigatePortal(\"aula\");\n\n      window.setTimeout(() => {\n        if (typeof openModal === \"function\") {\n          openModal(\"catalogo\");\n        }\n      }, 60);\n    }",
        "    function portalOpenCatalog() {\n      navigatePortal(\"catalog\");\n    }",
        "portal catalog function",
    )

    html = replace_once(
        html,
        '<button class="action-button" type="button" onclick="openModal(\'catalogo\')">',
        '<button class="action-button" type="button" onclick="navigatePortal(\'catalog\')">',
        "aula catalog button",
    )

    html = replace_once(
        html,
        "    /* ==========================================================\n       NAVIGAZIONE INTERNA — UN SOLO FILE HTML",
        CATALOG_JS + "\n\n    /* ==========================================================\n       NAVIGAZIONE INTERNA — UN SOLO FILE HTML",
        "navigation comment",
    )

    html = replace_once(
        html,
        '        title: "Catalogo",\n        html: `\n          <p>Trova percorsi, lezioni e materiali da importare nell\'aula.</p>',
        '        title: "Catalogo",\n        html: `\n          <p>Il Catalogo ora dispone di una vista completa integrata nella demo.</p>\n          <button class="primary-small" type="button" onclick="closeModal(); navigatePortal(\'catalog\')">Apri il Catalogo completo</button>\n          <p style="margin-top:12px"><small>Ricerca, filtri, selezione e importazione restano locali e deterministici.</small></p>\n          <div hidden>Trova percorsi, lezioni e materiali da importare nell\'aula.</div>',
        "legacy catalog modal",
    )

    return html


def update_docs(html: str) -> None:
    data = html.encode("utf-8")
    size = len(data)
    lines = html.count("\n") + 1
    sha256 = hashlib.sha256(data).hexdigest()
    blob_sha = git_blob_sha(data)

    readme = README_PATH.read_text(encoding="utf-8")
    readme = re.sub(r"\*\*Demo[^\n]*\*\*", f"**Demo {VERSION} pronta per verifica del checkpoint Catalogo.**", readme, count=1)
    if "- versione:" in readme:
        readme = re.sub(r"- versione: `[^`]+`", f"- versione: `{VERSION}`", readme, count=1)
    else:
        readme = readme.replace("Identificatori della versione corrente:\n", f"Identificatori della versione corrente:\n\n- versione: `{VERSION}`\n", 1)
    readme = re.sub(r"- dimensione: `\d+` byte", f"- dimensione: `{size}` byte", readme, count=1)
    readme = re.sub(r"- righe: `\d+`", f"- righe: `{lines}`", readme, count=1)
    readme = re.sub(r"- SHA-256: `[0-9a-f]+`", f"- SHA-256: `{sha256}`", readme, count=1)
    readme = re.sub(r"- Git blob SHA: `[0-9a-f]+`", f"- Git blob SHA: `{blob_sha}`", readme, count=1)
    README_PATH.write_text(readme, encoding="utf-8")

    changelog = CHANGELOG_PATH.read_text(encoding="utf-8")
    entry = f'''## [{VERSION}] — {DATE}\n\n### Catalogo intelligente — vista, ricerca e percorso\n\n- Aggiunta una route `#catalog` completa nello stesso HTML canonico.\n- Collegati Dashboard e pulsante Catalogo dell'Aula alla nuova vista.\n- Aggiunti ricerca locale, filtri per livello/formato/lingua e filtro fonti verificate.\n- Aggiunti otto materiali demo deterministici con monitorabilità e provenienza.\n- Aggiunti materiali salvati, selezione per il percorso e rimozione dal percorso.\n- Aggiunta interpretazione locale di Eve senza chiamate OpenAI.\n- Aggiunta importazione simulata idempotente nella stanza Python.\n- Aggiunti responsive mobile, focus nativo e rispetto di `prefers-reduced-motion`.\n\n### Identificatori\n\n- Dimensione: `{size}` byte\n- Righe: `{lines}`\n- SHA-256: `{sha256}`\n- Git blob SHA: `{blob_sha}`\n\n### Stato\n\nCheckpoint HTML completo e in attesa di verifica visuale e funzionale dell'utente.\n\n---\n\n'''
    if f"## [{VERSION}]" not in changelog:
        changelog = changelog.replace("## [1.0.0]", entry + "## [1.0.0]", 1)
    CHANGELOG_PATH.write_text(changelog, encoding="utf-8")

    status = STATUS_PATH.read_text(encoding="utf-8")
    catalog_status = f'''\n# Catalogo intelligente\n\n## Vista, navigazione, ricerca e percorso locale\n\nStato: 🟡 — checkpoint HTML in attesa di approvazione\n\nIntegrato nella demo canonica {VERSION}:\n\n- route autonoma `#catalog`;\n- navigazione Dashboard ↔ Catalogo e Aula → Catalogo;\n- ricerca e filtri;\n- argomenti rapidi;\n- materiali salvati;\n- selezione del percorso;\n- interpretazione deterministica di Eve;\n- importazione simulata idempotente;\n- responsive e stato vuoto.\n\nDa verificare manualmente:\n\n- resa visuale desktop e mobile;\n- navigazione avanti/indietro del browser;\n- filtri combinati;\n- salvataggio e selezione;\n- doppia importazione senza duplicati.\n\n---\n'''
    if "# Catalogo intelligente" not in status:
        status = status.replace("# Regola per Codex", catalog_status + "\n# Regola per Codex", 1)
    STATUS_PATH.write_text(status, encoding="utf-8")

    architecture = ARCHITECTURE_PATH.read_text(encoding="utf-8")
    architecture_entry = '''\n## Catalogo intelligente nella demo canonica\n\nLa route `#catalog` è una vista autonoma dello stesso documento HTML. Usa dati mock deterministici e riproduce il flusso operativo dell'app ufficiale senza chiamare backend o provider esterni.\n\nComponenti logici:\n\n- `catalogDemoMaterials` — inventario materiali;\n- `catalogDemoState` — salvati, selezione e firma dell'importazione;\n- `catalogDemoFilteredMaterials()` — ricerca e filtri combinati;\n- `catalogDemoRender()` — risultati, feedback Eve e stati vuoti;\n- `catalogDemoRenderPath()` — percorso selezionato;\n- `catalogDemoImportPath()` — importazione locale idempotente.\n\nL'app reale conserva come fonti autorevoli API, Supabase, RLS e importazione server-side; la demo definisce UX, stati e responsive.\n'''
    if "## Catalogo intelligente nella demo canonica" not in architecture:
        architecture += architecture_entry
    ARCHITECTURE_PATH.write_text(architecture, encoding="utf-8")

    approvals = APPROVALS_PATH.read_text(encoding="utf-8")
    approvals = approvals.replace(
        "5. fermarsi con stato `IN_ATTESA_APPROVAZIONE`;",
        "5. fermarsi con stato `IN_ATTESA_APPROVAZIONE` soltanto dopo avere modificato realmente l'HTML canonico e avere prodotto una versione apribile;",
    )
    approvals = approvals.replace(
        "| Fase 0 | Baseline documentale e controlli statici | IN_ATTESA_APPROVAZIONE | 2026-07-22 | Creato `BASELINE_VERIFICATION.md`; l'HTML non è stato modificato. |",
        "| Fase 0 | Baseline documentale e controlli statici | APPROVATO | 2026-07-22 | Superata su richiesta dell'utente: nessun checkpoint può fermarsi senza una modifica HTML visibile. |",
    )
    approvals = approvals.replace(
        "| Fase 1 | Catalogo: vista e navigazione | DA_INIZIARE | — | Non iniziare prima dell'approvazione della Fase 0. |",
        f"| Fase 1 | Catalogo: vista, navigazione, ricerca e percorso | IN_ATTESA_APPROVAZIONE | {DATE} | Demo HTML {VERSION} pronta da aprire e verificare. |",
    )
    APPROVALS_PATH.write_text(approvals, encoding="utf-8")


def validate(html: str) -> None:
    required = [
        'id="portalPresentation"',
        'id="portalDashboard"',
        'id="portalCatalog"',
        'id="portalAula"',
        "function catalogDemoRender(",
        "function catalogDemoImportPath(",
        'catalog: document.getElementById("portalCatalog")',
    ]
    for value in required:
        if value not in html:
            raise RuntimeError(f"Missing required marker: {value}")

    ids = re.findall(r'\bid=["\']([^"\']+)["\']', html)
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if duplicates:
        raise RuntimeError(f"Duplicate HTML ids: {duplicates}")

    if html.count("<script") != html.count("</script>"):
        raise RuntimeError("Unbalanced script tags")
    if not html.rstrip().endswith("</html>"):
        raise RuntimeError("HTML closing tag missing")


def main() -> None:
    html = HTML_PATH.read_text(encoding="utf-8")
    updated = update_html(html)
    validate(updated)
    HTML_PATH.write_text(updated, encoding="utf-8")
    update_docs(updated)

    data = updated.encode("utf-8")
    print(f"version={VERSION}")
    print(f"bytes={len(data)}")
    print(f"lines={updated.count(chr(10)) + 1}")
    print(f"sha256={hashlib.sha256(data).hexdigest()}")
    print(f"git_blob_sha={git_blob_sha(data)}")


if __name__ == "__main__":
    main()
