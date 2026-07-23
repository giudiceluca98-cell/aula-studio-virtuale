import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const canonicalPath = path.join(
  root,
  "reference",
  "demo-aula-studio-virtuale-canonica.html",
);
const publicPath = path.join(root, "public", "aula-studio-virtuale.html");

function sha256(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

describe("sostituzione con la demo canonica", () => {
  it("pubblica esattamente gli stessi byte della fonte canonica", async () => {
    const [canonical, published] = await Promise.all([
      readFile(canonicalPath),
      readFile(publicPath),
    ]);

    expect(sha256(published)).toBe(sha256(canonical));
    expect(published.equals(canonical)).toBe(true);
  });

  it("mantiene le quattro superfici canoniche nello stesso documento", async () => {
    const published = await readFile(publicPath, "utf8");

    expect(published).toContain('id="portalPresentation"');
    expect(published).toContain('id="portalDashboard"');
    expect(published).toContain('id="portalCatalog"');
    expect(published).toContain('id="portalAula"');
    expect(published).toContain("function navigatePortal(route");
  });
});
