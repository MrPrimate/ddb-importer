import utils from "../../utils.js";
import { getItemRarity, getAttuned, getEquipped, getUses } from "./common.js";

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
  item.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };

  item.data.source = utils.parseSource(data.definition);
  item.data.quantity = data.quantity ? data.quantity : 1;
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  item.data.weight = totalWeight / bundleSize;
  item.data.attuned = getAttuned(data);
  item.data.equipped = getEquipped(data);
  item.data.rarity = getItemRarity(data);
  item.data.identified = true;
  item.data.uses = getUses(data);

  return item;
}
