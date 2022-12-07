import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateHitPoints = function _generateHitPoints() {
  const constitutionHP = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.mod * this.raw.character.flags.ddbimporter.dndbeyond.totalLevels;
  const baseHitPoints = this.source.ddb.character.baseHitPoints || 0;
  const bonusHitPoints = this.source.ddb.character.bonusHitPoints || 0;
  const overrideHitPoints = this.source.ddb.character.overrideHitPoints || 0;
  const removedHitPoints = this.source.ddb.character.removedHitPoints || 0;
  const temporaryHitPoints = this.source.ddb.character.temporaryHitPoints || 0;

  // get all hit points features
  const bonusHitPointFeatures = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", "hit-points-per-level");
  const bonusHitPointFeaturesWithEffects = DDBHelper.filterBaseModifiers(this.source.ddb, "bonus", "hit-points-per-level", ["", null], true);

  // get their values
  const bonusHitPointValues = bonusHitPointFeatures.map((bonus) => {
    const cls = DDBHelper.findClassByFeatureId(this.source.ddb, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return this.raw.character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  const bonusHitPointValuesWithEffects = bonusHitPointFeaturesWithEffects.map((bonus) => {
    const cls = DDBHelper.findClassByFeatureId(this.source.ddb, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return this.raw.character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  // sum up the bonus HP per class level
  const totalBonusHitPoints = bonusHitPointValues.reduce((prev, cur) => prev + cur, 0);
  const totalBonusHPWithEffects = bonusHitPointValuesWithEffects.reduce((prev, cur) => prev + cur, 0);
  const bonusHPEffectDiff = totalBonusHPWithEffects - totalBonusHitPoints;

  // add the result to the base hitpoints
  // baseHitPoints += totalBonusHitPoints;

  const totalHitPoints = overrideHitPoints === 0
    ? constitutionHP + baseHitPoints + bonusHitPoints + totalBonusHitPoints
    : overrideHitPoints;

  this.raw.character.system.attributes.hp = {
    value: totalHitPoints - removedHitPoints + bonusHPEffectDiff,
    min: 0,
    max: totalHitPoints,
    temp: temporaryHitPoints,
    tempmax: bonusHitPoints,
  };
};

DDBCharacter.prototype._generateHitDice = function _generateHitDice() {
  const used = this.source.ddb.character.classes.reduce((prev, cls) => prev + cls.hitDiceUsed, 0);
  const total = this.source.ddb.character.classes.reduce((prev, cls) => prev + cls.level, 0);
  this.raw.character.system.attributes.hd = total - used;
};
