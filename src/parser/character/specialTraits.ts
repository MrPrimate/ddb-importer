import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype._setSpecialTraitFlags = function _setSpecialTraitFlags(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  const flags = this.raw.character.flags;
  if (!ddb || !flags) {
    logger.warn("Unable to set special trait flags, missing DDB source data or character flags");
    return;
  }
  const dnd5e: I5ePCDnd5eFlags = {
    powerfulBuild: false,
    savageAttacks: false,
    elvenAccuracy: false,
    halflingLucky: false,
    initiativeAdv: false,
    initiativeAlert: false,
    jackOfAllTrades: false,
    weaponCriticalThreshold: 20,
    observantFeat: false,
    remarkableAthlete: false,
    reliableTalent: false,
    diamondSoul: false,
    meleeCriticalDamageDice: 0,
    wildMagic: false,
    spellSniper: false,
    tavernBrawlerFeat: false,
  };
  flags.dnd5e = dnd5e;

  // These are now added via effect flags for the most part

  // advantage on initiative
  dnd5e.initiativeAdv
    = DDBModifiers.filterBaseModifiers(ddb, "advantage", { subType: "initiative" }).length > 0;

  // initiative half prof
  dnd5e.initiativeHalfProf
    = DDBModifiers.filterBaseModifiers(ddb, "half-proficiency", { subType: "initiative" }).length > 0;

  // observant
  // we now just add this to the skill
  // dnd5e.observantFeat = ddb.character.feats.some(
  //   (feat) => feat.definition.name === "Observant"
  // );

  // we set this as the UI does not show AE's effecting Concentration.
  const warCaster = ddb.character.feats.some(
    (feat) => feat.definition.name === "War Caster",
  );
  if (warCaster) {
    foundry.utils.setProperty(this.raw.character, "system.attributes.concentration.roll.mode", "1");
  }

  // weapon critical threshold
  // fighter improved crit
  // remarkable athlete
  ddb.character.classes.forEach((cls) => {
    if (cls.subclassDefinition) {
      // Improved Critical
      // const improvedCritical = cls.subclassDefinition.classFeatures.some(
      //   (feature) => feature.name === "Improved Critical" && cls.level >= feature.requiredLevel,
      // );
      // const superiorCritical = cls.subclassDefinition.classFeatures.some(
      //   (feature) => feature.name === "Superior Critical" && cls.level >= feature.requiredLevel,
      // );

      // if (superiorCritical) {
      //   dnd5e.weaponCriticalThreshold = 18;
      // } else if (improvedCritical && dnd5e.weaponCriticalThreshold > 19) {
      //   dnd5e.weaponCriticalThreshold = 19;
      // }

      // wild magic surge for 5e Helpers
      dnd5e.wildMagic = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Wild Magic Surge" && cls.level >= feature.requiredLevel,
      );
    }

    // // Brutal Critical
    // dnd5e.meleeCriticalDamageDice += cls.definition.classFeatures.filter(
    //   (feature) => feature.name === "Brutal Critical" && cls.level >= feature.requiredLevel,
    // ).length;

  });
};
