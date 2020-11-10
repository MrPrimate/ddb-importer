import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

export function getSensesLookup(data) {
  let senses = [];
  // custom senses
  if (data.character.customSenses) {
    data.character.customSenses
      .filter((sense) => !sense.distance)
      .forEach((sense) => {
        const s = DICTIONARY.character.senses.find((s) => s.id === sense.senseId);
        const senseName = s ? s.name : null;
        senses.push({ name: senseName, value: sense.distance });
      });
  }

  // Darkvision
  utils.filterBaseModifiers(data, "set-base", "darkvision").forEach((sense) => {
    let existing = senses.findIndex((s) => s.name === "Darkvision");
    if (existing !== -1) {
      if (sense.value > senses[existing].value) {
        senses[existing].value = sense.value;
      }
    } else {
      senses.push({ name: sense.friendlySubtypeName, value: sense.value });
    }
  });

  // Devils Sight gives bright light to 120 foot instead of normal darkvision
  utils
    .filterBaseModifiers(data, "set-base", "darkvision", [
      "You can see normally in darkness, both magical and nonmagical",
    ])
    .forEach((sense) => {
      let existing = senses.findIndex((s) => s.name === "Devils Sight");
      if (existing !== -1) {
        if (sense.value > senses[existing].value) {
          senses[existing].value = sense.value;
        }
      } else {
        senses.push({ name: "Devils Sight", value: sense.value });
      }
    });

  // Magical bonuses and additional, e.g. Gloom Stalker
  utils
    .filterBaseModifiers(data, "sense", "darkvision")
    .map((mod) => {
      return {
        name: DICTIONARY.character.senses.find((s) => s.id === mod.entityId).name,
        value: mod.value,
      };
    })
    .forEach((mod) => {
      let sense = senses.find((sense) => sense.name === mod.name);
      if (sense) {
        sense.value += mod.value;
      } else {
        senses.push({ name: mod.name, value: mod.value });
      }
    });

  return senses;
}

export function getSenses(data) {
  let senses = getSensesLookup(data);

  // sort the senses alphabetically
  senses = senses.sort((a, b) => a.name >= b.name);

  return senses.map((e) => e.name + ": " + e.value + " ft.").join(", ");
}
