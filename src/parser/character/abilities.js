import DICTIONARY from "../../dictionary.js";
// import logger from "../../logger.js";
import utils from "../../utils.js";

function getOverrides(data) {
  let result = {};
  DICTIONARY.character.abilities.forEach((ability) => {
    result[ability.value] = data.character.overrideStats.find((stat) => stat.id === ability.id).value || 0;
  });
  return result;
}

/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} data JSON Import
 * @param {obj} includeExcludedEffects Include effects from dae added items?
 */
function parseAbilities(data, includeExcludedEffects = false) {
  // go through every ability
  // console.error(`Abilities effects: ${includeExcludedEffects}`);

  let result = {};
  DICTIONARY.character.abilities.forEach((ability) => {
    result[ability.value] = {
      value: 0,
      min: 3,
      max: 20,
      proficient: 0,
    };
    // console.warn(ability.value);

    const stat = data.character.stats.find((stat) => stat.id === ability.id).value || 0;
    const abilityScoreMaxBonus = utils
      .filterBaseModifiers(data, "bonus", "ability-score-maximum", [null, ""], includeExcludedEffects)
      .filter((mod) => mod.statId === ability.id)
      .reduce((prev, cur) => prev + cur.value, 0);
    const bonus = utils
      .filterBaseModifiers(data, "bonus", `${ability.long}-score`, [null, "", "+2 to score maximum", "+4 to score maximum"], includeExcludedEffects)
      .filter((mod) => mod.entityId === ability.id)
      .reduce((prev, cur) => prev + cur.value, 0);
    const setAbilities = utils
      .filterBaseModifiers(data, "set", `${ability.long}-score`, [null, "", "if not already higher"], includeExcludedEffects)
      .map((mod) => mod.value);
    const modRestrictions = [
      "Your maximum is now ",
      "Maximum of ",
    ];
    const cappedBonusExp = new RegExp(`(?:${modRestrictions.join("|")})(\\d*)`);
    const cappedBonus = utils
      .filterBaseModifiers(data, "bonus", `${ability.long}-score`, false, includeExcludedEffects)
      .filter((mod) =>
        mod.entityId === ability.id && mod.restriction &&
        modRestrictions.some((m) => mod.restriction.startsWith(m))
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
    const bonusStat = data.character.bonusStats.find((stat) => stat.id === ability.id).value || 0;
    // over rides all other calculations if present
    const overrideStat = data.character.overrideStats.find((stat) => stat.id === ability.id).value || 0;

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

    const proficient = utils.filterBaseModifiers(data, "proficiency", `${ability.long}-saving-throws`, [null, ""], includeExcludedEffects).length > 0
        ? 1
        : 0;

    // update value, mod and proficiency
    result[ability.value].value = overRiddenStat;
    result[ability.value].mod = utils.calculateModifier(result[ability.value].value);
    result[ability.value].proficient = proficient;
    result[ability.value].max = Math.max(cappedBonus.cap, overRiddenStat);
  });

  return result;
}

/**
 * Retrieves character abilities, including proficiency on saving throws
 * @param {obj} data JSON Import
 */
export function getAbilities(data) {
  // go through every ability

  const result = {
    base: parseAbilities(data, false),
    withEffects: parseAbilities(data, true),
    overrides: getOverrides(data),
  };
  return result;
}
