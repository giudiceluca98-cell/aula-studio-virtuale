import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const desktopDist = resolve(join(root, "desktop-dist"));

if (!desktopDist.startsWith(`${root}\\`) && !desktopDist.startsWith(`${root}/`)) {
  throw new Error("La destinazione desktop deve restare dentro il progetto.");
}

// La demo canonica resta l'unica fonte. Prima rigeneriamo sempre le rotte web.
await import("./build-modular.mjs");
await import("./build-agenda.mjs");
await import("./build-auth.mjs");

await rm(desktopDist, { recursive: true, force: true });
await mkdir(desktopDist, { recursive: true });

const files = [
  "index.html",
  "login/index.html",
  "register/index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "agenda/index.html",
  "room/index.html",
  "manifest.webmanifest",
  "sw.js",
  "assets/aula-cursor.svg",
  "assets/aula-pointer.svg"
];

for (const relativePath of files) {
  const destination = join(desktopDist, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(root, relativePath), destination);
}

await cp(join(root, "assets", "css"), join(desktopDist, "assets", "css"), {
  recursive: true
});
await cp(join(root, "assets", "js"), join(desktopDist, "assets", "js"), {
  recursive: true
});
await cp(join(root, "assets", "vendor"), join(desktopDist, "assets", "vendor"), {
  recursive: true
});

const routeReplacements = [
  ['presentation: "/"', 'presentation: "/index.html"'],
  ['login: "/login"', 'login: "/login/index.html"'],
  ['register: "/register"', 'register: "/register/index.html"'],
  ['dashboard: "/dashboard"', 'dashboard: "/dashboard/index.html"'],
  ['catalog: "/catalog"', 'catalog: "/catalog/index.html"'],
  ['agenda: "/agenda"', 'agenda: "/agenda/index.html"'],
  ['aula: "/room/"', 'aula: "/room/index.html"'],
  ['window.location.assign("/catalog?from=aula")', 'window.location.assign("/catalog/index.html?from=aula")']
];

for (const route of ["presentation", "dashboard", "catalog", "aula"]) {
  const scriptPath = join(desktopDist, "assets", "js", `${route}.js`);
  let script = await readFile(scriptPath, "utf8");
  for (const [from, to] of routeReplacements) {
    script = script.replaceAll(from, to);
  }
  script = script.replace(
    /<div class="drawer-section" data-web-install>[\s\S]*?<\/div>/g,
    ""
  );
  script = script.replace(/<a\b[^>]*data-web-install[^>]*>[\s\S]*?<\/a>/g, "");
  await writeFile(scriptPath, script, "utf8");
}

const updaterSource = await readFile(join(root, "desktop", "desktop-updater.js"), "utf8");
await writeFile(
  join(desktopDist, "assets", "js", "desktop-updater.js"),
  updaterSource,
  "utf8"
);
const windowControllerSource = await readFile(
  join(root, "desktop", "desktop-window.js"),
  "utf8"
);
await writeFile(
  join(desktopDist, "assets", "js", "desktop-window.js"),
  windowControllerSource,
  "utf8"
);

// WebView2 può rifiutare la catena di moduli ES caricata dall'origine asset
// dell'app installata. L'Agenda usa quindi un unico script classico nella build
// desktop, lasciando invariati i moduli separati della versione web.
const stripModuleSyntax = (source) => source
  .replace(/^import\s+[^;]+;\s*$/gm, "")
  .replace(/^export\s+/gm, "");
const desktopAgendaBundle = [
  await readFile(join(desktopDist, "assets", "js", "auth", "session.js"), "utf8"),
  await readFile(join(desktopDist, "assets", "js", "agenda", "offline.js"), "utf8"),
  await readFile(join(desktopDist, "assets", "js", "agenda", "core.js"), "utf8"),
  await readFile(join(desktopDist, "assets", "js", "agenda", "agenda.js"), "utf8")
].map(stripModuleSyntax).join("\n\n");
await writeFile(
  join(desktopDist, "assets", "js", "agenda-desktop.js"),
  `window.addEventListener("error", (event) => {\n` +
    `  const app = document.getElementById("agendaApp");\n` +
    `  const loading = document.getElementById("loadingState");\n` +
    `  if (app && loading) { app.hidden = false; loading.hidden = false; loading.textContent = "Agenda non disponibile: " + event.message; }\n` +
    `});\n\n${desktopAgendaBundle}`,
  "utf8"
);

for (const relativePath of [
  "index.html",
  "login/index.html",
  "register/index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "agenda/index.html",
  "room/index.html"
]) {
  const htmlPath = join(desktopDist, relativePath);
  let html = await readFile(htmlPath, "utf8");
  html = html
    .replaceAll('href="/login"', 'href="/login/index.html"')
    .replaceAll('href="/register"', 'href="/register/index.html"')
    .replaceAll('href="/dashboard"', 'href="/dashboard/index.html"')
    .replaceAll('href="/catalog"', 'href="/catalog/index.html"')
    .replaceAll('href="/agenda"', 'href="/agenda/index.html"')
    .replaceAll('href="/room/"', 'href="/room/index.html"');
  html = html.replace(/<a\b[^>]*data-web-install[^>]*>[\s\S]*?<\/a>/g, "");
  if (relativePath === "agenda/index.html") {
    html = html
      .replace('  <script type="module" src="/assets/js/auth/session.js"></script>\n', "")
      .replace('  <script type="module" src="/assets/js/agenda/agenda.js"></script>\n',
        '  <script src="/assets/js/agenda-desktop.js"></script>\n');
  }
  html = html.replace(
    "</body>",
    '  <script src="/assets/js/desktop-window.js"></script>\n' +
      '  <script src="/assets/js/desktop-updater.js"></script>\n</body>'
  );
  await writeFile(htmlPath, html, "utf8");
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
await writeFile(
  join(desktopDist, "desktop-build.json"),
  `${JSON.stringify({
    product: "Aula Studio Virtuale",
    version: packageJson.version,
    source: "demo-aula-studio-virtuale-canonica.html",
    generatedAt: new Date().toISOString()
  }, null, 2)}\n`,
  "utf8"
);

console.log(`Build desktop pronta in ${desktopDist}`);
