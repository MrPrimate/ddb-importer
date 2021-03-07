import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

import { DDB_CONFIG } from "../../ddb-config.js";

function getCustomProficiencies(data, type) {
  const profGroup = DDB_CONFIG.proficiencyGroups.find((group) => group.label == type);
  const profCharacterValues = data.character.characterValues.filter(
    (value) =>
      profGroup.customAdjustments.includes(parseInt(value.typeId)) &&
      profGroup.entityTypeIds.includes(parseInt(value.valueTypeId)) &&
      value.value == 3
  );
  const customProfs = DDB_CONFIG[type.toLowerCase()]
    .filter((prof) => profCharacterValues.some((value) => value.valueId == prof.id))
    .map((prof) => prof.name);

  return customProfs;
}

export function getProficiencies(data, includeItemEffects = false) {
  const coreProficiencies = utils
   .filterBaseModifiers(data, "proficiency", null, null, includeItemEffects)
   .map((proficiency) => {
    return { name: proficiency.friendlySubtypeName };
  });

  const customProficiencies = [
    ...getCustomProficiencies(data, "Armor"),
    ...getCustomProficiencies(data, "Tools"),
    ...getCustomProficiencies(data, "Weapons"),
    ...getCustomProficiencies(data, "Languages"),
  ].map((proficiency) => {
    return { name: proficiency };
  });
  const proficiencies = coreProficiencies.concat(customProficiencies);

  return proficiencies;
}

export function getArmorProficiencies(data, proficiencyArray) {
  let values = [];
  let custom = [];

  // lookup the characters's proficiencies in the DICT
  let allProficiencies = DICTIONARY.character.proficiencies.filter((prof) => prof.type === "Armor");
  proficiencyArray.forEach((prof) => {
    if (prof.name === "Light Armor" && !values.includes("lgt")) {
      values.push("lgt");
    }
    if (prof.name === "Medium Armor" && !values.includes("med")) {
      values.push("med");
    }
    if (prof.name === "Heavy Armor" && !values.includes("hvy")) {
      values.push("hvy");
    }
    if (prof.name === "Shields" && !values.includes("shl")) {
      values.push("shl");
    }
    if (allProficiencies.find((p) => p.name === prof.name) !== undefined && !custom.includes(prof.name)) {
      custom.push(prof.name);
    }
  });

  if (data) {
    // load custom proficiencies in characterValues
    const customProfs = getCustomProficiencies(data, "Armor");
    custom = custom.concat(customProfs);
  }
  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join(";"),
  };
}

//
// DND5E.toolProficiencies = {
// "art": "Artisan's Tools",
// "disg": "Disguise Kit",
// "forg": "Forgery Kit",
// "game": "Gaming Set",
// "herb": "Herbalism Kit",
// "music": "Musical Instrument",
// "navg": "Navigator's Tools",
// "pois": "Poisoner's Kit",
// "thief": "Thieves' Tools",
// "vehicle": "Vehicle (Land or Water)"
// };
//
export function getToolProficiencies(data, proficiencyArray) {
  let values = [];
  let custom = [];

  // lookup the characters's proficiencies in the DICT
  let allToolProficiencies = DICTIONARY.character.proficiencies
    .filter((prof) => prof.type === "Tool")
    .map((prof) => {
      return prof.name;
    });

    proficiencyArray.forEach((prof) => {
    // Some have values we can match too in foundry, others have to be custom imported
    switch (prof.name) {
      case "Artisan's Tools":
        values.push("art");
        break;
      case "Disguise Kit":
        values.push("disg");
        break;
      case "Forgery Kit":
        values.push("forg");
        break;
      case "Gaming Set":
        values.push("game");
        break;
      case "Musical Instrument":
        values.push("music");
        break;
      case "Thieves' Tools":
        values.push("thief");
        break;
      case "Navigator's Tools":
        values.push("navg");
        break;
      case "Poisoner's Kit":
        values.push("pois");
        break;
      case "Vehicle (Land or Water)":
      case "Vehicle (Land)":
      case "Vehicle (Water)":
        values.push("vehicle");
        break;
      default:
        if (allToolProficiencies.includes(prof.name)) custom.push(prof.name);
    }
  });

  if (data) {
    // Custom proficiencies!
    data.character.customProficiencies.forEach((proficiency) => {
      if (proficiency.type === 2) {
        // type 2 is TOOL, 1 is SKILL, 3 is LANGUAGE
        custom.push(proficiency.name);
      }
    });

    // load custom proficiencies in characterValues
    const customProfs = getCustomProficiencies(data, "Tools");
    custom = custom.concat(customProfs);
  }

  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join(";"),
  };
}

export function getWeaponProficiencies(data, proficiencyArray) {
  let values = [];
  let custom = [];

  // lookup the characters's proficiencies in the DICT
  let allProficiencies = DICTIONARY.character.proficiencies.filter((prof) => prof.type === "Weapon");
  proficiencyArray.forEach((prof) => {
    if (prof.name === "Simple Weapons" && !values.includes("sim")) {
      values.push("sim");
    }
    if (prof.name === "Martial Weapons" && !values.includes("mar")) {
      values.push("mar");
    }
    if (allProficiencies.find((p) => p.name === prof.name) !== undefined && !custom.includes(prof.name)) {
      custom.push(prof.name);
    }
  });

  if (data) {
    // load custom proficiencies in characterValues
    const customProfs = getCustomProficiencies(data, "Weapons");
    custom = custom.concat(customProfs);
  }

  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join("; "),
  };
}

export function getLanguagesFromModifiers(data, modifiers) {
  let languages = [];
  let custom = [];

  modifiers
  .filter((mod) => mod.type === "language")
  .forEach((language) => {
    let result = DICTIONARY.character.languages.find((lang) => lang.name === language.friendlySubtypeName);
    if (result) {
      languages.push(result.value);
    } else {
      custom.push(language.friendlySubtypeName);
    }
  });

  if (data) {
    data.character.customProficiencies.forEach((proficiency) => {
      if (proficiency.type === 3) {
        // type 3 is LANGUAGE, 1 is SKILL, 2 is TOOL
        custom.push(proficiency.name);
      }
    });

    // load custom proficiencies in characterValues
    const customProfs = getCustomProficiencies(data, "Languages");
    custom = custom.concat(customProfs);
  }

  return {
    value: languages,
    custom: custom.map((entry) => utils.capitalize(entry)).join(";"),
  };
}

export function getLanguages(data) {
  const modifiers = utils.filterBaseModifiers(data, "language");

  return getLanguagesFromModifiers(data, modifiers);
}
