import utils from "../../utils.js";

/**
 * Gets Limited uses information, if any
 */
let getUses = (data) => {
  // uses: { value: 0, max: 0, per: null }
  if (data.limitedUse) {
    return {
      max: data.limitedUse.maxUses,
      value: data.limitedUse.numberUsed
        ? data.limitedUse.maxUses - data.limitedUse.numberUsed
        : data.limitedUse.maxUses,
      per: "charges",
      autoUse: false,
      autoDestroy: true,
    };
  } else {
    // default
    return { value: 0, max: 0, per: null, autoUse: false, autoDestroy: false };
  }
};

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

export default function parseScroll(data) {
  /**
   * MAIN parseWeapon
   */
  let consumable = {
    name: data.definition.name,
    type: "consumable",
    data: JSON.parse(utils.getTemplate("consumable")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: data.definition.type,
        },
      },
    },
  };

  // "consumableType": "potion",
  consumable.data.consumableType = "scroll";
  consumable.data.uses = getUses(data);

  // description: {
  //     value: '',
  //     chat: '',
  //     unidentified: ''
  // },
  consumable.data.description = {
    value: data.definition.description,
    chat: data.definition.description,
    unidentified: data.definition.type,
  };

  /* source: '', */
  consumable.data.source = utils.parseSource(data.definition);

  /* quantity: 1, */
  consumable.data.quantity = data.quantity ? data.quantity : 1;

  /* weight */
  const bundleSize = data.definition.bundleSize ? data.definition.bundleSize : 1;
  const totalWeight = data.definition.weight ? data.definition.weight : 0;
  consumable.data.weight = totalWeight / bundleSize;

  /* attuned: false, */
  consumable.data.attuned = getAttuned(data);

  /* equipped: false, */
  consumable.data.equipped = getEquipped(data);

  /* rarity: '', */
  consumable.data.rarity = data.definition.rarity;

  /* identified: true, */
  consumable.data.identified = true;

  /* activation: { type: '', cost: 0, condition: '' }, */
  consumable.data.activation = { type: "action", cost: 1, condition: "" };

  /* duration: { value: null, units: '' }, */
  // we leave that as-is

  /* target: { value: null, units: '', type: '' }, */
  // we leave that as-is

  /* range: { value: null, long: null, units: '' }, */
  // we leave that as is

  consumable.data.actionType = "other";

  // Trying to find the spell name for this scroll

  return consumable;
}
