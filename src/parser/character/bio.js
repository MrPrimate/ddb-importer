import DICTIONARY from "../../dictionary.js";

export function getBackground(data) {
  if (data.character.background.hasCustomBackground === false) {
    if (data.character.background.definition !== null) {
      return data.character.background.definition.name || "";
    } else {
      return "";
    }
  } else {
    return data.character.background.customBackground.name || "";
  }
}

export function getTrait(data) {
  let result = data.character.traits.personalityTraits;
  if (result !== null) {
    return result;
  } else {
    result = "";
  }
  return result;
}

export function getIdeal(data) {
  let result = data.character.traits.ideals;
  if (result !== null) {
    return result;
  } else {
    result = "";
  }
  return result;
}

function getCharacteristics(data) {
  let characteristicBlurb = "";
  if (data.character.gender) characteristicBlurb += `Gender: ${data.character.gender}\n`;
  if (data.character.eyes) characteristicBlurb += `Eyes: ${data.character.eyes}\n`;
  if (data.character.height) characteristicBlurb += `Height: ${data.character.height}\n`;
  if (data.character.faith) characteristicBlurb += `Faith: ${data.character.faith}\n`;
  if (data.character.hair) characteristicBlurb += `Hair: ${data.character.hair}\n`;
  if (data.character.skin) characteristicBlurb += `Skin: ${data.character.skin}\n`;
  if (data.character.age) characteristicBlurb += `Age: ${data.character.age}\n`;
  if (data.character.weight) characteristicBlurb += `Weight: ${data.character.weight}\n`;
  return characteristicBlurb;
}

export function getAppearance(data) {
  let result = getCharacteristics(data);
  if (result && result !== "") result += "\n";
  result += data.character.traits.appearance;
  if (result !== null) {
    return result;
  } else {
    result = "";
  }
  return result;
}

export function getBond(data) {
  let result = data.character.traits.bonds;
  if (result !== null) {
    return result;
  } else {
    result = "";
  }
  return result;
}

export function getFlaw(data) {
  let result = data.character.traits.flaws;
  if (result !== null) {
    return result;
  } else {
    result = "";
  }
  return result;
}

/**
 * Gets the character's alignment
 * Defaults to Neutral, if not set in DDB
 * @todo: returns .name right now, should switch to .value once the DND5E options are fully implemented
 */
export function getAlignment(data) {
  let alignmentID = data.character.alignmentId || 5;
  let alignment = DICTIONARY.character.alignments.find((alignment) => alignment.id === alignmentID); // DDBUtils.alignmentIdtoAlignment(alignmentID);
  return alignment.name;
}

export function getBackgroundData(data) {
  let result = {
    name: "Background",
    description: "",
    id: null,
    entityTypeId: null,
    featuresId: null,
    featuresEntityTypeId: null,
    characteristicsId: null,
    characteristicsEntityTypeId: null,
    definition: {
      name: "Background",
      description: "",
      id: null,
      entityTypeId: null,
    },
  };

  let bg = null;
  if (data.character.background.hasCustomBackground === true) {
    bg = data.character.background.customBackground;
  } else if (data.character.background.definition !== null) {
    bg = data.character.background.definition;
  } else {
    bg = data.character.background.customBackground;
    if (bg.id) result.id = bg.id;
    if (bg.entityTypeId) result.entityTypeId = bg.entityTypeId;
    return result;
  }


  if (bg.id) result.id = bg.id;
  if (bg.entityTypeId) result.entityTypeId = bg.entityTypeId;

  if (bg.name) {
    result.name = `Background: ${bg.name}`;
    result.description = `<h1>Background: ${bg.name}</h1>`;
  }

  if (bg.description) {
    result.description += `<p>${bg.description}</p>`;
  } else if (bg.shortDescription) {
    result.description += bg.shortDescription.replace("\r\n", "");
  }
  if (bg.definition) result.definition = bg.definition;

  if (data.character.background.hasCustomBackground === true) {
    if (bg.featuresBackground) {
      result.description += `<h2>${bg.featuresBackground.name}</h2>`;
      result.description += bg.featuresBackground.shortDescription.replace("\r\n", "");
      result.description += `<h3>${bg.featuresBackground.featureName}</h3>`;
      result.description += bg.featuresBackground.featureDescription.replace("\r\n", "");
      result.featuresId = bg.featuresBackground.id;
      result.id = bg.featuresBackground.id;
      result.featuresEntityTypeId = bg.featuresBackground.entityTypeId;
      result.definition = bg.featuresBackground;
    }
    if (
      bg.characteristicsBackground &&
      bg.featuresBackground &&
      bg.featuresBackground.entityTypeId != bg.characteristicsBackground.entityTypeId
    ) {
      result.description += `<h2>${bg.characteristicsBackground.name}</h2>`;
      result.description += bg.characteristicsBackground.shortDescription.replace("\r\n", "");
      result.description += `<h3>${bg.characteristicsBackground.featureName}</h3>`;
      result.description += bg.characteristicsBackground.featureDescription.replace("\r\n", "");
      result.characteristicsId = bg.characteristicsBackground.id;
      result.characteristicsEntityTypeId = bg.characteristicsBackground.entityTypeId;
    }
  }
  if (bg.featureName) {
    result.description += `<h2>${bg.featureName}</h2>`;
    result.description += bg.featureDescription.replace("\r\n", "");
  }
  // if (bg.skillProficienciesDescription && bg.skillProficienciesDescription !== "") {
  //   result.description += `<h2>Skill Proficiencies</h2>`;
  //   result.description += bg.skillProficienciesDescription.replace("\r\n", "");
  // }
  // if (bg.languagesDescription && bg.languagesDescription !== "") {
  //   result.description += `<h2>Languages</h2>`;
  //   result.description += bg.languagesDescription.replace("\r\n", "");
  // }
  // if (bg.toolProficienciesDescription && bg.toolProficienciesDescription !== "") {
  //   result.description += `<h2>Tool Proficiencies</h2>`;
  //   result.description += bg.toolProficienciesDescription.replace("\r\n", "");
  // }
  // if (bg.equipmentDescription && bg.equipmentDescription !== "") {
  //   result.description += `<h2>Starting Equipment</h2>`;
  //   result.description += bg.equipmentDescription.replace("\r\n", "");
  // }
  // if (bg.organization && bg.organization !== "") {
  //   result.description += `<h2>Organization</h2>`;
  //   result.description += bg.organization.replace("\r\n", "");
  // }
  // if (bg.contractsDescription && bg.contractsDescription !== "") {
  //   result.description += `<h2>Contracts</h2>`;
  //   result.description += bg.contractsDescription.replace("\r\n", "");
  // }
  // if (bg.spellsPreDescription && bg.spellsPreDescription !== "") {
  //   result.description += `<h2>Spells</h2>`;
  //   result.description += bg.spellsPreDescription.replace("\r\n", "");
  // }
  // if (bg.suggestedCharacteristicsDescription && bg.suggestedCharacteristicsDescription !== "") {
  //   result.description += `<h2>Suggested Characteristics</h2>`;
  //   result.description += bg.suggestedCharacteristicsDescription.replace("\r\n", "");
  // }
  // if (bg.personalityTraits && bg.personalityTraits.length > 0) {
  //   result.description += `<h>Suggested Personality Traits</h2>`;
  //   result.description += bg.personalityTraits.map((trait) => `<p>${trait}</p>`).join("");
  // }
  // if (bg.ideals && bg.ideals.length > 0) {
  //   result.description += `<h>Suggested Ideals</h2>`;
  //   result.description += bg.ideals.map((trait) => `<p>${trait}</p>`);
  // }
  // if (bg.bonds && bg.bonds.length > 0) {
  //   result.description += `<h>Suggested Bonds</h2>`;
  //   result.description += bg.bonds.map((trait) => `<p>${trait}</p>`);
  // }
  // if (bg.flaws && bg.flaws.length > 0) {
  //   result.description += `<h>Suggested Flaws</h2>`;
  //   result.description += bg.flaws.map((trait) => `<p>${trait}</p>`);
  // }
  if (bg.spellListIds) result.spellListIds = bg.spellListIds;
  result.definition.name = result.name;
  result.definition.description = result.description;
  return result;
}

export function getBiography(data) {
  // let format = (heading, text) => {
  //   text = text
  //     .split("\n")
  //     .map((text) => `<p>${text}</p>`)
  //     .join("");
  //   return `<h2>${heading}</h2>${text}`;
  // };

  let backstory =
    data.character.notes.backstory !== null ? "<h1>Backstory</h1><p>" + data.character.notes.backstory + "</p>" : "";

  // if (data.character.background.hasCustomBackground === true) {
  //   let bg = data.character.background.customBackground;

  //   let result = bg.name ? "<h1>Background: " + bg.name + "</h1>" : "";
  //   result += bg.description ? "<p>" + bg.description + "</p>" : "";
  //   if (bg.featuresBackground) {
  //     result += "<h2>" + bg.featuresBackground.name + "</h2>";
  //     result += bg.featuresBackground.shortDescription.replace("\r\n", "");
  //     result += "<h3>" + bg.featuresBackground.featureName + "</h3>";
  //     result += bg.featuresBackground.featureDescription.replace("\r\n", "");
  //   }
  //   if (
  //     bg.characteristicsBackground &&
  //     bg.featuresBackground &&
  //     bg.featuresBackground.entityTypeId != bg.characteristicsBackground.entityTypeId
  //   ) {
  //     result += "<h2>" + bg.characteristicsBackground.name + "</h2>";
  //     result += bg.characteristicsBackground.shortDescription.replace("\r\n", "");
  //     result += "<h3>" + bg.characteristicsBackground.featureName + "</h3>";
  //     result += bg.characteristicsBackground.featureDescription.replace("\r\n", "");
  //   }

  //   return {
  //     public: result + backstory,
  //     value: result + backstory,
  //   };
  // } else if (data.character.background.definition !== null) {
  //   let bg = data.character.background.definition;

  //   let result = "<h1>Background: " + bg.name + "</h1>";
  //   result += bg.shortDescription.replace("\r\n", "");
  //   if (bg.featureName) {
  //     result += "<h2>" + bg.featureName + "</h2>";
  //     result += bg.featureDescription.replace("\r\n", "");
  //   }
  //   return {
  //     public: result + backstory,
  //     value: result + backstory,
  //   };
  // } else {
  //   return {
  //     public: "" + backstory,
  //     value: "" + backstory,
  //   };
  // }

  let background = getBackgroundData(data);
  return {
    public: background.description + backstory,
    value: background.description + backstory,
  };
}

export function getDescription(data) {
  const result = {
    "gender": data.character.gender || "",
    "age": data.character.age || "",
    "height": data.character.height || "",
    "weight": data.character.weight || "",
    "eyes": data.character.eyes || "",
    "skin": data.character.skin || "",
    "hair": data.character.hair || "",
  };

  return result;
}


// "attunedItemsMax": "3",
// "attunedItemsCount": 0,
// "maxPreparedSpells": null,
