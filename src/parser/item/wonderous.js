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
  getCurrency,
  getWeightless,
} from "./common.js";

export default function parseWonderous(ddbData, { ddbTypeOverride = null, armorType = "trinket" } = {}) {
  const isContainer = ddbData.definition.isContainer;
  const isClothingTag = ddbData.definition.tags.includes('Outerwear')
    || ddbData.definition.tags.includes('Footwear')
    || ddbData.definition.tags.includes('Clothing');

  ddbTypeOverride = isClothingTag && !isContainer ? "Clothing" : ddbTypeOverride;

  const type = isContainer ? "container" : "equipment";
  /**
   * MAIN parseEquipment
   */
  let item = {
    _id: foundry.utils.randomID(),
    name: ddbData.definition.name,
    type,
    system: utils.getTemplate(type),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: ddbTypeOverride ?? ddbData.definition.type,
        },
      },
    },
  };

  if (isContainer) {
    if (ddbData.currency) item.system.currency = getCurrency(ddbData);
    if (getWeightless(ddbData)) {
      item.system.properties = utils.addToProperties(item.system.properties, "weightlessContents");
    }
  } else {
    //
    // "armor": {
    // "type": "trinket",
    // "value": 10,
    // "dex": null
    // }
    item.system.armor = {
      value: null,
      dex: null,
    };

    item.system.type.value = isClothingTag && !isContainer ? "clothing" : armorType;

    /* "strength": 0 */
    item.system.strength = 0;

    /* "stealth": false,*/
    utils.removeFromProperties(item.system.properties, "stealthDisadvantage");
    item.system.proficient = true;
  }

  item.system.description = getDescription(ddbData);
  item.system.source = DDBHelper.parseSource(ddbData.definition);
  item.system.quantity = getQuantity(ddbData);
  item.system.weight = getSingleItemWeight(ddbData);
  item.system.equipped = getEquipped(ddbData);
  item.system.rarity = getItemRarity(ddbData);
  item.system.identified = true;
  item.system.uses = getUses(ddbData);
  item.system.capacity = getCapacity(ddbData);

  return item;
}
