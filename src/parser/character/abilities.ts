import { DICTIONARY } from "../../config/_module";
import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";

// Passing restriction: null disables restriction filtering entirely in
// DDBModifiers.filterModifiers (the ["", null] default instead keeps only
// unrestricted modifiers). The filter option types do not yet admit null in
// the strict migration, so keep the load-bearing runtime null behind a
// targeted cast.
const NULL_RESTRICTION = null as unknown as (string | null)[];

DDBCharacter.prototype._generateAbilitiesOverrides = function _generateAbilitiesOverrides(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("_generateAbilitiesOverrides: no DDB source data available, skipping");
    return;
  }
  const overrides = {} as Record<T5eAbility, number>;
  DICTIONARY.actor.abilities.forEach((ability) => {
    overrides[ability.value] = ddb.character.overrideStats.find((stat) => stat.id === ability.id)?.value || 0;
  });
  this.abilities.overrides = overrides;

  const dndbeyondFlags = this.raw.character.flags?.ddbimporter?.dndbeyond;
  if (dndbeyondFlags) {
    dndbeyondFlags.abilityOverrides = this.abilities.overrides;
  } else {
    logger.warn("_generateAbilitiesOverrides: missing ddbimporter.dndbeyond flags on character, unable to store ability overrides");
  }
};

DDBCharacter.prototype._getCustomSaveProficiency = function _getCustomSaveProficiency(this: DDBCharacter, ability: DDBAbilityLookup): number | undefined {
  // Overwrite the proficient value with any custom set over rides
  const characterValues = this.source?.ddb.character.characterValues;
  if (characterValues) {
    const customProficiency = characterValues.find(
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

DDBCharacter.prototype._getCustomSaveBonus = function _getCustomSaveBonus(this: DDBCharacter, ability: DDBAbilityLookup): number {
  // Get any custom skill bonuses
  const characterValues = this.source?.ddb.character.characterValues;
  if (characterValues) {
    const customBonus = characterValues
      .filter((value) => (value.typeId == 40 || value.typeId == 39) && value.valueId == ability.id)
      .filter((value) => Number.isInteger(parseInt(String(value.value))))
      .reduce((total, bonus) => {
        const value = parseInt(String(bonus.value));
        return total + value;
      }, 0);

    if (customBonus) {
      return customBonus;
    }
  }
  return 0;
};

DDBCharacter.prototype._filterAbilityMods = function _filterAbilityMods(this: DDBCharacter, abilityLongName: string, type: string,
  { restriction = ["", null], includeExcludedEffects = false, effectOnly = false,
    classId = null, availableToMulticlass = null, useUnfilteredModifiers = null }: IFilterAbilityModsOptions = {},
): IModifiersMod[] {

  const subType = `${abilityLongName}-score`;

  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("_filterAbilityMods: no DDB source data available");
    return [];
  }

  const classMods = DDBModifiers.getChosenClassModifiers(ddb, { includeExcludedEffects, effectOnly, classId, availableToMulticlass, useUnfilteredModifiers });
  const raceMods = DDBModifiers.getModifiers(ddb, "race", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const backgroundMods = DDBModifiers.getModifiers(ddb, "background", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const featMods = DDBModifiers.getModifiers(ddb, "feat", includeExcludedEffects, effectOnly, useUnfilteredModifiers);
  const activeItemMods = DDBModifiers.getActiveItemModifiers(ddb, includeExcludedEffects);

  const modifiers = [
    classMods,
    // raceMods,
    backgroundMods,
    // featMods,
    activeItemMods,
  ];

  const backgroundFeatIds = ddb.character.background.definition?.grantedFeats.filter((f) => {
    return f.name.includes("Ability Score");
  }).map((f) => f.featIds).flat() ?? [];

  if (backgroundFeatIds.length > 0) {
    modifiers.push(featMods);
  } else {
    modifiers.push(raceMods);
    modifiers.push(featMods.filter((mod) => !backgroundFeatIds.includes(mod.componentId)));
  }

  return DDBModifiers.filterModifiers(modifiers.flat(), type, { subType, restriction });
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
DDBCharacter.prototype._getAbilities = function _getAbilities(this: DDBCharacter, includeExcludedEffects = false) {
  const result: Partial<I5eAbilities> = {};
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("_getAbilities: no DDB source data available");
    return result as I5eAbilities;
  }
  DICTIONARY.actor.abilities.forEach((ability) => {
    const abilityEntry: I5eAbilityScore = {
      value: 0,
      // min: 3,
      max: 20,
      proficient: 0,
    };
    result[ability.value] = abilityEntry;

    const statEntry = ddb.character.stats.find((stat) => stat.id === ability.id);
    if (!statEntry) {
      logger.warn(`No base stat entry found for ability "${ability.value}" (id ${ability.id}), defaulting to 0`);
    }
    const stat = statEntry?.value || 0;
    const abilityScoreMaxBonus = DDBModifiers
      .filterBaseModifiers(ddb, "bonus", { subType: "ability-score-maximum", restriction: ["", null], includeExcludedEffects: true })
      .filter((mod) => mod.statId === ability.id)
      .reduce((prev, cur) => prev + parseInt(String(cur.value)), 0);
    const bonusStatRestrictions = [
      null,
      "",
      "+2 to score maximum",
      "+4 to score maximum",
      "+2 to maximum score",
      "+4 to maximum score",
      "Can't be an Ability Score you already increased with this trait.",
      "That you do not have Saving Throw Proficiency in.",
    ];

    const bonus = this._filterAbilityMods(ability.long, "bonus", { restriction: bonusStatRestrictions, includeExcludedEffects })
      .filter((mod) => mod.entityId === ability.id && Number.isInteger(mod.value))
      .reduce((prev, cur) => prev + (cur.value as number), 0);

    const setAbilities = this._filterAbilityMods(ability.long, "set", { restriction: [null, "", "if not already higher"], includeExcludedEffects })
      .filter((mod) => Number.isInteger(mod.value))
      .map((mod) => mod.value) as number[];

    const modRestrictions = ["Your maximum is now ", "Maximum of ", "maximum of "];
    const cappedBonusExp = new RegExp(`(?:${modRestrictions.join("|")})(\\d*)`);
    const cappedBonus = this._filterAbilityMods(ability.long, "bonus", { restriction: NULL_RESTRICTION, includeExcludedEffects })
      .filter(
        (mod) =>
          mod.entityId === ability.id
          && mod.restriction
          && Number.isInteger(mod.value)
          && modRestrictions.some((m) => mod.restriction?.startsWith(m)),
      )
      .reduce(
        (prev, cur) => {
          const restricted = cur.restriction ? cappedBonusExp.exec(cur.restriction) : undefined;
          const max = restricted ? parseInt(restricted[1]) : 20;
          return {
            value: (prev.value as number) + (cur.value as number),
            cap: Math.max(prev.cap, max),
          };
        },
        { value: 0, cap: 20 + abilityScoreMaxBonus },
      );
    // applied regardless of cap
    const bonusStat = ddb.character.bonusStats.find((stat) => stat.id === ability.id)?.value || 0;
    // over rides all other calculations if present
    const overrideStat = ddb.character.overrideStats.find((stat) => stat.id === ability.id)?.value || 0;

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
      : DDBModifiers.filterBaseModifiers(ddb, "proficiency", {
        subType: `${ability.long}-saving-throws`,
        includeExcludedEffects,
        restriction: NULL_RESTRICTION,
      }).length > 0
        ? 1
        : 0;

    // update value, max and proficiency
    abilityEntry.value = overRiddenStat;
    // abilityEntry.mod = utils.calculateModifier(abilityEntry.value);
    abilityEntry.proficient = proficient;
    abilityEntry.max = Math.max(cappedBonus.cap, overRiddenStat);
  });

  return result as I5eAbilities;
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
DDBCharacter.prototype._getAbilitiesBonuses = function (this: DDBCharacter, includeExcludedEffects = false) {

  const result: Partial<I5eAbilities> = {};
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("_getAbilitiesBonuses: no DDB source data available");
    return result as I5eAbilities;
  }
  DICTIONARY.actor.abilities.forEach((ability) => {
    const entry = {
      bonuses: {
        check: "",
        save: "",
      },
    };
    result[ability.value] = entry;

    const checkBonusModifiers = DDBModifiers
      .filterBaseModifiers(ddb, "bonus", { subType: `${ability.long}-ability-checks`, includeExcludedEffects });
    const checkBonus = DDBModifiers.getModifierSum(checkBonusModifiers, this.raw.character);
    if (checkBonus && checkBonus !== "") {
      (result as Record<string, any>)[ability.value].bonuses.check = `+ ${checkBonus}`;
    }

    const saveBonusModifiers = DDBModifiers
      .filterBaseModifiers(ddb, "bonus", { subType: `${ability.long}-saving-throws`, includeExcludedEffects });
    const modifiersSaveBonus = DDBModifiers.getModifierSum(saveBonusModifiers, this.raw.character);
    const customSaveBonus = this._getCustomSaveBonus(ability);

    if (modifiersSaveBonus && modifiersSaveBonus !== "" && parseInt(modifiersSaveBonus)) {
      if (customSaveBonus) {
        const totalSave = customSaveBonus + parseInt(modifiersSaveBonus);
        // console.warn("totalSave", totalSave);
        entry.bonuses.save = `+ ${totalSave}`;
      } else {
        entry.bonuses.save = `+ ${modifiersSaveBonus}`;
      }
    } else if (modifiersSaveBonus && modifiersSaveBonus !== "") {
      if (customSaveBonus) {
        entry.bonuses.save = `+ ${modifiersSaveBonus} + ${customSaveBonus}`;
      } else {
        entry.bonuses.save = `+ ${modifiersSaveBonus}`;
      }
    } else if (customSaveBonus) {
      entry.bonuses.save = `+ ${customSaveBonus}`;
    }
  });

  return result as I5eAbilities;
};

/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} includeExcludedEffects Include effects from dae added items?
 */
DDBCharacter.prototype._generateBaseAbilities = function (this: DDBCharacter, includeExcludedEffects = false) {
  this.raw.character.system.abilities = this._getAbilities(includeExcludedEffects);
};


/**
 * Generates character abilities, including proficiency on saving throws
 */
DDBCharacter.prototype._generateAbilities = function _generateAbilities(this: DDBCharacter) {
  // go through every ability

  // we need to populate some base abilities to work out bonuses
  this._generateBaseAbilities(false);

  this.abilities.core = foundry.utils.mergeObject(this._getAbilities(false), this._getAbilitiesBonuses(false)) as I5eAbilities;
  this.abilities.withEffects = foundry.utils.mergeObject(this._getAbilities(true), this._getAbilitiesBonuses(true)) as I5eAbilities;
  this.raw.character.system.abilities = this.abilities.core;
  const dndbeyondFlags = this.raw.character.flags?.ddbimporter?.dndbeyond;
  if (dndbeyondFlags) {
    dndbeyondFlags.effectAbilities = this.abilities.withEffects;
  } else {
    logger.warn("_generateAbilities: missing ddbimporter.dndbeyond flags on character, unable to store effect abilities");
  }

  this._generateAbilitiesOverrides();

};
