import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getUses, getSingleItemWeight, getQuantity, getDescription, getBaseItem } from "./common.js";


/**
 * Get the armor type, armor class, and max dex modifier based on the provided data, character, and flags.
 *
 * @param {Object} data - The data object containing armor information.
 * @param {Object} character - The character object.
 * @param {Object} flags - The flags object for additional options.
 * @return {Object} An object containing the armor type, combined armor class, and max dex modifier.
 */
function getArmorType(data, character, flags) {
  // get the generic armor type
  const nameEntry = DICTIONARY.equipment.armorType.find((type) => type.name === data.definition.type);
  const idEntry = DICTIONARY.equipment.armorType.find((type) => type.id === data.definition.armorTypeId);

  // get the armor class
  const baseArmorClass = data.definition.armorClass;
  const bonusArmorClass = data.definition.grantedModifiers.reduce((prev, cur) => {
    if (cur.type === "bonus" && cur.subType === "armor-class" && Number.isInteger(cur.value)) {
      return prev + cur.value;
    } else {
      return prev;
    }
  }, 0);

  // console.warn("datadefinition",data.definition)
  // console.warn("baseArmorClass",baseArmorClass)
  // console.warn("bonusArmorClass",bonusArmorClass)

  // get the max dex modifier (Medium Armor: 2, Heavy: 0)
  let maxDexModifier;
  const armorType = nameEntry !== undefined
    ? nameEntry.value
    : idEntry !== undefined
      ? idEntry.value
      : "medium";

  switch (armorType) {
    case "heavy":
      maxDexModifier = 0;
      break;
    case "medium":
      maxDexModifier = flags.maxMediumArmorDex ?? 2;
      break;
    default:
      maxDexModifier = null;
      break;
  }

  const itemDexMaxAdjustment = DDBHelper.getModifierSum(DDBHelper.filterModifiersOld(data.definition.grantedModifiers, "set", "ac-max-dex-modifier"), character);
  if (maxDexModifier !== null && Number.isInteger(itemDexMaxAdjustment) && itemDexMaxAdjustment > maxDexModifier) {
    maxDexModifier = itemDexMaxAdjustment;
  }

  return {
    type: armorType,
    value: baseArmorClass + bonusArmorClass,
    dex: maxDexModifier,
  };
}

/**
 * Gets the strength requirement to wear this armor, if any
 * @param {obj} data Item data
 */
function getStrength(data) {
  return data.definition.strengthRequirement ?? 0; // in future null might be permitted again
}

/**
 * Wearing this armor can give a disadvantage on stealth checks
 */
function getStealthPenalty(data) {
  return data.definition.stealthCheck === 2;
}

/**
 * Checks the proficiency of the character with this specific weapon
 * @param {obj} data Item data
 * @param {array} proficiencies The character's proficiencies as an array of `{ name: 'PROFICIENCYNAME' }` objects
 */
function getProficient(data, proficiencies) {
  // Proficiency in armor category (Light Armor, Shield)
  if (proficiencies.find((proficiency) => proficiency.name === data.definition.type) !== -1) return true;
  // Specific proficiency
  if (proficiencies.find((proficiency) => proficiency.name === data.definition.baseArmorName) !== -1) return true;
  return false;
}

export default function parseArmor(data, character, flags) {
  let armor = {
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: "equipment",
    system: utils.getTemplate("armor"),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  const armorType = getArmorType(data, character, flags);

  armor.system.armor.value = armorType.value;
  armor.system.armor.dex = armorType.dex;
  armor.system.type.value = armorType.type;
  armor.system.type.baseItem = getBaseItem(data).baseItem;
  armor.system.strength = getStrength(data);
  if (getStealthPenalty(data)) armor.system.properties.push("stealthDisadvantage");
  armor.system.proficient = getProficient(data, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  armor.system.description = getDescription(data);
  armor.system.source = DDBHelper.parseSource(data.definition);
  armor.system.quantity = getQuantity(data);
  armor.system.weight = getSingleItemWeight(data);
  armor.system.equipped = getEquipped(data);
  armor.system.rarity = getItemRarity(data);
  armor.system.identified = true;
  armor.system.uses = getUses(data);

  if (!armor.name.toLowerCase().includes("armor")) {
    foundry.utils.setProperty(armor, "flags.ddbimporter.dndbeyond.alternativeNames", [`${armor.name} Armor`]);
  }

  return armor;
}
