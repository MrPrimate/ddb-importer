import utils from "../../utils.js";

/**
 * Checks if the character can attune to an item and if yes, if he is attuned to it.
 */
let getAttuned = (data) => {
  if (data.definition.canAttune !== undefined && data.definition.canAttune === true) {
    return data.isAttuned;
  } else {
    return false;
  }
};

/**
 * Checks if the character can equip an item and if yes, if he is has it currently equipped.
 */
let getEquipped = (data) => {
  if (data.definition.canEquip !== undefined && data.definition.canEquip === true) {
    return data.equipped;
  } else {
    return false;
  }
};

const getItemType = (data) => {
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
      } else {
        result.consumableType = "trinket";
      }
    }
  }

  return result;
};

export default function parseLoot(data, itemType) {
  /**
   * MAIN parseLoot
   */
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
  }

  // description: {
  //     value: '',
  //     chat: '',
  //     unidentified: ''
  // },
  loot.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  /* source: '', */
  loot.data.source = utils.parseSource(data.definition);

  /* quantity: 1, */
  loot.data.quantity = data.quantity ? data.quantity : 1;

  /* weight */
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  loot.data.weight = totalWeight / bundleSize;

  /* attuned: false, */
  loot.data.attuned = getAttuned(data);

  /* equipped: false, */
  loot.data.equipped = getEquipped(data);

  /* rarity: '', */
  loot.data.rarity = data.definition.rarity;

  /* identified: true, */
  loot.data.identified = true;

  return loot;
}
