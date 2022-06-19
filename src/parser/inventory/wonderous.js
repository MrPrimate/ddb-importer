import utils from "../../utils.js";
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
  /**
   * MAIN parseEquipment
   */
  let item = {
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

  //
  // "armor": {
  // "type": "trinket",
  // "value": 10,
  // "dex": null
  // }
  item.data.armor = {
    type: "trinket",
    value: 10,
    dex: null,
  };

  /* "strength": 0 */
  item.data.strength = 0;

  /* "stealth": false,*/
  item.data.stealth = false;
  item.data.proficient = true;
  item.data.description = getDescription(data);
  item.data.source = utils.parseSource(data.definition);
  item.data.quantity = getQuantity(data);
  item.data.weight = getSingleItemWeight(data);
  item.data.equipped = getEquipped(data);
  item.data.rarity = getItemRarity(data);
  item.data.identified = true;
  item.data.uses = getUses(data);
  item.data.capacity = getCapacity(data);

  return item;
}
