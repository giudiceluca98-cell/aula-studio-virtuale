import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const requested = String(process.argv[2] || "")
  .trim()
  .replace(/^eve-ai-studio-v/, "")
  .replace(/^v/, "");

const packageJson = JSON.parse(
  await readFile(join(desktopRoot, "package.json"), "utf8")
);
const tauriConfig = JSON.parse(
  await readFile(join(desktopRoot, "src-tauri", "tauri.conf.json"), "utf8")
);
const cargoToml = await readFile(
  join(desktopRoot, "src-tauri", "Cargo.toml"),
  "utf8"
);
const cargoVersion = cargoToml.match(
  /^\[package\][\s\S]*?^version\s*=\s*"([^"]+)"/m
)?.[1];

if (!requested) {
  throw new Error("Indicare la versione da verificare.");
}

for (const [source, version] of [
  ["package.json", packageJson.version],
  ["tauri.conf.json", tauriConfig.version],
  ["Cargo.toml", cargoVersion]
]) {
  if (version !== requested) {
    throw new Error(`${source} usa ${version}; versione richiesta ${requested}.`);
  }
}

console.log(`Versione desktop coerente: ${requested}`);

