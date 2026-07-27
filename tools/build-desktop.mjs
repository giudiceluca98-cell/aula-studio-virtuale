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

await rm(desktopDist, { recursive: true, force: true });
await mkdir(desktopDist, { recursive: true });

const files = [
  "index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "room/index.html",
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

const routeReplacements = [
  ['presentation: "/"', 'presentation: "/index.html"'],
  ['dashboard: "/dashboard"', 'dashboard: "/dashboard/index.html"'],
  ['catalog: "/catalog"', 'catalog: "/catalog/index.html"'],
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

for (const relativePath of [
  "index.html",
  "dashboard/index.html",
  "catalog/index.html",
  "room/index.html"
]) {
  const htmlPath = join(desktopDist, relativePath);
  let html = await readFile(htmlPath, "utf8");
  html = html.replace(/<a\b[^>]*data-web-install[^>]*>[\s\S]*?<\/a>/g, "");
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
