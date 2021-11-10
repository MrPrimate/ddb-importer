import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

import { DDB_CONFIG } from "../../ddbConfig.js";

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
      return prof;
    });

  proficiencyArray.forEach((prof) => {
    // Some have values we can match too in foundry, others have to be custom imported
    switch (prof.name) {
      default: {
        const allProfMatch = allToolProficiencies.find((allProf) => allProf.name === prof.name);
        if (allProfMatch && allProfMatch.baseTool && allProfMatch.baseTool !== "") {
          values.push(allProfMatch.baseTool);
        } else if (allProfMatch) {
         custom.push(prof.name);
        }
      }
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
  const allProficiencies = DICTIONARY.character.proficiencies.filter((prof) => prof.type === "Weapon");
  proficiencyArray.forEach((prof) => {
    if (prof.name === "Simple Weapons" && !values.includes("sim")) {
      values.push("sim");
    }
    if (prof.name === "Martial Weapons" && !values.includes("mar")) {
      values.push("mar");
    }
    // new  1.5
    const systemWeaponIds = CONFIG.DND5E.weaponIds;
    const dnd5eNameArray = prof.name.toLowerCase().split(",");
    const dnd5eName = dnd5eNameArray.length === 2
      ? `${dnd5eNameArray[1].trim()}${dnd5eNameArray[0].trim()}`
      : prof.name.toLowerCase();
    if (systemWeaponIds && dnd5eName in systemWeaponIds) {
      if (!values.includes(dnd5eName)) values.push(dnd5eName);
    } else if (allProficiencies.some((p) => p.name === prof.name) && !custom.includes(prof.name)) {
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
