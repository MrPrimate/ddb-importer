import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import {
  getItemRarity,
  getEquipped,
  getUses,
  getSingleItemWeight,
  getQuantity,
  getDescription,
  getCapacity,
  getCurrency,
  getWeightless,
} from "./common.js";


function getSavingThrow(description) {
  const save = description.match(/DC ([0-9]+) (.*?) saving throw|\(save DC ([0-9]+)\)/);
  if (save && save[2]) {
    return {
      dc: save[1],
      ability: save[2].toLowerCase().substr(0, 3),
    };
  } else {
    return null;
  }
}


function getActivation(description) {

  let action = "";
  const actionRegex = /(bonus) action|(reaction)|as (?:an|a) (action)/i;

  const match = description.match(actionRegex);
  if (match) {
    if (match[1]) action = "bonus";
    else if (match[2]) action = "reaction";
    else if (match[3]) action = "action";
  }

  return {
    type: action,
    cost: action ? 1 : null,
    condition: "",
  };
}

/**
 *
 * @param {obj} ddbData item data
 * /* damage: { parts: [], versatile: '' }, * /
 */
function getDamage(ddbData) {
  const parts = [];

  // additional damage parts
  ddbData.definition.grantedModifiers
    .filter((mod) => mod.type === "damage" && CONFIG.DND5E.damageTypes[mod.subType])
    .forEach((mod) => {
      const die = mod.dice
        ? mod.dice
        : mod.die
          ? mod.die
          : undefined;
      if (die?.diceString) {
        parts.push([die.diceString, mod.subType]);
      } else if (mod.value) {
        parts.push([`${mod.value}`, mod.subType]);
      }
    });

  const result = {
    parts,
    versatile: "",
  };

  return result;
}

// eslint-disable-next-line complexity
export default function parseWonderous(ddbData, { ddbTypeOverride = null, armorType = "trinket" } = {}) {
  const isContainer = ddbData.definition.isContainer;
  const isClothingTag = ddbData.definition.tags.includes('Outerwear')
    || ddbData.definition.tags.includes('Footwear')
    || ddbData.definition.tags.includes('Clothing');
  const tashasInstalled = game.modules.get("dnd-tashas-cauldron")?.active;
  const isTattoo = ddbData.definition.name.toLowerCase().includes("tattoo");
  const tattooType = tashasInstalled && isTattoo;

  ddbTypeOverride = isTattoo
    ? "Tattoo"
    : isClothingTag && !isContainer ? "Clothing" : ddbTypeOverride;

  const type = tattooType
    ? "dnd-tashas-cauldron.tattoo"
    : isContainer ? "container" : "equipment";
  /**
   * MAIN parseEquipment
   */
  let item = {
    _id: foundry.utils.randomID(),
    name: ddbData.definition.name,
    type,
    system: utils.getTemplate(type),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: ddbTypeOverride ?? ddbData.definition.type,
        },
      },
    },
  };

  if (isContainer) {
    if (ddbData.currency) item.system.currency = getCurrency(ddbData);
    if (getWeightless(ddbData)) {
      item.system.properties = utils.addToProperties(item.system.properties, "weightlessContents");
    }
  } else if (tattooType) {
    item.system.type.value = ddbData.definition.name.toLowerCase().includes("spellwrought")
      ? "spellwrought"
      : "permanent";
    utils.addToProperties(item.system.properties, "mgc");
  } else {
    //
    // "armor": {
    // "type": "trinket",
    // "value": 10,
    // "dex": null
    // }
    item.system.armor = {
      value: null,
      dex: null,
    };

    item.system.type.value = isClothingTag && !isContainer ? "clothing" : armorType;

    /* "strength": 0 */
    item.system.strength = 0;

    /* "stealth": false,*/
    utils.removeFromProperties(item.system.properties, "stealthDisadvantage");
    item.system.proficient = null;
  }

  item.system.description = getDescription(ddbData, item);
  item.system.source = DDBHelper.parseSource(ddbData.definition);
  item.system.quantity = getQuantity(ddbData);
  item.system.weight = getSingleItemWeight(ddbData);
  item.system.equipped = getEquipped(ddbData);
  item.system.rarity = getItemRarity(ddbData);
  item.system.identified = true;
  item.system.uses = getUses(ddbData, true);
  if (!isTattoo) item.system.capacity = getCapacity(ddbData);

  item.system.activation = getActivation(ddbData.definition.description);

  if (foundry.utils.hasProperty(item, "system.damage")) {
    item.system.damage = getDamage(ddbData);

    if (item.system.damage.parts.length > 0) {
      const saveDetails = getSavingThrow(ddbData.definition.description);
      if (saveDetails) {
        item.system.actionType = "save";
        item.system.save = { ability: saveDetails.ability, dc: saveDetails.dc, scaling: "flat" };
      } else {
        item.system.actionType = "util";
      }
      // console.warn(`Added damage to ${item.name}`, { item, damage: item.system.damage });
    }
    if (item.system.activation.value === "") item.system.activation.value = "special";
  }


  return item;
}
