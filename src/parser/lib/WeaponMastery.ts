import { ACTOR } from "../../config/dictionary/actor/actor";

/** Resolve DDB's display label, including ammunition annotations, to the system weapon key. */
export function parseWeaponMastery(label: string) {
  const text = label.trim();
  if (!text.endsWith(")")) return null;
  let depth = 0;
  let opening = -1;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === ")") depth++;
    if (text[i] === "(" && --depth === 0) {
      opening = i;
      break;
    }
  }
  if (opening <= 0) return null;
  const weapon = text.slice(opening + 1, -1).trim();
  const mastery = text.slice(0, opening).trim();
  if (!weapon || !mastery) return null;
  const normalize = (name: string) => name.trim().toLowerCase().replace(/[’‘]/g, "'");
  const candidates = [weapon, weapon.replace(/\s*\(wooden (?:arrows|bolts|bullets)\)$/i, "")];
  for (const candidate of candidates) {
    const entry = ACTOR.proficiencies.find((prof) => prof.type === "Weapon"
      && prof.foundryValue && prof.advancement && normalize(prof.name) === normalize(candidate));
    if (!entry?.foundryValue) continue;
    return { weapon, mastery, dnd5eName: entry.foundryValue,
      advancement: `${entry.advancement}:${entry.foundryValue}` };
  }
  // Extra base weapons are registered from this same DDB catalog by DDBRuleJournalFactory.
  // Preserve their keys (including silver/wooden variants) even when the core dictionary
  // has no mapping, rather than discarding previously imported masteries.
  const keyOf = (name: string) => normalize(name).split(",").reverse().join("").replace(/\s/g, "");
  const catalogWeapon = CONFIG.DDB.weapons.find((entry) => keyOf(entry.name) === keyOf(weapon));
  if (catalogWeapon) {
    const category = catalogWeapon.categoryId === 1 ? "sim" : "mar";
    const dnd5eName = keyOf(catalogWeapon.name);
    return { weapon, mastery, dnd5eName, advancement: `${category}:${dnd5eName}` };
  }
  return null;
}
