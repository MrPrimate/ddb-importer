import utils from "../../utils.js";

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
  return {
    value: data.definition.range ? data.definition.range : null,
    long: data.definition.longRange ? data.definition.longRange : null,
    units: (data.definition.range || data.definition.range) ? "ft." : "",
  };
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
  let parts = [];

  // first damage part
  // blowguns and other weapons rely on ammunition that provides the damage parts
  if (data.definition.damage && data.definition.damage.diceString && data.definition.damageType) {
    // if there is a magical damage bonus, it probably should only be included into the first damage part.
    parts.push([
      utils.parseDiceString(data.definition.damage.diceString + `+${magicalDamageBonus}`).diceString,
      data.definition.damageType.toLowerCase(),
    ]);
  }

  // additional damage parts
  // Note: For the time being, restricted additional bonus parts are not included in the damage
  //       The Saving Throw Freature within Foundry is not fully implemented yet, to this will/might change
  data.definition.grantedModifiers
    .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction.length === 0)
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
    versatile: "",
  };

  return result;
};

export default function parseAmmunition(data, itemType) {
  /**
   * MAIN parseWeapon
   */
  let template = JSON.parse(utils.getTemplate("consumable"));
  let ammunition = {
    name: data.definition.name,
    type: "consumable",
    data: template,
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  ammunition.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  ammunition.data.source = utils.parseSource(data.definition);

  ammunition.data.properties = {};

  ammunition.data.quantity = data.quantity ? data.quantity : 1;

  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  ammunition.data.weight = (totalWeight / bundleSize) * (ammunition.data.quantity / bundleSize);

  ammunition.data.attuned = getAttuned(data);

  ammunition.data.equipped = getEquipped(data);

  ammunition.data.rarity = data.definition.rarity;

  ammunition.data.identified = true;

  ammunition.data.activation = { type: "action", cost: 1, condition: "" };

  /* duration: { value: null, units: '' }, */
  // we leave that as-is

  /* target: { value: null, units: '', type: '' }, */
  // we leave that as-is

  /* range: { value: null, long: null, units: '' }, */
  ammunition.data.range = getRange(data);

  ammunition.data.ability = "";

  ammunition.data.actionType = "rwak";

  ammunition.data.attackBonus = getMagicalBonus(data);

  ammunition.data.damage = getDamage(data, getMagicalBonus(data));

  ammunition.data.consumableType = "ammo";

  return ammunition;
}
