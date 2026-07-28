import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = join(desktopRoot, "..");
const dist = join(desktopRoot, "frontend-dist");

await import("./build-frontend.mjs");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "model-rules-workflow.js",
  "model-test-workflow.js",
  "eve-release-workflow.js",
  "desktop/eve-desktop.css",
  "desktop/eve-desktop-window.js",
  "desktop/eve-desktop-updater.js",
  "desktop-build.json"
];

for (const relativePath of requiredFiles) {
  await access(join(dist, relativePath));
}

for (const forbidden of [
  "EVE_AI_STUDIO_STANDALONE.html",
  "build_standalone.py",
  "vendor"
]) {
  try {
    await access(join(dist, forbidden));
    throw new Error(`La build contiene il file o percorso vietato ${forbidden}.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const html = await readFile(join(dist, "index.html"), "utf8");
for (const expected of [
  'meta name="eve-desktop-version"',
  'loadPreviewScript("desktop/eve-desktop-window.js")',
  'loadPreviewScript("desktop/eve-desktop-updater.js")',
  'href="desktop/eve-desktop.css"'
]) {
  if (!html.includes(expected)) {
    throw new Error(`L'ingresso desktop non contiene ${expected}.`);
  }
}

const canonicalHtml = await readFile(
  join(repositoryRoot, "reference", "eve-ai-studio-preview", "index.html"),
  "utf8"
);
if (
  canonicalHtml.includes("eve-desktop-updater.js") ||
  canonicalHtml.includes("eve-desktop-window.js")
) {
  throw new Error("La build ha modificato l'ingresso canonico.");
}

const packageJson = JSON.parse(
  await readFile(join(desktopRoot, "package.json"), "utf8")
);
const desktopBuild = JSON.parse(
  await readFile(join(dist, "desktop-build.json"), "utf8")
);
if (desktopBuild.version !== packageJson.version) {
  throw new Error("La versione della build non coincide con package.json.");
}
if (
  desktopBuild.source !== "reference/eve-ai-studio-preview/" ||
  desktopBuild.entrypoint !== "reference/eve-ai-studio-preview/index.html"
) {
  throw new Error("La provenienza canonica della build non è registrata correttamente.");
}

const tauriConfig = JSON.parse(
  await readFile(join(desktopRoot, "src-tauri", "tauri.conf.json"), "utf8")
);
if (tauriConfig.build?.frontendDist !== "../frontend-dist") {
  throw new Error("Tauri non usa la build generata dalla sorgente canonica.");
}
const mainWindow = tauriConfig.app?.windows?.find(
  (window) => window.label === "main"
);
if (!mainWindow?.resizable || !mainWindow?.center || mainWindow.theme !== "Dark") {
  throw new Error("La finestra Eve deve essere centrata, ridimensionabile e scura.");
}

const rustMain = await readFile(
  join(desktopRoot, "src-tauri", "src", "main.rs"),
  "utf8"
);
if (!rustMain.includes('windows_subsystem = "windows"')) {
  throw new Error("La build Windows aprirebbe una console separata.");
}

const runtimeAssets = await readdir(
  join(dist, "eve-animation-runtime-v1.2.2", "assets"),
  { recursive: true }
);
if (runtimeAssets.filter((item) => item.endsWith(".webp")).length !== 64) {
  throw new Error("La build non contiene tutti i 64 asset Eve verificati.");
}

console.log(`Build desktop verificata: ${desktopBuild.version}`);

