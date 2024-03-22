import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getWeaponProficient, getMagicalBonus, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

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
  if (!weaponBehavior.properties || !Array.isArray(weaponBehavior.properties)) return [];
  let result = {};
  DICTIONARY.weapon.properties.forEach((property) => {
    if (weaponBehavior.properties && Array.isArray(weaponBehavior.properties)) {
      result[property.value] = weaponBehavior.properties.find((prop) => prop.name === property.name) !== undefined;
    }
  });

  result = DICTIONARY.weapon.properties.filter((p) =>
    weaponBehavior.properties.find((prop) => prop.name === p.name) !== undefined
  ).map((p) => p.value);
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
    const diceString = utils.parseDiceString(weaponBehavior.damage.diceString + `+${magicalDamageBonus}`).diceString;

    parts.push([
      `${diceString} +@mod`,
      weaponBehavior.damageType.toLowerCase(),
    ]);
  }

  // additional damage parts
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage")
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

  let result = {
    // label: utils.parseDiceString(parts.map(part => part[0]).join(' + ')).diceString,
    parts: parts,
    versatile: versatile,
  };

  return result;
}

export default function parseStaff(data, character) {
  let template = utils.getTemplate("weapon");
  let staff = {
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: "weapon",
    system: template,
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  staff.system.type.value = getWeaponType(data);
  staff.system.properties = getProperties(data);
  staff.system.proficient = getWeaponProficient(data, staff.system.type.value, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  staff.system.description = getDescription(data);
  staff.system.source = DDBHelper.parseSource(data.definition);
  staff.system.quantity = getQuantity(data);
  staff.system.weight = getSingleItemWeight(data);
  staff.system.equipped = getEquipped(data);
  staff.system.rarity = getItemRarity(data);
  staff.system.identified = true;
  staff.system.activation = { type: "action", cost: 1, condition: "" };
  staff.system.range = getRange(data);
  staff.system.ability = getAbility(staff.system.properties, staff.system.range, character.flags.ddbimporter.dndbeyond.effectAbilities);
  staff.system.actionType = staff.system.range.long === 5 ? "mwak" : "rwak";
  staff.system.attack.bonus = getMagicalBonus(data);
  staff.system.damage = getDamage(data, getMagicalBonus(data));

  return staff;
}
