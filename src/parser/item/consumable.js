import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import { getItemRarity, getEquipped, getConsumableUses, getSingleItemWeight, getQuantity, getDescription } from "./common.js";


export function getActionType(data) {
  if (data.definition.tags.includes("Healing")) {
    return "heal";
  } else if (data.definition.tags.includes("Damage")) {
    // ranged spell attack. This is a good guess
    return "rsak";
  } else {
    return "other";
  }
}

export function getDamage(data, actionType) {
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
        const healingDie = healingModifier.dice
          ? healingModifier.dice
          : healingModifier.die
            ? healingModifier.die
            : undefined;
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
      const damageModifier = data.definition.grantedModifiers.find((mod) =>
        mod.type === "damage" && (mod.dice || mod.die)
      );
      if (damageModifier) {
        const damageDie = damageModifier.dice
          ? damageModifier.dice
          : damageModifier.die
            ? damageModifier.die
            : undefined;
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

export function getDuration(data) {
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


export default function parseConsumable(ddbItem, { consumableTypeOverride = null, ddbTypeOverride = null } = {}) {
  let item = {
    _id: foundry.utils.randomID(),
    name: ddbItem.definition.name,
    type: "consumable",
    system: utils.getTemplate("consumable"),
    flags: {
      ddbimporter: {
        dndbeyond: {
          type: ddbTypeOverride ?? ddbItem.definition.type,
        },
      },
    },
  };

  item.system.type.value = consumableTypeOverride?.toLowerCase() ?? ddbItem.definition.filterType.toLowerCase();
  item.system.uses = getConsumableUses(ddbItem);
  item.system.description = getDescription(ddbItem);
  item.system.source = DDBHelper.parseSource(ddbItem.definition);
  item.system.quantity = getQuantity(ddbItem);
  item.system.weight = getSingleItemWeight(ddbItem);
  item.system.equipped = getEquipped(ddbItem);
  item.system.rarity = getItemRarity(ddbItem);
  item.system.identified = true;
  item.system.activation = { type: "action", cost: 1, condition: "" };
  item.system.duration = getDuration(ddbItem);
  item.system.actionType = getActionType(ddbItem);

  if (item.system.type.value === "potion") {
    item.system.damage = getDamage(ddbItem, getActionType(ddbItem));
  } else if (item.system.type.value === "wand") {
    item.system.properties.push("mgc");
  }

  return item;
}
