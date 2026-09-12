import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// dnd5e 6.0 expresses turn-edge expiry natively on `duration.expiry`, and enrichers declare it
// with the `options: { expiry }` hint. `daeSpecialDurations` is now reserved for the tokens only
// DAE can express - usage counts and trigger conditions (1Attack, isSave, isDamaged, 1Spell,
// isSkill.*, ...). Since the DAE_TO_NATIVE_EXPIRY retirement nothing translates a mappable token
// in a hint at all - applyDaeSpecialDurations only writes flags - so a natively mappable token
// here would produce NO native expiry: the effect would simply never expire without DAE.
// The description-duration parser still produces these tokens from prose, which
// is why the translator itself stays - this pin only covers hand-written enricher hints.

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const enricherRoot = path.resolve(dirname, "../../../../src/parser/enrichers");

const NATIVE_TOKENS = [
  "turnStart", "turnEnd", "turnStartSource", "turnEndSource", "combatEnd",
  "sourceStart", "sourceEnd", "targetStart", "targetEnd",
];

/** Every `daeSpecialDurations: [ ... ]` literal in the enricher tree, including multi-line ones. */
const DECLARATION = /daeSpecialDurations:\s*\[[^\]]*\]/gs;

function collectFiles(dir: string, extensions: string[] = [".ts"]): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectFiles(full, extensions));
    else if (extensions.some((ext) => entry.name.endsWith(ext))) found.push(full);
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
const COUNTED_DURATION = /durationSeconds: \d/;

// Generated effects carry elapsed seconds or a native expiry, never dnd5e's combat units:
// rounds and turns count round changes and initiative slots rather than the creature's own
// turn, so they misexpire depending on when in the round the effect landed
// (foundryvtt/dnd5e#7434). The option keys were removed from IDDBEffectOptions; a raw
// `data.duration` block could still smuggle the units in, so both spellings are scanned.
const COMBAT_UNIT_OPTION = /duration(?:Rounds|Turns)\s*:/;
const COMBAT_UNIT_LITERAL = /units:\s*["'`](?:rounds|turns)["'`]/;

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

  it("requests no rounds or turns duration on any effect hint", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const line of source.split("\n")) {
        if (COMBAT_UNIT_OPTION.test(line) || COMBAT_UNIT_LITERAL.test(line)) {
          offenders.push(`${path.relative(enricherRoot, file)}: ${line.trim()}`);
        }
      }
    }
    expect(
      offenders,
      "use durationSeconds for elapsed time, options: { expiry } for a turn edge (turnEnd = the current turn,"
      + " sourceStart/sourceEnd/targetStart/targetEnd = the next one)",
    ).toEqual([]);
  });

  it("writes no rounds or turns units from the legacy effect builders or the macros either", () => {
    // src/effects and macros/ emit effects without going through the enricher hints
    const roots = [path.resolve(dirname, "../../../../src/effects"), path.resolve(dirname, "../../../../macros")];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of collectFiles(root, [".ts", ".js"])) {
        for (const line of fs.readFileSync(file, "utf8").split("\n")) {
          if (COMBAT_UNIT_LITERAL.test(line)) offenders.push(`${path.relative(root, file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders, "effects carry seconds (value null for a native expiry), never rounds or turns").toEqual([]);
  });
});
