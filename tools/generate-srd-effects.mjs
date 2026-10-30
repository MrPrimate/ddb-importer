#!/usr/bin/env node
/**
 * Regenerate src/config/dictionary/effects/srdEffects.ts from the dnd5e repository's
 * packs/_source/effects tree.
 *
 *   node tools/generate-srd-effects.mjs /path/to/dnd5e [--base /path/to/older/dnd5e]
 *
 * With --base, an entry the older tree does not have is marked `since: "<newer version>"`, so
 * SRDEffects.optionalUuid can return nothing while an older dnd5e is running.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const baseFlag = args.indexOf("--base");
const baseRoot = baseFlag >= 0 ? args.splice(baseFlag, 2)[1] : null;
const root = args[0];
if (!root) {
  process.stderr.write("usage: node tools/generate-srd-effects.mjs <dnd5e repo path> [--base <older dnd5e repo path>]\n");
  process.exit(1);
}
const effectsDir = (repo) => path.join(repo, "packs", "_source", "effects");
const systemVersion = (repo) => JSON.parse(fs.readFileSync(path.join(repo, "system.json"), "utf-8")).version;
const SRC = effectsDir(root);
const OUT = path.resolve("src/config/dictionary/effects/srdEffects.ts");

const ABILITIES = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha", initiative: "init" };
const SKILLS = {
  "acrobatics": "acr", "animal-handling": "ani", "arcana": "arc", "athletics": "ath", "deception": "dec", "history": "his",
  "insight": "ins", "intimidation": "itm", "investigation": "inv", "medicine": "med", "nature": "nat", "perception": "prc",
  "performance": "prf", "persuasion": "per", "religion": "rel", "sleight-of-hand": "slt", "stealth": "ste", "survival": "sur",
};
const camel = (slug) => slug.replace(/-([a-z0-9])/g, (_m, c) => c.toUpperCase());
// the "every ability" entries ("advantage-on-ability-checks", "advantage-on-saving-throws") key as "all"
const ability = (slug) => (slug.includes("-on-") ? "all" : ABILITIES[slug.split("-")[0]]);
// "damage-resistance" (6.0) and "resistance-to-all-damage" (6.1) are the same effect under one id
const generic = (suffix) => (slug) => (slug === `damage-${suffix}` || slug.endsWith("-all-damage") ? "all" : slug.replace(`-${suffix}`, ""));
const skill = (suffix) => (slug) => (slug.includes("-on-") ? "all" : SKILLS[slug.replace(`-${suffix}`, "")]);
// "advantage-on-melee-spell-attacks" -> "meleeSpell", "advantage-on-attacks" -> "all"
const attack = (slug) => {
  const kind = slug.replace(/^(dis)?advantage-on-/, "").replace(/-?attacks$/, "");
  return kind === "" ? "all" : camel(kind);
};
const SPEEDS = { "speed-doubled": "doubled", "speed-halved": "halved", "speed-is-0": "zero" };

const CATEGORIES = [
  ["conditions", "conditions", (slug) => camel(slug)],
  ["condition-immunities", "conditionImmunities", (slug) => slug.replace("-immunity", "")],
  ["damage-resistances", "damageResistances", generic("resistance")],
  ["damage-immunities", "damageImmunities", generic("immunity")],
  ["damage-vulnerabilities", "damageVulnerabilities", generic("vulnerability")],
  ["ability-check-advantage", "checkAdvantage", ability],
  ["ability-check-disadvantage", "checkDisadvantage", ability],
  ["ability-save-advantage", "saveAdvantage", ability],
  ["ability-save-disadvantage", "saveDisadvantage", ability],
  ["ability-check-save-advantage", "checkAndSaveAdvantage", ability],
  ["ability-check-save-disadvantage", "checkAndSaveDisadvantage", ability],
  ["skill-advantage", "skillAdvantage", skill("advantage")],
  ["skill-disadvantage", "skillDisadvantage", skill("disadvantage")],
  ["attack-advantage", "attackAdvantage", attack],
  ["attack-disadvantage", "attackDisadvantage", attack],
  ["d20-tests", "d20Tests", (slug) => slug.replace("-on-d20-tests", "")],
  ["speeds", "speeds", (slug) => SPEEDS[slug] ?? slug.replace("-speed", "")],
  // Spell-specific effects landed with dnd5e PR #7332 ("Update spells to take advantage of 6.0 features").
  ["spells", "spells", camel],
  // species/<species>/<effect>.yml: "species/dragonborn/acid-breath-weapon" -> "dragonbornAcidBreathWeapon"
  ["species", "species", (slug) => camel(slug.replace("/", "-"))],
];

const QUOTES = /^["']|["']$/g;
const field = (text, name) => text.match(new RegExp(`^${name}: (.*)$`, "m"))?.[1]?.replace(QUOTES, "");
const identifier = (key) => ((/^[a-z][a-zA-Z0-9]*$/).test(key) ? key : `"${key}"`);

/** Every effect file under a folder, with its slug relative to that folder ("dragonborn/acid-breath-weapon"). */
function effectFiles(dir, prefix = "") {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) {
      results.push(...effectFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`));
    } else if (!entry.name.startsWith("_") && entry.name.endsWith(".yml")) {
      results.push({ file: path.join(dir, entry.name), slug: `${prefix}${entry.name.slice(0, -4)}` });
    }
  }
  return results;
}

const baseIds = new Set();
if (baseRoot) {
  for (const [folder] of CATEGORIES) {
    for (const { file } of effectFiles(path.join(effectsDir(baseRoot), folder))) {
      baseIds.add(field(fs.readFileSync(file, "utf-8"), "_id"));
    }
  }
}
const since = baseRoot ? systemVersion(root) : null;

const lines = [
  "/**",
  " * Stock ActiveEffects shipped in the dnd5e `effects` compendium (`Compendium.dnd5e.effects.ActiveEffect.<id>`).",
  " * Generated from `packs/_source/effects` in the dnd5e repository by `tools/generate-srd-effects.mjs`; regenerate",
  " * rather than hand-edit when the system renames or adds entries. Enrichers must go through",
  " * `SRDEffects` (parser/enrichers/effects/SRDEffects.ts) so the backing compendium can change in one place.",
  " * `since` marks an entry the oldest supported dnd5e lacks: read those through `SRDEffects.optionalUuid`.",
  " */",
  "",
  "export const SRD_EFFECTS_PACK = \"dnd5e.effects\";",
  "",
  "export const SRD_EFFECTS = {",
];
for (const [folder, category, keyFor] of CATEGORIES) {
  const files = effectFiles(path.join(SRC, folder));
  if (files.length === 0) continue;
  lines.push(`  ${category}: {`);
  const seen = new Set();
  for (const { file, slug } of files) {
    const text = fs.readFileSync(file, "utf-8");
    const name = field(text, "name");
    const id = field(text, "_id");
    let key = keyFor(slug);
    if (category === "conditions") {
      if (name === "Conditions") continue;
      key = text.match(/^statuses:\n {2}- (\S+)/m)?.[1] ?? key;
    }
    if (!key) throw new Error(`No key for ${folder}/${slug}`);
    if (seen.has(key)) throw new Error(`Duplicate key ${category}.${key} (${folder}/${slug})`);
    seen.add(key);
    const sinceField = since && !baseIds.has(id) ? `, since: "${since}"` : "";
    lines.push(`    ${identifier(key)}: { id: "${id}", name: "${name}"${sinceField} },`);
  }
  lines.push("  },");
}
lines.push(`} as const;
`);
fs.writeFileSync(OUT, lines.join("\n"));
process.stdout.write(`wrote ${OUT}${since ? ` (entries new since the base marked ${since})` : ""}\n`);
