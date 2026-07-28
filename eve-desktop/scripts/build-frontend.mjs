import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = resolve(join(dirname(fileURLToPath(import.meta.url)), ".."));
const repositoryRoot = resolve(join(desktopRoot, ".."));
const canonicalSource = resolve(
  join(repositoryRoot, "reference", "eve-ai-studio-preview")
);
const frontendDist = resolve(join(desktopRoot, "frontend-dist"));

if (!frontendDist.startsWith(`${desktopRoot}\\`) && !frontendDist.startsWith(`${desktopRoot}/`)) {
  throw new Error("La build desktop deve restare dentro eve-desktop.");
}

await rm(frontendDist, { recursive: true, force: true });
await mkdir(frontendDist, { recursive: true });
await cp(canonicalSource, frontendDist, {
  recursive: true,
  filter: (source) => {
    const canonicalRelative = relative(canonicalSource, source).replaceAll("\\", "/");
    if (!canonicalRelative) return true;
    return ![
      "vendor",
      "EVE_AI_STUDIO_STANDALONE.html",
      "build_standalone.py",
      "install_hq_animation_runtime.py"
    ].some(
      (excluded) =>
        canonicalRelative === excluded || canonicalRelative.startsWith(`${excluded}/`)
    );
  }
});

const packageJson = JSON.parse(
  await readFile(join(desktopRoot, "package.json"), "utf8")
);
const htmlPath = join(frontendDist, "index.html");
let html = await readFile(htmlPath, "utf8");
const moduleAnchor = '  await loadPreviewScript("simple-studio-navigation.js");';

if (!html.includes(moduleAnchor)) {
  throw new Error("Il punto di collegamento desktop non è presente nell'ingresso canonico.");
}

html = html.replace(
  "<title>",
  `<meta name="eve-desktop-version" content="${packageJson.version}">\n<title>`
);
html = html.replace(
  "</head>",
  '<link rel="stylesheet" href="desktop/eve-desktop.css">\n</head>'
);
html = html.replace(
  moduleAnchor,
  `${moduleAnchor}
  await loadPreviewScript("desktop/eve-desktop-window.js");
  await loadPreviewScript("desktop/eve-desktop-updater.js");`
);

await writeFile(htmlPath, html, "utf8");
await mkdir(join(frontendDist, "desktop"), { recursive: true });
for (const file of [
  "eve-desktop.css",
  "eve-desktop-window.js",
  "eve-desktop-updater.js"
]) {
  await cp(join(desktopRoot, "runtime", file), join(frontendDist, "desktop", file));
}

await writeFile(
  join(frontendDist, "desktop-build.json"),
  `${JSON.stringify(
    {
      product: "Eve AI Studio",
      version: packageJson.version,
      source: "reference/eve-ai-studio-preview/",
      entrypoint: "reference/eve-ai-studio-preview/index.html",
      generatedAt: new Date().toISOString()
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Build frontend generata dalla sorgente canonica in ${frontendDist}`);

