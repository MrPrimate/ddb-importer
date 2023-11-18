import DDBHelper from "../../lib/DDBHelper.js";
import DDBCharacter from "../DDBCharacter.js";

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

  // powerful build/equine build
  this.raw.character.flags.dnd5e.powerfulBuild = this.source.ddb.character.race.racialTraits.some((trait) =>
    ["Equine Build", "Powerful Build, Hippo Build", "Little Giant"].includes(trait.definition.name)
  );

  // tavern brawler feat
  this.raw.character.flags.dnd5e.tavernBrawlerFeat = this.source.ddb.character.feats.some(
    (trait) => trait.definition.name === "Tavern Brawler"
  );

  // savage attacks
  const savageAttacks = this.source.ddb.character.race.racialTraits.some(
    (trait) => trait.definition.name === "Savage Attacks"
  );
  this.raw.character.flags.dnd5e.savageAttacks = savageAttacks;
  if (savageAttacks) this.raw.character.flags.dnd5e.meleeCriticalDamageDice += 1;

  // halfling lucky
  this.raw.character.flags.dnd5e.halflingLucky = this.source.ddb.character.race.racialTraits.some(
    (trait) => trait.definition.name === "Lucky"
  );

  // elven accuracy
  this.raw.character.flags.dnd5e.elvenAccuracy = this.source.ddb.character.feats.some(
    (feat) => feat.definition.name === "Elven Accuracy"
  );

  // alert feat
  this.raw.character.flags.dnd5e.initiativeAlert = this.source.ddb.character.feats.some(
    (feat) => feat.definition.name === "Alert"
  );

  // advantage on initiative
  this.raw.character.flags.dnd5e.initiativeAdv
    = DDBHelper.filterBaseModifiers(this.source.ddb, "advantage", { subType: "initiative" }).length > 0;

  // initiative half prof
  this.raw.character.flags.dnd5e.initiativeHalfProf
    = DDBHelper.filterBaseModifiers(this.source.ddb, "half-proficiency", { subType: "initiative" }).length > 0;

  // observant
  // we now just add this to the skill
  // this.raw.character.flags.dnd5e.observantFeat = this.source.ddb.character.feats.some(
  //   (feat) => feat.definition.name === "Observant"
  // );

  // weapon critical threshold
  // fighter improved crit
  // remarkable athlete
  this.source.ddb.character.classes.forEach((cls) => {
    if (cls.subclassDefinition) {
      // Improved Critical
      const improvedCritical = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Improved Critical" && cls.level >= feature.requiredLevel
      );
      const superiorCritical = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Superior Critical" && cls.level >= feature.requiredLevel
      );

      if (superiorCritical) {
        this.raw.character.flags.dnd5e.weaponCriticalThreshold = 18;
      } else if (improvedCritical && this.raw.character.flags.dnd5e.weaponCriticalThreshold > 19) {
        this.raw.character.flags.dnd5e.weaponCriticalThreshold = 19;
      }

      // Remarkable Athlete
      this.raw.character.flags.dnd5e.remarkableAthlete = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Remarkable Athlete" && cls.level >= feature.requiredLevel
      );

      // wild magic surge for 5e Helpers
      this.raw.character.flags.dnd5e.wildMagic = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Wild Magic Surge" && cls.level >= feature.requiredLevel
      );
    }

    // Brutal Critical
    this.raw.character.flags.dnd5e.meleeCriticalDamageDice += cls.definition.classFeatures.filter(
      (feature) => feature.name === "Brutal Critical" && cls.level >= feature.requiredLevel
    ).length;

    // Diamond Soul
    this.raw.character.flags.dnd5e.diamondSoul = cls.definition.classFeatures.some(
      (feature) => feature.name === "Diamond Soul" && cls.level >= feature.requiredLevel
    );

    // Jack of All Trades
    this.raw.character.flags.dnd5e.jackOfAllTrades = cls.definition.classFeatures.some(
      (feature) => feature.name === "Jack of All Trades" && cls.level >= feature.requiredLevel
    );

    // Reliable Talent
    this.raw.character.flags.dnd5e.reliableTalent = cls.definition.classFeatures.some(
      (feature) => feature.name === "Reliable Talent" && cls.level >= feature.requiredLevel
    );
  });
};
