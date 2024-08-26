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
  ammunition.system.properties = [];

  ammunition.system.ability = "";
  ammunition.system.actionType = "rwak";

  ammunition.system.damage = getDamage(data);


  return ammunition;
}
