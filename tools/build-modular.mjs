import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "demo-aula-studio-virtuale-canonica.html");
const source = await readFile(sourcePath, "utf8");
const appVersion =
  source.match(/<meta\s+name="aula-demo-version"\s+content="([^"]+)"/)?.[1] ||
  "versione corrente";

const marker = (value, from = 0) => {
  const index = source.indexOf(value, from);
  if (index < 0) throw new Error(`Marcatore non trovato: ${value}`);
  return index;
};

const presentationStart = marker('<section class="portal-view portal-presentation"');
const dashboardStart = marker('<section class="portal-view portal-dashboard"');
const catalogStart = marker('<section class="portal-view catalog-demo-view"');
const aulaStart = marker('<section class="portal-view portal-aula-view"');
const mainScriptStart = marker("  <script>", aulaStart);

const styleBlocks = [...source.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)]
  .map((match) => match[1])
  .join("\n");
const scriptBlocks = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1]);

if (scriptBlocks.length < 2) {
  throw new Error("La demo canonica deve contenere lo script principale e il consolidamento.");
}

const mainScript = scriptBlocks[0];
const consolidationScript = scriptBlocks.slice(1).join("\n");

const scriptMarker = (value, from = 0) => {
  const index = mainScript.indexOf(value, from);
  if (index < 0) throw new Error(`Marcatore JavaScript non trovato: ${value}`);
  return index;
};

const dashboardLogicStart = scriptMarker("    const portalDashboardDemoErrorCodes");
const catalogContextStart = scriptMarker("    const portalCatalogRoomContextStorageKey", dashboardLogicStart);
const dashboardManageStart = scriptMarker("    let portalDashboardManagedRoomId", catalogContextStart);
const dashboardStorageStart = scriptMarker("    const portalDashboardRoomsStorageKey", dashboardManageStart);
const catalogLogicStart = scriptMarker("    const catalogDemoMaterials", dashboardStorageStart);
const routeLogicStart = scriptMarker("    const portalRouteMap", catalogLogicStart);
const aulaLogicResume = scriptMarker("    function exerciseDefinitionById", routeLogicStart);

const cleanRoot = (html, id) => html
  .replace(new RegExp(`(<section[^>]+id="${id}"[^>]*)\\shidden([^>]*>)`), "$1$2")
  .replace(/\n\s*<div class="portal-toast" id="portalToast"[^>]*><\/div>\s*$/m, "\n");

const portalMarkup = cleanRoot(source.slice(presentationStart, dashboardStart), "portalPresentation")
  .replaceAll("navigatePortal('dashboard')", "navigatePortal('register')")
  .replace('onclick="navigatePortal(\'register\')">Accedi', 'onclick="navigatePortal(\'login\')">Accedi');
const dashboardMarkup = cleanRoot(source.slice(dashboardStart, catalogStart), "portalDashboard")
  .replace("<h1>Ciao, Luca.</h1>", '<h1>Ciao, <span data-auth-display-name>studente</span>.</h1>')
  .replace('<button class="portal-button" type="button" onclick="navigatePortal(\'presentation\')">Esci</button>', '<button class="portal-button" type="button" data-auth-logout>Esci</button>');
const catalogMarkup = cleanRoot(source.slice(catalogStart, aulaStart), "portalCatalog");
const aulaMarkup = cleanRoot(source.slice(aulaStart, mainScriptStart), "portalAula");

const sharedRuntime = `
const routeUrls = {
  presentation: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  catalog: "/catalog",
  aula: "/room/"
};

function navigatePortal(route) {
  const destination = routeUrls[route] || routeUrls.presentation;
  window.location.assign(destination);
}

function portalNotify(message) {
  const toast = document.getElementById("portalToast") || document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(portalNotify.timeout);
  portalNotify.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function portalScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start"
  });
}

function readVisualPreferences() {
  try {
    return JSON.parse(localStorage.getItem("aula-demo-layout-reale") || "{}") || {};
  } catch {
    return {};
  }
}

function writeVisualPreferences(next) {
  try {
    localStorage.setItem("aula-demo-layout-reale", JSON.stringify(next));
  } catch {
    // La pagina resta utilizzabile anche quando la persistenza locale è bloccata.
  }
}

function applySharedVisualPreferences() {
  const preferences = readVisualPreferences();
  document.body.classList.toggle("dark", Boolean(preferences.dark));
  document.body.dataset.graphicsMode = ["full", "optimized", "reduced"].includes(preferences.graphicsMode)
    ? preferences.graphicsMode
    : "optimized";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  const preferences = readVisualPreferences();
  preferences.dark = document.body.classList.contains("dark");
  writeVisualPreferences(preferences);
}

applySharedVisualPreferences();
`;

const dashboardScript = [
  sharedRuntime,
  mainScript.slice(dashboardLogicStart, catalogContextStart),
  mainScript.slice(catalogContextStart, catalogLogicStart),
  "\nportalDashboardInit();\n"
].join("\n");

const catalogRoomsRuntime = `
const portalDashboardRoomsStorageKey = "aula-demo-dashboard-rooms-v1";
const portalDashboardRoleLabels = {
  owner: "Proprietario",
  member: "Partecipante"
};
const portalDashboardDefaultRooms = [
  {
    id: "python-room",
    name: "Programmazione in Python",
    code: "PYTHON-2026",
    members: 2,
    activity: "Lezione 0.1",
    lastActivity: "Lezione 0.1",
    role: "owner",
    inviteRotatedAt: "",
    createdAt: "2026-07-17T14:30:00.000Z"
  }
];
const portalDashboardState = { rooms: [] };

function portalDashboardEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function portalDashboardNormalizeRoom(room) {
  if (!room || typeof room !== "object") return null;
  const name = String(room.name || "").trim().slice(0, 60);
  const id = String(room.id || "").trim().slice(0, 80);
  if (!name || !id) return null;
  return {
    ...room,
    id,
    name,
    code: String(room.code || "").trim().toUpperCase().slice(0, 64),
    members: Math.max(1, Number(room.members || 1)),
    activity: String(room.activity || "Nessuna attività").slice(0, 120),
    role: room.role === "owner" ? "owner" : "member"
  };
}

function portalDashboardLoadRooms() {
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(portalDashboardRoomsStorageKey) || "null");
  } catch {
    stored = null;
  }
  const rooms = Array.isArray(stored) ? stored : portalDashboardDefaultRooms;
  portalDashboardState.rooms = rooms.map(portalDashboardNormalizeRoom).filter(Boolean);
}

portalDashboardLoadRooms();
`;

const catalogScript = [
  sharedRuntime,
  catalogRoomsRuntime,
  mainScript.slice(catalogContextStart, dashboardManageStart),
  mainScript.slice(catalogLogicStart, routeLogicStart),
  "\ncatalogDemoInit();\n"
].join("\n");

const aulaNavigationRuntime = `
const routeUrls = {
  presentation: "/",
  dashboard: "/dashboard",
  catalog: "/catalog",
  aula: "/room/"
};

function navigatePortal(route) {
  window.location.assign(routeUrls[route] || routeUrls.presentation);
}

function portalNotify(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(portalNotify.timeout);
  portalNotify.timeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function portalScrollTo(elementId) {
  const target = document.getElementById(elementId);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function portalDashboardOpenCatalogForRoom(roomId = "") {
  try {
    if (roomId) localStorage.setItem("aula-demo-catalog-room-context-v1", roomId);
  } catch {
    // Il Catalogo si apre comunque senza contesto persistente.
  }
  window.location.assign("/catalog?from=aula");
}
`;

const aulaScript = [
  aulaNavigationRuntime,
  mainScript.slice(0, dashboardLogicStart),
  mainScript.slice(aulaLogicResume),
  consolidationScript
].join("\n");

const portalScript = `
${sharedRuntime}
document.body.dataset.routeReady = "true";
`;

function classAndIdTokens(text) {
  const result = new Set();
  for (const match of text.matchAll(/(?:class|id)=["']([^"']+)["']/g)) {
    match[1].split(/\s+/).filter(Boolean).forEach((token) => result.add(token));
  }
  for (const match of text.matchAll(/[.#]([_a-zA-Z][\w-]*)/g)) result.add(match[1]);
  for (const match of text.matchAll(/["'`]([_a-zA-Z][\w-]*)["'`]/g)) result.add(match[1]);
  return result;
}

function readCssBlock(css, start) {
  let depth = 1;
  let quote = "";
  let escaped = false;
  let comment = false;
  for (let index = start; index < css.length; index += 1) {
    const char = css[index];
    const next = css[index + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return { body: css.slice(start, index), end: index + 1 };
    }
  }
  throw new Error("Blocco CSS non bilanciato");
}

function parseCssRules(css) {
  const rules = [];
  let cursor = 0;
  while (cursor < css.length) {
    while (cursor < css.length && /\s/.test(css[cursor])) cursor += 1;
    if (css.startsWith("/*", cursor)) {
      const end = css.indexOf("*/", cursor + 2);
      if (end < 0) break;
      cursor = end + 2;
      continue;
    }
    if (cursor >= css.length) break;

    let quote = "";
    let escaped = false;
    let parens = 0;
    let boundary = -1;
    for (let index = cursor; index < css.length; index += 1) {
      const char = css[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = "";
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === "(") parens += 1;
      if (char === ")") parens = Math.max(0, parens - 1);
      if (parens === 0 && (char === "{" || char === ";")) {
        boundary = index;
        break;
      }
    }
    if (boundary < 0) break;
    const prelude = css.slice(cursor, boundary).trim();
    if (css[boundary] === ";") {
      rules.push({ prelude, body: null });
      cursor = boundary + 1;
      continue;
    }
    const block = readCssBlock(css, boundary + 1);
    rules.push({ prelude, body: block.body });
    cursor = block.end;
  }
  return rules;
}

const ignoredSelectorTokens = new Set([
  "active", "dark", "disabled", "done", "error", "expanded", "full", "hidden",
  "hover", "is-dragging", "loading", "open", "optimized", "pressed", "reduced",
  "selected", "success", "visible"
]);

function selectorMatches(selector, tokens) {
  const selectors = selector.split(",");
  return selectors.some((part) => {
    const required = [...part.matchAll(/[.#]([_a-zA-Z][\w-]*)/g)]
      .map((match) => match[1])
      .filter((token) => !ignoredSelectorTokens.has(token));
    return required.length === 0 || required.every((token) => tokens.has(token));
  });
}

function filterCssRules(rules, tokens, keyframes) {
  const output = [];
  for (const rule of rules) {
    const lower = rule.prelude.toLowerCase();
    if (rule.body === null) {
      output.push(`${rule.prelude};`);
      continue;
    }
    if (lower.startsWith("@keyframes") || lower.startsWith("@-webkit-keyframes")) {
      const name = rule.prelude.split(/\s+/).at(-1);
      keyframes.set(name, `${rule.prelude}{${rule.body}}`);
      continue;
    }
    if (
      lower.startsWith("@media") ||
      lower.startsWith("@supports") ||
      lower.startsWith("@container") ||
      lower.startsWith("@layer")
    ) {
      const nested = filterCssRules(parseCssRules(rule.body), tokens, keyframes);
      if (nested.trim()) output.push(`${rule.prelude}{${nested}}`);
      continue;
    }
    if (lower.startsWith("@")) {
      output.push(`${rule.prelude}{${rule.body}}`);
      continue;
    }
    if (selectorMatches(rule.prelude, tokens)) {
      output.push(`${rule.prelude}{${rule.body}}`);
    }
  }
  return output.join("\n");
}

function routeCss(markup, script) {
  const tokens = classAndIdTokens(`${markup}\n${script}`);
  const keyframes = new Map();
  let filtered = filterCssRules(parseCssRules(styleBlocks), tokens, keyframes);
  for (const [name, rule] of keyframes) {
    if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`).test(filtered)) {
      filtered += `\n${rule}`;
    }
  }
  const absoluteAssets = filtered.replaceAll('url("assets/', 'url("/assets/');
  return `/* Generato dalla demo canonica. Non modificare manualmente. */\n${absoluteAssets}\n`;
}

function inlineHandlerNames(markup) {
  const names = new Set();
  for (const attribute of markup.matchAll(/\son(?:click|change|input|submit|keydown|keyup|pointerdown)=["']([^"']+)["']/g)) {
    for (const call of attribute[1].matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!["if", "preventDefault"].includes(call[1])) names.add(call[1]);
    }
  }
  return [...names].sort();
}

function exposeInlineHandlers(script, markup) {
  // Alcuni pulsanti (stanze, materiali e risultati del Catalogo) vengono creati
  // dentro template JavaScript. Analizziamo quindi sia il markup iniziale sia
  // il controller generato, altrimenti i relativi handler restano confinati
  // nello scope del modulo e il browser non può invocarli dall'attributo onclick.
  const exposure = inlineHandlerNames(`${markup}\n${script}`)
    .map((name) => `if (typeof ${name} === "function") window.${name} = ${name};`)
    .join("\n");
  return `${script}\n\n/* API usata dagli attributi interattivi della demo canonica. */\n${exposure}\n`;
}

const outputs = {
  portal: {
    path: "index.html",
    title: "Aula Studio Virtuale — Presentazione",
    route: "presentation",
    markup: portalMarkup,
    script: portalScript
  },
  dashboard: {
    path: "dashboard/index.html",
    title: "Aula Studio Virtuale — Le tue stanze",
    route: "dashboard",
    markup: dashboardMarkup,
    script: dashboardScript
  },
  catalog: {
    path: "catalog/index.html",
    title: "Aula Studio Virtuale — Catalogo intelligente",
    route: "catalog",
    markup: catalogMarkup,
    script: catalogScript
  },
  aula: {
    path: "room/index.html",
    title: "Aula Studio Virtuale — Programmazione in Python",
    route: "aula",
    markup: aulaMarkup,
    script: aulaScript
  }
};

function htmlDocument({ title, route, markup }) {
  const protectedRoute = ["dashboard", "catalog", "aula"].includes(route);
  const authHead = protectedRoute
    ? '  <link rel="stylesheet" href="/assets/css/auth.css" />\n  <script>document.documentElement.dataset.authState="checking";</script>'
    : "";
  const authScripts = protectedRoute
    ? '  <script src="/assets/vendor/supabase.js"></script>\n  <script type="module" src="/assets/js/auth/session.js"></script>'
    : "";
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="aula-demo-version" content="1.4.0-alpha.5" />
  <meta name="aula-build" content="modular-routes-1" />
  <title>${title}</title>
  <link rel="stylesheet" href="/assets/css/${route}.css" />
${authHead}
</head>
<body data-portal-route="${route}"${protectedRoute ? ' data-auth-required="true"' : ""}>
${markup}
  ${route === "aula" ? "" : '<div class="portal-toast" id="portalToast" aria-live="polite"></div>'}
${authScripts}
  <script type="module" src="/assets/js/${route}.js"></script>
</body>
</html>
`;
}

for (const output of Object.values(outputs)) {
  const htmlPath = join(root, output.path);
  const cssPath = join(root, "assets", "css", `${output.route}.css`);
  const jsPath = join(root, "assets", "js", `${output.route}.js`);
  await mkdir(dirname(htmlPath), { recursive: true });
  await mkdir(dirname(cssPath), { recursive: true });
  await mkdir(dirname(jsPath), { recursive: true });
  await writeFile(htmlPath, htmlDocument(output), "utf8");
  await writeFile(cssPath, routeCss(output.markup, output.script), "utf8");
  await writeFile(jsPath, exposeInlineHandlers(output.script, output.markup), "utf8");
}

const releaseOwner = "giudiceluca98-cell";
const releaseRepository = "aula-studio-virtuale-releases";
const releasePage = `https://github.com/${releaseOwner}/${releaseRepository}/releases/latest`;
const releaseApi = `https://api.github.com/repos/${releaseOwner}/${releaseRepository}/releases/latest`;
const downloadHtml = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="aula-demo-version" content="${appVersion}" />
  <title>Installa Aula Studio Virtuale</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #040912;
      --surface: rgba(9, 20, 34, .92);
      --line: rgba(111, 224, 255, .24);
      --ink: #effcff;
      --muted: #a8c2cc;
      --cyan: #63ddff;
      --green: #6af0c2;
    }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at 18% 12%, rgba(52, 197, 255, .13), transparent 32%),
        radial-gradient(circle at 86% 76%, rgba(130, 91, 255, .10), transparent 36%),
        var(--bg);
      font: 16px/1.55 Inter, ui-sans-serif, system-ui, sans-serif;
    }
    a { color: inherit; }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      width: min(1100px, calc(100% - 32px));
      margin: 0 auto;
      padding: 22px 0;
    }
    .brand { font-weight: 900; letter-spacing: -.03em; text-decoration: none; }
    .back { color: var(--muted); text-decoration: none; }
    main {
      display: grid;
      place-items: center;
      min-height: calc(100vh - 90px);
      padding: 32px 16px 70px;
    }
    .card {
      width: min(720px, 100%);
      padding: clamp(26px, 6vw, 54px);
      border: 1px solid var(--line);
      border-radius: 28px;
      background: var(--surface);
      box-shadow: 0 30px 100px rgba(0, 0, 0, .42);
      backdrop-filter: blur(20px);
    }
    .eyebrow {
      color: var(--cyan);
      font-size: 12px;
      font-weight: 850;
      letter-spacing: .13em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 620px;
      margin: 12px 0 14px;
      font-size: clamp(34px, 7vw, 62px);
      line-height: 1.02;
      letter-spacing: -.055em;
    }
    .lead { max-width: 600px; margin: 0; color: var(--muted); font-size: 18px; }
    .requirements {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin: 28px 0;
    }
    .requirement {
      padding: 13px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      background: rgba(255,255,255,.025);
    }
    .requirement strong { display: block; color: var(--ink); font-size: 13px; }
    .requirement span { color: var(--muted); font-size: 12px; }
    .status {
      min-height: 52px;
      margin: 0 0 18px;
      padding: 14px 16px;
      border: 1px solid rgba(99, 221, 255, .18);
      border-radius: 14px;
      color: var(--muted);
      background: rgba(45, 174, 212, .06);
    }
    .status[data-state="ready"] { color: #baffea; border-color: rgba(106, 240, 194, .30); }
    .status[data-state="error"] { color: #ffd7b5; border-color: rgba(255, 174, 105, .28); }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .button {
      min-height: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 18px;
      border: 1px solid var(--line);
      border-radius: 14px;
      color: var(--ink);
      background: rgba(255,255,255,.035);
      font-weight: 800;
      text-decoration: none;
    }
    .button.primary {
      color: #03151a;
      border-color: var(--green);
      background: linear-gradient(135deg, var(--green), var(--cyan));
    }
    .button[aria-disabled="true"] { opacity: .52; pointer-events: none; }
    .notes { margin: 24px 0 0; color: var(--muted); font-size: 13px; }
    @media (max-width: 620px) {
      .requirements { grid-template-columns: 1fr; }
      .actions { flex-direction: column; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/">Aula Studio Virtuale</a>
    <a class="back" href="/">← Torna al sito</a>
  </header>
  <main>
    <section class="card">
      <div class="eyebrow">Applicazione per Windows</div>
      <h1>Porta la tua aula sul computer.</h1>
      <p class="lead">
        Installa la stessa Aula Studio Virtuale del sito. Le versioni successive
        sostituiranno quella precedente senza accumulare copie dell'app.
      </p>
      <div class="requirements" aria-label="Informazioni installer">
        <div class="requirement"><strong>Sistema</strong><span>Windows 10 o 11</span></div>
        <div class="requirement"><strong>Versione web</strong><span>${appVersion}</span></div>
        <div class="requirement"><strong>Aggiornamenti</strong><span>Confermati dentro l'app</span></div>
      </div>
      <p class="status" id="releaseStatus" data-state="loading" aria-live="polite">
        Controllo dell'installer più recente…
      </p>
      <div class="actions">
        <a class="button primary" id="installerDownload" href="#" aria-disabled="true">
          Scarica installer Windows
        </a>
        <a class="button" href="${releasePage}" target="_blank" rel="noopener">
          Vedi tutte le versioni
        </a>
      </div>
      <p class="notes">
        Il file viene scaricato dalle release pubbliche ufficiali di GitHub.
        Nessuna password o chiave privata viene inserita nel browser.
      </p>
    </section>
  </main>
  <script>
    (() => {
      const status = document.getElementById("releaseStatus");
      const download = document.getElementById("installerDownload");
      fetch(${JSON.stringify(releaseApi)}, {
        headers: { Accept: "application/vnd.github+json" }
      })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json();
        })
        .then((release) => {
          const assets = Array.isArray(release.assets) ? release.assets : [];
          const installer = assets.find((asset) =>
            /(?:setup|installer).*\\.exe$/i.test(String(asset.name || ""))
          ) || assets.find((asset) => /\\.exe$/i.test(String(asset.name || "")));
          if (!installer?.browser_download_url) throw new Error("installer-missing");
          download.href = installer.browser_download_url;
          download.removeAttribute("aria-disabled");
          download.textContent = \`Scarica \${installer.name}\`;
          status.dataset.state = "ready";
          status.textContent = \`Versione \${release.tag_name || "più recente"} pronta per il download.\`;
        })
        .catch(() => {
          status.dataset.state = "error";
          status.textContent =
            "L'installer non è ancora stato pubblicato. Questa pagina si attiverà automaticamente alla prima release desktop.";
        });
    })();
  </script>
</body>
</html>
`;

const downloadPath = join(root, "download", "index.html");
await mkdir(dirname(downloadPath), { recursive: true });
await writeFile(downloadPath, downloadHtml, "utf8");

console.log("Build modulare completata:");
for (const output of Object.values(outputs)) {
  console.log(`- ${output.route}: ${output.path}`);
}
console.log("- download: download/index.html");
