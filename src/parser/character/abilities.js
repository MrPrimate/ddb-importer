import { DICTIONARY } from "../../config/_module.mjs";
import { utils, DDBHelper } from "../../lib/_module.mjs";
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
      (value) => value.typeId === 41 && value.valueId == ability.id && value.value,
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

DDBCharacter.prototype._filterAbilityMods = function _filterAbilityMods(abilityLongName, type,
  { restriction = ["", null], includeExcludedEffects = false, effectOnly = false,
    classId = null, availableToMulticlass = null, useUnfilteredModifiers = null } = {},
) {

  const subType = `${abilityLongName}-score`;

  const classMods = DDBHelper.getChosenClassModifiers(this.source.ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers });
  const raceMods = DDBHelper.getModifiers(this.source.ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const backgroundMods = DDBHelper.getModifiers(this.source.ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const featMods = DDBHelper.getModifiers(this.source.ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const activeItemMods = DDBHelper.getActiveItemModifiers(this.source.ddb, includeExcludedEffects);

  const modifiers = [
    classMods,
    // raceMods,
    backgroundMods,
    // featMods,
    activeItemMods,
  ];

  const backgroundFeatIds = this.source.ddb.character.background.definition?.grantedFeats.filter((f) => {
    return f.name === "Ability Scores";
  }).map((f) => f.featIds).flat() ?? [];

  if (backgroundFeatIds.length > 0) {
    modifiers.push(featMods);
  } else {
    modifiers.push(raceMods);
    modifiers.push(featMods.filter((mod) => !backgroundFeatIds.includes(mod.componentId)));
  }

  return DDBHelper.filterModifiers(modifiers, type, { subType, restriction });
};

/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} includeExcludedEffects Include effects from dae added items?
 */


/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {boolean} [includeExcludedEffects=false] Include bonuses from generated effects?
 * @returns {object} abilities populated with character abilities
 */
DDBCharacter.prototype._getAbilities = function _getAbilities(includeExcludedEffects = false) {
  let result = {};
  DICTIONARY.character.abilities.forEach((ability) => {
    result[ability.value] = {
      value: 0,
      min: 3,
      max: 20,
      proficient: 0,
    };

    const stat = this.source.ddb.character.stats.find((stat) => stat.id === ability.id).value || 0;
    const abilityScoreMaxBonus = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", { subType: "ability-score-maximum", restriction: ["", null], includeExcludedEffects })
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

    const bonus = this._filterAbilityMods(ability.long, "bonus", { restriction: bonusStatRestrictions, includeExcludedEffects })
      .filter((mod) => mod.entityId === ability.id)
      .reduce((prev, cur) => prev + cur.value, 0);

    const setAbilities = this._filterAbilityMods(ability.long, "set", { restriction: [null, "", "if not already higher"], includeExcludedEffects })
      .map((mod) => mod.value);

    const modRestrictions = ["Your maximum is now ", "Maximum of "];
    const cappedBonusExp = new RegExp(`(?:${modRestrictions.join("|")})(\\d*)`);
    const cappedBonus = this._filterAbilityMods(ability.long, "bonus", { restriction: false, includeExcludedEffects })
      .filter(
        (mod) =>
          mod.entityId === ability.id
          && mod.restriction
          && modRestrictions.some((m) => mod.restriction.startsWith(m)),
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
        { value: 0, cap: 20 + abilityScoreMaxBonus },
      );
    // applied regardless of cap
    const bonusStat = this.source.ddb.character.bonusStats.find((stat) => stat.id === ability.id).value || 0;
    // over rides all other calculations if present
    const overrideStat = this.source.ddb.character.overrideStats.find((stat) => stat.id === ability.id).value || 0;

    const setAbility = Math.max(...[0, ...setAbilities]);
    const calculatedStat = stat + bonus + cappedBonus.value;
    // bonus gets added regardlesss of normal caps
    const maxAdjustedStat = Math.min(cappedBonus.cap, calculatedStat) + bonusStat;
    // some items will set the ability score if lower
    const setAbilityState = maxAdjustedStat > setAbility ? maxAdjustedStat : setAbility;
    // Is there a hard over ride?
    const overRiddenStat = overrideStat === 0 ? setAbilityState : overrideStat;
    const customProficiency = this._getCustomSaveProficiency(ability);

    const proficient = customProficiency
      ? customProficiency
      : DDBHelper.filterBaseModifiers(this.source.ddb, "proficiency", { subType: `${ability.long}-saving-throws`, includeExcludedEffects }).length > 0
        ? 1
        : 0;

    // update value, mod and proficiency
    result[ability.value].value = overRiddenStat;
    result[ability.value].mod = utils.calculateModifier(result[ability.value].value);
    result[ability.value].proficient = proficient;
    result[ability.value].max = Math.max(cappedBonus.cap, overRiddenStat);
  });

  return result;
};

/**
 * Get ability bonuses for a character.
 * @param {boolean} [includeExcludedEffects=false] Whether to include effects that are excluded by default.
 * @returns {object} A dictionary of ability bonuses, keyed by ability names.
 * @property {object} [bonuses] A dictionary of bonuses for the ability.
 * @property {string} [bonuses.check] A string representing the bonus to ability checks.
 * @property {string} [bonuses.save] A string representing the bonus to saving throws.
 * @property {number} [bonuses.checkMinimum] The minimum bonus to ability checks.
 * @property {number} [bonuses.saveMinimum] The minimum bonus to saving throws.
 */
DDBCharacter.prototype._getAbilitiesBonuses = function (includeExcludedEffects = false) {

  let result = {};
  DICTIONARY.character.abilities.forEach((ability) => {
    result[ability.value] = {
      bonuses: {
        check: "",
        save: "",
        checkMinimum: null,
        saveMinimum: null,
      },
    };

    const checkBonusModifiers = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", { subType: `${ability.long}-ability-checks`, includeExcludedEffects });
    const checkBonus = DDBHelper.getModifierSum(checkBonusModifiers, this.raw.character);
    if (checkBonus && checkBonus !== "") {
      result[ability.value].bonuses.check = `+ ${checkBonus}`;
    }

    const saveBonusModifiers = DDBHelper
      .filterBaseModifiers(this.source.ddb, "bonus", { subType: `${ability.long}-saving-throws`, includeExcludedEffects });
    const modifiersSaveBonus = DDBHelper.getModifierSum(saveBonusModifiers, this.raw.character);
    const customSaveBonus = this._getCustomSaveBonus(ability);

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
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} includeExcludedEffects Include effects from dae added items?
 */
DDBCharacter.prototype._generateBaseAbilities = function (includeExcludedEffects = false) {
  this.raw.character.system.abilities = this._getAbilities(includeExcludedEffects);
};


/**
 * Generates character abilities, including proficiency on saving throws
 */
DDBCharacter.prototype._generateAbilities = function _generateAbilities() {
  // go through every ability

  // we need to populate some base abilities to work out bonuses
  this._generateBaseAbilities(false);

  this.abilities.core = foundry.utils.mergeObject(this._getAbilities(false), this._getAbilitiesBonuses(false));
  this.abilities.withEffects = foundry.utils.mergeObject(this._getAbilities(true), this._getAbilitiesBonuses(true));
  this.raw.character.system.abilities = this.abilities.core;
  this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities = this.abilities.withEffects;

  this._generateAbilitiesOverrides();

};
