import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicKey = String(process.env.TAURI_UPDATER_PUBLIC_KEY || "").trim();
const endpoint = String(process.env.TAURI_UPDATER_ENDPOINT || "").trim();

if (!publicKey) {
  throw new Error("Manca TAURI_UPDATER_PUBLIC_KEY.");
}

if (!endpoint.startsWith("https://")) {
  throw new Error("TAURI_UPDATER_ENDPOINT deve essere un URL pubblico HTTPS.");
}

const outputPath = join(root, "src-tauri", "tauri.release.conf.json");
const releaseConfig = {
  bundle: {
    createUpdaterArtifacts: true
  },
  plugins: {
    updater: {
      pubkey: publicKey,
      endpoints: [endpoint],
      windows: {
        installMode: "passive"
      }
    }
  }
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(releaseConfig, null, 2)}\n`, "utf8");
console.log(`Configurazione release generata: ${outputPath}`);
