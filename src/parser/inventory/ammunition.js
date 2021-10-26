import utils from "../../utils.js";
import { getItemRarity, getEquipped, getMagicalBonus, getSingleItemWeight, getQuantity } from "./common.js";

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
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };
  ammunition.data.source = utils.parseSource(data.definition);
  ammunition.data.properties = {};
  ammunition.data.quantity = getQuantity(data);
  ammunition.data.weight = getSingleItemWeight(data);
  ammunition.data.equipped = getEquipped(data);
  ammunition.data.rarity = getItemRarity(data);
  ammunition.data.identified = true;
  ammunition.data.activation = { type: "action", cost: 1, condition: "" };
  ammunition.data.range = getRange(data);
  ammunition.data.ability = "";
  ammunition.data.actionType = "rwak";
  ammunition.data.attackBonus = getMagicalBonus(data);
  ammunition.data.damage = getDamage(data, getMagicalBonus(data));
  ammunition.data.consumableType = "ammo";

  return ammunition;
}
