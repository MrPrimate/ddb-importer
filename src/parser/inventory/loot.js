import utils from "../../utils.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";

function getItemType(data) {
  let result = {
    type: "loot"
  };

  const foundryTypes = ["weapon", "equipment", "consumable", "tool", "loot", "class", "spell", "feat", "backpack"];

  const itemTypes =
    data.definition.tags && Array.isArray(data.definition.tags)
      ? [data.definition.type.toLowerCase(), ...data.definition.tags.map((t) => t.toLowerCase())]
      : [data.definition.type.toLowerCase()];

  let itemType = itemTypes
    .map((itemType) => {
      if (itemType === "container") return "backpack";
      if (itemType === "consumable") return "consumable";
      return foundryTypes.find((t) => t.indexOf(itemType) !== -1 || itemType.indexOf(t) !== -1);
    })
    .reduce(
      (itemType, currentType) => (currentType !== undefined && itemType === undefined ? currentType : itemType),
      undefined
    );

  if (!itemType) {
    const isConsumable =
      data.definition.type === "Gear" &&
      data.definition.subType === "Adventuring Gear" &&
      data.definition.tags.includes('Utility') &&
      ((data.definition.tags.includes('Damage') &&
      data.definition.tags.includes('Combat')) ||
      data.definition.tags.includes('Healing'));
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
  const type = getItemType(data);

  let loot = {
    name: data.definition.name,
    type: type.type,
    data: JSON.parse(utils.getTemplate("loot")), // was: tool
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  if (type.consumableType) {
    loot.data.consumableType = type.consumableType;
    loot.data.uses = getConsumableUses(data);
  }
  loot.data.description = getDescription(data);
  loot.data.source = utils.parseSource(data.definition);
  loot.data.quantity = getQuantity(data);
  loot.data.weight = getSingleItemWeight(data);
  loot.data.equipped = getEquipped(data);
  loot.data.rarity = getItemRarity(data);
  loot.data.identified = true;

  return loot;
}
