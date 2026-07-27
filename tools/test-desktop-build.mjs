import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "desktop-dist");

const requiredFiles = [
  "index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "room/index.html",
  "assets/css/presentation.css",
  "assets/css/dashboard.css",
  "assets/css/catalog.css",
  "assets/css/aula.css",
  "assets/js/presentation.js",
  "assets/js/dashboard.js",
  "assets/js/catalog.js",
  "assets/js/aula.js",
  "assets/js/desktop-window.js",
  "assets/js/desktop-updater.js",
  "desktop-build.json"
];

for (const relativePath of requiredFiles) {
  await access(join(dist, relativePath));
}
await access(join(root, "download", "index.html"));

const desktopPages = [
  "index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "room/index.html"
];

for (const relativePath of desktopPages) {
  const html = await readFile(join(dist, relativePath), "utf8");
  if (!html.includes('/assets/js/desktop-updater.js')) {
    throw new Error(`Updater non collegato in ${relativePath}.`);
  }
  if (!html.includes('/assets/js/desktop-window.js')) {
    throw new Error(`Controlli finestra non collegati in ${relativePath}.`);
  }
}

const webPortal = await readFile(join(root, "index.html"), "utf8");
if (webPortal.includes("desktop-updater.js")) {
  throw new Error("La build web non deve caricare il controller desktop.");
}
if (!webPortal.includes('href="/download"')) {
  throw new Error("Il portale web non contiene il collegamento all'installer.");
}

for (const relativePath of desktopPages) {
  const html = await readFile(join(dist, relativePath), "utf8");
  if (html.includes("data-web-install")) {
    throw new Error(`La build già installata non deve riproporre l'installazione in ${relativePath}.`);
  }
}

for (const route of ["presentation", "dashboard", "catalog", "aula"]) {
  const script = await readFile(join(dist, "assets", "js", `${route}.js`), "utf8");
  if (script.includes("data-web-install")) {
    throw new Error(`Il controller desktop ${route}.js contiene ancora il pulsante web.`);
  }
}

for (const route of ["presentation", "dashboard", "catalog", "aula"]) {
  const script = await readFile(join(dist, "assets", "js", `${route}.js`), "utf8");
  for (const expected of [
    'presentation: "/index.html"',
    'dashboard: "/dashboard/index.html"',
    'catalog: "/catalog/index.html"',
    'aula: "/room/index.html"'
  ]) {
    if (!script.includes(expected)) {
      throw new Error(`${route}.js non contiene la destinazione ${expected}.`);
    }
  }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const desktopBuild = JSON.parse(await readFile(join(dist, "desktop-build.json"), "utf8"));
if (desktopBuild.version !== packageJson.version) {
  throw new Error("La versione della build desktop non coincide con package.json.");
}

const tauriConfig = JSON.parse(
  await readFile(join(root, "src-tauri", "tauri.conf.json"), "utf8")
);
const mainWindow = tauriConfig.app?.windows?.find((window) => window.label === "main");
if (!mainWindow?.resizable || !mainWindow?.center) {
  throw new Error("La finestra principale deve essere ridimensionabile e centrata.");
}
if (mainWindow.minWidth > 760 || mainWindow.minHeight > 520) {
  throw new Error("La finestra minima non attiva correttamente il layout responsive.");
}

const rustMain = await readFile(join(root, "src-tauri", "src", "main.rs"), "utf8");
if (!rustMain.includes('windows_subsystem = "windows"')) {
  throw new Error("La build Windows aprirebbe anche la console nera.");
}

console.log(`Build desktop verificata: ${desktopBuild.version}`);
