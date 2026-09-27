import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// The release build is webpack, the dev build esbuild. esbuild inlines every dynamic import(),
// but webpack splits one without `webpackMode: "eager"` into its own chunk, which cannot load
// from the module's ES module script. The miss only shows in a release build, so every runtime
// dynamic import of a module path must carry the hint.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const srcRoot = path.resolve(dirname, "../../src");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return (/\.(ts|mjs|js)$/).test(entry.name) && !entry.name.endsWith(".d.ts") ? [full] : [];
  });
}

// `await import("x")` and `import("x").then(...)`; type positions such as `import("x").Type` are not matched
const RUNTIME_IMPORT = /\bawait\s+import\(\s*["'`]|\bimport\(\s*["'`][^"'`]+["'`]\s*\)\s*\.then\b/;

describe("dynamic imports", () => {
  it("carry the webpackMode eager hint", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(srcRoot)) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, index) => {
        if (RUNTIME_IMPORT.test(line)) offenders.push(`${path.relative(srcRoot, file)}:${index + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
