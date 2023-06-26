import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import {
  getItemRarity,
  getEquipped,
  getUses,
  getSingleItemWeight,
  getQuantity,
  getDescription,
  getCapacity,
} from "./common.js";

export default function parseWonderous(data) {

  const isContainer = data.definition.isContainer;
  const type = isContainer ? "backpack" : "equipment";
  /**
   * MAIN parseEquipment
   */
  let item = {
    name: data.definition.name,
    type,
    system: JSON.parse(utils.getTemplate(type)),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };


  if (!isContainer) {
    //
    // "armor": {
    // "type": "trinket",
    // "value": 10,
    // "dex": null
    // }
    item.system.armor = {
      type: "trinket",
      value: 10,
      dex: null,
    };

    /* "strength": 0 */
    item.system.strength = 0;

    /* "stealth": false,*/
    item.system.stealth = false;
    item.system.proficient = true;
  }

  item.system.description = getDescription(data);
  item.system.source = DDBHelper.parseSource(data.definition);
  item.system.quantity = getQuantity(data);
  item.system.weight = getSingleItemWeight(data);
  item.system.equipped = getEquipped(data);
  item.system.rarity = getItemRarity(data);
  item.system.identified = true;
  item.system.uses = getUses(data);
  item.system.capacity = getCapacity(data);

  return item;
}
