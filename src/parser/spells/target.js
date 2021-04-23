import DICTIONARY from "../../dictionary.js";

/**
 * Does the spell target creatures?
 * @param {*} data
 */
let doesTargetCreature = (data) => {
  const creature = /a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range/gi;
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
export function getTarget(data) {
  // if spell is an AOE effect get some details
  if (data.definition.range.aoeType && data.definition.range.aoeValue) {
    return {
      value: data.definition.range.aoeValue,
      type: data.definition.range.aoeType.toLowerCase(),
      units: "ft",
    };
  }

  // else lets try and fill in some target details
  let type = null;
  let units = null;
  let value = null;

  // does the spell target a creature?
  const creatures = doesTargetCreature(data);

  if (creatures) {
    value = getTargetValues(data);
  }

  switch (data.definition.range.origin) {
    case "Touch":
      units = "touch";
      if (creatures) type = "creature";
      break;
    case "Self": {
      const dmgSpell = data.definition.modifiers.some((mod) => mod.type === "damage");
      type = (dmgSpell) ? "creature" : "self";
      break;
    }
    case "None":
      type = "none";
      break;
    case "Ranged":
      if (creatures) type = "creature";
      break;
    case "Feet":
      if (creatures) type = "creature";
      break;
    case "Miles":
      if (creatures) type = "creature";
      break;
    case "Sight":
    case "Special":
      units = "special";
      break;
    case "Any":
      units = "any";
      break;
    case undefined:
      type = null;
      break;
    // no default
  }

  return {
    value: value,
    units: units,
    type: type,
  };
}
