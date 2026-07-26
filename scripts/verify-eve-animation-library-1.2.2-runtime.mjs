#!/usr/bin/env node

import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2] || "reference/demo-aula-studio-virtuale-canonica.html";
const html = fs.readFileSync(file, "utf8");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const count = (pattern) => [...html.matchAll(pattern)].length;

check(count(/EVE_ANIMATION_LIBRARY_1_2_2_STYLE_START/g) === 1, "marker stile Eve assente o duplicato");
check(count(/EVE_ANIMATION_LIBRARY_1_2_2_RUNTIME_START/g) === 1, "marker runtime Eve assente o duplicato");
check(count(/<style(?:\s|>)/gi) === count(/<\/style>/gi), "tag style non bilanciati");
check(count(/<script(?:\s|>)/gi) === count(/<\/script>/gi), "tag script non bilanciati");
check(count(/"dataUri":"data:image\/webp;base64,/g) === 64, "il registro non incorpora esattamente 64 WebP");
check(count(/const STATIC_AVATAR = "data:image\/webp;base64,/g) === 1, "fallback statico ufficiale assente o duplicato");
check(html.includes('const VERSION = "1.2.2"'), "versione runtime errata");
check(html.includes("totalAssets: ASSETS.length"), "totalAssets runtime assente");
check(!/\beval\s*\(/.test(html), "eval non consentito");
check(!/\bnew\s+Function\b/.test(html), "Function non consentito");
check(!/DecompressionStream/.test(html), "DecompressionStream non consentito");
check(!/<(?:script|img|link|source)[^>]+(?:src|href)=["']https?:\/\//i.test(html), "dipendenza remota trovata");
check(!/url\(\s*["']?https?:\/\//i.test(html), "risorsa CSS remota trovata");

const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
scripts.forEach((source, index) => {
  try {
    new vm.Script(source, { filename: `${file}#script-${index + 1}` });
  } catch (error) {
    failures.push(`JavaScript non valido nello script ${index + 1}: ${error.message}`);
  }
});

if (failures.length) {
  console.error(JSON.stringify({ ok: false, file, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  file,
  scripts: scripts.length,
  styles: count(/<style(?:\s|>)/gi),
  embeddedWebp: count(/"dataUri":"data:image\/webp;base64,/g),
  bytes: Buffer.byteLength(html),
  lines: html.split(/\r?\n/).length
}, null, 2));
