import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
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
  const armorType = nameEntry !== undefined ? nameEntry.value : idEntry !== undefined ? idEntry.value : "medium";

  switch (armorType) {
    case "heavy":
      maxDexModifier = 0;
      break;
    case "medium":
      maxDexModifier = flags.maxMediumArmorDex || 2;
      break;
    default:
      maxDexModifier = null;
      break;
  }

  const itemDexMaxAdjustment = utils.getModifierSum(utils.filterModifiers(data.definition.grantedModifiers, "set", "ac-max-dex-modifier"), character);
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
  return data.definition.strengthRequirement !== null ? data.definition.strengthRequirement : 0;
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
    name: data.definition.name,
    type: "equipment",
    data: JSON.parse(utils.getTemplate("equipment")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  armor.system.armor = getArmorType(data, character, flags);
  armor.system.strength = getStrength(data);
  armor.system.stealth = getStealthPenalty(data);
  armor.system.proficient = getProficient(data, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  armor.system.description = getDescription(data);
  armor.system.source = utils.parseSource(data.definition);
  armor.system.quantity = getQuantity(data);
  armor.system.weight = getSingleItemWeight(data);
  armor.system.equipped = getEquipped(data);
  armor.system.rarity = getItemRarity(data);
  armor.system.identified = true;
  armor.system.uses = getUses(data);

  return armor;
}
