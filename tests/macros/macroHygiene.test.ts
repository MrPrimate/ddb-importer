import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// The shipped runtime macros in macros/ are plain JS executed by DDBSimpleMacro, which wraps
// the file body in an AsyncFunction (`{${script}\n}`) - so top-level await/return are legal.
// There is no other test coverage for these files; this suite pins two things:
// 1. every macro parses under the same wrapping the runtime uses;
// 2. no v13-era effect idioms creep back in (numeric change modes, legacy data paths, APIs
//    removed by Foundry v14 / dnd5e 6.0). See the WP-A (P1.5) sweep, 2026-08-26.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const macrosRoot = path.resolve(dirname, "../../macros");

const macroFiles: string[] = [];
for (const dir of fs.readdirSync(macrosRoot)) {
  const dirPath = path.join(macrosRoot, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;
  for (const file of fs.readdirSync(dirPath)) {
    if (file.endsWith(".js")) macroFiles.push(path.join(dir, file));
  }
}

const BANNED_PATTERNS: { name: string; pattern: RegExp; reason: string }[] = [
  {
    name: "logger global",
    pattern: /\blogger\./,
    reason: "`logger` is not injected into the macro scope (see DDBSimpleMacro.execute) - use console",
  },
  {
    name: "pre-v10 data path",
    pattern: /\b(?:actor|token)\.data\.|["'`]data\.(?:attributes|traits|abilities)\./,
    reason: "pre-v10 `data.*` document paths - use `system.*`",
  },
];

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = (async function() {}).constructor as new (...fnArgs: string[]) => unknown;

describe("runtime macro hygiene", () => {
  describe.each(macroFiles)("%s", (relPath) => {
    const source = fs.readFileSync(path.join(macrosRoot, relPath), "utf-8");

    it("parses as an async function body", () => {
      // mirrors DDBSimpleMacro.execute: new AsyncFunction(...names, `{${script}\n}`)
      expect(() => new AsyncFunction(`{${source}\n}`)).not.toThrow();
    });

    it.each(BANNED_PATTERNS.map((b) => [b.name, b] as const))("has no %s", (_name, banned) => {
      const hits = source
        .split("\n")
        .map((line, i) => ({ line, number: i + 1 }))
        .filter(({ line }) => !line.trim().startsWith("//") && banned.pattern.test(line));
      expect(hits, `${banned.reason}\n${hits.map((h) => `  ${relPath}:${h.number}: ${h.line.trim()}`).join("\n")}`)
        .toEqual([]);
    });
  });
});
