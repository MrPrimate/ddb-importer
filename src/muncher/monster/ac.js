import logger from "../../logger.js";
import { loadPassedItemsFromCompendium } from "../import.js";
import { getCompendiumLabel, getCompendium } from "../utils.js";

const BAD_AC_MONSTERS = [
  "arkhan the cruel"
];

var equipmentCompendium;

export function resetEquipment() {
  equipmentCompendium = null;
}

async function getEquipmentCompendium() {
  if (!equipmentCompendium) {
    const label = getCompendiumLabel("inventory");
    // eslint-disable-next-line require-atomic-updates
    equipmentCompendium = await getCompendium(label);
    if (!equipmentCompendium.indexed) await equipmentCompendium.getIndex();
  }
  return equipmentCompendium;
}

export async function generateAC(monster, useItemAC) {

  const ac = {
    "flat": monster.armorClass,
    "calc": "",
    "formula": "",
    "label": monster.armorClassDescription ? monster.armorClassDescription.replace("(", "").replace(")", "") : "",
  };

  let flatAC = true;

  const stat = monster.stats.find((stat) => stat.statId === 2).value || 10;
  const dexBonus = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;

  let acItems = [];

  const lowerDescription = monster.armorClassDescription.toLowerCase();
  const descriptionItems = monster.armorClassDescription
    ? lowerDescription.replace("(", "").replace(")", "")
      .split(";")[0]
      .split(",").map((item) => item.trim())
    : [];

  // arkhan the cruel has Armor Class 23 (obsidian flint dragon plate, shield)

  // archmage 12 (15 with mage armor)

  // Jarlaxle Baenre 24 (+3 leather armor, Suave Defense)
  // Suave Defense. While Jarlaxle is wearing light or no armor and wielding no shield, his AC includes his Charisma modifier.

  // Eternal flame guardian 17 (breastplate, shield; 15 while using a crossbow)

  let itemsToCheck = [];
  if (descriptionItems.length > 0) {
    descriptionItems.forEach((item) => {
      if (item == "natural" || item == "natural armor") {
        ac.calc = "natural";

        if (lowerDescription.includes("shield")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("ring of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("cloak of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+1") || lowerDescription.includes("+ 1")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+2") || lowerDescription.includes("+ 2")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("+3") || lowerDescription.includes("+ 3")) ac.flat = parseInt(ac.flat) - 3;
      } else if (!item.includes("with mage armor")) {
        if (item === "leather armor") {
          item = "leather";
        } else if (item === "hide armor") {
          item = "hide";
        } else if (item.startsWith("+")) {
          const bonusRegex = /(\+\d+)(?:\s+)(.*)/;
          const matches = item.match(bonusRegex);
          if (matches) {
            item = `${matches[2]}, ${matches[1]}`;
          }
        }
        // const type = item.includes("ring") || item.includes("cloak") ? "trinket" : "equipment";
        itemsToCheck.push({ name: item, type: "equipment", flags: {}, data: { equipped: true } });
      };
    });
  }

  logger.debug("Checking for items", itemsToCheck);
  const compendium = await getEquipmentCompendium();
  const unAttunedItems = await loadPassedItemsFromCompendium(compendium, itemsToCheck, "inventory", { monsterMatch: true });
  const attunedItems = unAttunedItems.map((item) => {
    if (item.data.attunement === 1) item.data.attunement = 2;
    return item;
  });

  logger.debug("Found items", { unAttunedItems, attunedItems });
  const allItemsMatched = attunedItems.length > 0 && attunedItems.length == itemsToCheck.length;
  const badACMonster = BAD_AC_MONSTERS.includes(monster.name.toLowerCase());

  if (allItemsMatched && useItemAC && ac.calc !== "natural" && !badACMonster) {
    ac.flat = null;
    ac.calc = "default";
    ac.formula = "";
    flatAC = false;
  }

  const result = {
    ac,
    flatAC,
    acItems,
    dexBonus,
    ddbItems: attunedItems,
    allItemsMatched,
    badACMonster,
  };
  logger.debug(`${monster.name} ac calcs`, result);
  return result;

}
