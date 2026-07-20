import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const [file] = process.argv.slice(2);
const secret = process.env.WEBHOOK_SECRET;

if (!file || !secret) {
  console.error("Uso: WEBHOOK_SECRET=<secret> node scripts/sign-webhook.mjs <payload.json>");
  process.exit(1);
}
if (Buffer.byteLength(secret, "utf8") < 32) {
  console.error("WEBHOOK_SECRET deve contenere almeno 32 byte.");
  process.exit(1);
}

const rawBody = await readFile(file);
const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
process.stdout.write(`sha256=${digest}`);
