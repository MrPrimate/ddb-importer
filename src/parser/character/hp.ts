import DDBCharacter from "../DDBCharacter";
import { DDBDataUtils, DDBModifiers } from "../lib/_module";
import { logger, utils } from "../../lib/_module";

DDBCharacter.prototype._generateHitPoints = function _generateHitPoints(this: DDBCharacter) {
  const ddbImporterFlags = this.raw.character.flags?.ddbimporter;
  const abilities = ddbImporterFlags?.dndbeyond?.effectAbilities;
  const conValue = abilities?.con.value;
  const attributes = this.raw.character.system.attributes;
  if (!this.source || !ddbImporterFlags || conValue === undefined || !attributes) {
    logger.warn("_generateHitPoints: missing DDB source data, importer flags, or effect abilities");
    return;
  }
  const ddb = this.source.ddb;
  const totalLevels = ddbImporterFlags.dndbeyond?.totalLevels ?? 0;
  const constitutionHP = utils.calculateModifier(conValue) * totalLevels;
  const baseHitPoints = ddb.character.baseHitPoints || 0;
  const tempMaxHitPoints = ddb.character.bonusHitPoints || 0;
  const overrideHitPoints = ddb.character.overrideHitPoints || 0;
  const removedHitPoints = ddb.character.removedHitPoints || 0;
  const temporaryHitPoints = ddb.character.temporaryHitPoints || 0;

  // get allvalues hit points features
  const bonusHitPointFeaturesPerLevel = DDBModifiers.filterBaseModifiers(ddb, "bonus", { subType: "hit-points-per-level" });
  const bonusHitPointFeaturesPerLevelWithEffects = DDBModifiers.filterBaseModifiers(ddb, "bonus", { subType: "hit-points-per-level", includeExcludedEffects: true });
  const bonusHitPointModifiersWithEffects = DDBModifiers.filterBaseModifiers(ddb, "bonus", { subType: "hit-points", includeExcludedEffects: true });

  // get their
  const bonusHitPointValues = bonusHitPointFeaturesPerLevel.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(ddb, bonus.componentId);
    if (cls) {
      return cls.level * parseInt(String(bonus.value));
    } else {
      return totalLevels * parseInt(String(bonus.value));
    }
  });

  const bonusHitPointValuesWithEffects = bonusHitPointFeaturesPerLevelWithEffects.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(ddb, bonus.componentId);
    if (cls) {
      return cls.level * parseInt(String(bonus.value));
    } else {
      return totalLevels * parseInt(String(bonus.value));
    }
  });

  const fixedBonusHitPointValuesWithEffects = bonusHitPointModifiersWithEffects
    .map((bonus) => parseInt(String(bonus.value)))
    .reduce((prev, cur) => prev + cur, 0);

  // sum up the bonus HP per class level
  const totalBonusHitPoints = bonusHitPointValues.reduce((prev, cur) => prev + cur, 0);
  const totalBonusHPWithEffects = bonusHitPointValuesWithEffects.reduce((prev, cur) => prev + cur, 0);

  const bonusPerLevelValue = bonusHitPointFeaturesPerLevel.map((bonus) => {
    const cls = DDBDataUtils.findClassByFeatureId(ddb, bonus.componentId);
    // console.warn("cls hp", { bonus, cls});
    if (!cls) {
      return parseInt(String(bonus.value));
    } else {
      return 0;
    }
  }).reduce((prev, cur) => prev + cur, 0);

  // const bonusHPEffectDiff = totalBonusHPWithEffects - totalBonusHitPoints - bonusPerLevelValue;
  const overallBonus = totalBonusHitPoints - (bonusPerLevelValue * totalLevels);

  const maxHitPoints = overrideHitPoints === 0
    ? constitutionHP + baseHitPoints + totalBonusHPWithEffects
    : overrideHitPoints;

  const rolledHP = foundry.utils.getProperty(ddb, "character.preferences.hitPointType") === 2;

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

  attributes.hp = {
    value: maxHitPoints + tempMaxHitPoints - removedHitPoints,
    max: overrideHitPoints !== 0
      ? overrideHitPoints
      : rolledHP && utils.getSetting<boolean>("character-update-policy-use-hp-max-for-rolled-hp")
        ? maxHitPoints
        : null,
    temp: temporaryHitPoints ?? 0,
    tempmax: tempMaxHitPoints ?? 0,
    bonuses: {
      level: bonusPerLevelValue !== 0 ? String(bonusPerLevelValue) : "",
      overall: overallBonus !== 0 ? String(overallBonus) : "",
    },
  };

  ddbImporterFlags.rolledHP = rolledHP;
  ddbImporterFlags.baseHitPoints = baseHitPoints;
  ddbImporterFlags.fixedBonusHitPointValuesWithEffects = parseInt(String(fixedBonusHitPointValuesWithEffects));
  ddbImporterFlags.totalHP = maxHitPoints + tempMaxHitPoints + parseInt(String(fixedBonusHitPointValuesWithEffects));
  ddbImporterFlags.removedHitPoints = removedHitPoints;
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
