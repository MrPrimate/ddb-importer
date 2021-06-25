import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";
import logger from "../../logger.js";

export function getSensesMap(data) {
  let senses = {
    darkvision: 0,
    blindsight: 0,
    tremorsense: 0,
    truesight: 0,
    units: "ft",
    special: ""
  };

  // custom senses
  if (data.character.customSenses) {
    data.character.customSenses
      .filter((sense) => sense.distance)
      .forEach((sense) => {
        const s = DICTIONARY.character.senses.find((s) => s.id === sense.senseId);
        if (s && sense.distance) {
          senses[s.name.toLowerCase()] = sense.distance;
        } else {
          senses.special += `${sense.distance}; `;
        }
      });
  }

  // Base senses
  for (const senseName in senses) {
    utils.filterBaseModifiers(data, "set-base", senseName).forEach((sense) => {
      if (sense.value > senses[senseName]) {
        senses[senseName] = sense.value;
      }
    });
  }

  // Devils Sight gives bright light to 120 foot instead of normal darkvision
  utils
    .filterBaseModifiers(data, "set-base", "darkvision", [
      "You can see normally in darkness, both magical and nonmagical",
    ])
    .forEach((sense) => {
      if (sense.value > senses['darkvision']) {
        senses['darkvision'] = sense.value;
        senses.special += "You can see normally in darkness, both magical and nonmagical.";
      }
    });

  // Magical bonuses and additional, e.g. Gloom Stalker
  utils
    .filterBaseModifiers(data, "sense", "darkvision", ["", null, "plus 60 feet if wearer already has Darkvision"])
    .forEach((mod) => {
      const hasSense = mod.subType in senses;
      if (hasSense) {
        senses[mod.subType] += mod.value;
      } else {
        senses.special += ` ${mod.value},`;
      }
    });

  return senses;

}

export function getSensesLookup(data) {
  // const low = "1.1.0";
  // const high = "1.2.0"

  // const compareLowHigh = utils.versionCompare(low, high);
  // const compareSame = utils.versionCompare(high, high);
  // const compareHighLow = utils.versionCompare(high, low);
  // console.warn(`${compareLowHigh}-${compareSame}-${compareHighLow}`);
  // // -1-0-1

  // dnd5e 1.2.0 introduced a different sense system
  let senses;

  try {
    senses = getSensesMap(data);
  } catch (err) {
    logger.error(err);
    logger.error(err.stack);
    throw new Error("Sense parsing failed. You might need to update your D&D 5e system to a newer version");
  }

  return senses;
}

export function getSenses(data) {
  return getSensesMap(data);
}
