import utils from "../../utils.js";

export function getSpecialTraits(data) {
  let results = {
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
  };

  // powerful build/equine build
  results.powerfulBuild = data.character.race.racialTraits.some(
    (trait) => trait.definition.name === "Equine Build" || trait.definition.name === "Powerful Build"
  );

  // savage attacks
  const savageAttacks = data.character.race.racialTraits.some((trait) => trait.definition.name === "Savage Attacks");
  results.savageAttacks = savageAttacks;
  if (savageAttacks) results.meleeCriticalDamageDice += 1;

  // halfling lucky
  results.halflingLucky = data.character.race.racialTraits.some((trait) => trait.definition.name === "Lucky");

  // elven accuracy
  results.elvenAccuracy = data.character.feats.some((feat) => feat.definition.name === "Elven Accuracy");

  // alert feat
  results.initiativeAlert = data.character.feats.some((feat) => feat.definition.name === "Alert");

  // advantage on initiative
  results.initiativeAdv = utils.filterBaseModifiers(data, "advantage", "initiative").length > 0;

  // initiative half prof
  results.initiativeHalfProf = utils.filterBaseModifiers(data, "half-proficiency", "initiative").length > 0;

  // observant
  results.observantFeat = data.character.feats.some((feat) => feat.definition.name === "Observant");

  // weapon critical threshold
  // fighter improved crit
  // remarkable athlete
  data.character.classes.forEach((cls) => {
    if (cls.subclassDefinition) {
      // Improved Critical
      const improvedCritical = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Improved Critical" && cls.level >= feature.requiredLevel
      );
      const superiorCritical = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Superior Critical" && cls.level >= feature.requiredLevel
      );

      if (superiorCritical) {
        results.weaponCriticalThreshold = 18;
      } else if (improvedCritical && results.weaponCriticalThreshold > 19) {
        results.weaponCriticalThreshold = 19;
      }

      // Remarkable Athlete
      results.remarkableAthlete = results.remarkableAthlete || cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Remarkable Athlete" && cls.level >= feature.requiredLevel
      );

      // wild magic surge for 5e Helpers
      results.wildMagic = cls.subclassDefinition.classFeatures.some(
        (feature) => feature.name === "Wild Magic Surge" && cls.level >= feature.requiredLevel
      );
    }

    // Brutal Critical
    results.meleeCriticalDamageDice += cls.definition.classFeatures.filter(
      (feature) => feature.name === "Brutal Critical" && cls.level >= feature.requiredLevel
    ).length;

    // Diamond Soul
    results.diamondSoul = results.diamondSoul || cls.definition.classFeatures.some(
      (feature) => feature.name === "Diamond Soul" && cls.level >= feature.requiredLevel
    );

    // Jack of All Trades
    results.jackOfAllTrades = results.jackOfAllTrades || cls.definition.classFeatures.some(
      (feature) => feature.name === "Jack of All Trades" && cls.level >= feature.requiredLevel
    );

    // Reliable Talent
    results.reliableTalent = results.reliableTalent || cls.definition.classFeatures.some(
      (feature) => feature.name === "Reliable Talent" && cls.level >= feature.requiredLevel
    );
  });

  return results;
}
