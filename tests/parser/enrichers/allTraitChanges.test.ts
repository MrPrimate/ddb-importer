/**
 * Guards the "all damage types" and "all languages" effect changes.
 *
 * dnd5e 6 reads "ALL" in `system.traits.dr/di/dv.value` and `system.traits.languages.value` itself
 * (TraitsFields.prepareResistImmune, prepareLanguages), so the change must be an `add` of "ALL".
 * A custom-type change of "ALL" is never applied: dnd5e ignores custom changes and the importer's
 * applyActiveEffect stub only handles the legacy `.all` keys, which remain for effects imported
 * by earlier versions and are not for new ones. This walks the source rather than building every
 * enricher.
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["src/parser", "src/effects"].map((root) => path.resolve(process.cwd(), root));

function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

function offenders(pattern: RegExp): string[] {
  return ROOTS.flatMap(sourceFiles)
    .filter((file) => pattern.test(fs.readFileSync(file, "utf-8")))
    .map((file) => path.relative(process.cwd(), file));
}

describe("all damage type and language changes", () => {
  it("add \"ALL\" rather than writing it with a custom change", () => {
    expect(offenders(/customChange\(\s*["']ALL["']\s*,\s*\d+\s*,\s*["']system\.traits\.(?:di|dr|dv|languages)\.value["']/)).toEqual([]);
  });

  it("do not emit the legacy .all keys", () => {
    expect(offenders(/["']system\.traits\.(?:di|dr|dv|languages)\.all["']/)).toEqual([]);
  });
});
