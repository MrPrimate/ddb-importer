import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getUses, getSingleItemWeight, getQuantity } from "./common.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
 */
function getArmorType(data, flags) {
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
  switch (data.definition.type) {
    case "Heavy Armor":
      maxDexModifier = 0;
      break;
    case "Medium Armor":
      maxDexModifier = flags.maxMediumArmorDex;
      break;
    default:
      maxDexModifier = null;
  }

  return {
    type: nameEntry !== undefined ? nameEntry.value : idEntry !== undefined ? idEntry.value : "medium",
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

  armor.data.armor = getArmorType(data, flags);
  armor.data.strength = getStrength(data);
  armor.data.stealth = getStealthPenalty(data);
  armor.data.proficient = getProficient(data, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  armor.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  armor.data.source = utils.parseSource(data.definition);
  armor.data.quantity = getQuantity(data);
  armor.data.weight = getSingleItemWeight(data);
  armor.data.equipped = getEquipped(data);
  armor.data.rarity = getItemRarity(data);
  armor.data.identified = true;
  armor.data.uses = getUses(data);

  return armor;
}
