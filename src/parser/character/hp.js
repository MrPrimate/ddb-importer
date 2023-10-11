import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

DDBCharacter.prototype._generateHitPoints = function _generateHitPoints() {
  const constitutionHP = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.mod * this.raw.character.flags.ddbimporter.dndbeyond.totalLevels;
  const baseHitPoints = this.source.ddb.character.baseHitPoints || 0;
  const tempMaxHitPoints = this.source.ddb.character.bonusHitPoints || 0;
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

  const bonusPerLevelValue = bonusHitPointFeatures.map((bonus) => {
    const cls = DDBHelper.findClassByFeatureId(this.source.ddb, bonus.componentId);
    // console.warn("cls hp", { bonus, cls});
    if (!cls) {
      return bonus.value;
    } else {
      return 0;
    }
  }).reduce((prev, cur) => prev + cur, 0);

  // const bonusHPEffectDiff = totalBonusHPWithEffects - totalBonusHitPoints - bonusPerLevelValue;
  const overallBonus = totalBonusHitPoints - (bonusPerLevelValue * this.raw.character.flags.ddbimporter.dndbeyond.totalLevels);

  // console.warn("hp data", {
  //   bonusHitPointValues,
  //   bonusHitPointValuesWithEffects,
  //   totalBonusHPWithEffects,
  //   totalBonusHitPoints,
  //   bonusPerLevelValue,
  //   overallBonus,
  // });

  const maxHitPoints = overrideHitPoints === 0
    ? constitutionHP + baseHitPoints + totalBonusHPWithEffects
    : overrideHitPoints;

  this.raw.character.system.attributes.hp = {
    value: maxHitPoints + tempMaxHitPoints - removedHitPoints,
    max: overrideHitPoints !== 0 ? overrideHitPoints : null,
    temp: temporaryHitPoints !== 0 ? temporaryHitPoints : null,
    tempmax: tempMaxHitPoints !== 0 ? tempMaxHitPoints : null,
    bonuses: {
      level: bonusPerLevelValue !== 0 ? bonusPerLevelValue : "",
      overall: overallBonus !== 0 ? overallBonus : "",
    },
  };

  // "hp": {
  //   "value": 23,
  //   "max": null,
  //   "temp": null,
  //   "tempmax": null,
  //   "bonuses": {
  //     "level": "1",
  //     "overall": "2"
  //   }
  // },
};

DDBCharacter.prototype._generateHitDice = function _generateHitDice() {
  const used = this.source.ddb.character.classes.reduce((prev, cls) => prev + cls.hitDiceUsed, 0);
  const total = this.source.ddb.character.classes.reduce((prev, cls) => prev + cls.level, 0);
  this.raw.character.system.attributes.hd = total - used;
};
