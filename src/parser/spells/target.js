import DICTIONARY from "../../dictionary.js";

/**
 * Does the spell target creatures?
 * @param {*} data
 */
let doesTargetCreature = (data) => {
  const creature = /You touch a creature|You touch a willing creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range/gi;
  const creaturesRange = /(humanoid|monster|creature|target)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
  return data.definition.description.match(creature) || data.definition.description.match(creaturesRange);
};

/**
 * Get Target Values
 * Uses regex magic to try and determine the number of creatures affected
 * @param {*} data
 */
let getTargetValues = (data) => {
  const numCreatures = /(?!At Higher Levels.*)(\w*) (falling )?(willing )?(creature|target|monster|celestial|fiend|fey|corpse(s)? of|humanoid)(?!.*you have animated)/gim;
  const targets = [...data.definition.description.matchAll(numCreatures)];
  const targetValues = targets
    .filter((target) => {
      const matches = DICTIONARY.numbers.filter((n) => n.natural === target[1].toLowerCase());
      return Array.isArray(matches) && !!matches.length;
    })
    .map((target) => DICTIONARY.numbers.find((n) => n.natural === target[1].toLowerCase()).num);

  if (Array.isArray(targetValues) && !!targetValues.length) {
    return Math.max(...targetValues);
  } else {
    return null;
  }
};

/**
 * Spell targets
 */
// eslint-disable-next-line complexity
export function getTarget(data) {
  const result = {
    value: null,
    units: null,
    type: null,
    width: null,
  };

  // if spell is an AOE effect get some details
  if (data.definition.range.aoeType && data.definition.range.aoeValue) {
    result.value = parseInt(data.definition.range.aoeValue);
    result.type = data.definition.range.aoeType.toLowerCase();
    result.units = "ft";
    return result;
  }

  // does the spell target a creature?
  const creatures = doesTargetCreature(data);

  if (creatures) {
    result.value = getTargetValues(data);
  }

  const rangeValue = foundry.utils.getProperty(data, "definition.range.rangeValue");

  switch (data.definition.range.origin) {
    case "Touch":
      if (creatures) {
        result.units = "1";
        result.type = "creature";
      }
      break;
    case "Self": {
      const dmgSpell = data.definition.modifiers.some((mod) => mod.type === "damage");
      if (dmgSpell && rangeValue) {
        result.value = rangeValue;
        result.units = "ft";
        result.type = "radius";
      } else if (dmgSpell) {
        result.type = "creature";
      } else {
        result.type = "self";
      }
      break;
    }
    case "None":
      result.type = "none";
      break;
    case "Ranged":
      if (creatures) result.type = "creature";
      break;
    case "Feet":
      if (creatures) result.type = "creature";
      break;
    case "Miles":
      if (creatures) result.type = "creature";
      break;
    case "Sight":
    case "Special":
      result.units = "special";
      break;
    case "Any":
      result.units = "any";
      break;
    case undefined:
      result.type = null;
      break;
    // no default
  }

  // wall type spell?
  if (data.definition.name.includes("Wall")) {
    result.type = "wall";
    result.units = "ft";

    if (data.definition.description.includes("ten 10-foot-")) {
      result.value = 100;
    } else {
      const wallReg = new RegExp(/ (\d*) feet long/);
      const matches = data.definition.description.match(wallReg);
      if (matches) {
        result.value = parseInt(matches[1]);
      }
    }
    const thickReg = new RegExp(/ (\d*) foot (thick|wide)/);
    const thickMatch = data.definition.description.match(thickReg);
    if (thickMatch && thickMatch[1] > 5) {
      result.width = parseInt(thickMatch[1]);
    }
  }

  return result;
}
