import DICTIONARY from "../../dictionary.js";
import utils from "../../utils.js";

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
  if (result === null) {
    result = "";
  }
  return result;
}

export function getIdeal(data) {
  let result = data.character.traits.ideals;
  if (result === null) {
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
  if (data.character.traits.appearance) result += data.character.traits.appearance;
  if (result === null) {
    result = "";
  }
  return result;
}

export function getBond(data) {
  let result = data.character.traits.bonds;
  if (result === null) {
    result = "";
  }
  return result;
}

export function getFlaw(data) {
  let result = data.character.traits.flaws;
  if (result === null) {
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

function getBackgroundTemplate() {
  return {
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
}

export function generateBackground(bg) {
  let result = getBackgroundTemplate();

  console.warn(bg)

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

  if (bg.isHomebrew === true) {
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
  if (bg.spellListIds) result.spellListIds = bg.spellListIds;
  result.definition.name = result.name;
  result.description = utils.replaceHtmlSpaces(result.description);
  result.definition.description = result.description;
  return result;
}

export function generateBackgroundFeature(bg) {
  let result = getBackgroundTemplate();
  result.name = "Background Feature";

  if (bg.isHomebrew === true) {
    if (bg.featuresBackground) {
      result.name = bg.featuresBackground.featureName;
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
      result.name = bg.characteristicsBackground.featureName;
      result.description += bg.characteristicsBackground.featureDescription.replace("\r\n", "");
      result.characteristicsId = bg.characteristicsBackground.id;
      result.characteristicsEntityTypeId = bg.characteristicsBackground.entityTypeId;
    }
  }

  if (bg.featureName) {
    result.name = bg.featureName;
    result.description += bg.featureDescription.replace("\r\n", "");
  }

}

export function getBackgroundData(data) {
  let bg = null;
  if (data.character.background.hasCustomBackground === true) {
    bg = data.character.background.customBackground;
    bg.isHomebrew = true;
  } else if (data.character.background.definition !== null) {
    bg = data.character.background.definition;
  } else {
    bg = data.character.background.customBackground;
    let result = getBackgroundTemplate();
    if (bg.id) result.id = bg.id;
    if (bg.entityTypeId) result.entityTypeId = bg.entityTypeId;
    return result;
  }

  return generateBackground(bg);
}

export function getBiography(data) {
  const backstory = data.character.notes.backstory
    ? "<h1>Backstory</h1><p>" + data.character.notes.backstory + "</p>"
    : "";

  return {
    public: backstory,
    value: backstory,
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
