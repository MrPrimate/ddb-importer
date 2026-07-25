import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype._getCoreProficiencies = function _getCoreProficiencies(this: DDBCharacter, includeItemEffects = false): IDDBPCDnDBeyondProficiencyFlags[] {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to get core proficiencies, no DDB source data");
    return [];
  }
  return DDBModifiers
    .filterBaseModifiers(ddb, "proficiency", { restriction: null, includeExcludedEffects: includeItemEffects })
    .map((proficiency) => {
      return { name: proficiency.friendlySubtypeName, custom: false };
    });
};

DDBCharacter.prototype._getCoreMasteries = function _getCoreMasteries(this: DDBCharacter, includeItemEffects = false): IDDBPCDnDBeyondWeaponMasteryFlags[] {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to get core masteries, no DDB source data");
    return [];
  }
  return DDBModifiers
    .filterBaseModifiers(ddb, "weapon-mastery", { restriction: null, includeExcludedEffects: includeItemEffects })
    .map((prof) => {
      try {
        const weaponRegex = /(.*) \(([\w-, ]+)\)$/ig;
        const masteryDetails = weaponRegex.exec(prof.friendlySubtypeName);
        if (!masteryDetails) {
          logger.warn("Unable to parse weapon mastery proficiency", {
            proficiency: prof,
            friendlySubtypeName: prof.friendlySubtypeName,
            this: this,
          });
          return null;
        }
        const dnd5eNameArray = masteryDetails[2].trim().toLowerCase().split(",");
        const dnd5eName = dnd5eNameArray.length === 2
          ? `${dnd5eNameArray[1].trim()}${dnd5eNameArray[0].trim()}`.replaceAll(" ", "")
          : dnd5eNameArray[0].replaceAll(" ", "");
        return { weapon: masteryDetails[2].trim(), mastery: masteryDetails[1].trim(), dnd5eName };
      } catch (error) {
        logger.error(`Error parsing weapon mastery proficiency ${prof.friendlySubtypeName}`, { error, prof, this: this });
        return null;
      }
    }).filter((mastery) => mastery !== null) as IDDBPCDnDBeyondWeaponMasteryFlags[];
};

DDBCharacter.prototype._generateLanguages = function _generateLanguages(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const traits = this.raw.character.system.traits;
  if (!ddb || !traits) {
    logger.warn("Unable to generate languages, missing DDB source data or character traits");
    return;
  }
  const modifiers = DDBModifiers.filterBaseModifiers(ddb, "language");
  traits.languages = this.proficiencyFinder.getLanguagesFromModifiers(modifiers);
};

DDBCharacter.prototype._generateProficiencies = function _generateProficiencies(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const dndbeyondFlags = this.raw.character.flags?.ddbimporter?.dndbeyond;
  const traits = this.raw.character.system.traits;
  if (!ddb || !dndbeyondFlags || !traits) {
    logger.warn("Unable to generate proficiencies, missing DDB source data or character skeleton data");
    return;
  }
  const customProficiencies: IDDBPCDnDBeyondProficiencyFlags[] = [
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

  if (ddb.character.feats.some((f) => f.definition.name === "Advanced Weapon Proficiency")) {
    this.proficiencies.push({ name: "Advanced Weapons", custom: false });
    this.proficienciesIncludingEffects.push({ name: "Advanced Weapons", custom: false });
  }

  dndbeyondFlags.proficiencies = this.proficiencies;
  dndbeyondFlags.proficienciesIncludingEffects = this.proficienciesIncludingEffects;
  dndbeyondFlags.weaponMasteries = this.weaponMasteries;

  traits.weaponProf = this.proficiencyFinder.getWeaponProficiencies(this.proficiencies, this.weaponMasteries);
  traits.armorProf = this.proficiencyFinder.getArmorProficiencies(this.proficiencies);
  this.raw.character.system.tools = this.proficiencyFinder.getToolProficiencies(this.proficiencies);
  this._generateLanguages();
};
