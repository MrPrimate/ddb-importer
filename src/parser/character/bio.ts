import DDBCharacter from "../DDBCharacter";
import { DICTIONARY } from "../../config/_module";
import { logger, utils } from "../../lib/_module";

DDBCharacter.prototype.getBackgroundName = function getBackgroundName(this: DDBCharacter) {
  if (!this.source) {
    logger.warn("getBackgroundName called before DDB source data was loaded");
    return "";
  }
  const background = this.source.ddb.character.background;
  if (background.hasCustomBackground === false) {
    if (background.definition !== null) {
      return background.definition.name || "";
    } else {
      return "";
    }
  } else {
    return background.customBackground.name || "";
  }
};

DDBCharacter.prototype._generateTrait = function _generateTrait(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateTrait: missing DDB source data or character details");
    return;
  }
  details.trait = this.source.ddb.character.traits.personalityTraits ?? "";
};

DDBCharacter.prototype._generateIdeal = function _generateIdeal(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateIdeal: missing DDB source data or character details");
    return;
  }
  details.ideal = this.source.ddb.character.traits.ideals ?? "";
};

DDBCharacter.prototype._generateBond = function _generateBond(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateBond: missing DDB source data or character details");
    return;
  }
  details.bond = this.source.ddb.character.traits.bonds ?? "";
};

DDBCharacter.prototype._generateFlaw = function _generateFlaw(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateFlaw: missing DDB source data or character details");
    return;
  }
  details.flaw = this.source.ddb.character.traits.flaws ?? "";
};

DDBCharacter.prototype.getCharacteristics = function getCharacteristics(this: DDBCharacter): string {
  if (!this.source) {
    logger.warn("getCharacteristics called before DDB source data was loaded");
    return "";
  }
  const character = this.source.ddb.character;
  let characteristicBlurb = "";
  if (character.gender) characteristicBlurb += `Gender: ${character.gender}\n`;
  if (character.eyes) characteristicBlurb += `Eyes: ${character.eyes}\n`;
  if (character.height) characteristicBlurb += `Height: ${character.height}\n`;
  if (character.faith) characteristicBlurb += `Faith: ${character.faith}\n`;
  if (character.hair) characteristicBlurb += `Hair: ${character.hair}\n`;
  if (character.skin) characteristicBlurb += `Skin: ${character.skin}\n`;
  if (character.age) characteristicBlurb += `Age: ${character.age}\n`;
  if (character.weight) characteristicBlurb += `Weight: ${character.weight}\n`;
  return characteristicBlurb;
};

DDBCharacter.prototype._generateAppearance = function _generateAppearance(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateAppearance: missing DDB source data or character details");
    return;
  }
  let result = this.getCharacteristics();
  if (result && result !== "") result += "\n";
  if (this.source.ddb.character.traits.appearance) result += this.source.ddb.character.traits.appearance;
  details.appearance = result ?? "";
};

/**
 * Gets the character's alignment
 * Defaults to Neutral, if not set in DDB
 * returns .name right now, should switch to .value once the DND5E options are fully implemented
 */
DDBCharacter.prototype._generateAlignment = function _generateAlignment(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateAlignment: missing DDB source data or character details");
    return;
  }
  const alignmentID = this.source.ddb.character.alignmentId || 5;
  const alignment = DICTIONARY.actor.alignments.find((alignment) => alignment.id === alignmentID);
  if (alignment) details.alignment = alignment.name;
};

function getBackgroundTemplate(): IDDBGeneratedBackground {
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
      originalDescription: null,
      id: null,
      entityTypeId: null,
      sources: null,
    },
  } satisfies IDDBGeneratedBackground;
}

export function generateBackground(bg: IDDBBackgroundInput): IDDBGeneratedBackground {
  const result = getBackgroundTemplate();

  // console.warn(bg)
  // bg is a leaf definition/custom-background, never a wrapper: the source object
  // is mutated into the generated definition on the lines that follow.
  result.definition = bg as IDDBGeneratedBackgroundDefinition;

  result.definition.originalDescription = bg.description;

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
  if (bg.sources) result.definition.sources = bg.sources;

  if (bg.isHomebrew === true) {
    if (bg.featuresBackground) {
      result.description += `<h2>${bg.featuresBackground.name}</h2>`;
      result.description += bg.featuresBackground.shortDescription.replace("\r\n", "");
      if (utils.stripHtml(bg.featuresBackground.featureDescription ?? "").trim()) {
        result.description += `<h3>${bg.featuresBackground.featureName}</h3>`;
        result.description += bg.featuresBackground.featureDescription.replace("\r\n", "");
      }
      result.featuresId = bg.featuresBackground.id;
      result.id = bg.featuresBackground.id;
      result.featuresEntityTypeId = bg.featuresBackground.entityTypeId;
      result.definition = bg.featuresBackground;
    }
    if (
      bg.characteristicsBackground
      && bg.featuresBackground
      && bg.featuresBackground.entityTypeId != bg.characteristicsBackground.entityTypeId
    ) {
      result.description += `<h2>${bg.characteristicsBackground.name}</h2>`;
      result.description += bg.characteristicsBackground.shortDescription.replace("\r\n", "");
      if (utils.stripHtml(bg.characteristicsBackground.featureDescription ?? "").trim()) {
        result.description += `<h3>${bg.characteristicsBackground.featureName}</h3>`;
        result.description += bg.characteristicsBackground.featureDescription.replace("\r\n", "");
      }
      result.characteristicsId = bg.characteristicsBackground.id;
      result.characteristicsEntityTypeId = bg.characteristicsBackground.entityTypeId;
    }
  }

  const featureDescription = bg.featureDescription ?? "";
  if (bg.featureName && utils.stripHtml(featureDescription).trim()) {
    result.description += `<h2>${bg.featureName}</h2>`;
    result.description += featureDescription.replace("\r\n", "");
  }

  // update definition
  result.definition.name = result.name;
  result.description = utils.replaceHtmlSpaces(result.description);
  result.definition.description = result.description;

  return result;
}

DDBCharacter.prototype.getBackgroundData = function getBackgroundData(this: DDBCharacter): IDDBGeneratedBackground {
  if (!this.source) {
    logger.warn("getBackgroundData called before DDB source data was loaded");
    return getBackgroundTemplate();
  }
  const background = this.source.ddb.character.background;
  let bg;
  if (background.hasCustomBackground === true) {
    bg = background.customBackground;
    foundry.utils.setProperty(bg, "isHomebrew", true);
  } else if (background.definition !== null) {
    bg = background.definition;
  } else {
    bg = background.customBackground;
    const result = getBackgroundTemplate();
    if (bg.id) {
      result.id = bg.id;
      result.definition.id = bg.id;
    }
    if (bg.entityTypeId) {
      result.entityTypeId = bg.entityTypeId;
      result.definition.entityTypeId = bg.entityTypeId;
    }
    return result;
  }

  return generateBackground(bg);
};

DDBCharacter.prototype._generateBiography = function _generateBiography(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateBiography: missing DDB source data or character details");
    return;
  }
  const backstory = this.source.ddb.character.notes.backstory
    ? "<h1>Backstory</h1><p>" + this.source.ddb.character.notes.backstory + "</p>"
    : "";

  details.biography = {
    public: backstory,
    value: backstory,
  };
};

DDBCharacter.prototype._generateDescription = function _generateDescription(this: DDBCharacter) {
  const details = this.raw.character.system.details;
  if (!this.source || !details) {
    logger.warn("_generateDescription: missing DDB source data or character details");
    return;
  }
  const character = this.source.ddb.character;
  details["gender"] = character.gender || "";
  details["age"] = character.age || "";
  details["height"] = character.height || "";
  details["weight"] = character.weight || "";
  details["eyes"] = character.eyes || "";
  details["skin"] = character.skin || "";
  details["hair"] = character.hair || "";
};
