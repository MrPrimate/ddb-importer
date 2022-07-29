import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

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
        if (s && sense.distance && Number.isInteger(sense.distance)) {
          senses[s.name.toLowerCase()] = parseInt(sense.distance);
        } else {
          senses.special += `${sense.distance}; `;
        }
      });
  }

  // Base senses
  for (const senseName in senses) {
    utils.filterBaseModifiers(data, "set-base", senseName).forEach((sense) => {
      if (Number.isInteger(sense.value) && sense.value > senses[senseName]) {
        senses[senseName] = parseInt(sense.value);
      }
    });
  }

  // Devils Sight gives bright light to 120 foot instead of normal darkvision
  utils
    .filterBaseModifiers(data, "set-base", "darkvision", [
      "You can see normally in darkness, both magical and nonmagical",
    ])
    .forEach((sense) => {
      if (Number.isInteger(sense.value) && sense.value > senses['darkvision']) {
        senses['darkvision'] = parseInt(sense.value);
        senses.special += "You can see normally in darkness, both magical and nonmagical.";
      }
    });

  // Magical bonuses and additional, e.g. Gloom Stalker
  utils
    .filterBaseModifiers(data, "sense", "darkvision", ["", null, "plus 60 feet if wearer already has Darkvision"])
    .forEach((mod) => {
      const hasSense = mod.subType in senses;
      if (hasSense && mod.value && Number.isInteger(mod.value)) {
        senses[mod.subType] += parseInt(mod.value);
      } else {
        senses.special += ` ${mod.value},`;
      }
    });

  return senses;

}

export function getSenses(data) {
  return getSensesMap(data);
}
