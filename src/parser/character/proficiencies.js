import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype._getCoreProficiencies = function _getCoreProficiencies(includeItemEffects = false) {
  return DDBModifiers
    .filterBaseModifiers(this.source.ddb, "proficiency", { restriction: null, includeExcludedEffects: includeItemEffects })
    .map((proficiency) => {
      return { name: proficiency.friendlySubtypeName, custom: false };
    });
};

DDBCharacter.prototype._getCoreMasteries = function _getCoreMasteries(includeItemEffects = false) {
  return DDBModifiers
    .filterBaseModifiers(this.source.ddb, "weapon-mastery", { restriction: null, includeExcludedEffects: includeItemEffects })
    .map((prof) => {
      const weaponRegex = /(.*) \(([\w- ]+)\)$/ig;
      const masteryDetails = weaponRegex.exec(prof.friendlySubtypeName);
      const dnd5eNameArray = masteryDetails[2].trim().toLowerCase().split(",");
      const dnd5eName = dnd5eNameArray.length === 2
        ? `${dnd5eNameArray[1].trim()}${dnd5eNameArray[0].trim()}`.replaceAll(" ", "")
        : dnd5eNameArray[0].replaceAll(" ", "");
      return { weapon: masteryDetails[2].trim(), mastery: masteryDetails[1].trim(), dnd5eName };
    });
};

DDBCharacter.prototype._generateLanguages = function _generateLanguages() {
  const modifiers = DDBModifiers.filterBaseModifiers(this.source.ddb, "language");
  this.raw.character.system.traits.languages = this.proficiencyFinder.getLanguagesFromModifiers(modifiers);
};

DDBCharacter.prototype._generateProficiencies = function _generateProficiencies() {
  const customProficiencies = [
    ...this.proficiencyFinder.getCustomProficiencies("Armor"),
    ...this.proficiencyFinder.getCustomProficiencies("Tools"),
    ...this.proficiencyFinder.getCustomProficiencies("Weapons"),
    ...this.proficiencyFinder.getCustomProficiencies("Languages"),
  ].map((proficiency) => {
    return { name: proficiency, custom: true };
  });

  this.proficiencies = this._getCoreProficiencies(false).concat(customProficiencies);
  this.proficienciesIncludingEffects = this._getCoreProficiencies(true).concat(customProficiencies);
  this.weaponMasteries = this._getCoreMasteries(false);

  this.raw.character.flags.ddbimporter.dndbeyond.proficiencies = this.proficiencies;
  this.raw.character.flags.ddbimporter.dndbeyond.proficienciesIncludingEffects = this.proficienciesIncludingEffects;
  this.raw.character.flags.ddbimporter.dndbeyond.weaponMasteries = this.weaponMasteries;

  this.raw.character.system.traits.weaponProf = this.proficiencyFinder.getWeaponProficiencies(this.proficiencies, this.weaponMasteries);
  this.raw.character.system.traits.armorProf = this.proficiencyFinder.getArmorProficiencies(this.proficiencies);
  this.raw.character.system.tools = this.proficiencyFinder.getToolProficiencies(this.proficiencies);
  this._generateLanguages();
};
