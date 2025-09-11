import DDBCharacter from "../DDBCharacter.js";
import { DDBDataUtils, DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype._generateHitPoints = function _generateHitPoints() {
  const constitutionHP = this.raw.character.flags.ddbimporter.dndbeyond.effectAbilities.con.mod * this.raw.character.flags.ddbimporter.dndbeyond.totalLevels;
  const baseHitPoints = this.source.ddb.character.baseHitPoints || 0;
  const tempMaxHitPoints = this.source.ddb.character.bonusHitPoints || 0;
  const overrideHitPoints = this.source.ddb.character.overrideHitPoints || 0;
  const removedHitPoints = this.source.ddb.character.removedHitPoints || 0;
  const temporaryHitPoints = this.source.ddb.character.temporaryHitPoints || 0;

  // get allvalues hit points features
  const bonusHitPointFeaturesPerLevel = DDBModifiers.filterBaseModifiers(this.source.ddb, "bonus", { subType: "hit-points-per-level" });
  const bonusHitPointFeaturesPerLevelWithEffects = DDBModifiers.filterBaseModifiers(this.source.ddb, "bonus", { subType: "hit-points-per-level", includeExcludedEffects: true });
  const bonusHitPointModifiersWithEffects = DDBModifiers.filterBaseModifiers(this.source.ddb, "bonus", { subType: "hit-points", includeExcludedEffects: true });

  // get their
  const bonusHitPointValues = bonusHitPointFeaturesPerLevel.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(this.source.ddb, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return this.raw.character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  const bonusHitPointValuesWithEffects = bonusHitPointFeaturesPerLevelWithEffects.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(this.source.ddb, bonus.componentId);
    if (cls) {
      return cls.level * bonus.value;
    } else {
      return this.raw.character.flags.ddbimporter.dndbeyond.totalLevels * bonus.value;
    }
  });

  const fixedBonusHitPointValuesWithEffects = bonusHitPointModifiersWithEffects
    .map((bonus) => bonus.value)
    .reduce((prev, cur) => prev + cur, 0);

  // sum up the bonus HP per class level
  const totalBonusHitPoints = bonusHitPointValues.reduce((prev, cur) => prev + cur, 0);
  const totalBonusHPWithEffects = bonusHitPointValuesWithEffects.reduce((prev, cur) => prev + cur, 0);

  const bonusPerLevelValue = bonusHitPointFeaturesPerLevel.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(this.source.ddb, bonus.componentId);
    // console.warn("cls hp", { bonus, cls});
    if (!cls) {
      return bonus.value;
    } else {
      return 0;
    }
  }).reduce((prev, cur) => prev + cur, 0);

  // const bonusHPEffectDiff = totalBonusHPWithEffects - totalBonusHitPoints - bonusPerLevelValue;
  const overallBonus = totalBonusHitPoints - (bonusPerLevelValue * this.raw.character.flags.ddbimporter.dndbeyond.totalLevels);

  const maxHitPoints = overrideHitPoints === 0
    ? constitutionHP + baseHitPoints + totalBonusHPWithEffects
    : overrideHitPoints;

  const rolledHP = foundry.utils.getProperty(this.source, "ddb.character.preferences.hitPointType") === 2;

  // console.warn("hp data", {
  //   bonusHitPointValues,
  //   bonusHitPointValuesWithEffects,
  //   totalBonusHPWithEffects,
  //   totalBonusHitPoints,
  //   bonusPerLevelValue,
  //   overallBonus,
  //   maxHitPoints,
  //   rolledHP,
  // });

  this.raw.character.system.attributes.hp = {
    value: maxHitPoints + tempMaxHitPoints - removedHitPoints,
    max: overrideHitPoints !== 0
      ? overrideHitPoints
      : rolledHP && game.settings.get("ddb-importer", "character-update-policy-use-hp-max-for-rolled-hp")
        ? maxHitPoints
        : null,
    temp: temporaryHitPoints ?? 0,
    tempmax: tempMaxHitPoints ?? 0,
    bonuses: {
      level: bonusPerLevelValue !== 0 ? bonusPerLevelValue : "",
      overall: overallBonus !== 0 ? overallBonus : "",
    },
  };

  this.raw.character.flags.ddbimporter.rolledHP = rolledHP;
  this.raw.character.flags.ddbimporter.baseHitPoints = baseHitPoints;
  this.raw.character.flags.ddbimporter.fixedBonusHitPointValuesWithEffects = parseInt(fixedBonusHitPointValuesWithEffects);
  this.raw.character.flags.ddbimporter.totalHP = maxHitPoints + tempMaxHitPoints + parseInt(fixedBonusHitPointValuesWithEffects);
  this.raw.character.flags.ddbimporter.removedHitPoints = removedHitPoints;
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
