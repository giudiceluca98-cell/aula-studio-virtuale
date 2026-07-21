import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const worker = readFileSync(join(root, "public/python-runner.worker.mjs"), "utf8");
const hook = readFileSync(join(root, "src/hooks/use-python-runner.ts"), "utf8");
const config = readFileSync(join(root, "next.config.ts"), "utf8");

describe("sicurezza del runner Python didattico", () => {
  it("usa una versione Pyodide fissata e non scarica pacchetti richiesti dal codice", () => {
    expect(worker).toContain("pyodide/v314.0.2/full/pyodide.mjs");
    expect(worker).not.toContain("loadPackagesFromImports");
    expect(worker).not.toContain("micropip");
  });

  it("consente soltanto il sottoinsieme didattico e built-in espliciti", () => {
    const allowedNodes = worker.match(/allowed_nodes = \([\s\S]*?\n\)/)?.[0] ?? "";
    expect(allowedNodes).toContain("ast.If");
    expect(allowedNodes).not.toMatch(/\bast\.Import\b/);
    expect(allowedNodes).not.toMatch(/\bast\.While\b/);
    expect(allowedNodes).not.toMatch(/\bast\.For\b/);
    expect(worker).toContain("allowed_calls");
    expect(worker).toContain("safe_builtins");
  });

  it("esegue in un worker locale con timeout e CSP limitata", () => {
    expect(hook).toContain('new Worker("/python-runner.worker.mjs"');
    expect(hook).toContain("}, 6000)");
    expect(config).toContain('"worker-src \'self\'"');
    expect(config).toContain("'wasm-unsafe-eval'");
    expect(config).toContain("https://cdn.jsdelivr.net");
  });
});
