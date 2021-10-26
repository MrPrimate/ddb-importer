import utils from "../../utils.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity } from "./common.js";


function getActionType(data) {
  if (data.definition.tags.includes("Healing")) {
    return "heal";
  } else if (data.definition.tags.includes("Damage")) {
    // ranged spell attack. This is a good guess
    return "rsak";
  } else {
    return "other";
  }
}

function getDamage(data, actionType) {
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
}

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
  let potion = {
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

  potion.data.consumableType = "potion";
  potion.data.uses = getConsumableUses(data);
  potion.data.description = {
    value: data.definition.description,
    chat: data.definition.snippet ? data.definition.snippet : data.definition.description,
    unidentified: data.definition.type,
  };
  potion.data.source = utils.parseSource(data.definition);
  potion.data.quantity = getQuantity(data);
  potion.data.weight = getSingleItemWeight(data);
  potion.data.equipped = getEquipped(data);
  potion.data.rarity = getItemRarity(data);
  potion.data.identified = true;
  potion.data.activation = { type: "action", cost: 1, condition: "" };
  potion.data.duration = getDuration(data);
  potion.data.actionType = getActionType(data);
  potion.data.damage = getDamage(data, getActionType(data));

  return potion;
}
