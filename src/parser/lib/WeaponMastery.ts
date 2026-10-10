import { ACTOR } from "../../config/dictionary/actor/actor";

/**
 * The dnd5e base item key for a DDB catalogue weapon name. The qualifier comes after a comma, so
 * reversed and squashed the name becomes the key: "Crossbow, Hand" -> "handcrossbow". DDBItem
 * builds weapon and armor base item keys the same way. Material copies of core weapons are not
 * keyed this way, see weaponMaterialVariant.
 */
export function ddbWeaponKey(name: string) {
  return name.trim().toLowerCase().replace(/[’‘]/g, "'").split(",").reverse().join("").replace(/\s/g, "");
}

const MATERIAL_VARIANT = /^(.+?),\s*(silver|wooden)$/i;
const WOODEN_AMMUNITION_VARIANT = /^(.+?)\s*\(wooden (?:arrows|bolts|bullets)\)$/i;

/**
 * DDB's catalogue lists silvered and wooden copies of the core weapons as weapons of their own
 * ("Longsword, Silver", "Dart, Wooden", "Shortbow (Wooden Arrows)"). dnd5e has one base item per
 * weapon, so these resolve to the core weapon's key; the silvered copy carries the Silvered
 * property instead. Returns null for anything that is not a material copy of a core weapon.
 */
export function weaponMaterialVariant(name: string | null | undefined) {
  const text = name?.trim() ?? "";
  const material = text.match(MATERIAL_VARIANT);
  const ammunition = material ? null : text.match(WOODEN_AMMUNITION_VARIANT);
  const base = (material ?? ammunition)?.[1].trim();
  if (!base) return null;
  // "Light Crossbow (Wooden Bolts)" names the dictionary's "Crossbow, Light"
  const entry = ACTOR.proficiencies.find((prof) => prof.type === "Weapon"
    && prof.foundryValue && prof.advancement
    && (prof.name.toLowerCase() === base.toLowerCase() || ddbWeaponKey(prof.name) === ddbWeaponKey(base)));
  if (!entry?.foundryValue) return null;
  return {
    base: entry.name,
    key: entry.foundryValue,
    advancement: `${entry.advancement}:${entry.foundryValue}`,
    silvered: material?.[2].toLowerCase() === "silver",
  };
}

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
  const candidates = [weapon, weaponMaterialVariant(weapon)?.base]
    .filter((candidate): candidate is string => Boolean(candidate));
  for (const candidate of candidates) {
    const entry = ACTOR.proficiencies.find((prof) => prof.type === "Weapon"
      && prof.foundryValue && prof.advancement && normalize(prof.name) === normalize(candidate));
    if (!entry?.foundryValue) continue;
    return { weapon, mastery, dnd5eName: entry.foundryValue,
      advancement: `${entry.advancement}:${entry.foundryValue}` };
  }
  // Extra base weapons are registered from this same DDB catalog by DDBRuleJournalFactory.
  // Preserve their keys even when the core dictionary has no mapping, rather than discarding
  // previously imported masteries.
  const catalogWeapon = CONFIG.DDB.weapons.find((entry) => ddbWeaponKey(entry.name) === ddbWeaponKey(weapon));
  if (catalogWeapon) {
    const category = catalogWeapon.categoryId === 1 ? "sim" : "mar";
    const dnd5eName = ddbWeaponKey(catalogWeapon.name);
    return { weapon, mastery, dnd5eName, advancement: `${category}:${dnd5eName}` };
  }
  return null;
}
