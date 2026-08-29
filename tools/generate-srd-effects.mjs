#!/usr/bin/env node
/**
 * Regenerate src/config/dictionary/effects/srdEffects.ts from the dnd5e repository's
 * packs/_source/effects tree.
 *
 *   node tools/generate-srd-effects.mjs /path/to/dnd5e
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.argv[2];
if (!root) {
  process.stderr.write("usage: node tools/generate-srd-effects.mjs <dnd5e repo path>\n");
  process.exit(1);
}
const SRC = path.join(root, "packs", "_source", "effects");
const OUT = path.resolve("src/config/dictionary/effects/srdEffects.ts");

const ABILITIES = { strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha", initiative: "init" };
const SKILLS = {
  "acrobatics": "acr", "animal-handling": "ani", "arcana": "arc", "athletics": "ath", "deception": "dec", "history": "his",
  "insight": "ins", "intimidation": "itm", "investigation": "inv", "medicine": "med", "nature": "nat", "perception": "prc",
  "performance": "prf", "persuasion": "per", "religion": "rel", "sleight-of-hand": "slt", "stealth": "ste", "survival": "sur",
};
const ability = (slug) => ABILITIES[slug.split("-")[0]];
const generic = (suffix) => (slug) => (slug === `damage-${suffix}` ? "all" : slug.replace(`-${suffix}`, ""));

const CATEGORIES = [
  ["conditions", "conditions", (slug) => slug],
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
  ["skill-advantage", "skillAdvantage", (slug) => SKILLS[slug.replace("-advantage", "")]],
  ["skill-disadvantage", "skillDisadvantage", (slug) => SKILLS[slug.replace("-disadvantage", "")]],
  ["speeds", "speeds", (slug) => slug.replace("-speed", "")],
  // Spell-specific effects landed with dnd5e PR #7332 ("Update spells to take advantage of 6.0 features").
  ["spells", "spells", (slug) => slug.replace(/-([a-z])/g, (_m, c) => c.toUpperCase())],
];

const QUOTES = /^["']|["']$/g;
const field = (text, name) => text.match(new RegExp(`^${name}: (.*)$`, "m"))?.[1]?.replace(QUOTES, "");
const identifier = (key) => ((/^[a-z][a-zA-Z0-9]*$/).test(key) ? key : `"${key}"`);

const lines = [
  "/**",
  " * Stock ActiveEffects shipped in the dnd5e `effects` compendium (`Compendium.dnd5e.effects.ActiveEffect.<id>`).",
  " * Generated from `packs/_source/effects` in the dnd5e repository by `tools/generate-srd-effects.mjs`; regenerate",
  " * rather than hand-edit when the system renames or adds entries. Enrichers must go through",
  " * `SRDEffects` (parser/enrichers/effects/SRDEffects.ts) so the backing compendium can change in one place.",
  " */",
  "",
  "export const SRD_EFFECTS_PACK = \"dnd5e.effects\";",
  "",
  "export const SRD_EFFECTS = {",
];
for (const [folder, category, keyFor] of CATEGORIES) {
  lines.push(`  ${category}: {`);
  for (const file of fs.readdirSync(path.join(SRC, folder)).sort()) {
    if (file.startsWith("_") || !file.endsWith(".yml")) continue;
    const text = fs.readFileSync(path.join(SRC, folder, file), "utf-8");
    const name = field(text, "name");
    const id = field(text, "_id");
    const slug = file.slice(0, -4);
    let key = keyFor(slug);
    if (category === "conditions") {
      if (name === "Conditions") continue;
      key = text.match(/^statuses:\n {2}- (\S+)/m)?.[1] ?? slug;
    }
    if (!key) throw new Error(`No key for ${folder}/${file}`);
    lines.push(`    ${identifier(key)}: { id: "${id}", name: "${name}" },`);
  }
  lines.push("  },");
}
lines.push(`} as const;
`);
fs.writeFileSync(OUT, lines.join("\n"));
process.stdout.write(`wrote ${OUT}\n`);
