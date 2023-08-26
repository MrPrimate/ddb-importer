import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription, getCapacity } from "./common.js";
import DICTIONARY from "../../dictionary.js";

function getItemType(data, typeHint) {
  let result = {
    type: "loot"
  };

  if (data.definition.isContainer
    || ["Mount", "Vehicle"].includes(data.definition.subType)
    || ["Vehicle", "Mount"].includes(typeHint)
  ) {
    return {
      type: "backpack",
    };
  } else if (data.definition.name.startsWith("Lantern,")
    || ["Lamp", "Healer's Kit"].includes(data.definition.name)
  ) {
    return {
      type: "consumable",
      consumableType: "trinket",
    };
  }

  const itemTypes = data.definition.tags && Array.isArray(data.definition.tags)
    ? [data.definition.type.toLowerCase(), ...data.definition.tags.map((t) => t.toLowerCase())]
    : [data.definition.type.toLowerCase()];

  let itemType = itemTypes
    .map((itemType) => {
      if (itemType === "container") return "backpack";
      if (itemType === "consumable") return "consumable";
      return DICTIONARY.types.full.find((t) => t.indexOf(itemType) !== -1 || itemType.indexOf(t) !== -1);
    })
    .reduce(
      (itemType, currentType) => (currentType !== undefined && itemType === undefined ? currentType : itemType),
      undefined
    );

  if (!itemType) {
    const isConsumable
      = data.definition.type === "Gear"
      && ["Adventuring Gear"].includes(data.definition.subType);
      // && data.definition.subType === "Adventuring Gear"
      // && data.definition.tags.includes('Utility')
      // && ((data.definition.tags.includes('Damage')
      // && data.definition.tags.includes('Combat'))
      // || data.definition.tags.includes('Healing'));
    if (isConsumable) itemType = "consumable";
  }

  if (itemType) {
    result.type = itemType;
    if (itemType === "consumable") {
      if (data.definition.name.includes('vial') || data.definition.name.includes('flask')) {
        result.consumableType = "potion";
      } else if (data.definition.name.startsWith("Ration")) {
        result.consumableType = "food";
      } else {
        result.consumableType = "trinket";
      }
    }
  }

  return result;
}

export default function parseLoot(data, itemType) {
  const type = getItemType(data, itemType);

  let loot = {
    name: data.definition.name,
    type: type.type,
    system: JSON.parse(utils.getTemplate(type.type)),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  if (type.consumableType) {
    loot.system.consumableType = type.consumableType;
    loot.system.uses = getConsumableUses(data);
  }
  loot.system.description = getDescription(data);
  loot.system.source = DDBHelper.parseSource(data.definition);
  loot.system.quantity = getQuantity(data);
  loot.system.weight = getSingleItemWeight(data);
  loot.system.equipped = getEquipped(data);
  loot.system.rarity = getItemRarity(data);
  loot.system.identified = true;
  loot.system.cost = data.definition.cost;

  if (type.type === "backpack") {
    loot.system.capacity = getCapacity(data);
  }
  return loot;
}
