import logger from "../../logger.js";
import DDBMonster from "../DDBMonster.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";

DDBMonster.prototype.BAD_AC_MONSTERS = [
  "arkhan the cruel"
];

DDBMonster.prototype._generateAC = async function _generateAC() {

  const ac = {
    "flat": this.source.armorClass,
    "calc": "",
    "formula": "",
    "label": this.source.armorClassDescription ? this.source.armorClassDescription.replace("(", "").replace(")", "") : "",
  };

  let flatAC = true;

  const stat = this.source.stats.find((stat) => stat.statId === 2).value || 10;
  const dexBonus = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;

  let acItems = [];

  const lowerDescription = this.source.armorClassDescription
    ? this.source.armorClassDescription.toLowerCase()
    : "";
  const descriptionItems = this.source.armorClassDescription
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
        flatAC = false;

        if (lowerDescription.includes("shield")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("ring of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("cloak of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+1") || lowerDescription.includes("+ 1")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+2") || lowerDescription.includes("+ 2")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("+3") || lowerDescription.includes("+ 3")) ac.flat = parseInt(ac.flat) - 3;
      } else if (!item.includes("with mage armor")) {
        item = item.replace("leather armor", "leather").replace("hide armor", "hide").replace("plate mail", "plate");
        if (item.startsWith("+")) {
          const bonusRegex = /(\+\d+)(?:\s+)(.*)/;
          const matches = item.match(bonusRegex);
          if (matches) {
            item = `${matches[2]}, ${matches[1]}`;
          }
        }
        // const type = item.includes("ring") || item.includes("cloak") ? "trinket" : "equipment";
        const itemsToIgnore = this.addMonsterEffects ? ["suave defense"] : [];
        if (!itemsToIgnore.includes(item)) {
          itemsToCheck.push({ name: item, type: "equipment", flags: {}, system: { equipped: true } });
        }
      };
    });
  }

  logger.debug("Checking for items", itemsToCheck);
  const unAttunedItems = await DDBItemImporter.getCompendiumItems(itemsToCheck, "inventory", { monsterMatch: true });
  const attunedItems = unAttunedItems.map((item) => {
    if (item.system.attunement === 1) item.system.attunement = 2;
    return item;
  });

  logger.debug("Found items", { unAttunedItems, attunedItems });
  const allItemsMatched = attunedItems.length > 0 && attunedItems.length == itemsToCheck.length;
  const badACMonster = this.BAD_AC_MONSTERS.includes(this.source.name.toLowerCase());

  if (allItemsMatched && this.useItemAC && ac.calc !== "natural" && !badACMonster) {
    ac.flat = null;
    ac.calc = "default";
    ac.formula = "";
    flatAC = false;
  } else if ((!this.useItemAC && ac.calc !== "natural") || attunedItems.length === 0) {
    // default monsters with no ac equipment to natural
    ac.calc = "natural";
    flatAC = false;
  }

  this.ac = {
    ac,
    flatAC,
    acItems,
    dexBonus,
    ddbItems: this.useItemAC ? attunedItems : [], // only add items if we are told too
    attunedItems,
    allItemsMatched,
    badACMonster,
  };

  logger.debug(`${this.source.name} ac calcs`, this.ac);
  this.npc.system.attributes.ac = ac;
  this.npc.flags.ddbimporter.flatAC = flatAC;
  if (this.useItemAC) this.items.push(...attunedItems);

};
