import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getMagicalBonus, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

/**
 * Gets the range(s) of a given weapon
 */
function getRange(data) {
  // range: { value: null, long: null, units: '' },
  return {
    value: data.definition.range ? data.definition.range : null,
    long: data.definition.longRange ? data.definition.longRange : null,
    units: (data.definition.range || data.definition.range) ? "ft." : "",
  };
}

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
      const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
      if (die) {
        parts.push([die.diceString, mod.subType]);
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
  let template = utils.getTemplate("consumable");
  let ammunition = {
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: "consumable",
    system: template,
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  ammunition.system.description = getDescription(data);
  ammunition.system.source = DDBHelper.parseSource(data.definition);
  ammunition.system.properties = [];
  ammunition.system.quantity = getQuantity(data);
  ammunition.system.weight = getSingleItemWeight(data);
  ammunition.system.equipped = getEquipped(data);
  ammunition.system.rarity = getItemRarity(data);
  ammunition.system.identified = true;
  ammunition.system.activation = { type: "action", cost: 1, condition: "" };
  ammunition.system.range = getRange(data);
  ammunition.system.ability = "";
  ammunition.system.actionType = "rwak";
  ammunition.system.attack.bonus = getMagicalBonus(data);
  ammunition.system.damage = getDamage(data, getMagicalBonus(data));
  ammunition.system.type.value = "ammo";

  return ammunition;
}
