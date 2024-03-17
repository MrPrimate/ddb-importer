import DICTIONARY from "../../dictionary.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._isHalfProficiencyRoundedUp = function _isHalfProficiencyRoundedUp(skill, modifiers = null) {
  const longAbility = DICTIONARY.character.abilities
    .filter((ability) => skill.ability === ability.value)
    .map((ability) => ability.long)[0];

  const roundUp = (modifiers)
    ? DDBHelper.filterModifiersOld(modifiers, "half-proficiency-round-up", `${longAbility}-ability-checks`)
    : DDBHelper.filterBaseModifiers(this.source?.ddb, "half-proficiency-round-up", { subType: `${longAbility}-ability-checks`, includeExcludedEffects: true });
  return Array.isArray(roundUp) && roundUp.length;
};

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
    .filterBaseModifiers(this.source.ddb, "proficiency", { restriction: null, includeExcludedEffects: includeItemEffects })
    .map((proficiency) => {
      return { name: proficiency.friendlySubtypeName };
    });
};


DDBCharacter.prototype.getArmorProficiencies = function getArmorProficiencies(proficiencyArray) {
  const values = new Set();
  const custom = [];

  // lookup the characters's proficiencies in the DICT
  const allProficiencies = DICTIONARY.character.proficiencies.filter((prof) => prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue"));

  const processArmorProficiency = (prof) => {
    if (prof.name === "Light Armor") values.add("lgt");
    else if (prof.name === "Medium Armor") values.add("med");
    else if (prof.name === "Heavy Armor") values.add("hvy");
    else if (prof.name === "Shields") values.add("shl");
    else {
      const entry = allProficiencies.find((p) => p.name === prof.name);
      if (entry) values.add(entry.foundryValue);
    }
  };
  proficiencyArray.forEach((prof) => {
    processArmorProficiency(prof);
  });

  if (this.source?.ddb) {
    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Armor");
    customProfs.forEach((prof) => {
      processArmorProficiency({ name: prof });
    });
  }
  return {
    value: [...values],
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
  const results = {};

  // lookup the characters's proficiencies in the DICT
  const allToolProficiencies = DICTIONARY.character.proficiencies
    .filter((prof) => prof.type === "Tool");

  const mods = this.source?.ddb ? DDBHelper.getAllModifiers(this.source.ddb, { includeExcludedEffects: true }) : [];

  const toolExpertise = this.source?.ddb
    ? this.source.ddb.character.classes.some((cls) =>
      cls.classFeatures.some((feature) => feature.definition.name === "Tool Expertise" && cls.level >= feature.definition.requiredLevel)
    )
      ? 2
      : 1
    : 1;

  proficiencyArray.forEach((prof) => {
    const profMatch = allToolProficiencies.find((allProf) => allProf.name === prof.name);
    if (profMatch && profMatch.baseTool) {
      const modifiers = mods
        .filter((modifier) => modifier.friendlySubtypeName === profMatch.name)
        .map((mod) => mod.type);

      const defaultAbility = profMatch?.ability ?? "dex";

      const halfProficiency = this.source?.ddb
        ? DDBHelper.getChosenClassModifiers(this.source.ddb).find(
          (modifier) =>
            // Jack of All trades/half-rounded down
            (modifier.type === "half-proficiency" && modifier.subType === "ability-checks")
            // e.g. champion for specific ability checks
            || this._isHalfProficiencyRoundedUp({ ability: defaultAbility })
        ) !== undefined
          ? 0.5
          : 0
        : 0;

      const proficient = modifiers.includes("expertise") ? 2 : modifiers.includes("proficiency") ? toolExpertise : halfProficiency;

      results[profMatch.baseTool] = {
        value: proficient,
        ability: profMatch.ability,
        bonuses: {
          check: ""
        }
      };
    }
  });

  return results;

  // tools no longer support easily modifiable custom tools, see
  // https://github.com/foundryvtt/dnd5e/issues/2372
  // use toolIds
  // if (this.source?.ddb) {
  //   // Custom proficiencies!
  //   this.source.ddb.character.customProficiencies.forEach((proficiency) => {
  //     if (proficiency.type === 2) {
  //       // type 2 is TOOL, 1 is SKILL, 3 is LANGUAGE
  //       processToolProficiency(proficiency);
  //     }
  //   });

  //   // load custom proficiencies in characterValues
  //   const customProfs = this._getCustomProficiencies("Tools");
  //   for (const prof of customProfs) {
  //     processToolProficiency({ name: prof });
  //   }
  // }

};

DDBCharacter.prototype.getWeaponProficiencies = function getWeaponProficiencies(proficiencyArray) {
  const values = new Set();
  const custom = [];

  // lookup the characters's proficiencies in the DICT
  const allProficiencies = DICTIONARY.character.proficiencies.filter((prof) => prof.type === "Weapon");

  const processWeaponProficiency = (prof) => {
    if (prof.name === "Simple Weapons") {
      values.add("sim");
    } else if (prof.name === "Martial Weapons") {
      values.add("mar");
    } else {
      const systemWeaponIds = CONFIG.DND5E.weaponIds;
      const dnd5eNameArray = prof.name.toLowerCase().split(",");
      const dnd5eName = dnd5eNameArray.length === 2
        ? `${dnd5eNameArray[1].trim()}${dnd5eNameArray[0].trim()}`
        : prof.name.toLowerCase();
      if (systemWeaponIds && dnd5eName in systemWeaponIds) {
        values.add(dnd5eName);
      } else if (allProficiencies.some((p) => p.name === prof.name) && !custom.includes(prof.name)) {
        custom.push(prof.name);
      }
    }
  };

  proficiencyArray.forEach((prof) => {
    processWeaponProficiency(prof);
  });

  if (this.source?.ddb) {
    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Weapons");
    customProfs.forEach((prof) => {
      processWeaponProficiency({ name: prof });
    });
  }

  return {
    value: Array.from(values),
    custom: [...new Set(custom)].join("; "),
  };
};

DDBCharacter.prototype.getLanguagesFromModifiers = function getLanguagesFromModifiers(modifiers) {
  const languages = new Set();
  const custom = new Set();

  modifiers
    .filter((mod) => mod.type === "language")
    .forEach((language) => {
      const result = DICTIONARY.character.languages.find((lang) => lang.name === language.friendlySubtypeName);
      if (result) {
        languages.add(result.value);
      } else if (language.friendlySubtypeName !== "Choose a Language") {
        custom.add(language.friendlySubtypeName);
      }
    });

  if (this.source?.ddb) {
    this.source.ddb.character.customProficiencies.forEach((proficiency) => {
      if (proficiency.type === 3) {
        // type 3 is LANGUAGE, 1 is SKILL, 2 is TOOL
        const result = DICTIONARY.character.languages.find((lang) => lang.name === proficiency.name);
        if (result) {
          languages.add(result.value);
        } else {
          custom.add(proficiency.name);
        }
      }
    });

    // load custom proficiencies in characterValues
    const customProfs = this._getCustomProficiencies("Languages");
    for (const prof of customProfs) {
      const result = DICTIONARY.character.languages.find((lang) => lang.name === prof);
      if (result) {
        languages.add(result.value);
      } else {
        custom.add(prof);
      }
    }
  }

  return {
    value: Array.from(languages),
    custom: Array.from(custom).map((entry) => utils.capitalize(entry)).join(";"),
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
  this.raw.character.system.tools = this.getToolProficiencies(this.proficiencies);
  this._generateLanguages();
};
