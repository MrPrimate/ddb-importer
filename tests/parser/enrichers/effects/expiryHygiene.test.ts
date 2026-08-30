import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// dnd5e 6.0 expresses turn-edge expiry natively on `duration.expiry`, and enrichers declare it
// with the `options: { expiry }` hint. `daeSpecialDurations` is now reserved for the tokens only
// DAE can express - usage counts and trigger conditions (1Attack, isSave, isDamaged, 1Spell,
// isSkill.*, ...). A natively mappable token in a hint would be laundered through
// EffectGenerator.DAE_TO_NATIVE_EXPIRY, which reintroduces the two problems the migration removed:
// the source-anchored tokens leak into flags.dae.specialDuration, and the intent is stated in the
// wrong vocabulary. The description-duration parser still produces these tokens from prose, which
// is why the translator itself stays - this pin only covers hand-written enricher hints.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const enricherRoot = path.resolve(dirname, "../../../../src/parser/enrichers");

const NATIVE_TOKENS = [
  "turnStart", "turnEnd", "turnStartSource", "turnEndSource", "combatEnd",
  "sourceStart", "sourceEnd", "targetStart", "targetEnd",
];

/** Every `daeSpecialDurations: [ ... ]` literal in the enricher tree, including multi-line ones. */
const DECLARATION = /daeSpecialDurations:\s*\[[^\]]*\]/gs;

function collectFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(full));
    else if (entry.name.endsWith(".ts")) found.push(full);
  }
  return found;
}

// the mixin consumes the hint and data/types.d.ts declares it; neither is an enricher
const files = collectFiles(enricherRoot).filter((file) =>
  !file.includes(`${path.sep}mixins${path.sep}`) && !file.includes(`${path.sep}data${path.sep}`),
);

// A pseudo expiry (source*/target*) cannot carry a counted duration: dnd5e nulls duration.value
// in preCreate, and EffectGenerator.applyNativeExpiry matches that at build time. The
// durationSeconds/durationRounds/durationTurns that used to sit beside these hints existed to
// make DAE and midi-QOL hold the effect long enough for their own expiry pass, and are now dead
// weight that misrepresents the effect's real lifetime in the source.
const PSEUDO_EXPIRY = /expiry: "(?:source|target)(?:Start|End)"/;
const COUNTED_DURATION = /duration(?:Seconds|Rounds|Turns): \d/;

describe("enricher effect expiry hygiene", () => {
  it("finds enricher files to scan", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(NATIVE_TOKENS)("declares no %s token in a daeSpecialDurations hint", (token) => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const declaration of fs.readFileSync(file, "utf8").match(DECLARATION) ?? []) {
        if (new RegExp(`["'\`]${token}["'\`]`).test(declaration)) {
          offenders.push(path.relative(enricherRoot, file));
        }
      }
    }
    expect(offenders, `use options: { expiry } instead of the "${token}" DAE token`).toEqual([]);
  });

  it("pairs no counted duration with a pseudo expiry", () => {
    const offenders: string[] = [];
    for (const file of files) {
      // each `options: { ... }` block, matched non-greedily so blocks stay separate
      for (const block of fs.readFileSync(file, "utf8").match(/options: \{[^{}]*\}/gs) ?? []) {
        if (PSEUDO_EXPIRY.test(block) && COUNTED_DURATION.test(block)) {
          offenders.push(`${path.relative(enricherRoot, file)}: ${block.replace(/\s+/g, " ")}`);
        }
      }
    }
    expect(offenders, "a pseudo expiry nulls duration.value - drop the counted duration").toEqual([]);
  });
});
