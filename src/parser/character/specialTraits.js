import DDBCharacter from "../DDBCharacter.js";
import { DDBModifiers } from "../lib/_module.mjs";

DDBCharacter.prototype._setSpecialTraitFlags = function _setSpecialTraitFlags() {
  this.raw.character.flags.dnd5e = {
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

  // These are now added via effect flags for the most part

  // advantage on initiative
  this.raw.character.flags.dnd5e.initiativeAdv
    = DDBModifiers.filterBaseModifiers(this.source.ddb, "advantage", { subType: "initiative" }).length > 0;

  // initiative half prof
  this.raw.character.flags.dnd5e.initiativeHalfProf
    = DDBModifiers.filterBaseModifiers(this.source.ddb, "half-proficiency", { subType: "initiative" }).length > 0;

  // observant
  // we now just add this to the skill
  // this.raw.character.flags.dnd5e.observantFeat = this.source.ddb.character.feats.some(
  //   (feat) => feat.definition.name === "Observant"
  // );

  // we set this as the UI does not show AE's effecting Concentration.
  const warCaster = this.source.ddb.character.feats.some(
    (feat) => feat.definition.name === "War Caster",
  );
  if (warCaster) {
    foundry.utils.setProperty(this.raw.character, "system.attributes.concentration.roll.mode", "1");
  }

  // weapon critical threshold
  // fighter improved crit
  // remarkable athlete
  this.source.ddb.character.classes.forEach((cls) => {
    if (cls.subclassDefinition) {
      // Improved Critical
      // const improvedCritical = cls.subclassDefinition.classFeatures.some(
      //   (feature) => feature.name === "Improved Critical" && cls.level >= feature.requiredLevel,
      // );
      // const superiorCritical = cls.subclassDefinition.classFeatures.some(
      //   (feature) => feature.name === "Superior Critical" && cls.level >= feature.requiredLevel,
      // );

      // if (superiorCritical) {
      //   this.raw.character.flags.dnd5e.weaponCriticalThreshold = 18;
      // } else if (improvedCritical && this.raw.character.flags.dnd5e.weaponCriticalThreshold > 19) {
      //   this.raw.character.flags.dnd5e.weaponCriticalThreshold = 19;
      // }

      // wild magic surge for 5e Helpers
      this.raw.character.flags.dnd5e.wildMagic = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Wild Magic Surge" && cls.level >= feature.requiredLevel,
      );
    }

    // // Brutal Critical
    // this.raw.character.flags.dnd5e.meleeCriticalDamageDice += cls.definition.classFeatures.filter(
    //   (feature) => feature.name === "Brutal Critical" && cls.level >= feature.requiredLevel,
    // ).length;

  });
};
