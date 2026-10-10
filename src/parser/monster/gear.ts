import DDBMonster from "../DDBMonster";

const PHYSICAL_TYPES = ["weapon", "equipment", "consumable", "tool", "loot", "container"];

interface IMonsterGearEntry {
  text: string;
  keys: Set<string>;
  quantity: number;
}

/**
 * Name variants a gear entry or item name can match on. DDB pluralises carried
 * stacks ("Javelins (6)", "Light Hammers (3)") where the attack is singular, and
 * armor is named "Plate Armor" in the Gear line but "Plate" in the compendium.
 */
function gearKeys(name: string): Set<string> {
  const base = name
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\+\d+/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+\d+\s*$/, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ armor$/, "");
  const keys = new Set([base]);
  if (base.endsWith("es")) keys.add(base.slice(0, -2));
  if (base.endsWith("s")) keys.add(base.slice(0, -1));
  return keys;
}

function gearMatches(entry: IMonsterGearEntry, name: string): boolean {
  for (const key of gearKeys(name)) {
    if (entry.keys.has(key)) return true;
  }
  return false;
}

function parseGearEntry(text: string): IMonsterGearEntry {
  // "Javelins (6)", and the odd "Daggers 3"
  const quantityMatch = text.match(/\((\d+)\)\s*$/) ?? text.match(/\s(\d+)\s*$/);
  return {
    text,
    keys: gearKeys(text),
    quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1,
  };
}

function setGearProperty(item: I5eMonsterItem, isGear: boolean) {
  const system = item.system as { properties?: string[] };
  const properties = (system.properties ?? []).filter((p) => p !== "gear");
  if (isGear) properties.push("gear");
  system.properties = properties;
}

/**
 * Flags the items an NPC carries with dnd5e's `gear` property, which builds the
 * stat block's Gear line and lets the items be looted. Gear is what DDB lists in
 * the Gear line plus the armor matched from the AC description; monster-specific
 * attacks stay off it, as in the SRD. Entries with no item
 * on the actor (a wand, unmatched armor when items are not added for AC) would
 * drop out of the generated line, so the line falls back to DDB's text.
 */
DDBMonster.prototype._generateGear = function _generateGear(this: DDBMonster, gearList: string[] = []) {
  const entries = gearList
    .map((g) => g.trim())
    .filter((g) => g !== "")
    .map((g) => parseGearEntry(g));
  const acItems = new Set<I5eMonsterItem>(this.useItemAC ? (this.ac?.ddbItems ?? []) : []);
  const matched = new Set<IMonsterGearEntry>();

  for (const item of this.items) {
    if (!PHYSICAL_TYPES.includes(item.type)) continue;
    const typeValue = foundry.utils.getProperty(item, "system.type.value");

    if (acItems.has(item)) {
      setGearProperty(item, true);
      for (const entry of entries) {
        if (gearMatches(entry, item.name)) matched.add(entry);
      }
      continue;
    }

    // a stack is carried once: the melee and thrown variants of a javelin share the entry
    const entry = typeValue === "natural"
      ? undefined
      : entries.find((e) => !matched.has(e) && gearMatches(e, item.name));
    setGearProperty(item, entry !== undefined);
    if (!entry) continue;
    matched.add(entry);
    if ("quantity" in item.system) item.system.quantity = entry.quantity;
  }

  if (entries.length > 0 && matched.size < entries.length) {
    foundry.utils.setProperty(this.npc, "flags.dnd5e.statBlockOverride.gear", entries.map((e) => e.text).join(", "));
  }
};
