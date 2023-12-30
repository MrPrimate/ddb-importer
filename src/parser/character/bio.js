import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype.getBackgroundName = function getBackgroundName() {
  if (this.source.ddb.character.background.hasCustomBackground === false) {
    if (this.source.ddb.character.background.definition !== null) {
      return this.source.ddb.character.background.definition.name || "";
    } else {
      return "";
    }
  } else {
    return this.source.ddb.character.background.customBackground.name || "";
  }
};

DDBCharacter.prototype._generateTrait = function _generateTrait() {
  this.raw.character.system.details.trait = this.source.ddb.character.traits.personalityTraits ?? "";
};

DDBCharacter.prototype._generateIdeal = function _generateIdeal() {
  this.raw.character.system.details.ideal = this.source.ddb.character.traits.ideals ?? "";
};

DDBCharacter.prototype._generateBond = function _generateBond() {
  this.raw.character.system.details.bond = this.source.ddb.character.traits.bonds ?? "";
};

DDBCharacter.prototype._generateFlaw = function _generateFlaw() {
  this.raw.character.system.details.flaw = this.source.ddb.character.traits.flaws ?? "";
};

DDBCharacter.prototype.getCharacteristics = function getCharacteristics() {
  let characteristicBlurb = "";
  if (this.source.ddb.character.gender) characteristicBlurb += `Gender: ${this.source.ddb.character.gender}\n`;
  if (this.source.ddb.character.eyes) characteristicBlurb += `Eyes: ${this.source.ddb.character.eyes}\n`;
  if (this.source.ddb.character.height) characteristicBlurb += `Height: ${this.source.ddb.character.height}\n`;
  if (this.source.ddb.character.faith) characteristicBlurb += `Faith: ${this.source.ddb.character.faith}\n`;
  if (this.source.ddb.character.hair) characteristicBlurb += `Hair: ${this.source.ddb.character.hair}\n`;
  if (this.source.ddb.character.skin) characteristicBlurb += `Skin: ${this.source.ddb.character.skin}\n`;
  if (this.source.ddb.character.age) characteristicBlurb += `Age: ${this.source.ddb.character.age}\n`;
  if (this.source.ddb.character.weight) characteristicBlurb += `Weight: ${this.source.ddb.character.weight}\n`;
  return characteristicBlurb;
};

DDBCharacter.prototype._generateAppearance = function _generateAppearance() {
  let result = this.getCharacteristics();
  if (result && result !== "") result += "\n";
  if (this.source.ddb.character.traits.appearance) result += this.source.ddb.character.traits.appearance;
  this.raw.character.system.details.appearance = result ?? "";
};

/**
 * Gets the character's alignment
 * Defaults to Neutral, if not set in DDB
 * @todo: returns .name right now, should switch to .value once the DND5E options are fully implemented
 */
DDBCharacter.prototype._generateAlignment = function _generateAlignment() {
  const alignmentID = this.source.ddb.character.alignmentId || 5;
  const alignment = DICTIONARY.character.alignments.find((alignment) => alignment.id === alignmentID);
  if (alignment) this.raw.character.system.details.alignment = alignment.name;
};

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

  // console.warn(bg)

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
  if (bg.sources) result.definition.sources = bg.sources;

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
      bg.characteristicsBackground
      && bg.featuresBackground
      && bg.featuresBackground.entityTypeId != bg.characteristicsBackground.entityTypeId
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

  // update definition
  result.definition.name = result.name;
  result.description = utils.replaceHtmlSpaces(result.description);
  result.definition.description = result.description;
  result.definition.id = result.id;
  result.definition.spellListIds = result.spellListIds;
  return result;
}

DDBCharacter.prototype.getBackgroundData = function getBackgroundData() {
  let bg = null;
  if (this.source.ddb.character.background.hasCustomBackground === true) {
    bg = this.source.ddb.character.background.customBackground;
    bg.isHomebrew = true;
  } else if (this.source.ddb.character.background.definition !== null) {
    bg = this.source.ddb.character.background.definition;
  } else {
    bg = this.source.ddb.character.background.customBackground;
    let result = getBackgroundTemplate();
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

DDBCharacter.prototype._generateBiography = function _generateBiography() {
  const backstory = this.source.ddb.character.notes.backstory
    ? "<h1>Backstory</h1><p>" + this.source.ddb.character.notes.backstory + "</p>"
    : "";

  this.raw.character.system.details.biography = {
    public: backstory,
    value: backstory,
  };
};

DDBCharacter.prototype._generateDescription = function _generateDescription() {
  this.raw.character.system.details["gender"] = this.source.ddb.character.gender || "";
  this.raw.character.system.details["age"] = this.source.ddb.character.age || "";
  this.raw.character.system.details["height"] = this.source.ddb.character.height || "";
  this.raw.character.system.details["weight"] = this.source.ddb.character.weight || "";
  this.raw.character.system.details["eyes"] = this.source.ddb.character.eyes || "";
  this.raw.character.system.details["skin"] = this.source.ddb.character.skin || "";
  this.raw.character.system.details["hair"] = this.source.ddb.character.hair || "";
};
