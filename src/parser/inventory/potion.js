import utils from "../../utils.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";


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
      if (healingModifier) {
        const healingDie = healingModifier.dice ? healingModifier.dice : healingModifier.die ? healingModifier.die : undefined;
        if (healingDie?.diceString) {
          damage.parts = [[healingDie.diceString + "[healing] ", "healing"]];
        } else if (healingModifier.fixedValue) {
          damage.parts = [[healingModifier.fixedValue + "[healing] ", "healing"]];
        }
      }
      break;
    }
    case "rsak": {
      // damage potion
      const damageModifier = data.definition.grantedModifiers.find((mod) => mod.type === "damage" && (mod.dice || mod.die));
      if (damageModifier) {
        const damageDie = damageModifier.dice ? damageModifier.dice : damageModifier.die ? damageModifier.die : undefined;
        if (damageDie?.diceString) {
          damage.parts = [[damageDie.diceString + `[${damageModifier.subType}] `, damageModifier.subType]];
        } else if (damageModifier.fixedValue) {
          damage.parts = [[damageModifier.fixedValue + `[${damageModifier.subType}] `, damageModifier.subType]];
        }
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
    system: JSON.parse(utils.getTemplate("consumable")),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: itemType,
        },
      },
    },
  };

  potion.system.consumableType = "potion";
  potion.system.uses = getConsumableUses(data);
  potion.system.description = getDescription(data);
  potion.system.source = utils.parseSource(data.definition);
  potion.system.quantity = getQuantity(data);
  potion.system.weight = getSingleItemWeight(data);
  potion.system.equipped = getEquipped(data);
  potion.system.rarity = getItemRarity(data);
  potion.system.identified = true;
  potion.system.activation = { type: "action", cost: 1, condition: "" };
  potion.system.duration = getDuration(data);
  potion.system.actionType = getActionType(data);
  potion.system.damage = getDamage(data, getActionType(data));

  return potion;
}
