import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requested = String(process.argv[2] || process.env.RELEASE_VERSION || "")
  .trim()
  .replace(/^v/, "");

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(requested)) {
  throw new Error(`Versione release non valida: ${requested || "(vuota)"}`);
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const tauriConfig = JSON.parse(
  await readFile(join(root, "src-tauri", "tauri.conf.json"), "utf8")
);
const cargo = await readFile(join(root, "src-tauri", "Cargo.toml"), "utf8");
const cargoVersion = cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

const versions = {
  "package.json": packageJson.version,
  "src-tauri/tauri.conf.json": tauriConfig.version,
  "src-tauri/Cargo.toml": cargoVersion
};

for (const [file, version] of Object.entries(versions)) {
  if (version !== requested) {
    throw new Error(`${file} contiene ${version}; la release richiesta è ${requested}.`);
  }
}

console.log(`Versione desktop coerente: ${requested}`);
