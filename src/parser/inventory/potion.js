import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

/**
 * Gets Limited uses information, if any
 * uses: { value: 0, max: 0, per: null, autoUse: false, autoDestroy: false };
 */
let getUses = (data) => {
  if (data.limitedUse?.maxUses) {
    let resetType = DICTIONARY.resets.find((reset) => reset.id == data.limitedUse.resetType);
    return {
      max: data.limitedUse.maxUses,
      value: data.limitedUse.numberUsed
        ? data.limitedUse.maxUses - data.limitedUse.numberUsed
        : data.limitedUse.maxUses,
      per: resetType.value,
      autoUse: false,
      autoDestroy: true,
    };
  } else {
    return { value: 1, max: 1, per: "charges", autoUse: false, autoDestroy: true };
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

let getActionType = (data) => {
  if (data.definition.tags.includes("Healing")) {
    return "heal";
  } else if (data.definition.tags.includes("Damage")) {
    // ranged spell attack. This is a good guess
    return "rsak";
  } else {
    return "other";
  }
};

let getDamage = (data, actionType) => {
  let damage = { parts: [], versatile: "" };
  // is this a damage potion
  switch (actionType) {
    case "heal": {
      // healing potion
      // we only get the first matching modifier
      const healingModifier = data.definition.grantedModifiers.find(
        (mod) => mod.type === "bonus" && mod.subType === "hit-points"
      );
      if (healingModifier && healingModifier.dice) {
        damage.parts = [[healingModifier.dice.diceString + "[healing] ", "healing"]];
      } else if (healingModifier && healingModifier.fixedValue) {
        damage.parts = [[healingModifier.fixedValue + "[healing] ", "healing"]];
      }
      break;
    }
    case "rsak": {
      // damage potion
      const damageModifier = data.definition.grantedModifiers.find((mod) => mod.type === "damage" && mod.dice);
      if (damageModifier && damageModifier.dice) {
        damage.parts = [[damageModifier.dice.diceString + `[${damageModifier.subType}] `, damageModifier.subType]];
      } else if (damageModifier && damageModifier.fixedValue) {
        damage.parts = [[damageModifier.fixedValue + `[${damageModifier.subType}] `, damageModifier.subType]];
      }
      break;
    }
    // no default
  }
  return damage;
};

function getDuration(data) {
  let duration = {
    value: null,
    units: "",
  };

  if (data.definition.duration) {
    if (data.definition.duration.durationUnit !== null) {
      duration.units = data.definition.duration.durationUnit.toLowerCase();
    } else {
      duration.units = data.definition.duration.durationType.toLowerCase().substring(0, 4);
    }
    if (data.definition.duration.durationInterval) duration.value = data.definition.duration.durationInterval;
  } else {
    const durationArray = [
      { foundryUnit: "day", descriptionMatches: ["day", "days"] },
      { foundryUnit: "hour", descriptionMatches: ["hour", "hours"] },
      { foundryUnit: "inst", descriptionMatches: ["instant", "instantaneous"] },
      { foundryUnit: "minute", descriptionMatches: ["minute", "minutes"] },
      { foundryUnit: "month", descriptionMatches: ["month", "months"] },
      { foundryUnit: "perm", descriptionMatches: ["permanent"] },
      { foundryUnit: "round", descriptionMatches: ["round", "rounds"] },
     // { foundryUnit: "spec", descriptionMatches: [null] },
      { foundryUnit: "turn", descriptionMatches: ["turn", "turns"] },
      { foundryUnit: "year", descriptionMatches: ["year", "years"] },
    ];
    // attempt to parse duration
    const descriptionUnits = durationArray.map((unit) => unit.descriptionMatches).flat().join("|");
    const durationExpression = new RegExp(`(\\d*)(?:\\s)(${descriptionUnits})`);
    const durationMatch = data.definition.description.match(durationExpression);

    if (durationMatch) {
      duration.units = durationArray.find((duration) => duration.descriptionMatches.includes(durationMatch[2])).foundryUnit;
      duration.value = durationMatch[1];
    }
  }
  return duration;
}


export default function parsePotion(data, itemType) {
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
          type: itemType,
        },
      },
    },
  };

  // "consumableType": "potion",
  consumable.data.consumableType = "potion";
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
  consumable.data.duration = getDuration(data);

  /* target: { value: null, units: '', type: '' }, */
  // we leave that as-is

  /* range: { value: null, long: null, units: '' }, */
  // we leave that as is

  consumable.data.actionType = getActionType(data);

  consumable.data.damage = getDamage(data, getActionType(data));

  consumable.data.uses = getUses(data);

  return consumable;
}
