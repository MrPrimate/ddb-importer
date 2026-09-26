import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// The region UI (template expiry prompts, the region display editor and its canvas hooks) builds
// its keys in a few fixed ways. This reads the source statically and checks every key it names
// exists in lang/en.json, and that each key given a count carries the plural forms, so a renamed
// or missing key fails here rather than showing a raw key in the dialog.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "../..");
const lang = JSON.parse(fs.readFileSync(path.join(root, "lang/en.json"), "utf8"));

const EXPIRY = "ddb-importer.regionExpiry";
const DISPLAY = "ddb-importer.behaviors.display";

const SOURCES = [
  "src/effects/enhancers/Regions/RegionExpiryDialog.ts",
  "src/effects/enhancers/Regions/RegionExpiryCleanup.ts",
  "src/apps/DDBRegionDisplayConfig.ts",
  "src/apps/DDBRegionDisplayProfiles.ts",
  "src/apps/DDBIconPicker.ts",
  "src/hooks/canvas/regionDisplayPicker.ts",
  "src/hooks/canvas/regionConfigDisplay.ts",
  "src/hooks/canvas/regionDisplaySummary.ts",
  "src/effects/auras/RegionTargetPrompt.ts",
  "handlebars/region-display/profiles.hbs",
  "handlebars/region-display/region-config.hbs",
];

function node(key: string): unknown {
  return key.split(".").reduce<unknown>((at, part) => (at && typeof at === "object" ? (at as Record<string, unknown>)[part] : undefined), lang);
}

/** Every static key a source names, split into plain keys and keys used with a count. */
function keysIn(file: string): { plain: Set<string>; plural: Set<string> } {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const plain = new Set<string>();
  const plural = new Set<string>();
  // a template-literal prefix stands for the file's root: `${I18N}.title`
  const expand = (key: string) => key.replace(/^\$\{I18N\}/, EXPIRY);
  for (const [, key] of text.matchAll(/["'`]((?:ddb-importer\.(?:regionExpiry|behaviors\.(?:display|macro))|\$\{I18N\})\.[\w.]+)["'`]/g)) {
    plain.add(expand(key));
  }
  for (const [, key] of text.matchAll(/RegionDisplayProfiles\.(?:localize|format)\(\s*"([\w.]+)"/g)) {
    plain.add(`${DISPLAY}.${key}`);
  }
  for (const [, key] of text.matchAll(/localizePlural\(\s*["'`]([^"'`]+)["'`]/g)) {
    plain.delete(expand(key));
    // a key assembled at runtime (`${base}.found`) is covered by the explicit checks below
    if (!expand(key).includes("${")) plural.add(expand(key));
  }
  return { plain, plural };
}

describe("region UI localization keys", () => {
  it.each(SOURCES)("%s names only keys en.json carries", (file) => {
    const { plain, plural } = keysIn(file);
    const missing = [...plain].filter((key) => typeof node(key) !== "string");
    expect(missing).toEqual([]);
    const notPlural = [...plural].filter((key) => {
      const forms = node(key) as Record<string, unknown> | undefined;
      return typeof forms?.one !== "string" || typeof forms?.other !== "string";
    });
    expect(notPlural).toEqual([]);
  });

  it("finds keys in every source, so a change in how they are written cannot empty the check", () => {
    for (const file of SOURCES) {
      const { plain, plural } = keysIn(file);
      expect(plain.size + plural.size, file).toBeGreaterThan(0);
    }
  });

  it("names every expiry reason, scan result and shipped profile", () => {
    for (const scope of ["scanCurrent", "scanAll"]) {
      expect(node(`${EXPIRY}.notify.${scope}.found`)).toEqual({ one: expect.any(String), other: expect.any(String) });
      expect(typeof node(`${EXPIRY}.notify.${scope}.none`)).toBe("string");
    }
    for (const reason of ["expired", "deleted", "concentration", "combat", "scene", "duration"]) {
      expect(typeof node(`${EXPIRY}.reason.${reason}`)).toBe("string");
    }
    for (const id of ["aura", "damage", "status", "minimal"]) {
      expect(typeof node(`${DISPLAY}.builtin.${id}`)).toBe("string");
    }
  });
});
