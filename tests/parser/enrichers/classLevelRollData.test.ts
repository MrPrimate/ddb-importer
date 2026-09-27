import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// dnd5e exposes a class's level in roll data as `@classes.<identifier>.levels`. There is no
// `level` key, so `@classes.fighter.level` resolves to 0 at roll time without any error: a heal
// or bonus built on it silently rolls nothing.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const srcRoot = path.resolve(dirname, "../../../src");

const WRONG_KEY = /@classes\.[\w-]+\.level\b/g;

function collectFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(full));
    else if ((/\.(?:ts|mjs|js)$/).test(entry.name)) found.push(full);
  }
  return found;
}

describe("class level roll data", () => {
  it("never reads @classes.<class>.level (the key is levels)", () => {
    const offenders = collectFiles(srcRoot).flatMap((file) => {
      const matches = fs.readFileSync(file, "utf8").match(WRONG_KEY) ?? [];
      return matches.map((match) => `${path.relative(srcRoot, file)}: ${match}`);
    });
    expect(offenders).toEqual([]);
  });
});
