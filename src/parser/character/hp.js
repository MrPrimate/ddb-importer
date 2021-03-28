import utils from "../../utils.js";

export function getHitpoints(data, character) {
  const constitutionHP = character.flags.ddbimporter.dndbeyond.effectAbilities.con.mod * character.flags.ddbimporter.dndbeyond.totalLevels;
  let baseHitPoints = data.character.baseHitPoints || 0;
  const bonusHitPoints = data.character.bonusHitPoints || 0;
  const overrideHitPoints = data.character.overrideHitPoints || 0;
  const removedHitPoints = data.character.removedHitPoints || 0;
  const temporaryHitPoints = data.character.temporaryHitPoints || 0;

  // get all hit points features
  const bonusHitPointFeatures = utils.filterBaseModifiers(data, "bonus", "hit-points-per-level");
  const bonusHitPointFeaturesWithEffects = utils.filterBaseModifiers(data, "bonus", "hit-points-per-level", ["", null], true);

  // get their values
  const bonusHitPointValues = bonusHitPointFeatures.map((bonus) => {
    const cls = utils.findClassByFeatureId(data, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  const bonusHitPointValuesWithEffects = bonusHitPointFeaturesWithEffects.map((bonus) => {
    const cls = utils.findClassByFeatureId(data, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  // sum up the bonus HP per class level
  const totalBonusHitPoints = bonusHitPointValues.reduce((prev, cur) => prev + cur, 0);
  const totalBonusHPWithEffects = bonusHitPointValuesWithEffects.reduce((prev, cur) => prev + cur, 0);
  const bonusHPEffectDiff = totalBonusHPWithEffects - totalBonusHitPoints;

  // add the result to the base hitpoints
  baseHitPoints += totalBonusHitPoints;

  const totalHitPoints = overrideHitPoints === 0
    ? constitutionHP + baseHitPoints + bonusHitPoints
    : overrideHitPoints;

  return {
    value: totalHitPoints - removedHitPoints + bonusHPEffectDiff,
    min: 0,
    max: totalHitPoints,
    temp: temporaryHitPoints,
    tempmax: bonusHitPoints,
  };
}

export function getHitDice(data) {
  let used = data.character.classes.reduce((prev, cls) => prev + cls.hitDiceUsed, 0);
  let total = data.character.classes.reduce((prev, cls) => prev + cls.level, 0);
  return total - used;
}
