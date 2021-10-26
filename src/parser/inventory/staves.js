import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getWeaponProficient, getMagicalBonus, getSingleItemWeight, getQuantity } from "./common.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
 */
function getWeaponType(data) {
  const weaponBehavior = data.definition.weaponBehaviors[0];
  const type = DICTIONARY.weapon.weaponType.find((type) => type.categoryId === weaponBehavior.categoryId);
  const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === weaponBehavior.attackType);

  if (type && range) {
    return `${type.value}${range.value}`;
  } else {
    return "simpleM";
  }
}

/**
 * Gets the weapons's properties (Finesse, Reach, Heavy etc.)
 * @param {obj} data Item data
 */
function getProperties(data) {
  let weaponBehavior = data.definition.weaponBehaviors[0];
  let result = {};
  DICTIONARY.weapon.properties.forEach((property) => {
    if (weaponBehavior.properties && Array.isArray(weaponBehavior.properties)) {
      result[property.value] = weaponBehavior.properties.find((prop) => prop.name === property.name) !== undefined;
    }
  });
  return result;
}


/**
 * Gets the range(s) of a given weapon
 */
function getRange(data) {
  // range: { value: null, long: null, units: '' },
  let weaponBehavior = data.definition.weaponBehaviors[0];
  return {
    value: weaponBehavior.range ? weaponBehavior.range : 5,
    long: weaponBehavior.longRange ? weaponBehavior.longRange : 5,
    units: "ft.",
  };
}

/**
 * Gets the ability which the to hit modifier is baed on
 * Melee: STR
 * Ranged: DEX
 * Finesse: STR || DEX
 * Thrown: STR, unless Finesse, then STR || DEX
 * @param {obj} weaponProperties weapon properties
 * @param {obj} weaponRange weapon range information
 * @param {obj} abilities character abilities (scores)
 */
function getAbility(weaponProperties, weaponRange, abilities) {
  // finesse weapons can choose freely, so we choose the higher one
  if (weaponProperties.fin) {
    return abilities.str.value > abilities.dex.value ? "str" : "dex";
  }

  // thrown, but not finesse weapon: STR
  if (weaponProperties.thr) {
    return "str";
  }

  // if it's a ranged weapon, and hot a reach weapon (long = 10 (?))
  if (weaponRange.long !== 5 && !weaponProperties.rch) {
    return "dex";
  }

  // the default is STR
  return "str";
}

/**
 *
 * @param {obj} data item data
 * @param {obj} weaponProperties weapon properties
 * /* damage: { parts: [], versatile: '' }, * /
 */
function getDamage(data, magicalDamageBonus) {
  let weaponBehavior = data.definition.weaponBehaviors[0];
  let versatile = weaponBehavior.properties.find((property) => property.name === "Versatile");
  if (versatile && versatile.notes) {
    versatile = utils.parseDiceString(versatile.notes + `+${magicalDamageBonus}`).diceString;
  } else {
    versatile = "";
  }

  let parts = [];

  // first damage part
  // blowguns and other weapons rely on ammunition that provides the damage parts
  if (weaponBehavior.damage && weaponBehavior.damage.diceString && weaponBehavior.damageType) {
    parts.push([
      utils.parseDiceString(weaponBehavior.damage.diceString + `+${magicalDamageBonus}`).diceString,
      weaponBehavior.damageType.toLowerCase(),
    ]);
  }

  // additional damage parts
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage")
    .forEach((mod) => {
      if (mod.dice) {
        parts.push([mod.dice.diceString, mod.subType]);
      } else if (mod.value) {
        parts.push([`${mod.value}`, mod.subType]);
      }
    });

  let result = {
    // label: utils.parseDiceString(parts.map(part => part[0]).join(' + ')).diceString,
    parts: parts,
    versatile: versatile,
  };

  return result;
}

export default function parseStaff(data, character) {
  let template = JSON.parse(utils.getTemplate("weapon"));
  let staff = {
    name: data.definition.name,
    type: "weapon",
    data: template,
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  staff.data.weaponType = getWeaponType(data);
  staff.data.properties = getProperties(data);
  staff.data.proficient = getWeaponProficient(data, staff.data.weaponType, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  staff.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  staff.data.source = utils.parseSource(data.definition);
  staff.data.quantity = getQuantity(data);
  staff.data.weight = getSingleItemWeight(data);
  staff.data.equipped = getEquipped(data);
  staff.data.rarity = getItemRarity(data);
  staff.data.identified = true;
  staff.data.activation = { type: "action", cost: 1, condition: "" };
  staff.data.range = getRange(data);
  staff.data.ability = getAbility(staff.data.properties, staff.data.range, character.flags.ddbimporter.dndbeyond.effectAbilities);
  staff.data.actionType = staff.data.range.long === 5 ? "mwak" : "rwak";
  staff.data.attackBonus = getMagicalBonus(data);
  staff.data.damage = getDamage(data, getMagicalBonus(data));

  return staff;
}
