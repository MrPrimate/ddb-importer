import { logger, DDBItemImporter, utils, CompendiumHelper } from "../../lib/_module.mjs";
import DDBMonster from "../DDBMonster.js";

DDBMonster.prototype.BAD_AC_MONSTERS = ["arkhan the cruel"];

// eslint-disable-next-line complexity
DDBMonster.prototype._generateAC = async function _generateAC(additionalItems = []) {
  const ac = {
    flat: this.source.armorClass,
    calc: "",
    formula: "",
    label: this.source.armorClassDescription ? this.source.armorClassDescription.replace("(", "").replace(")", "") : "",
  };

  let flatAC = true;

  const stat = this.source.stats.find((stat) => stat.statId === 2).value || 10;
  const dexBonus = CONFIG.DDB.statModifiers.find((s) => s.value == stat).modifier;
  const baseAc = 10 + parseInt(dexBonus);

  let acItems = [];

  const lowerDescription = this.source.armorClassDescription ? this.source.armorClassDescription.toLowerCase() : "";
  const descriptionItems = this.source.armorClassDescription
    ? this.source.armorClassDescription
      .replace("(", "")
      .replace(")", "")
      .split(";")[0]
      .split(",")
      .map((item) => item.trim())
    : [];

  // arkhan the cruel has Armor Class 23 (obsidian flint dragon plate, shield)

  // archmage 12 (15 with mage armor)

  // Jarlaxle Baenre 24 (+3 leather armor, Suave Defense)
  // Suave Defense. While Jarlaxle is wearing light or no armor and wielding no shield, his AC includes his Charisma modifier.

  // Eternal flame guardian 17 (breastplate, shield; 15 while using a crossbow)

  let itemsToCheck = [];
  descriptionItems.push(...additionalItems.map((item) => item));

  if (descriptionItems.length > 0) {
    descriptionItems.forEach((item) => {
      let lowerItem = item.toLowerCase();
      if (lowerItem == "natural" || lowerItem == "natural armor") {
        ac.calc = "natural";
        flatAC = false;

        if (lowerDescription.includes("shield")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("ring of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("cloak of protection")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+1") || lowerDescription.includes("+ 1")) ac.flat = parseInt(ac.flat) - 1;
        if (lowerDescription.includes("+2") || lowerDescription.includes("+ 2")) ac.flat = parseInt(ac.flat) - 2;
        if (lowerDescription.includes("+3") || lowerDescription.includes("+ 3")) ac.flat = parseInt(ac.flat) - 3;
      } else if (!lowerItem.includes("with mage armor")) {
        lowerItem = lowerItem
          .replace("leather armor", "leather")
          .replace("hide armor", "hide")
          .replace("plate mail", "plate");
        if (lowerItem.startsWith("+")) {
          const bonusRegex = /(\+\d+)(?:\s+)(.*)/;
          const matches = lowerItem.match(bonusRegex);
          if (matches) {
            lowerItem = `${matches[2]}, ${matches[1]}`;
          }
        }
        // const type = item.includes("ring") || item.includes("cloak") ? "trinket" : "equipment";
        const itemsToIgnore = this.addMonsterEffects ? ["suave defense"] : [];
        if (!itemsToIgnore.includes(lowerItem)) {
          const quantityRegex = /(.*)s \((\d+)\)/;
          const match = lowerItem.match(quantityRegex);
          let name = match ? match[1] : lowerItem;
          let quantity = match ? parseInt(match[2]) : 1;
          itemsToCheck.push({
            name: name
              .split(" ")
              .map((word) => utils.capitalize(word))
              .join(" "),
            type: "equipment",
            flags: {
              ddbimporter: {
                is2014: this.is2014,
                is2024: this.is2024,
              },
            },
            system: {
              quantity,
              equipped: true,
            },
          });
        }
      }
    });
  }

  logger.debug("Checking for items", itemsToCheck);
  const rawItems = await DDBItemImporter.getCompendiumItems(itemsToCheck, "inventory", { monsterMatch: true });
  const unAttunedItems = rawItems.filter((i) => i.type !== "weapon"); // filter out weapons for now
  const attunedItems = unAttunedItems.map((item) => {
    if (item.system.attunement === 1) item.system.attunement = 2;
    if (foundry.utils.hasProperty(item.system.equipped)) item.system.equipped = true;
    const check = itemsToCheck.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (check) {
      item.system.quantity = check.system.quantity;
    }
    return item;
  });

  for (const item of this.items) {
    if (item.type !== "weapon") continue;
    const check = itemsToCheck.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (check) {
      item.system.quantity = check.system.quantity;
    }
  }

  logger.debug("Found items", { unAttunedItems, attunedItems, rawItems });
  const allItemsMatched = attunedItems.length > 0 && attunedItems.length == itemsToCheck.length;
  const badACMonster = this.BAD_AC_MONSTERS.includes(this.source.name.toLowerCase());

  if (attunedItems.length === 0 && ac.calc !== "natural" && baseAc !== ac.flat) {
    ac.calc = "natural";
    flatAC = false;
  } else if (this.useItemAC && ac.calc !== "natural" && !badACMonster) {
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
    rawItems,
  };

  logger.debug(`${this.source.name} ac calcs`, this.ac);
  this.npc.system.attributes.ac = ac;
  this.npc.flags.ddbimporter.flatAC = flatAC;
  if (this.useItemAC) this.items.push(...attunedItems);

  const spellCastingAC = this.items.find(
    (i) => i.name.includes("Spellcasting") && i.system.description.value.includes("Mage Armor (included in AC)"),
  );

  if (spellCastingAC) {
    const compendium = CompendiumHelper.getCompendiumLabel("monster");
    this.npc.effects.push({
      img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
      name: "Mage Armor",
      statuses: [],
      changes: [
        {
          key: "system.attributes.ac.calc",
          value: "mage",
          mode: 5,
          priority: 5,
        },
      ],
      duration: {
        seconds: 28800,
        startTime: 0,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
        combat: null,
      },
      transfer: false,
      disabled: false,
      flags: {
        dae: {
          transfer: false,
          stackable: "noneNameOnly",
          specialDuration: [],
        },
        dnd5e: {
          spellLevel: 1,
        },
      },
      _id: "Md6K6TE3a5buYstn",
      type: "base",
      system: {},
      origin: `Compendium.${compendium}.Actor.${this.npc._id}.Item.${spellCastingAC._id}`,
    });
  }
};
