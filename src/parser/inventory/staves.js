import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import { getItemRarity, getEquipped, getWeaponProficient, getMagicalBonus } from "./common.js";

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
        parts.push([mod.value, mod.subType]);
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
  let weapon = {
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

  weapon.data.weaponType = getWeaponType(data);
  weapon.data.properties = getProperties(data);
  weapon.data.proficient = getWeaponProficient(data, weapon.data.weaponType, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);
  weapon.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  weapon.data.source = utils.parseSource(data.definition);
  weapon.data.quantity = data.quantity ? data.quantity : 1;

  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  weapon.data.weight = totalWeight / bundleSize;
  weapon.data.equipped = getEquipped(data);
  weapon.data.rarity = getItemRarity(data);
  weapon.data.identified = true;
  weapon.data.activation = { type: "action", cost: 1, condition: "" };
  weapon.data.range = getRange(data);
  weapon.data.ability = getAbility(weapon.data.properties, weapon.data.range, character.flags.ddbimporter.dndbeyond.effectAbilities);
  weapon.data.actionType = weapon.data.range.long === 5 ? "mwak" : "rwak";
  weapon.data.attackBonus = getMagicalBonus(data);
  weapon.data.damage = getDamage(data, getMagicalBonus(data));

  return weapon;
}
