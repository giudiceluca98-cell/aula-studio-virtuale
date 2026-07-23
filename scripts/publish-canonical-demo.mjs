import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(
  root,
  "reference",
  "demo-aula-studio-virtuale-canonica.html",
);
const destination = path.join(root, "public", "aula-studio-virtuale.html");

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);

const [sourceBytes, destinationBytes] = await Promise.all([
  readFile(source),
  readFile(destination),
]);

if (!sourceBytes.equals(destinationBytes)) {
  throw new Error("La copia pubblica non coincide con la demo canonica.");
}

const sha256 = createHash("sha256").update(destinationBytes).digest("hex");
console.log(`Demo canonica pubblicata senza trasformazioni: ${sha256}`);
