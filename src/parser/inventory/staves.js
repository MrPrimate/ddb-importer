import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

/**
 * Gets the DND5E weapontype (simpleM, martialR etc.) as string
 * Supported Types only: Simple/Martial Melee/Ranged and Ammunition (Firearms in D&DBeyond)
 * @param {obj} data item data
 */
let getWeaponType = (data) => {
  const weaponBehavior = data.definition.weaponBehaviors[0];
  const type = DICTIONARY.weapon.weaponType.find((type) => type.categoryId === weaponBehavior.categoryId);
  const range = DICTIONARY.weapon.weaponRange.find((type) => type.attackType === weaponBehavior.attackType);

  if (type && range) {
    return `${type.value}${range.value}`;
  } else {
    return "simpleM";
  }
};

/**
 * Gets the weapons's properties (Finesse, Reach, Heavy etc.)
 * @param {obj} data Item data
 */
let getProperties = (data) => {
  let weaponBehavior = data.definition.weaponBehaviors[0];
  let result = {};
  DICTIONARY.weapon.properties.forEach((property) => {
    if (weaponBehavior.properties && Array.isArray(weaponBehavior.properties)) {
      result[property.value] = weaponBehavior.properties.find((prop) => prop.name === property.name) !== undefined;
    }
  });
  return result;
};

/**
 * Checks the proficiency of the character with this specific weapon
 * @param {obj} data Item data
 * @param {string} weaponType The DND5E weaponType
 * @param {array} proficiencies The character's proficiencies as an array of `{ name: 'PROFICIENCYNAME' }` objects
 */
let getProficient = (data, weaponType, proficiencies) => {
  // if it's a simple weapon and the character is proficient in simple weapons:
  if (proficiencies.find((proficiency) => proficiency.name === "Simple Weapons") && weaponType.indexOf("simple") !== -1)
    return true;
  if (
    proficiencies.find((proficiency) => proficiency.name === "Martial Weapons") &&
    weaponType.indexOf("martial") !== -1
  )
    return true;
  return proficiencies.find((proficiency) => proficiency.name === data.definition.type) !== undefined;
};

/**
 * Checks if the character can attune to an item and if yes, if he is attuned to it.
 */
let getAttuned = (data) => {
  if (data.definition.canAttune !== undefined && data.definition.canAttune === true) {
    return data.isAttuned;
  } else {
    return false;
  }
};

/**
 * Checks if the character can equip an item and if yes, if he is has it currently equipped.
 */
let getEquipped = (data) => {
  if (data.definition.canEquip !== undefined && data.definition.canEquip === true) {
    return data.equipped;
  } else {
    return false;
  }
};

/**
 * Gets the range(s) of a given weapon
 */
let getRange = (data) => {
  // range: { value: null, long: null, units: '' },
  let weaponBehavior = data.definition.weaponBehaviors[0];
  return {
    value: weaponBehavior.range ? weaponBehavior.range : 5,
    long: weaponBehavior.longRange ? weaponBehavior.longRange : 5,
    units: "ft.",
  };
};

/**
 * Gets Limited uses information, if any
 * uses: { value: 0, max: 0, per: null }
 */
// let getUses = (data) => {
//   if (data.limitedUse !== undefined && data.limitedUse !== null) {
//     let resetType = DICTIONARY.resets.find(
//       (reset) => reset.id == data.limitedUse.resetType
//     );
//     return {
//       max: data.limitedUse.maxUses,
//       value: data.limitedUse.numberUsed
//         ? data.limitedUse.maxUses - data.limitedUse.numberUsed
//         : data.limitedUse.maxUses,
//       per: resetType.value,
//       description: data.limitedUse.resetTypeDescription,
//     };
//   } else {
//     return { value: 0, max: 0, per: null };
//   }
// };

/**
 * Gets the ability which the to hit modifier is baed on
 * Melee: STR
 * Ranged: DEX
 * Finesse: STR || DEX
 * Thrown: STR, unless Finesse, then STR || DEX
 * @param {obj} data item data
 * @param {obj} weaponProperties weapon properties
 * @param {obj} weaponRange weapon range information
 * @param {obj} abilities character abilities (scores)
 */
let getAbility = (weaponProperties, weaponRange, abilities) => {
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
};

/**
 * Searches for a magical attack bonus granted by this weapon
 * @param {obj} data item data
 */
let getMagicalBonus = (data) => {
  let boni = data.definition.grantedModifiers.filter(
    (mod) => mod.type === "bonus" && mod.subType === "magic" && mod.value && mod.value !== 0
  );
  let bonus = boni.reduce((prev, cur) => prev + cur.value, 0);
  return bonus;
};

/**
 *
 * @param {obj} data item data
 * @param {obj} weaponProperties weapon properties
 * /* damage: { parts: [], versatile: '' }, * /
 */
let getDamage = (data, magicalDamageBonus) => {
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
};

export default function parseStaff(data, character) {
  /**
   * MAIN parseStaff
   */
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

  /* weaponType: { value: 'simpleM' }, */
  weapon.data.weaponType = getWeaponType(data);
  // properties: {
  //        amm: false,
  //        fin: false,
  //        hvy: true,
  //        lgt: false,
  //        rel: false,
  //        fir: false,
  //        rch: true,
  //        spc: false,
  //        thr: false,
  //        two: true,
  //        ver: false
  //    }
  weapon.data.properties = getProperties(data);

  /* proficient: true, */
  weapon.data.proficient = getProficient(data, weapon.data.weaponType, character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects);

  // description: {
  //        value: '',
  //        chat: '',
  //        unidentified: ''
  //    },
  weapon.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  /* source: '', */
  weapon.data.source = utils.parseSource(data.definition);

  /* quantity: 1, */
  weapon.data.quantity = data.quantity ? data.quantity : 1;

  /* weight */
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  weapon.data.weight = totalWeight / bundleSize;

  /* attuned: false, */
  weapon.data.attuned = getAttuned(data);

  /* equipped: false, */
  weapon.data.equipped = getEquipped(data);

  /* rarity: '', */
  weapon.data.rarity = data.definition.rarity;

  /* identified: true, */
  weapon.data.identified = true;

  /* activation: { type: '', cost: 0, condition: '' }, */
  weapon.data.activation = { type: "action", cost: 1, condition: "" };

  /* duration: { value: null, units: '' }, */
  // we leave that as-is

  /* target: { value: null, units: '', type: '' }, */
  // we leave that as-is

  /* range: { value: null, long: null, units: '' }, */
  weapon.data.range = getRange(data);

  // we don't parse this because the weapon then becomes a limited use item.
  // this field is normally reserved on weapons for magic effects. so we handle it there.
  /* uses: { value: 0, max: 0, per: null }, */
  // weapon.data.uses = getUses(data);

  /* ability: null, */
  weapon.data.ability = getAbility(weapon.data.properties, weapon.data.range, character.flags.ddbimporter.dndbeyond.effectAbilities);

  /* actionType: null, */
  weapon.data.actionType = weapon.data.range.long === 5 ? "mwak" : "rwak";

  /* attackBonus: 0, */
  weapon.data.attackBonus = getMagicalBonus(data);

  /* chatFlavor: '', */
  // we leave that as-is

  /* critical: null, */
  // we leave that as-is

  /* damage: { parts: [], versatile: '' }, */
  // again, we are adding the magical damage bonus to the damage, and again
  // even while I dislike to not use weapon.data.attackBonus, it makes it more clear about what is going on
  weapon.data.damage = getDamage(data, getMagicalBonus(data));

  /* formula: '', */
  // we leave that as-is

  /* save: { ability: '', dc: null } */
  // we leave that as-is

  return weapon;
}
