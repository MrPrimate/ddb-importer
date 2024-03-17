import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription, getCapacity, getPrice, getCurrency, getWeightless } from "./common.js";
import DICTIONARY from "../../dictionary.js";


const LOOT_ITEM = [
  "Abacus",
  "Barding",
  "Basic Fishing Equipment",
  "Bedroll",
  "Bell",
  "Bit and Bridle",
  "Blanket",
  "Block and Tackle",
  "Book",
  "Magnifying Glass",
  "Scale, Merchant's",
  "Signet Ring",
  "String",
];

const LOOT_TYPES = {
  "Gemstone": "gem",
  "Gem": "gem",
  "Art Object": "art",
  "Art": "art",
  "Material": "material",
  "Resource": "resource",
  "Treasure": "treasure",
  "Adventuring Gear": "gear",
  "Junk": "junk",
};

function getItemType(data, typeHint) {
  let result = {
    type: "loot"
  };

  if (data.definition.isContainer
    || ["Mount", "Vehicle"].includes(data.definition.subType)
    || ["Vehicle", "Mount"].includes(typeHint)
  ) {
    return {
      type: "container",
    };
  } else if (data.definition.name.startsWith("Lantern,")
    || ["Lamp", "Healer's Kit"].includes(data.definition.name)
  ) {
    return {
      type: "consumable",
      consumableType: "trinket",
    };
  } else if (["Waterskin"].includes(data.definition.name)) {
    return {
      type: "consumable",
      consumableType: "food",
    };
  } else if (data.definition.name.startsWith("Spell Scroll:")) {
    return {
      type: "consumable",
      consumableType: "scroll",
    };
  }

  const itemTypes = data.definition.tags && Array.isArray(data.definition.tags)
    ? [data.definition.type.toLowerCase(), ...data.definition.tags.map((t) => t.toLowerCase())]
    : [data.definition.type.toLowerCase()];

  let itemType = itemTypes
    .map((itemType) => {
      if (itemType === "container") return "container";
      if (itemType === "consumable") return "consumable";
      return DICTIONARY.types.full.find((t) => t.indexOf(itemType) !== -1 || itemType.indexOf(t) !== -1);
    })
    .reduce(
      (itemType, currentType) => (currentType !== undefined && itemType === undefined ? currentType : itemType),
      undefined
    );

  if (!itemType && data.definition.type === "Gear"
    && ["Adventuring Gear"].includes(data.definition.subType)
    && !LOOT_ITEM.includes(data.definition.name)
  ) {
    // && data.definition.subType === "Adventuring Gear"
    // && data.definition.tags.includes('Utility')
    // && ((data.definition.tags.includes('Damage')
    // && data.definition.tags.includes('Combat'))
    // || data.definition.tags.includes('Healing'));
    itemType = "consumable";
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
    _id: foundry.utils.randomID(),
    name: data.definition.name,
    type: type.type,
    system: utils.getTemplate(type.type),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  if (type.consumableType) {
    loot.system.type.value = type.consumableType;
    loot.system.uses = getConsumableUses(data);
  }
  loot.system.description = getDescription(data);
  loot.system.source = DDBHelper.parseSource(data.definition);
  loot.system.quantity = getQuantity(data);
  loot.system.weight = getSingleItemWeight(data);
  loot.system.equipped = getEquipped(data);
  loot.system.rarity = getItemRarity(data);
  loot.system.identified = true;
  loot.system.price = getPrice(data);

  if (type.type === "loot") {
    const lookup = LOOT_TYPES[itemType];
    if (lookup) foundry.utils.setProperty(loot, "system.type.value", lookup);
  } else if (type.type === "container") {
    loot.system.capacity = getCapacity(data);
    if (data.currency) loot.system.currency = getCurrency(data);
    if (getWeightless(data)) {
      loot.system.properties = utils.addToProperties(loot.system.properties, "weightlessContents");
    }
  }
  return loot;
}
