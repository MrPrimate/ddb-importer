import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._getCustomProficiencies = function _getCustomProficiencies(type) {
  const profGroup = CONFIG.DDB.proficiencyGroups.find((group) => group.label == type);
  const profCharacterValues = this.source.ddb.character.characterValues.filter(
    (value) =>
      profGroup.customAdjustments.includes(parseInt(value.typeId))
      && profGroup.entityTypeIds.includes(parseInt(value.valueTypeId))
      && value.value == 3
  );
  const customProfs = CONFIG.DDB[type.toLowerCase()]
    .filter((prof) => profCharacterValues.some((value) => value.valueId == prof.id))
    .map((prof) => prof.name);

  return customProfs;
};

DDBCharacter.prototype._getCoreProficiencies = function _getCoreProficiencies(includeItemEffects = false) {
  return DDBHelper
    .filterBaseModifiers(this.source.ddb, "proficiency", null, null, includeItemEffects)
    .map((proficiency) => {
      return { name: proficiency.friendlySubtypeName };
    });
};


DDBCharacter.prototype.getArmorProficiencies = function getArmorProficiencies(proficiencyArray) {
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

  if (this.source?.ddb) {
    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Armor");
    custom = custom.concat(customProfs);
  }
  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join(";"),
  };
};

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
DDBCharacter.prototype.getToolProficiencies = function getToolProficiencies(proficiencyArray) {
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

  if (this.source?.ddb) {
    // Custom proficiencies!
    this.source.ddb.character.customProficiencies.forEach((proficiency) => {
      if (proficiency.type === 2) {
        // type 2 is TOOL, 1 is SKILL, 3 is LANGUAGE
        custom.push(proficiency.name);
      }
    });

    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Tools");
    custom = custom.concat(customProfs);
  }

  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join(";"),
  };
};

DDBCharacter.prototype.getWeaponProficiencies = function getWeaponProficiencies(proficiencyArray) {
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

  if (this.source?.ddb) {
    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Weapons");
    custom = custom.concat(customProfs);
  }

  return {
    value: [...new Set(values)],
    custom: [...new Set(custom)].join("; "),
  };
};

DDBCharacter.prototype.getLanguagesFromModifiers = function getLanguagesFromModifiers(modifiers) {
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

  if (this.source?.ddb) {
    this.source.ddb.character.customProficiencies.forEach((proficiency) => {
      if (proficiency.type === 3) {
        // type 3 is LANGUAGE, 1 is SKILL, 2 is TOOL
        custom.push(proficiency.name);
      }
    });

    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Languages");
    custom = custom.concat(customProfs);
  }

  return {
    value: languages,
    custom: custom.map((entry) => utils.capitalize(entry)).join(";"),
  };
};

DDBCharacter.prototype._generateLanguages = function _generateLanguages() {
  const modifiers = DDBHelper.filterBaseModifiers(this.source.ddb, "language");
  this.raw.character.system.traits.languages = this.getLanguagesFromModifiers(modifiers);
};

DDBCharacter.prototype._generateProficiencies = function _generateProficiencies() {
  const customProficiencies = [
    ...this._getCustomProficiencies("Armor"),
    ...this._getCustomProficiencies("Tools"),
    ...this._getCustomProficiencies("Weapons"),
    ...this._getCustomProficiencies("Languages"),
  ].map((proficiency) => {
    return { name: proficiency };
  });

  this.proficiencies = this._getCoreProficiencies(false).concat(customProficiencies);
  this.proficienciesIncludingEffects = this._getCoreProficiencies(true).concat(customProficiencies);

  this.raw.character.flags.ddbimporter.dndbeyond.proficiencies = this.proficiencies;
  this.raw.character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects = this.proficienciesIncludingEffects;

  this.raw.character.system.traits.weaponProf = this.getWeaponProficiencies(this.proficiencies);
  this.raw.character.system.traits.armorProf = this.getArmorProficiencies(this.proficiencies);
  this.raw.character.system.traits.toolProf = this.getToolProficiencies(this.proficiencies);
  this._generateLanguages();
};
