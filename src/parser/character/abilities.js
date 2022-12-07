import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";
import utils from "../../lib/utils.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateAbilitiesOverrides = function _generateAbilitiesOverrides() {
  DICTIONARY.character.abilities.forEach((ability) => {
    this.abilities.overrides[ability.value]
      = this.source.ddb.character.overrideStats.find((stat) => stat.id === ability.id).value || 0;
  });
  this.raw.character.flags.ddbimporter.dndbeyond.abilityOverrides = this.abilities.overrides;
};

DDBCharacter.prototype._getCustomSaveProficiency = function _getCustomSaveProficiency(ability) {
  // Overwrite the proficient value with any custom set over rides
  if (this.source.ddb.character.characterValues) {
    const customProficiency = this.source.ddb.character.characterValues.find(
      (value) => value.typeId === 41 && value.valueId == ability.id && value.value
    );
    if (customProficiency) {
      if (customProficiency.value === 1) {
        return 0;
      }
      // Foundry does not support half proficiencies or expertise here
      return 1;
    }
  }
  return undefined;
};

DDBCharacter.prototype._getCustomSaveBonus = function _getCustomSaveBonus(ability) {
  // Get any custom skill bonuses
  if (this.source.ddb.character.characterValues) {
    const customBonus = this.source.ddb.character.characterValues
      .filter((value) => (value.typeId == 40 || value.typeId == 39) && value.valueId == ability.id)
      .reduce((total, bonus) => {
        return total + bonus.value;
      }, 0);

    if (customBonus) {
      return customBonus;
    }
  }
  return 0;
};

/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} includeExcludedEffects Include effects from dae added items?
 */
DDBCharacter.prototype._getAbilities = function _getAbilities(includeExcludedEffects = false) {
  // go through every ability
  // console.error(`Abilities effects: ${includeExcludedEffects}`);

  let result = {};
  DICTIONARY.character.abilities.forEach((ability) => {
    result[ability.value] = {
      value: 0,
      min: 3,
      max: 20,
      proficient: 0,
      bonuses: {
        check: "",
        save: "",
        checkMinimum: null,
        saveMinimum: null,
      },
    };
    // console.warn(ability.value);

    const stat = this.source.ddb.character.stats.find((stat) => stat.id === ability.id).value || 0;
    const abilityScoreMaxBonus = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", "ability-score-maximum", [null, ""], includeExcludedEffects)
      .filter((mod) => mod.statId === ability.id)
      .reduce((prev, cur) => prev + cur.value, 0);
    const bonusStatRestrictions = [
      null,
      "",
      "+2 to score maximum",
      "+4 to score maximum",
      "+2 to maximum score",
      "+4 to maximum score",
      "Can't be an Ability Score you already increased with this trait.",
    ];
    const bonus = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", `${ability.long}-score`, bonusStatRestrictions, includeExcludedEffects)
      .filter((mod) => mod.entityId === ability.id)
      .reduce((prev, cur) => prev + cur.value, 0);
    const setAbilities = DDBHelper
      .filterBaseModifiers(this.source.ddb, "set", `${ability.long}-score`, [null, "", "if not already higher"], includeExcludedEffects)
      .map((mod) => mod.value);
    const modRestrictions = ["Your maximum is now ", "Maximum of "];
    const cappedBonusExp = new RegExp(`(?:${modRestrictions.join("|")})(\\d*)`);
    const cappedBonus = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", `${ability.long}-score`, false, includeExcludedEffects)
      .filter(
        (mod) =>
          mod.entityId === ability.id
          && mod.restriction
          && modRestrictions.some((m) => mod.restriction.startsWith(m))
      )
      .reduce(
        (prev, cur) => {
          const restricted = cur.restriction ? cappedBonusExp.exec(cur.restriction) : undefined;
          const max = restricted ? restricted[1] : 20;
          return {
            value: prev.value + cur.value,
            cap: Math.max(prev.cap, max),
          };
        },
        { value: 0, cap: 20 + abilityScoreMaxBonus }
      );
    // applied regardless of cap
    const bonusStat = this.source.ddb.character.bonusStats.find((stat) => stat.id === ability.id).value || 0;
    // over rides all other calculations if present
    const overrideStat = this.source.ddb.character.overrideStats.find((stat) => stat.id === ability.id).value || 0;

    // console.warn(`${ability.value} - Include active effects: ${includeExcludedEffects}`);
    // console.log(`stat ${stat}`);
    // console.log(`bonus ${bonus}`);
    // console.log(`bonusStat ${bonusStat}`);
    // console.log(`overrideStat ${overrideStat}`);
    // console.log(`abilityScoreMaxBonus ${abilityScoreMaxBonus}`);
    // console.log(`setAbilities ${setAbilities}`);
    // console.log(setAbilities);
    // console.log(`cappedBonus ${cappedBonus}`);
    // console.log(cappedBonus);

    const setAbility = Math.max(...[0, ...setAbilities]);
    const calculatedStat = stat + bonus + cappedBonus.value;
    // bonus gets added regardlesss of normal caps
    const maxAdjustedStat = Math.min(cappedBonus.cap, calculatedStat) + bonusStat;
    // some items will set the ability score if lower
    const setAbilityState = maxAdjustedStat > setAbility ? maxAdjustedStat : setAbility;
    // Is there a hard over ride?
    const overRiddenStat = overrideStat === 0 ? setAbilityState : overrideStat;

    // console.log(`setAbility ${setAbility}`);
    // console.log(`calculatedStat ${calculatedStat}`);
    // console.log(`maxAdjustedStat ${maxAdjustedStat}`);
    // console.log(`setAbilityState ${setAbilityState}`);
    // console.log(`overRiddenStat ${overRiddenStat}`);

    const customProficiency = this._getCustomSaveProficiency(ability);

    const proficient = customProficiency
      ? customProficiency
      : DDBHelper.filterBaseModifiers(this.source.ddb, "proficiency", `${ability.long}-saving-throws`, [null, ""], includeExcludedEffects).length > 0
        ? 1
        : 0;

    // update value, mod and proficiency
    result[ability.value].value = overRiddenStat;
    result[ability.value].mod = utils.calculateModifier(result[ability.value].value);
    result[ability.value].proficient = proficient;
    result[ability.value].max = Math.max(cappedBonus.cap, overRiddenStat);
  });

  DICTIONARY.character.abilities.forEach((ability) => {

    const checkBonusModifiers = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", `${ability.long}-ability-checks`, [null, ""], includeExcludedEffects);
    const checkBonus = DDBHelper.getModifierSum(checkBonusModifiers, this.raw.character);
    if (checkBonus && checkBonus !== "") {
      result[ability.value].bonuses.check = `+ ${checkBonus}`;
    }

    const saveBonusModifiers = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", `${ability.long}-saving-throws`, [null, ""], includeExcludedEffects);
    const modifiersSaveBonus = DDBHelper.getModifierSum(saveBonusModifiers, this.raw.character);
    const customSaveBonus = this._getCustomSaveBonus(ability);

    // console.warn("modifiersSaveBonus", modifiersSaveBonus);
    // console.warn("customSaveBonus", customSaveBonus);

    if (modifiersSaveBonus && modifiersSaveBonus !== "" && parseInt(modifiersSaveBonus)) {
      if (customSaveBonus) {
        const totalSave = parseInt(customSaveBonus) + parseInt(modifiersSaveBonus);
        // console.warn("totalSave", totalSave);
        result[ability.value].bonuses.save = `+ ${totalSave}`;
      } else {
        result[ability.value].bonuses.save = `+ ${modifiersSaveBonus}`;
      }
    } else if (modifiersSaveBonus && modifiersSaveBonus !== "") {
      if (customSaveBonus) {
        result[ability.value].bonuses.save = `+ ${modifiersSaveBonus} + ${customSaveBonus}`;
      } else {
        result[ability.value].bonuses.save = `+ ${modifiersSaveBonus}`;
      }
    } else if (customSaveBonus) {
      result[ability.value].bonuses.save = `+ ${customSaveBonus}`;
    }
  });

  return result;
};

/**
 * Generates character abilities, including proficiency on saving throws
 */
DDBCharacter.prototype._generateAbilities = function _generateAbilities() {
  // go through every ability

  this.raw.character.system.abilities = this._getAbilities(false);
  this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities = this._getAbilities(true);
  this.abilities.core = this.raw.character.system.abilities;
  this.abilities.withEffects = this.raw.character.flags.ddbimporter.dndbeyond.withEffects;

  this._generateAbilitiesOverrides();

};
